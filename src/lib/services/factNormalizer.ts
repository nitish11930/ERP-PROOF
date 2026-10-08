import type { Evidence, ExtractedDocument } from '@/lib/types';

export interface NormalizedEvidenceFacts {
  evidenceId: string;
  documentType: string;
  quantityKg: number | null;
  date: Date | null;
  recyclerName: string | null;
  certificateNumber: string | null;
  materialType: string | null;
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
      return {
        evidenceId: evidence.evidenceId,
        documentType: bedrock.documentType,
        quantityKg: parseNumber(bedrock.facts.quantityKg?.value),
        date: parseDate(bedrock.facts.date?.value),
        recyclerName: parseString(bedrock.facts.recyclerName?.value),
        certificateNumber: parseString(bedrock.facts.certificateNumber?.value),
        materialType: parseString(bedrock.facts.materialType?.value),
        confidence: bedrock.confidence || 0
      };
    }

    // Phase 2 fallback
    return {
      evidenceId: evidence.evidenceId,
      documentType: evidence.type,
      quantityKg: evidence.extractedData.quantity || null,
      date: evidence.extractedData.date ? new Date(evidence.extractedData.date) : null,
      recyclerName: evidence.extractedData.recyclerName || null,
      certificateNumber: evidence.extractedData.certificateNumber || null,
      materialType: evidence.extractedData.materialType || null,
      confidence: evidence.confidenceScore || 0
    };
  }
};

// --- Helpers ---

function parseNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  const num = parseFloat(value.toString().replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

function parseDate(value: string | number | null | undefined): Date | null {
  if (value === null || value === undefined) return null;
  const d = new Date(value.toString());
  return isNaN(d.getTime()) ? null : d;
}

function parseString(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return value.toString().trim();
}
