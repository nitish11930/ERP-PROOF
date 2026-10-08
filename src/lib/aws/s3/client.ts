import { S3Client } from '@aws-sdk/client-s3';

// Singleton instance of the S3 Client
// Safe for local development - if credentials/region are missing, it won't crash
// until an actual network request is made.
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  // Credentials are automatically resolved from environment variables:
  // AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
  // or via IAM Roles in production
});
