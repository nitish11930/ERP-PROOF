import { NextResponse } from 'next/server';
import { HeadBucketCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { getSession } from '@/lib/auth';
import { s3Client, getS3BucketName } from '@/lib/aws/s3/client';
import { EvidenceStorage } from '@/lib/aws/s3/storage';

export const runtime = 'nodejs';

export async function GET() {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const bucket = getS3BucketName();
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucket }), { abortSignal: AbortSignal.timeout(10000) });
    return NextResponse.json({ connected: true, service: 'Amazon S3', bucket, region: process.env.AWS_REGION || 'ap-south-1', checkedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ connected: false, service: 'Amazon S3', bucket, region: process.env.AWS_REGION || 'ap-south-1', error: 'S3 is unavailable. Renew AWS login and check bucket permissions.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (Number(request.headers.get('content-length')) > 11 * 1024 * 1024) return NextResponse.json({ error: 'Maximum upload size is 10 MB.' }, { status: 413 });
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File) || file.size === 0 || file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Choose a non-empty file up to 10 MB.' }, { status: 400 });
    if (!['application/pdf', 'image/png', 'image/jpeg', 'text/plain'].includes(file.type)) return NextResponse.json({ error: 'Supported formats: PDF, PNG, JPEG, TXT.' }, { status: 400 });
    const owner = session.producerId || 'reviewer';
    const key = `submission-demo/${owner}/${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    await s3Client.send(new PutObjectCommand({ Bucket: getS3BucketName(), Key: key, Body: Buffer.from(await file.arrayBuffer()), ContentType: file.type, ServerSideEncryption: 'AES256' }), { abortSignal: AbortSignal.timeout(20000) });
    const downloadUrl = await EvidenceStorage.getDownloadUrl(key);
    return NextResponse.json({ service: 'Amazon S3', bucket: getS3BucketName(), key, fileName: file.name, size: file.size, downloadUrl, uploadedAt: new Date().toISOString() }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'AWS upload failed. Renew AWS login and check S3 permissions, then retry.' }, { status: 502 });
  }
}
