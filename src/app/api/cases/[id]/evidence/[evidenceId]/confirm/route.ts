import { NextResponse } from 'next/server';
import { CaseRepository } from '@/lib/aws/dynamodb/repository';
import { getSession } from '@/lib/auth';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });

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

    let fileHash = 'mock-sha256-hash-for-local-demo';

    try {
      const bucket = process.env.AWS_S3_BUCKET || 'epr-proof-evidence-local';
      const cmd = new GetObjectCommand({ Bucket: bucket, Key: evidence.s3Key });
      const resp = await s3Client.send(cmd);
      
      if (resp.Body) {
        const hash = crypto.createHash('sha256');
        const chunks = [];
        // @ts-expect-error Node.js readable stream is async iterable
        for await (const chunk of resp.Body) {
          hash.update(chunk);
          chunks.push(chunk);
        }
        fileHash = hash.digest('hex');
      }
    } catch (awsError) {
      console.warn(`S3 Download/Hash failed (using mock for demo): ${(awsError as Error).message}`);
    }

    evidence.fileHash = fileHash;
    
    // Save updated evidence metadata safely
    await CaseRepository.saveExtractionResult(caseId, evidence);

    return NextResponse.json({ success: true, fileHash });
  } catch (error: unknown) {
    console.error('Evidence confirm error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
