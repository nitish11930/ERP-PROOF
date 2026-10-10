import { NextResponse } from 'next/server';
import { CaseRepository } from '@/lib/aws/dynamodb/repository';
import { getDocumentAnalysisProvider } from '@/lib/ai';
import { getSession } from '@/lib/auth';
import type { ExtractedDocument, Case } from '@/lib/types';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; evidenceId: string }> }
) {
  const { id: caseId, evidenceId } = await context.params;

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch Case and Evidence from DynamoDB
    const caseData = await CaseRepository.getCase(caseId);
    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Authorization
    if (session.role === 'producer' && caseData.producer.producerId !== session.producerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

    // 2. Invoke AI Extraction Service
    const aiProvider = getDocumentAnalysisProvider();
    
    // Check if provider is available
    const status = await aiProvider.getProviderStatus();
    if (!status.isAvailable) {
      console.warn('AI Provider unavailable:', status.error);
      const failedResult: ExtractedDocument = {
        documentId: evidenceId,
        documentType: 'unknown',
        extractionStatus: 'PROVIDER_UNAVAILABLE',
        facts: {},
        confidence: 0,
        warnings: ['AI Provider Configuration Error: ' + (status.error || 'Unknown error')],
        modelId: 'demo-fallback',
        extractedAt: new Date().toISOString()
      };
      
      evidence.extractedData = { ...evidence.extractedData, bedrockExtraction: failedResult };
      await CaseRepository.saveExtractionResult(caseId, evidence);
      return NextResponse.json(failedResult, { status: 200 }); // Still return 200 so UI doesn't crash on demo
    }

    const extractionResult: ExtractedDocument = await aiProvider.extractStructuredFacts(evidence);

    if (extractionResult.extractionStatus === 'FAILED') {
      console.warn(JSON.stringify({
        event: 'EXTRACTION_FAILED',
        caseId,
        evidenceId,
        reason: 'AI parsing or invocation failed',
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
    
    // 4. Fallback - Ensure failure is persisted
    const errorResult: ExtractedDocument = {
      documentId: evidenceId,
      documentType: 'unknown',
      extractionStatus: 'FAILED',
      facts: {},
      confidence: 0,
      warnings: ['Extraction failed: ' + (error as Error).message],
      modelId: 'demo-fallback',
      extractedAt: new Date().toISOString()
    };
    
    // We try to persist the failure. If this fails, we can't do much.
    try {
      evidence.extractedData = { ...evidence.extractedData, bedrockExtraction: errorResult };
      await CaseRepository.saveExtractionResult(caseId, evidence);
    } catch (dbError) {
      console.error('Failed to persist extraction error state:', dbError);
    }

    return NextResponse.json(errorResult, { status: 200 }); 
    // We return 200 so the UI doesn't crash, but the status is FAILED.
  }
}
