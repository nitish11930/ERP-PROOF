import type { Evidence } from '@/lib/types';

export interface PreprocessedDocument {
  buffer: Buffer;
  text: string;
  isTextExtractable: boolean;
  requiresOCR: boolean;
  mimeType: string;
  numPages: number;
}

export class DocumentPreprocessor {
  /**
   * Processes a buffer, extracting text if it is a PDF and determining if OCR is required.
   */
  static async preprocess(evidence: Evidence, buffer: Buffer): Promise<PreprocessedDocument> {
    let text = '';
    let isTextExtractable = false;
    let requiresOCR = false;
    let numPages = 1;

    // Validate size (e.g. max 10MB)
    if (buffer.length > 10 * 1024 * 1024) {
      throw new Error('File exceeds 10MB limit for analysis');
    }

    if (evidence.mimeType === 'application/pdf') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(buffer);
        text = data.text || '';
        numPages = data.numpages || 1;
        
        // A simple heuristic: if a PDF yields less than 50 characters of text per page, 
        // it's likely a scanned image, and we must rely on OCR.
        if (text.trim().length > numPages * 50) {
          isTextExtractable = true;
          requiresOCR = false;
        } else {
          requiresOCR = true;
        }
      } catch (error) {
        console.warn('PDF text extraction failed. Document might be encrypted or malformed. Falling back to OCR.', error);
        requiresOCR = true;
      }
    } else if (evidence.mimeType.startsWith('image/')) {
      // Images always require OCR/Vision model
      requiresOCR = true;
    } else {
      throw new Error(`Unsupported document type: ${evidence.mimeType}`);
    }

    return {
      buffer,
      text,
      isTextExtractable,
      requiresOCR,
      mimeType: evidence.mimeType,
      numPages
    };
  }
}
