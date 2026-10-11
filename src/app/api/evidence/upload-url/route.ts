import { NextResponse } from 'next/server';
import { EvidenceStorage } from '@/lib/aws/s3/storage';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.producerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { caseId, fileName, contentType, fileSize } = await request.json();

    if (!caseId || !fileName || !contentType) {
      return NextResponse.json(
        { error: 'Missing required fields: caseId, fileName, contentType' },
        { status: 400 }
      );
    }

    if (fileSize && fileSize > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    const key = EvidenceStorage.generateObjectKey(caseId, fileName);

    // Fallback safely for local dev if AWS credentials are not fully set up
    try {
      const uploadUrl = await EvidenceStorage.getUploadUrl(key, contentType);
      console.log(JSON.stringify({
        event: 'EVIDENCE_UPLOAD_URL_CREATED',
        caseId,
        fileName,
        s3Key: key,
        timestamp: new Date().toISOString()
      }));
      return NextResponse.json({ uploadUrl, key });
    } catch (awsError: unknown) {
      const errorMessage = (awsError as Error).message;
      console.error(JSON.stringify({
        event: 'EVIDENCE_UPLOAD_URL_FAILED',
        caseId,
        error: errorMessage,
        timestamp: new Date().toISOString()
      }));

      // In production, do not return mock URLs that cannot receive uploads
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({
          error: 'Failed to generate S3 upload URL. AWS S3 configuration or credentials unavailable.',
          details: errorMessage
        }, { status: 502 });
      }

      // If the SDK throws due to missing credentials, return mock for local offline demo
      return NextResponse.json({
        uploadUrl: `mock-upload-url-for-${key}`,
        key,
        mock: true,
        warning: 'Local offline demo: S3 credentials unavailable.'
      });
    }
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
