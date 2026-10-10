import type { Evidence, ExtractedDocument } from '@/lib/types';

export interface DocumentAnalysisProvider {
  /**
   * Check if the provider is properly configured and reachable.
   */
  getProviderStatus(): Promise<{ isAvailable: boolean; modelId?: string; error?: string }>;

  /**
   * Extract structured facts and perform analysis on a document.
   */
  extractStructuredFacts(evidence: Evidence): Promise<ExtractedDocument>;
}
