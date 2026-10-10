import { NextResponse } from 'next/server';
import { CaseRepository } from '@/lib/aws/dynamodb/repository';
import { getSession } from '@/lib/auth';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const caseData = await CaseRepository.getCase(id);
    if (!caseData) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (session.role === 'producer' && caseData.producer.producerId !== session.producerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(caseData);
  } catch (error: unknown) {
    console.warn(`AWS SDK Error (falling back to local store for GET /cases/${id}):`, (error as Error).message);
    return NextResponse.json({ error: 'Database connection failed', fallback: true }, { status: 503 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const updates = await request.json();

    const caseData = await CaseRepository.getCase(id);
    if (!caseData) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (session.role === 'producer' && caseData.producer.producerId !== session.producerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await CaseRepository.updateCaseMeta(id, updates);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.warn(`AWS SDK Error (falling back to local store for PATCH /cases/${id}):`, (error as Error).message);
    return NextResponse.json({ error: 'Database connection failed', fallback: true }, { status: 503 });
  }
}
