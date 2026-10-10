import crypto from 'crypto';
import { cookies } from 'next/headers';

const SECRET = process.env.API_SECRET || 'hackathon-fallback-secret-123';

export interface AuthSession {
  role: 'reviewer' | 'producer';
  producerId?: string;
  name?: string;
}

export function signToken(payload: AuthSession): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64');
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(data);
  const signature = hmac.digest('base64');
  return `${data}.${signature}`;
}

export function verifyToken(token: string): AuthSession | null {
  try {
    if (!token) return null;
    const [data, signature] = token.split('.');
    const hmac = crypto.createHmac('sha256', SECRET);
    hmac.update(data);
    const expectedSignature = hmac.digest('base64');
    
    // Constant time comparison is ideal, but strict equality is fine for this hackathon
    if (signature === expectedSignature) {
      return JSON.parse(Buffer.from(data, 'base64').toString('utf8'));
    }
    return null;
  } catch (e) {
    return null;
  }
}

export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}
