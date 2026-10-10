import { DocumentAnalysisProvider } from '../provider';
import { bedrockClient, getBedrockModelId } from '@/lib/aws/bedrock/client';
import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { s3Client } from '@/lib/aws/s3/client';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { EXTRACTION_PROMPT } from '@/lib/ai/prompts/epr-extraction';
import { DocumentPreprocessor } from '../preprocessing/documentPreprocessor';
import { ExtractedDocumentSchema } from '../schema';
import type { Evidence, ExtractedDocument } from '@/lib/types';

const BUCKET = process.env.AWS_S3_BUCKET || 'epr-proof-evidence-510935912210';

export class BedrockAnalysisProvider implements DocumentAnalysisProvider {
  async getProviderStatus(): Promise<{ isAvailable: boolean; modelId?: string; error?: string }> {
    try {
      const modelId = getBedrockModelId();
      if (!modelId) {
        return { isAvailable: false, error: 'AI_MODEL_ID is not configured' };
      }
      return { isAvailable: true, modelId };
    } catch (e: unknown) {
      return { isAvailable: false, error: (e as Error).message };
    }
  }

  async extractStructuredFacts(evidence: Evidence): Promise<ExtractedDocument> {
    const modelId = getBedrockModelId();
    const documentId = evidence.evidenceId;

    try {
      // 1. Fetch document from S3
      const getObjCmd = new GetObjectCommand({
        Bucket: BUCKET,
        Key: evidence.s3Key,
      });
      const s3Response = await s3Client.send(getObjCmd);
      const bodyStream = s3Response.Body as unknown as AsyncIterable<Uint8Array>;
      
      if (!bodyStream) {
        throw new Error('Failed to retrieve document stream from S3.');
      }

      // Convert stream to Buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of bodyStream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      
      // 2. Preprocess document
      const preprocessed = await DocumentPreprocessor.preprocess(evidence, buffer);
      
      const base64Data = preprocessed.buffer.toString('base64');

      const payload = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 4000,
        system: EXTRACTION_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: preprocessed.mimeType === 'application/pdf' ? 'application/pdf' : (preprocessed.mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif" | "application/pdf"),
                  data: base64Data
                }
              },
              {
                type: "text",
                text: "Extract the facts from this document according to the system instructions and output strictly valid JSON."
              }
            ]
          }
        ]
      };

      const command = new InvokeModelCommand({
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload),
      });

      const response = await bedrockClient.send(command);
      
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const contentText = responseBody.content?.[0]?.text || '{}';
      
      const jsonMatch = contentText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : contentText;
      
      const rawParsed = JSON.parse(jsonString);
      
      // Validate with Zod
      const parseResult = ExtractedDocumentSchema.safeParse(rawParsed);
      if (!parseResult.success) {
        throw new Error('AI returned malformed or unexpected data structure: ' + parseResult.error.message);
      }
      
      const parsed = parseResult.data;

      return {
        documentId,
        documentType: parsed.documentType || 'unknown',
        classificationRationale: parsed.classificationRationale,
        extractionStatus: 'COMPLETED',
        facts: parsed.facts || {},
        confidence: parsed.confidence || 0,
        warnings: parsed.warnings || [],
        requiresHumanReview: parsed.requiresHumanReview,
        modelId,
        extractedAt: new Date().toISOString()
      };
    } catch (error: unknown) {
      console.warn(`Bedrock Extraction Failed for evidence ${documentId}:`, (error as Error).message);
      
      return {
        documentId,
        documentType: 'unknown',
        extractionStatus: 'FAILED',
        facts: {},
        confidence: 0,
        warnings: [(error as Error).message],
        modelId,
        extractedAt: new Date().toISOString()
      };
    }
  }
}
