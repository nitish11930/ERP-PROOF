import { NextResponse } from 'next/server';
import { CaseRepository } from '@/lib/aws/dynamodb/repository';
import { getSession } from '@/lib/auth';
import { s3Client, getS3BucketName } from '@/lib/aws/s3/client';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; evidenceId: string }> }
) {
  const { id: caseId, evidenceId } = await context.params;

  try {
    const session = await getSession();
    if (!session || !session.producerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const caseData = await CaseRepository.getCase(caseId);
    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    if (session.role === 'producer' && caseData.producer.producerId !== session.producerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const evidence = caseData.evidence.find(e => e.evidenceId === evidenceId);
    if (!evidence) {
      return NextResponse.json({ error: 'Evidence not found' }, { status: 404 });
    }

    try {
      const bucket = getS3BucketName();
      const cmd = new GetObjectCommand({ Bucket: bucket, Key: evidence.s3Key });
      const resp = await s3Client.send(cmd);

      if (!resp.Body) {
        return NextResponse.json({ error: 'Failed to retrieve evidence file body from S3' }, { status: 502 });
      }

      const hash = crypto.createHash('sha256');
      // @ts-expect-error Node.js readable stream is async iterable
      for await (const chunk of resp.Body) {
        hash.update(chunk);
      }
      const fileHash = hash.digest('hex');
      evidence.fileHash = fileHash;

      // Save updated evidence metadata safely
      await CaseRepository.saveExtractionResult(caseId, evidence);

      return NextResponse.json({ success: true, fileHash });
    } catch (awsError) {
      console.error('S3 Evidence confirmation failed:', awsError);
      return NextResponse.json({
        error: 'Failed to retrieve evidence file from S3 to compute SHA-256 hash',
        details: (awsError as Error).message
      }, { status: 502 });
    }
  } catch (error: unknown) {
    console.error('Evidence confirm error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
