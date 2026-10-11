import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getS3BucketName } from '../s3/client';
import { getDynamoTableName } from '../dynamodb/client';
import { EvidenceStorage } from '../s3/storage';
import { CaseRepository } from '../dynamodb/repository';

describe('AWS Configuration & Resource Name Resolution', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('S3 Bucket Configuration', () => {
    it('should default to epr-proof-evidence-510935912210 when AWS_S3_BUCKET is unset', () => {
      delete process.env.AWS_S3_BUCKET;
      expect(getS3BucketName()).toBe('epr-proof-evidence-510935912210');
      expect(EvidenceStorage.getBucketName()).toBe('epr-proof-evidence-510935912210');
    });

    it('should use process.env.AWS_S3_BUCKET when set', () => {
      process.env.AWS_S3_BUCKET = 'custom-production-bucket';
      expect(getS3BucketName()).toBe('custom-production-bucket');
      expect(EvidenceStorage.getBucketName()).toBe('custom-production-bucket');
    });

    it('should generate sanitized, structured S3 object keys', () => {
      const caseId = 'EP-2026-00123';
      const rawFileName = 'my invoice (draft)#1.pdf';
      const key = EvidenceStorage.generateObjectKey(caseId, rawFileName);

      expect(key.startsWith(`cases/${caseId}/evidence/`)).toBe(true);
      expect(key).not.toContain(' ');
      expect(key).not.toContain('#');
      expect(key).toContain('my_invoice__draft__1.pdf');
    });
  });

  describe('DynamoDB Table Configuration', () => {
    it('should default to EPRProof when AWS_DYNAMODB_TABLE is unset', () => {
      delete process.env.AWS_DYNAMODB_TABLE;
      expect(getDynamoTableName()).toBe('EPRProof');
      expect(CaseRepository.getTableName()).toBe('EPRProof');
    });

    it('should use process.env.AWS_DYNAMODB_TABLE when set', () => {
      process.env.AWS_DYNAMODB_TABLE = 'CustomEPRTable';
      expect(getDynamoTableName()).toBe('CustomEPRTable');
      expect(CaseRepository.getTableName()).toBe('CustomEPRTable');
    });
  });
});
