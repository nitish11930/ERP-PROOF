import type { CaseStatus, RiskLevel } from '@/lib/types';

// ── Status Badge ──────────────────────────────
const STATUS_LABELS: Record<CaseStatus, string> = {
  pending:   'Pending',
  in_review: 'In Review',
  approved:  'Approved',
  rejected:  'Rejected',
  escalated: 'Escalated',
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span className={`badge badge-${status}`}>
      <span className="badge-dot" />
      {STATUS_LABELS[status]}
    </span>
  );
}

// ── Risk Badge ────────────────────────────────
const RISK_LABELS: Record<RiskLevel, string> = {
  low:      'Low',
  medium:   'Medium',
  high:     'High',
  critical: 'Critical',
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={`badge badge-${level}`}>
      {RISK_LABELS[level]}
    </span>
  );
}

// ── Risk Score Bar ────────────────────────────
const RISK_BAR_COLORS: Record<RiskLevel, string> = {
  low:      'var(--color-success)',
  medium:   'var(--color-warning)',
  high:     'var(--color-orange)',
  critical: 'var(--color-danger)',
};

export function RiskScoreBar({
  score,
  level,
  compact = false,
}: {
  score: number;
  level: RiskLevel;
  compact?: boolean;
}) {
  const color = RISK_BAR_COLORS[level];
  return (
    <div className="risk-bar-wrap">
      <div className="risk-bar-track" style={{ height: compact ? '4px' : '6px' }}>
        <div
          className="risk-bar-fill"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span
        className="risk-score-text"
        style={{ color, fontSize: compact ? '11px' : '12px' }}
      >
        {score}
      </span>
    </div>
  );
}

// ── Evidence Type Badge ───────────────────────
const EV_TYPE_CONFIG = {
  invoice:     { label: 'Invoice',     color: '#eff6ff', text: '#1d4ed8' },
  certificate: { label: 'Certificate', color: '#d1fae5', text: '#065f46' },
  photo:       { label: 'Photo',       color: '#fef3c7', text: '#92400e' },
  manifest:    { label: 'Manifest',    color: '#ede9fe', text: '#5b21b6' },
  report:      { label: 'Report',      color: '#fee2e2', text: '#991b1b' },
};

export function EvidenceTypeBadge({ type }: { type: keyof typeof EV_TYPE_CONFIG }) {
  const cfg = EV_TYPE_CONFIG[type] ?? { label: type, color: '#f1f5f9', text: '#475569' };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        fontSize: '11px',
        fontWeight: 600,
        background: cfg.color,
        color: cfg.text,
      }}
    >
      {cfg.label}
    </span>
  );
}
