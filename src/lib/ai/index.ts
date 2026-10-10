import type { DocumentAnalysisProvider } from './provider';
import { BedrockAnalysisProvider } from './providers/bedrock';

export function getDocumentAnalysisProvider(): DocumentAnalysisProvider {
  const providerType = process.env.AI_PROVIDER || 'bedrock';
  
  if (providerType === 'bedrock') {
    return new BedrockAnalysisProvider();
  }
  
  throw new Error(`Unsupported AI provider configured: ${providerType}`);
}
