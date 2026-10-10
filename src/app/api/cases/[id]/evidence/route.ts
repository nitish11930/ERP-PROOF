import { NextResponse } from 'next/server';
import { CaseRepository } from '@/lib/aws/dynamodb/repository';
import type { Evidence } from '@/lib/types';
import { getSession } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: caseId } = await params;
    const body = await request.json();
    const { type, fileName, s3Key, fileSize, mimeType } = body;

    if (!type || !fileName || !s3Key || !fileSize || !mimeType) {
      return NextResponse.json({ error: 'Missing required evidence fields' }, { status: 400 });
    }

    const c = await CaseRepository.getCase(caseId);
    if (!c) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Producer authorization check
    if (session.role === 'producer' && c.producer.producerId !== session.producerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const evidenceId = `EV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const newEvidence: Evidence = {
      evidenceId,
      caseId,
      type,
      fileName,
      s3Key,
      fileSize,
      mimeType,
      uploadedAt: new Date().toISOString(),
      extractedData: {},
      contradictions: [],
      confidenceScore: 0,
    };

    // 1. Save the new evidence object
    await CaseRepository.saveExtractionResult(caseId, newEvidence);

    // 2. Update the case's evidenceIds list and add an audit log entry
    const newEvidenceIds = [...c.evidenceIds, evidenceId];
    await CaseRepository.updateCaseMeta(caseId, { evidenceIds: newEvidenceIds });
    await CaseRepository.addAuditLog(caseId, {
      entryId: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      caseId,
      action: 'Evidence Uploaded',
      actor: session.name || session.producerId || 'Unknown User',
      actorRole: (session.role === 'producer' ? 'system' : session.role) as 'system' | 'analyst' | 'reviewer' | 'admin',
      timestamp: new Date().toISOString(),
      details: `File "${fileName}" uploaded.`
    });

    return NextResponse.json({ success: true, evidenceId });
  } catch (error: unknown) {
    console.error('Failed to add evidence:', error);
    return NextResponse.json({ error: 'Failed to add evidence', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
