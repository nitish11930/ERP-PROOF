import { NextResponse } from 'next/server';
import { CaseRepository } from '@/lib/aws/dynamodb/repository';
import { getSession } from '@/lib/auth';
import type { ReviewDecision, CaseStatus } from '@/lib/types';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  
  try {
    const session = await getSession();
    if (!session || session.role !== 'reviewer') {
      return NextResponse.json({ error: 'Forbidden. Only reviewers can submit decisions.' }, { status: 403 });
    }

    const payload = await request.json();
    const { decision, comments } = payload;

    if (!decision || !['approved', 'rejected', 'needs_more_info', 'escalated'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
    }

    const caseData = await CaseRepository.getCase(id);
    if (!caseData) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

    const reviewDecision: ReviewDecision = {
      reviewerId: session.producerId || 'reviewer-001',
      reviewerName: session.name || 'System Reviewer',
      decision,
      comments: comments || '',
      reviewedAt: new Date().toISOString()
    };

    let newStatus = caseData.status;
    if (decision === 'approved') newStatus = 'approved';
    else if (decision === 'rejected') newStatus = 'rejected';
    else if (decision === 'needs_more_info') newStatus = 'needs_more_evidence';
    else if (decision === 'escalated') newStatus = 'escalated';

    const auditEntry = {
      entryId: `AUD-${Date.now()}-rev`,
      caseId: id,
      action: 'Human Review Decision',
      actor: session.name || 'Reviewer',
      actorRole: 'reviewer' as const,
      timestamp: new Date().toISOString(),
      details: `Reviewer marked case as ${decision}. Comments: ${comments || 'None'}`
    };

    // Update case in memory and persist via saveVerificationResult
    // which safely saves Case meta and new Audit events without dropping evidence
    caseData.status = newStatus as CaseStatus;
    caseData.reviewDecision = reviewDecision;
    caseData.auditLog = [...caseData.auditLog, auditEntry];

    await CaseRepository.saveVerificationResult(caseData);

    return NextResponse.json({ success: true, case: caseData });
  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
