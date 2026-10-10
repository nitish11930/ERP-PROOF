// ──────────────────────────────────────────────
// EPR PROOF — Core TypeScript Types
// ──────────────────────────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type CaseStatus = 'draft' | 'evidence_uploaded' | 'processing' | 'needs_more_evidence' | 'ready_for_review' | 'pending' | 'in_review' | 'approved' | 'rejected' | 'escalated' | 'review_completed';
export type EvidenceType = 'invoice' | 'certificate' | 'photo' | 'manifest' | 'report';
export type FindingType =
  | 'quantity_mismatch'
  | 'date_inconsistency'
  | 'location_mismatch'
  | 'forged_document'
  | 'missing_certificate'
  | 'low_confidence'
  | 'duplicate_evidence'
  | 'entity_inconsistency'
  | 'batch_mismatch'
  | 'missing_information';

export interface Producer {
  producerId: string;
  name: string;
  category: string; // e.g. "Electronics", "Batteries"
  registrationNumber: string;
  contactEmail: string;
  state: string;
}

export interface Evidence {
  evidenceId: string;
  caseId: string;
  type: EvidenceType;
  fileName: string;
  s3Key: string;
  extractedData: ExtractedData;
  contradictions: Contradiction[];
  confidenceScore: number; // 0–1
  uploadedAt: string; // ISO date
  fileSize: number; // bytes
  mimeType: string;
  fileHash?: string; // SHA-256 hash
}

export interface ExtractedFact {
  field: string;
  value: string | number | boolean | null;
  confidence: number | null;
  source: {
    page?: number | null;
    text?: string;
    inferred?: boolean;
  } | null;
}

export interface ExtractedDocument {
  documentId: string;
  documentType: 'epr_certificate' | 'collection_receipt' | 'transportation_document' | 'recycler_intake' | 'processing_report' | 'recovery_report' | 'invoice' | 'registration' | 'other' | 'unknown';
  classificationRationale?: string;
  extractionStatus: 'UPLOADED' | 'PENDING_PROCESSING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'UNSUPPORTED_FORMAT' | 'PROVIDER_UNAVAILABLE';
  facts: Record<string, ExtractedFact>;
  confidence: number;
  warnings: string[];
  requiresHumanReview?: boolean;
  modelId: string;
  extractedAt: string;
}

// Keeping the original ExtractedData for backward compatibility with Phase 2 UI
export interface ExtractedData {
  quantity?: number;          // kg
  unit?: string;
  date?: string;              // ISO date
  location?: string;
  recyclerName?: string;
  certificateNumber?: string;
  materialType?: string;
  aiSummary?: string;
  bedrockExtraction?: ExtractedDocument; // Attached for Phase 3D
}

export interface Contradiction {
  contradictionId: string;
  field: string;
  expectedValue: string;
  foundValue: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface Finding {
  findingId: string;
  caseId: string;
  type: FindingType;
  severity: RiskLevel;
  title: string;
  description: string;
  affectedEvidenceIds: string[];
  aiReasoning: string;
  riskPoints: number;
  detectedAt: string;
}

export interface ReviewDecision {
  reviewerId: string;
  reviewerName: string;
  decision: 'approved' | 'rejected' | 'needs_more_info' | 'escalated';
  comments: string;
  reviewedAt: string;
}

export interface AuditEntry {
  entryId: string;
  caseId: string;
  action: string;
  actor: string;
  actorRole: 'system' | 'analyst' | 'reviewer' | 'admin';
  timestamp: string;
  details: string;
  metadata?: Record<string, string>;
}

export interface Case {
  caseId: string;
  producer: Producer;
  submittedAt: string;
  status: CaseStatus;
  claimedQuantityKg: number;
  verifiedQuantityKg: number | null;
  riskScore: number;       // 0–100
  riskLevel: RiskLevel;
  evidenceIds: string[];
  evidence: Evidence[];
  findings: Finding[];
  reviewDecision: ReviewDecision | null;
  auditLog: AuditEntry[];
  financialYear: string;   // e.g. "2024-25"
  materialCategory: string;
  targetQuantityKg: number;
  
  // New fields for Step A
  claimTitle?: string;
  periodStart?: string;
  periodEnd?: string;
  activity?: string;
  recyclerRegistrationRef?: string;
  description?: string;
}

// Dashboard summary types
export interface KPIData {
  totalCases: number;
  pendingReview: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
  avgRiskScore: number;
  totalQuantityVerifiedKg: number;
  verificationRate: number; // percentage
}

export interface RiskDistribution {
  level: RiskLevel;
  count: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  submitted: number;
  approved: number;
  rejected: number;
}
