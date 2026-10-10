import { NextResponse } from 'next/server';
import { signToken, AuthSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    let session: AuthSession | null = null;

    if (email === 'demo@eprproof.ai' && password === 'EPRProof@2026') {
      // Reviewer Role
      session = { role: 'reviewer', name: 'Demo Reviewer' };
    } else if (email === 'producer@eprproof.ai' && password === 'EPRProof@2026') {
      // Producer Role (using the demo producer ID)
      session = { role: 'producer', producerId: 'P001', name: 'ABC Recycling Pvt. Ltd.' };
    } else {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = signToken(session);

    const response = NextResponse.json({ success: true, role: session.role });
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400,
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
