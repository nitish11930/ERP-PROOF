import { NextResponse } from 'next/server';
import { CaseRepository } from '@/lib/aws/dynamodb/repository';
import { extractDocumentFacts } from '@/lib/aws/bedrock/extraction';
import type { ExtractedDocument, Case } from '@/lib/types';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; evidenceId: string }> }
) {
  const { id: caseId, evidenceId } = await context.params;

  try {
    // 1. Fetch Case and Evidence from DynamoDB
    const caseData = await CaseRepository.getCase(caseId);
    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const evidence = caseData.evidence.find(e => e.evidenceId === evidenceId);
    if (!evidence) {
      return NextResponse.json({ error: 'Evidence not found' }, { status: 404 });
    }

    console.log(JSON.stringify({
      event: 'EXTRACTION_STARTED',
      caseId,
      evidenceId,
      s3Key: evidence.s3Key,
      timestamp: new Date().toISOString()
    }));

    // 2. Invoke Bedrock Extraction Service
    const extractionResult: ExtractedDocument = await extractDocumentFacts(evidence);

    if (extractionResult.extractionStatus === 'FAILED') {
      console.warn(JSON.stringify({
        event: 'EXTRACTION_FAILED',
        caseId,
        evidenceId,
        reason: 'Bedrock parsing or invocation failed',
        timestamp: new Date().toISOString()
      }));
    } else {
      console.log(JSON.stringify({
        event: 'EXTRACTION_COMPLETED',
        caseId,
        evidenceId,
        documentType: extractionResult.documentType,
        confidence: extractionResult.confidence,
        timestamp: new Date().toISOString()
      }));
    }

    // 3. Update Evidence Metadata and Persist to DynamoDB
    evidence.extractedData = {
      ...evidence.extractedData,
      bedrockExtraction: extractionResult
    };

    // Phase 3F Hardening: Update just this evidence record safely.
    await CaseRepository.saveExtractionResult(caseId, evidence);

    return NextResponse.json(extractionResult);
  } catch (error: unknown) {
    console.error(JSON.stringify({
      event: 'EXTRACTION_FAILED',
      caseId,
      evidenceId,
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    }));
    
    // 4. Local Fallback - For Hackathon Demo
    // DO NOT fake a bedrock success. Explicitly return a failure status if AWS is offline.
    return NextResponse.json({
      documentId: evidenceId,
      documentType: 'unknown',
      extractionStatus: 'FAILED',
      facts: {},
      confidence: 0,
      warnings: ['Local Fallback Active - Bedrock Not Configured'],
      modelId: 'demo-fallback',
      extractedAt: new Date().toISOString()
    } as ExtractedDocument, { status: 200 }); 
    // We return 200 so the UI doesn't crash, but the status is FAILED.
  }
}
