import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { getDeploymentCredentials } from '../credentials';

/**
 * Singleton Bedrock Runtime Client
 * Requires AWS_REGION to be set in the environment or uses ap-south-1
 */
export const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: getDeploymentCredentials(),
});

export const getBedrockModelId = () => 
  process.env.AWS_BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0';
