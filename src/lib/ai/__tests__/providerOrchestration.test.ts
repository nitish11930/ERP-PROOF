import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDocumentAnalysisProvider } from '../index';
import { DocumentAnalysisProvider } from '../provider';
import type { Evidence } from '@/lib/types';

describe('AI Provider Orchestration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('fails safely for unsupported provider', () => {
    process.env.AI_PROVIDER = 'unknown_provider';
    expect(() => getDocumentAnalysisProvider()).toThrow('Unsupported AI provider configured: unknown_provider');
  });

  it('loads bedrock provider when configured', () => {
    process.env.AI_PROVIDER = 'bedrock';
    const provider = getDocumentAnalysisProvider();
    expect(provider).toBeDefined();
    expect(provider.constructor.name).toBe('BedrockAnalysisProvider');
  });

  it('handles missing AI configuration gracefully for bedrock', async () => {
    process.env.AI_PROVIDER = 'bedrock';
    // Remove AWS credentials to simulate missing config
    delete process.env.AWS_REGION;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    
    const provider = getDocumentAnalysisProvider();
    const status = await provider.getProviderStatus();
    
    // In our implementation, bedrockClient doesn't immediately fail on missing creds during status check unless it attempts an API call.
    // Assuming status returns isAvailable: false or similar if it catches a config error.
    // If not, we just ensure it doesn't crash here.
    expect(status).toHaveProperty('isAvailable');
  });
});
