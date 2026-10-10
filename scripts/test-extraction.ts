import { getDocumentAnalysisProvider } from '../src/lib/ai';
import type { Evidence } from '../src/lib/types';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function run() {
  console.log('Testing AI Extraction Provider...');

  const provider = getDocumentAnalysisProvider();
  
  console.log('1. Checking Provider Status...');
  const status = await provider.getProviderStatus();
  console.log('Status:', status);

  if (!status.isAvailable) {
    console.error('Provider is not available. Please check credentials and environment variables.');
    process.exit(1);
  }

  const s3Key = process.argv[2];
  if (!s3Key) {
    console.log('Provider is ready. To test actual extraction, pass an S3 Key as an argument.');
    console.log('Usage: tsx scripts/test-extraction.ts <s3-key>');
    process.exit(0);
  }

  console.log(`2. Attempting to extract facts for S3 Key: ${s3Key}`);
  
  const mockEvidence: Evidence = {
    evidenceId: 'test-evidence-123',
    caseId: 'test-case-123',
    type: 'certificate',
    fileName: s3Key.split('/').pop() || 'test.pdf',
    s3Key,
    extractedData: {},
    contradictions: [],
    confidenceScore: 0,
    uploadedAt: new Date().toISOString(),
    fileSize: 100000,
    mimeType: s3Key.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
  };

  try {
    const result = await provider.extractStructuredFacts(mockEvidence);
    console.log('Extraction Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.extractionStatus === 'FAILED') {
      console.error('Extraction completed with FAILED status. Check warnings.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Extraction failed with exception:', error);
    process.exit(1);
  }
}

run();
