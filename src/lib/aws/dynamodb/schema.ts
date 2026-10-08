/**
 * Single-Table Design Schema Definition for EPR Proof
 * 
 * Table Name: epr-proof-cases
 * Partition Key (PK): String
 * Sort Key (SK): String
 * 
 * Access Patterns supported:
 * 1. Get Case: PK = CASE#<id>, SK = CASE#<id>
 * 2. Get Case + All Details (Evidence, Findings, Audit): Query PK = CASE#<id>
 * 3. List Cases: Use GSI1 (GSI1PK = STATUS#<status>, GSI1SK = SUBMITTED_AT) or scan for demo
 * 4. Get Case Evidence: Query PK = CASE#<id> AND SK begins_with(EVIDENCE#)
 */

export const SchemaKeys = {
  case: (caseId: string) => ({
    PK: `CASE#${caseId}`,
    SK: `CASE#${caseId}`,
  }),
  evidence: (caseId: string, evidenceId: string) => ({
    PK: `CASE#${caseId}`,
    SK: `EVIDENCE#${evidenceId}`,
  }),
  finding: (caseId: string, findingId: string) => ({
    PK: `CASE#${caseId}`,
    SK: `FINDING#${findingId}`,
  }),
  audit: (caseId: string, entryId: string) => ({
    PK: `CASE#${caseId}`,
    SK: `AUDIT#${entryId}`,
  }),
};

/**
 * Example Item Structure for Case
 * {
 *    PK: "CASE#EP-2026-00128",
 *    SK: "CASE#EP-2026-00128",
 *    Type: "Case",
 *    ProducerId: "P001",
 *    ClaimedQuantityKg: 2400,
 *    RiskScore: 78,
 *    Status: "pending",
 *    GSI1PK: "STATUS#pending",
 *    GSI1SK: "2024-10-05T00:00:00Z"
 * }
 */
