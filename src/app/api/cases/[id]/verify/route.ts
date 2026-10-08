import { NextResponse } from 'next/server';
import { CaseRepository } from '@/lib/aws/dynamodb/repository';
import { runDemoVerification } from '@/lib/services/verificationService';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  
  try {
    // Fetch from real persistence
    const caseData = await CaseRepository.getCase(id);
    if (!caseData) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    console.log(JSON.stringify({
      event: 'VERIFICATION_STARTED',
      caseId: caseData.caseId,
      timestamp: new Date().toISOString()
    }));

    // Run verification engine
    const verifiedCase = runDemoVerification(caseData);

    // Phase 3F Hardening: Non-destructive update 
    await CaseRepository.saveVerificationResult(verifiedCase);  

    console.log(JSON.stringify({
      event: 'VERIFICATION_COMPLETED',
      caseId: verifiedCase.caseId,
      riskScore: verifiedCase.riskScore,
      riskLevel: verifiedCase.riskLevel,
      reviewRequired: verifiedCase.status === 'in_review',
      timestamp: new Date().toISOString()
    }));

    return NextResponse.json(verifiedCase);
  } catch (error: unknown) {
    console.error(JSON.stringify({
      event: 'VERIFICATION_FAILED',
      caseId: id,
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    }));
    return NextResponse.json({ error: 'Database connection failed', fallback: true }, { status: 503 });
  }
}
