import { describe, it, expect, vi } from 'vitest';
import { DocumentPreprocessor } from '../documentPreprocessor';
import type { Evidence } from '@/lib/types';

describe('DocumentPreprocessor', () => {
  it('identifies images as requiring OCR automatically', async () => {
    const mockEvidence: Evidence = {
      evidenceId: 'e-1',
      caseId: 'c-1',
      type: 'photo',
      fileName: 'test.jpg',
      s3Key: 'test.jpg',
      mimeType: 'image/jpeg',
      fileSize: 1000,
      uploadedAt: '2024-01-01T00:00:00Z',
      confidenceScore: 0,
      contradictions: [],
      extractedData: {}
    };

    const buffer = Buffer.from('fake-image-bytes');
    
    const result = await DocumentPreprocessor.preprocess(mockEvidence, buffer);
    
    expect(result.requiresOCR).toBe(true);
    expect(result.isTextExtractable).toBe(false);
  });

  it('rejects unsupported file formats', async () => {
    const mockEvidence: Evidence = {
      evidenceId: 'e-2',
      caseId: 'c-1',
      type: 'report',
      fileName: 'test.doc',
      s3Key: 'test.doc',
      mimeType: 'application/msword', // unsupported
      fileSize: 1000,
      uploadedAt: '2024-01-01T00:00:00Z',
      confidenceScore: 0,
      contradictions: [],
      extractedData: {}
    };

    const buffer = Buffer.from('fake-doc-bytes');
    
    await expect(DocumentPreprocessor.preprocess(mockEvidence, buffer)).rejects.toThrow('Unsupported document type: application/msword');
  });

  it('rejects files over 10MB limit', async () => {
    const mockEvidence: Evidence = {
      evidenceId: 'e-3',
      caseId: 'c-1',
      type: 'certificate',
      fileName: 'large.pdf',
      s3Key: 'large.pdf',
      mimeType: 'application/pdf',
      fileSize: 12000000,
      uploadedAt: '2024-01-01T00:00:00Z',
      confidenceScore: 0,
      contradictions: [],
      extractedData: {}
    };

    // Create 11MB buffer
    const buffer = Buffer.alloc(11 * 1024 * 1024);
    
    await expect(DocumentPreprocessor.preprocess(mockEvidence, buffer)).rejects.toThrow('File exceeds 10MB limit for analysis');
  });
});
