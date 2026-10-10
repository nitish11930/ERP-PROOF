import type { Evidence, ExtractedDocument } from '@/lib/types';

export interface NormalizedEvidenceFacts {
  evidenceId: string;
  documentType: string;
  quantityKg: number | null;
  receivedQuantityKg: number | null;
  processedQuantityKg: number | null;
  recoveredOutputKg: number | null;
  date: Date | null;
  issueDate: Date | null;
  expiryDate: Date | null;
  recyclerName: string | null;
  certificateNumber: string | null;
  materialType: string | null;
  issuer: string | null;
  issuingAuthority: string | null;
  registrationNumber: string | null;
  unit: string | null;
  reportingPeriod: string | null;
  sourceLocation: string | null;
  destinationLocation: string | null;
  batchIdentifier: string | null;
  referencedDocuments: string | null;
  confidence: number;
}

export const FactNormalizer = {
  /**
   * Translates Bedrock ExtractedDocument facts into deterministic structural values
   * appropriate for verification rules.
   */
  normalize: (evidence: Evidence): NormalizedEvidenceFacts => {
    // Phase 3E prefers Bedrock extraction if present
    const bedrock = evidence.extractedData.bedrockExtraction;
    
    if (bedrock && bedrock.extractionStatus === 'COMPLETED') {
        const rawQuantity = parseNumber(bedrock.facts.quantity?.value);
        const unit = parseString(bedrock.facts.unit?.value)?.toLowerCase();
        
        let quantityKg = rawQuantity;
        let receivedQuantityKg = parseNumber(bedrock.facts.receivedQuantity?.value);
        let processedQuantityKg = parseNumber(bedrock.facts.processedQuantity?.value);
        let recoveredOutputKg = parseNumber(bedrock.facts.recoveredOutput?.value);

        if (unit === 'tons' || unit === 't' || unit === 'ton' || unit === 'tonnes' || unit === 'mt') {
          if (quantityKg !== null) quantityKg *= 1000;
          if (receivedQuantityKg !== null) receivedQuantityKg *= 1000;
          if (processedQuantityKg !== null) processedQuantityKg *= 1000;
          if (recoveredOutputKg !== null) recoveredOutputKg *= 1000;
        }

        return {
          evidenceId: evidence.evidenceId,
          documentType: bedrock.documentType,
          quantityKg,
          receivedQuantityKg,
          processedQuantityKg,
          recoveredOutputKg,
          date: parseDate(bedrock.facts.eventDate?.value) || parseDate(bedrock.facts.issueDate?.value),
          issueDate: parseDate(bedrock.facts.issueDate?.value),
          expiryDate: parseDate(bedrock.facts.expiryDate?.value),
          recyclerName: parseString(bedrock.facts.recyclerName?.value),
          certificateNumber: parseString(bedrock.facts.documentNumber?.value),
          materialType: parseString(bedrock.facts.materialCategory?.value),
          issuer: parseString(bedrock.facts.issuingOrganization?.value),
          issuingAuthority: parseString(bedrock.facts.issuingAuthority?.value),
          registrationNumber: parseString(bedrock.facts.registrationNumber?.value),
          unit: parseString(bedrock.facts.unit?.value),
          reportingPeriod: parseString(bedrock.facts.reportingPeriod?.value),
          sourceLocation: parseString(bedrock.facts.facilityAddress?.value),
          destinationLocation: parseString(bedrock.facts.destinationLocation?.value),
          batchIdentifier: parseString(bedrock.facts.batchIdentifier?.value),
          referencedDocuments: parseString(bedrock.facts.referencedDocuments?.value),
          confidence: bedrock.confidence || 0
        };
    }

    const fallbackUnit = parseString(evidence.extractedData.unit)?.toLowerCase();
    let fallbackKg = evidence.extractedData.quantity || null;
    if (fallbackKg !== null && fallbackUnit) {
      if (fallbackUnit === 'tons' || fallbackUnit === 't' || fallbackUnit === 'ton' || fallbackUnit === 'tonnes' || fallbackUnit === 'mt') {
        fallbackKg = fallbackKg * 1000;
      }
    }

    // Phase 2 fallback
    return {
      evidenceId: evidence.evidenceId,
      documentType: evidence.type,
      quantityKg: fallbackKg,
      receivedQuantityKg: null,
      processedQuantityKg: null,
      recoveredOutputKg: null,
      date: evidence.extractedData.date ? new Date(evidence.extractedData.date) : null,
      issueDate: null,
      expiryDate: null,
      recyclerName: evidence.extractedData.recyclerName || null,
      certificateNumber: evidence.extractedData.certificateNumber || null,
      materialType: evidence.extractedData.materialType || null,
      issuer: null,
      issuingAuthority: null,
      registrationNumber: null,
      unit: evidence.extractedData.unit || null,
      reportingPeriod: null,
      sourceLocation: evidence.extractedData.location || null,
      destinationLocation: null,
      batchIdentifier: null,
      referencedDocuments: null,
      confidence: evidence.confidenceScore || 0
    };
  }
};

// --- Helpers ---

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  const num = parseFloat(value.toString().replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  const d = new Date(value.toString());
  return isNaN(d.getTime()) ? null : d;
}

function parseString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return value.toString().trim();
}
