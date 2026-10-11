import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { bedrockClient, getBedrockModelId } from './client';
import { s3Client, getS3BucketName } from '../s3/client';
import { EXTRACTION_PROMPT } from '@/lib/ai/prompts/epr-extraction';
import type { Evidence, ExtractedDocument } from '@/lib/types';

/**
 * Orchestrates the extraction of facts from an S3 document using Amazon Bedrock.
 */
export async function extractDocumentFacts(evidence: Evidence): Promise<ExtractedDocument> {
  const modelId = getBedrockModelId();
  const documentId = evidence.evidenceId;

  try {
    // 1. Fetch document from S3
    const getObjCmd = new GetObjectCommand({
      Bucket: getS3BucketName(),
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
    
    // Determine media type for Bedrock
    // Bedrock typically supports pdf, png, jpeg, webp
    let format = 'png'; // default fallback
    if (evidence.mimeType === 'application/pdf') format = 'pdf';
    if (evidence.mimeType === 'image/jpeg') format = 'jpeg';
    if (evidence.mimeType === 'image/webp') format = 'webp';

    const base64Data = buffer.toString('base64');

    // 2. Build Bedrock request payload (Claude 3 format)
    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 1000,
      system: EXTRACTION_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: evidence.mimeType === 'application/pdf' ? 'application/pdf' : `image/${format}`,
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

    // 3. Invoke Bedrock
    const command = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await bedrockClient.send(command);
    
    // 4. Parse response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const contentText = responseBody.content?.[0]?.text || '{}';
    
    // Attempt to extract JSON from markdown if model wrapped it
    const jsonMatch = contentText.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : contentText;
    
    const parsed = JSON.parse(jsonString);

    return {
      documentId,
      documentType: parsed.documentType || 'unknown',
      extractionStatus: 'COMPLETED',
      facts: parsed.facts || {},
      confidence: parsed.confidence || 0,
      warnings: parsed.warnings || [],
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
