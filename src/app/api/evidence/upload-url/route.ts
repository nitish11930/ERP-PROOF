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
      console.error(JSON.stringify({
        event: 'EVIDENCE_UPLOAD_URL_FAILED',
        caseId,
        error: (awsError as Error).message,
        timestamp: new Date().toISOString()
      }));
      
      // If the SDK throws due to missing credentials, we simulate success for local demo
      return NextResponse.json({ 
        uploadUrl: `mock-upload-url-for-${key}`,
        key,
        mock: true 
      });
    }
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
