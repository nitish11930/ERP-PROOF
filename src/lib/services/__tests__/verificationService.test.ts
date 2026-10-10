import { describe, it, expect } from 'vitest';
import { runDemoVerification } from '../verificationService';
import type { Case, Evidence } from '../../../lib/types';

describe('VerificationService', () => {
  const baseCase: Case = {
    caseId: 'C-001',
    producer: {
      producerId: 'P-001',
      name: 'Test Producer',
      category: 'Electronics',
      registrationNumber: 'REG-001',
      contactEmail: 'test@example.com',
      state: 'CA'
    },
    claimedQuantityKg: 1000,
    status: 'pending',
    evidence: [],
    auditLog: [],
    submittedAt: '2024-01-01T00:00:00Z',
    verifiedQuantityKg: null,
    riskScore: 0,
    riskLevel: 'low',
    evidenceIds: [],
    findings: [],
    reviewDecision: null,
    financialYear: '2024-25',
    materialCategory: 'Electronics',
    targetQuantityKg: 1000
  };

  const createMockEvidence = (
    id: string,
    aiDocumentType: 'epr_certificate' | 'collection_receipt' | 'transportation_document' | 'recovery_report',
    evidenceType: 'certificate' | 'invoice' | 'photo' | 'manifest' | 'report',
    facts: Record<string, unknown>,
    extractionStatus: 'COMPLETED' | 'FAILED' | 'UNSUPPORTED_FORMAT' = 'COMPLETED'
  ): Evidence => ({
    evidenceId: id,
    caseId: 'C-001',
    type: evidenceType,
    fileName: `${id}.pdf`,
    s3Key: `cases/C-001/${id}.pdf`,
    mimeType: 'application/pdf',
    fileSize: 1000,
    uploadedAt: '2024-01-01T00:00:00Z',
    confidenceScore: 0.9,
    contradictions: [],
    extractedData: {
      bedrockExtraction: {
        documentId: id,
        documentType: aiDocumentType,
        extractionStatus,
        confidence: 0.9,
        warnings: [],
        modelId: 'test-model',
        extractedAt: '2024-01-01T00:00:00Z',
        facts: Object.keys(facts).reduce((acc, key) => {
          acc[key] = { field: key, value: facts[key] as string | number, confidence: 0.9, source: null };
          return acc;
        }, {} as Record<string, { field: string; value: string | number | boolean | null; confidence: number; source: null }>)
      }
    }
  });

  it('generates finding for missing required certificate fields', () => {
    const caseData: Case = {
      ...baseCase,
      evidence: [
        createMockEvidence('ev-1', 'epr_certificate', 'certificate', {
          quantity: 1000,
          unit: 'kg',
          // Missing issuingAuthority and documentNumber
        })
      ]
    };

    const result = runDemoVerification(caseData);
    
    expect(result.findings.some(f => f.type === 'missing_information' && f.title === 'Missing Issuing Authority')).toBe(true);
    expect(result.findings.some(f => f.type === 'missing_information' && f.title === 'Missing Certificate Number')).toBe(true);
  });

  it('generates finding for date inconsistency in certificate', () => {
    const caseData: Case = {
      ...baseCase,
      evidence: [
        createMockEvidence('ev-2', 'epr_certificate', 'certificate', {
          documentNumber: 'CERT-123',
          issuingAuthority: 'Gov',
          issueDate: '2024-12-31',
          expiryDate: '2024-01-01', // Invalid: expires before issue
          quantity: 1000,
          unit: 'kg',
        })
      ]
    };

    const result = runDemoVerification(caseData);
    expect(result.findings.some(f => f.type === 'date_inconsistency' && f.title === 'Invalid Certificate Dates')).toBe(true);
  });

  it('generates finding for impossible recovery rate', () => {
    const caseData: Case = {
      ...baseCase,
      evidence: [
        createMockEvidence('ev-3', 'recovery_report', 'report', {
          documentNumber: 'REP-1',
          issuingAuthority: 'Gov',
          receivedQuantity: 1000,
          recoveredOutput: 1500, // Impossible
          unit: 'kg',
        })
      ]
    };

    const result = runDemoVerification(caseData);
    expect(result.findings.some(f => f.type === 'quantity_mismatch' && f.title === 'Impossible Recovery Rate')).toBe(true);
  });

  it('detects duplicate certificates', () => {
    const caseData: Case = {
      ...baseCase,
      evidence: [
        createMockEvidence('ev-4a', 'epr_certificate', 'certificate', {
          documentNumber: 'DUPE-123',
          issuingAuthority: 'Gov',
          quantity: 500,
          unit: 'kg',
        }),
        createMockEvidence('ev-4b', 'epr_certificate', 'certificate', {
          documentNumber: 'DUPE-123',
          issuingAuthority: 'Gov',
          quantity: 500,
          unit: 'kg',
        })
      ]
    };

    const result = runDemoVerification(caseData);
    expect(result.findings.some(f => f.type === 'duplicate_evidence')).toBe(true);
  });

  it('passes a perfect case with no findings', () => {
    const caseData: Case = {
      ...baseCase,
      evidence: [
        createMockEvidence('ev-coll', 'collection_receipt', 'invoice', {
          quantity: 1000,
          unit: 'kg',
          eventDate: '2024-01-01',
          recyclerName: 'EcoRecycle'
        }),
        createMockEvidence('ev-trans', 'transportation_document', 'manifest', {
          quantity: 1000,
          unit: 'kg',
          eventDate: '2024-01-02',
          recyclerName: 'EcoRecycle'
        }),
        createMockEvidence('ev-cert', 'epr_certificate', 'certificate', {
          documentNumber: 'CERT-OK',
          issuingAuthority: 'Gov Authority',
          registrationNumber: 'REG-123',
          issueDate: '2024-01-10',
          expiryDate: '2025-01-10',
          receivedQuantity: 1000,
          processedQuantity: 1000,
          recoveredOutput: 900,
          quantity: 1000,
          unit: 'kg',
          recyclerName: 'EcoRecycle'
        })
      ]
    };

    const result = runDemoVerification(caseData);
    expect(result.findings).toHaveLength(0);
    expect(result.status).toBe('approved');
  });
});
