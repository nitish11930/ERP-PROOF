import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

// Singleton instance of the DynamoDB Client
// Safe for local development - if credentials/region are missing, it won't crash
// until an actual network request is made.
export const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  // Credentials are automatically resolved from environment variables:
  // AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
  // or via IAM Roles in production
});

export const getDynamoTableName = (): string =>
  process.env.AWS_DYNAMODB_TABLE || 'EPRProof';
