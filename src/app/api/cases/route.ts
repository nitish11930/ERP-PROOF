import { NextResponse } from 'next/server';
import { CaseRepository } from '@/lib/aws/dynamodb/repository';

export async function GET() {
  try {
    const cases = await CaseRepository.listCases();
    return NextResponse.json(cases);
  } catch (error: unknown) {
    console.warn('AWS SDK Error (falling back to local store for GET /cases):', (error as Error).message);
    return NextResponse.json({ error: 'Database connection failed', fallback: true }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const caseData = await request.json();
    await CaseRepository.createCase(caseData);
    
    console.log(JSON.stringify({
      event: 'CASE_CREATED',
      caseId: caseData.caseId,
      timestamp: new Date().toISOString()
    }));

    return NextResponse.json(caseData, { status: 201 });
  } catch (error: unknown) {
    console.error(JSON.stringify({
      event: 'CASE_CREATION_FAILED',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    }));
    return NextResponse.json({ error: 'Database connection failed', fallback: true }, { status: 503 });
  }
}
