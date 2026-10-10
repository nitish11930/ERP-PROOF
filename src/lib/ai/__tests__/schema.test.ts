import { describe, it, expect } from 'vitest';
import { ExtractedDocumentSchema } from '../schema';

describe('AI Extraction Schema Validation', () => {
  it('validates a correct AI response', () => {
    const validResponse = {
      documentType: 'epr_certificate',
      confidence: 0.95,
      requiresHumanReview: false,
      facts: {
        quantity: {
          field: 'quantity',
          value: 1000,
          confidence: 0.99,
          source: { page: 1, text: '1,000 kg', inferred: false }
        }
      }
    };

    const result = ExtractedDocumentSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
  });

  it('rejects a malformed AI response (missing confidence)', () => {
    const malformedResponse = {
      documentType: 'epr_certificate',
      // Missing confidence
      facts: {}
    };

    const result = ExtractedDocumentSchema.safeParse(malformedResponse);
    expect(result.success).toBe(false);
  });

  it('rejects invalid document types', () => {
    const invalidTypeResponse = {
      documentType: 'fake_certificate', // Invalid enum
      confidence: 0.9,
      facts: {}
    };

    const result = ExtractedDocumentSchema.safeParse(invalidTypeResponse);
    expect(result.success).toBe(false);
  });

  it('preserves and validates source references', () => {
    const validWithSource = {
      documentType: 'epr_certificate',
      confidence: 0.95,
      facts: {
        registrationNumber: {
          field: 'registrationNumber',
          value: 'REG-123',
          confidence: 0.99,
          source: { page: 2, text: 'Registration No: REG-123', inferred: false }
        }
      }
    };

    const result = ExtractedDocumentSchema.safeParse(validWithSource);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.facts.registrationNumber?.source?.page).toBe(2);
      expect(result.data.facts.registrationNumber?.source?.inferred).toBe(false);
    }
  });

  it('rejects facts with invalid source references', () => {
    const invalidSource = {
      documentType: 'epr_certificate',
      confidence: 0.95,
      facts: {
        registrationNumber: {
          field: 'registrationNumber',
          value: 'REG-123',
          confidence: 0.99,
          // Missing 'text' which is required if it is not inferred, or 'page' is wrong type
          source: { page: 'two', inferred: false } 
        }
      }
    };

    const result = ExtractedDocumentSchema.safeParse(invalidSource);
    expect(result.success).toBe(false);
  });
});
