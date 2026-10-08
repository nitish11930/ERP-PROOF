import { 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand 
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from './client';

const BUCKET = process.env.AWS_S3_BUCKET || 'epr-proof-evidence-510935912210';

/**
 * Foundation for Evidence Storage via S3.
 * NOT FULLY INTEGRATED IN PHASE 3A.
 */
export const EvidenceStorage = {
  /**
   * Generates a deterministic S3 key for a case document
   */
  generateObjectKey: (caseId: string, fileName: string): string => {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    return `cases/${caseId}/evidence/${timestamp}-${sanitizedFileName}`;
  },

  /**
   * Generates a short-lived presigned URL for direct-to-S3 client uploads
   */
  getUploadUrl: async (key: string, contentType: string): Promise<string> => {
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    });
    // URL expires in 15 minutes
    return getSignedUrl(s3Client, command, { expiresIn: 900 });
  },

  /**
   * Generates a short-lived presigned URL for viewing/downloading evidence
   */
  getDownloadUrl: async (key: string): Promise<string> => {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });
    // URL expires in 1 hour
    return getSignedUrl(s3Client, command, { expiresIn: 3600 });
  },

  /**
   * Deletes evidence from S3 (e.g., if a case is rolled back or file replaced)
   */
  deleteEvidence: async (key: string): Promise<void> => {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });
    await s3Client.send(command);
  }
};
