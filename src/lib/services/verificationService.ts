import { calculateRisk } from '@/lib/risk/calculator';
import { FactNormalizer } from './factNormalizer';
import type { Case, Finding, Contradiction, RiskLevel } from '@/lib/types';

export function runDemoVerification(caseData: Case): Case {
  const findings: Finding[] = [];
  
  // 1. Fact Normalization
  const normalizedFacts = caseData.evidence.map(ev => FactNormalizer.normalize(ev));
  
  // Group facts by logical type
  const collectionFacts = normalizedFacts.filter(f => f.documentType === 'invoice' || f.documentType === 'collection');
  const transportFacts = normalizedFacts.filter(f => f.documentType === 'manifest' || f.documentType === 'transport');
  const recyclingFacts = normalizedFacts.filter(f => f.documentType === 'certificate' || f.documentType === 'recycling');

  // Calculate aggregations
  const collectionKg = collectionFacts.reduce((sum, f) => sum + (f.quantityKg || 0), 0);
  const transportKg = transportFacts.reduce((sum, f) => sum + (f.quantityKg || 0), 0);
  const recyclingKg = recyclingFacts.reduce((sum, f) => sum + (f.quantityKg || 0), 0);

  // Confidence
  const avgConfidence = normalizedFacts.length > 0 
    ? normalizedFacts.reduce((sum, f) => sum + f.confidence, 0) / normalizedFacts.length 
    : 0;

  const hasCertificate = recyclingFacts.length > 0;

  // 2. Quantity Verification
  const collectionGap = caseData.claimedQuantityKg - collectionKg;
  if (collectionKg > 0 && Math.abs(collectionGap) / caseData.claimedQuantityKg > 0.1) {
    findings.push({
      findingId: `F-${Date.now()}-1`,
      caseId: caseData.caseId,
      type: 'quantity_mismatch',
      severity: 'high',
      title: 'Quantity Mismatch: Claim vs Collection',
      description: `Collection evidence totals ${collectionKg} kg, leaving a gap of ${collectionGap} kg (>${Math.round(Math.abs(collectionGap)/caseData.claimedQuantityKg * 100)}%) from the claim.`,
      affectedEvidenceIds: collectionFacts.map(f => f.evidenceId),
      aiReasoning: 'Deterministic rule triggered: Aggregated collection quantities diverge from claimed total by >10%.',
      riskPoints: 30,
      detectedAt: new Date().toISOString()
    });
  }

  const recyclingGap = caseData.claimedQuantityKg - recyclingKg;
  if (recyclingKg > 0 && Math.abs(recyclingGap) / caseData.claimedQuantityKg > 0.1) {
    findings.push({
      findingId: `F-${Date.now()}-2`,
      caseId: caseData.caseId,
      type: 'quantity_mismatch',
      severity: 'high',
      title: 'Quantity Mismatch: Claim vs Recycling',
      description: `Recycling evidence totals ${recyclingKg} kg, differing by ${recyclingGap} kg from claim.`,
      affectedEvidenceIds: recyclingFacts.map(f => f.evidenceId),
      aiReasoning: 'Deterministic rule triggered: Recycling output does not support the claimed input quantity.',
      riskPoints: 30,
      detectedAt: new Date().toISOString()
    });
  }

  // 3. Date Consistency Verification
  let maxDateDeltaDays = 0;
  if (collectionFacts.length > 0 && recyclingFacts.length > 0) {
    const minCollectionDate = new Date(Math.min(...collectionFacts.map(f => (f.date ? f.date.getTime() : Date.now()))));
    const minRecyclingDate = new Date(Math.min(...recyclingFacts.map(f => (f.date ? f.date.getTime() : Date.now()))));

    if (minRecyclingDate < minCollectionDate) {
       findings.push({
        findingId: `F-${Date.now()}-3`,
        caseId: caseData.caseId,
        type: 'date_inconsistency',
        severity: 'high',
        title: 'Impossible Date Sequence',
        description: `Recycling occurred before collection was initiated.`,
        affectedEvidenceIds: [...collectionFacts.map(f=>f.evidenceId), ...recyclingFacts.map(f=>f.evidenceId)],
        aiReasoning: 'Deterministic rule triggered: chronological sequence violated (recycling before collection).',
        riskPoints: 40,
        detectedAt: new Date().toISOString()
      });
    } else {
      maxDateDeltaDays = (minRecyclingDate.getTime() - minCollectionDate.getTime()) / (1000 * 3600 * 24);
    }
  }

  // 4. Missing Evidence
  if (!hasCertificate) {
    findings.push({
      findingId: `F-${Date.now()}-4`,
      caseId: caseData.caseId,
      type: 'missing_certificate',
      severity: 'high',
      title: 'Missing Required Evidence',
      description: 'No valid recycling certificate provided.',
      affectedEvidenceIds: [],
      aiReasoning: 'Deterministic rule triggered: Mandatory document type absent.',
      riskPoints: 40,
      detectedAt: new Date().toISOString()
    });
  }

  // 5. Low Confidence Check (Routing to Human Review)
  if (avgConfidence < 0.7) {
    findings.push({
      findingId: `F-${Date.now()}-5`,
      caseId: caseData.caseId,
      type: 'low_confidence',
      severity: 'medium',
      title: 'Low Extraction Confidence',
      description: `Bedrock reported an average extraction confidence of ${(avgConfidence * 100).toFixed(1)}%.`,
      affectedEvidenceIds: normalizedFacts.filter(f => f.confidence < 0.7).map(f => f.evidenceId),
      aiReasoning: 'Fallback logic triggered: extraction uncertainty exceeds safety thresholds.',
      riskPoints: 15,
      detectedAt: new Date().toISOString()
    });
  }

  // 6. Calculate Overall Risk
  const riskResult = calculateRisk(
    caseData.claimedQuantityKg,
    recyclingKg > 0 ? recyclingKg : (collectionKg > 0 ? collectionKg : null),
    findings,
    hasCertificate,
    avgConfidence,
    maxDateDeltaDays
  );

  // Note: We don't artificially modify Evidences' contradictions array here unless we want to rebuild Phase 2 UI exactly.
  // Phase 3E prefers structured Findings over inline Evidence contradictions where possible, but we can preserve 
  // the array to keep UI from breaking.

  const reviewRequired = riskResult.riskLevel === 'high' || riskResult.riskLevel === 'critical' || findings.length > 0;

  return {
    ...caseData,
    findings,
    status: reviewRequired ? 'in_review' : 'approved',
    riskScore: riskResult.totalScore,
    riskLevel: riskResult.riskLevel,
    verifiedQuantityKg: recyclingKg > 0 ? recyclingKg : null,
    auditLog: [
      ...caseData.auditLog,
      {
        entryId: `AUD-${Date.now()}-verif`,
        caseId: caseData.caseId,
        action: 'Verification Completed',
        actor: 'Deterministic Verification Engine',
        actorRole: 'system',
        timestamp: new Date().toISOString(),
        details: `Automated checks completed. Risk Score: ${riskResult.totalScore}. Review required: ${reviewRequired}`
      }
    ]
  };
}
