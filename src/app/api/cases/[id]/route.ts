import { NextResponse } from 'next/server';
import { CaseRepository } from '@/lib/aws/dynamodb/repository';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const caseData = await CaseRepository.getCase(id);
    if (!caseData) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(caseData);
  } catch (error: unknown) {
    console.warn(`AWS SDK Error (falling back to local store for GET /cases/${id}):`, (error as Error).message);
    return NextResponse.json({ error: 'Database connection failed', fallback: true }, { status: 503 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const updates = await request.json();
    await CaseRepository.updateCaseMeta(id, updates);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.warn(`AWS SDK Error (falling back to local store for PATCH /cases/${id}):`, (error as Error).message);
    return NextResponse.json({ error: 'Database connection failed', fallback: true }, { status: 503 });
  }
}
