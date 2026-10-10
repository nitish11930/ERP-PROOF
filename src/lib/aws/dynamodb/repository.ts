import { 
  PutItemCommand, 
  QueryCommand,
  UpdateItemCommand,
  ScanCommand,
  GetItemCommand
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { dynamoClient } from './client';
import { SchemaKeys } from './schema';
import type { Case, Evidence, Finding, AuditEntry } from '@/lib/types';

const TABLE_NAME = process.env.AWS_DYNAMODB_TABLE || 'EPRProof';

/**
 * DynamoDB Repository for Case Persistence
 */
export const CaseRepository = {
  
  /**
   * Creates a full case with its nested entities in DynamoDB
   */
  createCase: async (caseData: Case): Promise<void> => {
    // 1. Save the main Case item
    const { evidence, findings, auditLog, ...caseMeta } = caseData;
    
    await dynamoClient.send(new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall({
        ...SchemaKeys.case(caseData.caseId),
        Type: 'Case',
        ...caseMeta
      }, { removeUndefinedValues: true })
    }));

    // 2. Save Evidence items
    for (const ev of evidence) {
      await dynamoClient.send(new PutItemCommand({
        TableName: TABLE_NAME,
        Item: marshall({
          ...SchemaKeys.evidence(caseData.caseId, ev.evidenceId),
          Type: 'Evidence',
          ...ev
        }, { removeUndefinedValues: true })
      }));
    }

    // 3. Save Findings items
    for (const finding of findings) {
      await dynamoClient.send(new PutItemCommand({
        TableName: TABLE_NAME,
        Item: marshall({
          ...SchemaKeys.finding(caseData.caseId, finding.findingId),
          Type: 'Finding',
          ...finding
        }, { removeUndefinedValues: true })
      }));
    }

    // 4. Save Audit Logs
    for (const audit of auditLog) {
      await dynamoClient.send(new PutItemCommand({
        TableName: TABLE_NAME,
        Item: marshall({
          ...SchemaKeys.audit(caseData.caseId, audit.entryId),
          Type: 'Audit',
          ...audit
        }, { removeUndefinedValues: true })
      }));
    }
  },

  /**
   * Safely persists verification results (updates Case, adds new Findings and Audits)
   * without replacing all Evidence records destructively.
   */
  saveVerificationResult: async (verifiedCase: Case): Promise<void> => {
    const { evidence, findings, auditLog, ...caseMeta } = verifiedCase;
    
    // 1. Update the Case status and risk
    await dynamoClient.send(new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall({
        ...SchemaKeys.case(verifiedCase.caseId),
        Type: 'Case',
        ...caseMeta
      }, { removeUndefinedValues: true })
    }));

    // 2. Put only the NEW findings (or overwrite findings with same IDs safely)
    for (const finding of findings) {
      await dynamoClient.send(new PutItemCommand({
        TableName: TABLE_NAME,
        Item: marshall({
          ...SchemaKeys.finding(verifiedCase.caseId, finding.findingId),
          Type: 'Finding',
          ...finding
        }, { removeUndefinedValues: true })
      }));
    }

    // 3. Put Audit Logs
    for (const audit of auditLog) {
      await dynamoClient.send(new PutItemCommand({
        TableName: TABLE_NAME,
        Item: marshall({
          ...SchemaKeys.audit(verifiedCase.caseId, audit.entryId),
          Type: 'Audit',
          ...audit
        }, { removeUndefinedValues: true })
      }));
    }
  },

  /**
   * Safely persists an extraction result to a specific evidence record
   */
  saveExtractionResult: async (caseId: string, evidence: Evidence): Promise<void> => {
    await dynamoClient.send(new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall({
        ...SchemaKeys.evidence(caseId, evidence.evidenceId),
        Type: 'Evidence',
        ...evidence
      }, { removeUndefinedValues: true })
    }));
  },

  /**
   * Retrieves a full Case by ID, assembling its nested entities
   */
  getCase: async (caseId: string): Promise<Case | null> => {
    const { Items } = await dynamoClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: marshall({ ':pk': `CASE#${caseId}` })
    }));

    if (!Items || Items.length === 0) return null;

    let caseMeta: Record<string, unknown> | null = null;
    const evidence: Evidence[] = [];
    const findings: Finding[] = [];
    const auditLog: AuditEntry[] = [];

    for (const rawItem of Items) {
      const item = unmarshall(rawItem);
      if (item.Type === 'Case') caseMeta = item;
      else if (item.Type === 'Evidence') evidence.push(item as Evidence);
      else if (item.Type === 'Finding') findings.push(item as Finding);
      else if (item.Type === 'Audit') auditLog.push(item as AuditEntry);
    }

    if (!caseMeta) return null;

    return {
      ...caseMeta,
      evidence,
      findings,
      auditLog
    } as Case;
  },

  /**
   * Lists all Cases (Scans for demo purposes. In prod, use GSI queries)
   */
  listCases: async (orgId?: string): Promise<Case[]> => {
    let filterExpression = '#typ = :caseType';
    const expressionAttributeNames: Record<string, string> = { '#typ': 'Type' };
    const expressionAttributeValues: Record<string, unknown> = { ':caseType': 'Case' };

    if (orgId) {
      filterExpression += ' AND producer.producerId = :orgId';
      expressionAttributeValues[':orgId'] = orgId;
    }

    const { Items } = await dynamoClient.send(new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: filterExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: marshall(expressionAttributeValues)
    }));

    if (!Items) return [];
    
    // For listing, we might just return the metadata to save bandwidth, 
    // but to keep types compatible, we'll return empty arrays for nested items
    return Items.map(raw => {
      const item = unmarshall(raw);
      return {
        ...item,
        evidence: [],
        findings: [],
        auditLog: []
      } as unknown as Case;
    });
  },

  /**
   * Updates only the core Case metadata
   */
  updateCaseMeta: async (caseId: string, updates: Partial<Case>): Promise<void> => {
    const { evidence, findings, auditLog, caseId: cid, ...metaUpdates } = updates;
    
    // Build update expression dynamically
    const updateExpressions: string[] = [];
    const expressionAttributeValues: Record<string, unknown> = {};
    const expressionAttributeNames: Record<string, string> = {};

    Object.entries(metaUpdates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    if (updateExpressions.length === 0) return;

    await dynamoClient.send(new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: marshall(SchemaKeys.case(caseId)),
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: marshall(expressionAttributeValues, { removeUndefinedValues: true })
    }));
  },

  /**
   * Adds a single audit log entry to a case.
   */
  addAuditLog: async (caseId: string, audit: AuditEntry): Promise<void> => {
    await dynamoClient.send(new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall({
        ...SchemaKeys.audit(caseId, audit.entryId),
        Type: 'Audit',
        ...audit
      }, { removeUndefinedValues: true })
    }));
  }
};
