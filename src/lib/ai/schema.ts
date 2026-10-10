import { z } from 'zod';

export const ExtractedFactSchema = z.object({
  field: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  confidence: z.number().nullable(),
  source: z.object({
    page: z.number().nullable().optional(),
    text: z.string().optional(),
    inferred: z.boolean().optional()
  }).nullable()
});

export const ExtractedDocumentSchema = z.object({
  documentType: z.enum([
    'epr_certificate', 
    'collection_receipt', 
    'transportation_document', 
    'recycler_intake', 
    'processing_report', 
    'recovery_report', 
    'invoice', 
    'registration', 
    'other', 
    'unknown'
  ]),
  classificationRationale: z.string().optional(),
  confidence: z.number(),
  warnings: z.array(z.string()).optional(),
  requiresHumanReview: z.boolean().optional(),
  facts: z.record(z.string(), ExtractedFactSchema).optional()
});
