import { calculateRisk } from '@/lib/risk/calculator';
import { FactNormalizer } from './factNormalizer';
import type { Case, Finding, RiskLevel } from '@/lib/types';

export function runDemoVerification(caseData: Case): Case {
  const findings: Finding[] = [];
  
  // 1. Fact Normalization
  const normalizedFacts = caseData.evidence.map(ev => FactNormalizer.normalize(ev));
  
  // Group facts by logical type
  const collectionFacts = normalizedFacts.filter(f => f.documentType === 'invoice' || f.documentType === 'collection_receipt');
  const transportFacts = normalizedFacts.filter(f => f.documentType === 'manifest' || f.documentType === 'transportation_document');
  const recyclingFacts = normalizedFacts.filter(f => f.documentType === 'certificate' || f.documentType === 'epr_certificate' || f.documentType === 'recovery_report');

  // Calculate aggregations
  const collectionKg = collectionFacts.reduce((sum, f) => sum + (f.quantityKg || 0), 0);
  const transportKg = transportFacts.reduce((sum, f) => sum + (f.quantityKg || 0), 0);
  const recyclingKg = recyclingFacts.reduce((sum, f) => sum + (f.quantityKg || 0), 0);
  
  // Also check processed / received quantities for deeper reconciliation
  const recyclerReceivedKg = recyclingFacts.reduce((sum, f) => sum + (f.receivedQuantityKg || 0), 0);
  const recyclerProcessedKg = recyclingFacts.reduce((sum, f) => sum + (f.processedQuantityKg || 0), 0);
  const recyclerRecoveredKg = recyclingFacts.reduce((sum, f) => sum + (f.recoveredOutputKg || 0), 0);

  // Confidence
  const avgConfidence = normalizedFacts.length > 0 
    ? normalizedFacts.reduce((sum, f) => sum + f.confidence, 0) / normalizedFacts.length 
    : 0;

  const hasCertificate = recyclingFacts.length > 0;

  // --- PHASE 7: CERTIFICATE ANALYSIS ---

  for (const cert of recyclingFacts) {
    if (!cert.issuingAuthority && !cert.issuer) {
      findings.push({
        findingId: `F-${Date.now()}-issauth-${cert.evidenceId}`,
        caseId: caseData.caseId,
        type: 'missing_information',
        severity: 'medium',
        title: 'Missing Issuing Authority',
        description: `Certificate ${cert.certificateNumber || 'unknown'} does not explicitly state the issuing authority.`,
        affectedEvidenceIds: [cert.evidenceId],
        aiReasoning: 'Deterministic rule: Required field "issuingAuthority" or "issuer" is missing.',
        riskPoints: 10,
        detectedAt: new Date().toISOString()
      });
    }

    if (!cert.certificateNumber) {
      findings.push({
        findingId: `F-${Date.now()}-certnum-${cert.evidenceId}`,
        caseId: caseData.caseId,
        type: 'missing_information',
        severity: 'medium',
        title: 'Missing Certificate Number',
        description: `A document classified as a certificate lacks a readable document or certificate number.`,
        affectedEvidenceIds: [cert.evidenceId],
        aiReasoning: 'Deterministic rule: Required field "documentNumber" is missing.',
        riskPoints: 15,
        detectedAt: new Date().toISOString()
      });
    }

    if (cert.issueDate && cert.expiryDate && cert.issueDate > cert.expiryDate) {
      findings.push({
        findingId: `F-${Date.now()}-dates-${cert.evidenceId}`,
        caseId: caseData.caseId,
        type: 'date_inconsistency',
        severity: 'high',
        title: 'Invalid Certificate Dates',
        description: `Certificate issue date is after its expiry date.`,
        affectedEvidenceIds: [cert.evidenceId],
        aiReasoning: 'Deterministic rule: issueDate > expiryDate.',
        riskPoints: 20,
        detectedAt: new Date().toISOString()
      });
    }

    if (!cert.registrationNumber) {
      findings.push({
        findingId: `F-${Date.now()}-reg-${cert.evidenceId}`,
        caseId: caseData.caseId,
        type: 'missing_information',
        severity: 'low',
        title: 'Missing Registration Number',
        description: `The facility's registration/authorization identifier is not found in the certificate.`,
        affectedEvidenceIds: [cert.evidenceId],
        aiReasoning: 'Deterministic rule: Recommended field "registrationNumber" is missing.',
        riskPoints: 5,
        detectedAt: new Date().toISOString()
      });
    }
  }

  // --- PHASE 8: CROSS-DOCUMENT RECONCILIATION ---

  // Quantity Reconciliation
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

  // Processing Loss Check (Recycler Received vs Processed/Recovered)
  if (recyclerReceivedKg > 0 && recyclerRecoveredKg > 0) {
    if (recyclerRecoveredKg > recyclerReceivedKg) {
      findings.push({
        findingId: `F-${Date.now()}-loss`,
        caseId: caseData.caseId,
        type: 'quantity_mismatch',
        severity: 'high',
        title: 'Impossible Recovery Rate',
        description: `Recovered output (${recyclerRecoveredKg} kg) exceeds received quantity (${recyclerReceivedKg} kg).`,
        affectedEvidenceIds: recyclingFacts.map(f => f.evidenceId),
        aiReasoning: 'Deterministic rule: recoveredOutputKg > receivedQuantityKg.',
        riskPoints: 40,
        detectedAt: new Date().toISOString()
      });
    }
  }

  // Transport vs Collection Reconciliation
  if (transportKg > 0 && collectionKg > 0 && Math.abs(transportKg - collectionKg) / collectionKg > 0.1) {
    findings.push({
      findingId: `F-${Date.now()}-trans-coll`,
      caseId: caseData.caseId,
      type: 'quantity_mismatch',
      severity: 'medium',
      title: 'Quantity Mismatch: Transport vs Collection',
      description: `Transported quantity (${transportKg} kg) differs significantly from collected quantity (${collectionKg} kg).`,
      affectedEvidenceIds: [...transportFacts.map(f => f.evidenceId), ...collectionFacts.map(f => f.evidenceId)],
      aiReasoning: 'Deterministic rule: Transport vs Collection difference > 10%.',
      riskPoints: 20,
      detectedAt: new Date().toISOString()
    });
  }

  // Date Consistency Verification
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

  // Missing Required Evidence
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

  // Duplicate Evidence
  const uniqueCerts = new Set<string>();
  for (const f of recyclingFacts) {
    if (f.certificateNumber && uniqueCerts.has(f.certificateNumber)) {
      findings.push({
        findingId: `F-${Date.now()}-dup`,
        caseId: caseData.caseId,
        type: 'duplicate_evidence',
        severity: 'medium',
        title: 'Duplicate Evidence Detected',
        description: `Certificate number ${f.certificateNumber} appears multiple times.`,
        affectedEvidenceIds: recyclingFacts.filter(x => x.certificateNumber === f.certificateNumber).map(x => x.evidenceId),
        aiReasoning: 'Deterministic rule triggered: duplicate certificate numbers.',
        riskPoints: 20,
        detectedAt: new Date().toISOString()
      });
    } else if (f.certificateNumber) {
      uniqueCerts.add(f.certificateNumber);
    }
  }

  // Entity Consistency
  const entities = new Set<string>();
  for (const f of [...collectionFacts, ...recyclingFacts]) {
    if (f.recyclerName) entities.add(f.recyclerName.toLowerCase().trim());
  }
  if (entities.size > 1) {
    findings.push({
      findingId: `F-${Date.now()}-ent`,
      caseId: caseData.caseId,
      type: 'entity_inconsistency',
      severity: 'medium',
      title: 'Entity Inconsistency',
      description: `Multiple different recycler names detected across documents: ${Array.from(entities).join(', ')}.`,
      affectedEvidenceIds: [...collectionFacts, ...recyclingFacts].map(f => f.evidenceId),
      aiReasoning: 'Deterministic rule triggered: recycler names do not match across evidence.',
      riskPoints: 15,
      detectedAt: new Date().toISOString()
    });
  }

  // Batch References
  const collectionBatches = new Set<string>(collectionFacts.map(f => f.batchIdentifier).filter(Boolean) as string[]);
  const recyclingBatches = new Set<string>(recyclingFacts.map(f => f.batchIdentifier).filter(Boolean) as string[]);
  
  for (const rb of recyclingBatches) {
    if (collectionBatches.size > 0 && !collectionBatches.has(rb)) {
      findings.push({
        findingId: `F-${Date.now()}-batch`,
        caseId: caseData.caseId,
        type: 'batch_mismatch',
        severity: 'medium',
        title: 'Batch Reference Mismatch',
        description: `Recycling batch ${rb} is not found in the collection records.`,
        affectedEvidenceIds: [...collectionFacts, ...recyclingFacts].map(f => f.evidenceId),
        aiReasoning: 'Deterministic rule triggered: recycling batch ID not supported by collection records.',
        riskPoints: 10,
        detectedAt: new Date().toISOString()
      });
    }
  }

  // Low Confidence Check (Routing to Human Review)
  if (avgConfidence < 0.7) {
    findings.push({
      findingId: `F-${Date.now()}-5`,
      caseId: caseData.caseId,
      type: 'low_confidence',
      severity: 'medium',
      title: 'Low Extraction Confidence',
      description: `AI provider reported an average extraction confidence of ${(avgConfidence * 100).toFixed(1)}%.`,
      affectedEvidenceIds: normalizedFacts.filter(f => f.confidence < 0.7).map(f => f.evidenceId),
      aiReasoning: 'Extraction uncertainty exceeds safety thresholds.',
      riskPoints: 15,
      detectedAt: new Date().toISOString()
    });
  }

  // Calculate Overall Risk
  const riskResult = calculateRisk(
    caseData.claimedQuantityKg,
    recyclingKg > 0 ? recyclingKg : (collectionKg > 0 ? collectionKg : null),
    findings,
    hasCertificate,
    avgConfidence,
    maxDateDeltaDays
  );

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
