import { awsCredentialsProvider } from '@vercel/oidc-aws-credentials-provider';

// Vercel uses short-lived federation credentials; local development keeps the
// AWS SDK's normal credential chain (including `aws login`).
export function getDeploymentCredentials() {
  const roleArn = process.env.AWS_ROLE_ARN;
  return roleArn ? awsCredentialsProvider({ roleArn }) : undefined;
}
