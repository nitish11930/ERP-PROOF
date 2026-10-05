// ──────────────────────────────────────────────
// EPR PROOF — Risk Calculation Engine
// Deterministic scoring — no AI required
// ──────────────────────────────────────────────
import type { Case, Finding, RiskLevel } from '@/lib/types';

export interface RiskBreakdown {
  totalScore: number;
  riskLevel: RiskLevel;
  factors: { label: string; points: number; triggered: boolean }[];
}

export function calculateRisk(
  claimedKg: number,
  certifiedKg: number | null,
  findings: Finding[],
  hasRequiredCertificate: boolean,
  avgConfidence: number,
  dateDeltaDays: number
): RiskBreakdown {
  const factors: RiskBreakdown['factors'] = [];
  let score = 0;

  // Quantity delta
  const quantityDelta =
    certifiedKg !== null
      ? Math.abs(claimedKg - certifiedKg) / claimedKg
      : 0;
  const quantityTriggered = quantityDelta > 0.2;
  const quantityPoints = quantityTriggered ? 30 : 0;
  score += quantityPoints;
  factors.push({
    label: `Quantity delta > 20% (actual: ${(quantityDelta * 100).toFixed(1)}%)`,
    points: quantityPoints,
    triggered: quantityTriggered,
  });

  // Date gaps
  const dateTriggered = dateDeltaDays > 30;
  const datePoints = dateTriggered ? 20 : 0;
  score += datePoints;
  factors.push({
    label: `Date gap > 30 days between documents (actual: ${dateDeltaDays}d)`,
    points: datePoints,
    triggered: dateTriggered,
  });

  // Location mismatch
  const locationTriggered = findings.some((f) => f.type === 'location_mismatch');
  const locationPoints = locationTriggered ? 25 : 0;
  score += locationPoints;
  factors.push({
    label: 'Location mismatch detected',
    points: locationPoints,
    triggered: locationTriggered,
  });

  // Missing certificate
  const certPoints = !hasRequiredCertificate ? 40 : 0;
  score += certPoints;
  factors.push({
    label: 'Mandatory recycling certificate missing',
    points: certPoints,
    triggered: !hasRequiredCertificate,
  });

  // Low AI confidence
  const confTriggered = avgConfidence < 0.7;
  const confPoints = confTriggered ? 15 : 0;
  score += confPoints;
  factors.push({
    label: `Low AI extraction confidence (< 0.70, actual: ${avgConfidence.toFixed(2)})`,
    points: confPoints,
    triggered: confTriggered,
  });

  const capped = Math.min(score, 100);

  let riskLevel: RiskLevel;
  if (capped <= 30) riskLevel = 'low';
  else if (capped <= 60) riskLevel = 'medium';
  else if (capped <= 80) riskLevel = 'high';
  else riskLevel = 'critical';

  return { totalScore: capped, riskLevel, factors };
}

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'low':      return '#10b981';
    case 'medium':   return '#f59e0b';
    case 'high':     return '#f97316';
    case 'critical': return '#ef4444';
  }
}

export function getRiskBgColor(level: RiskLevel): string {
  switch (level) {
    case 'low':      return '#d1fae5';
    case 'medium':   return '#fef3c7';
    case 'high':     return '#ffedd5';
    case 'critical': return '#fee2e2';
  }
}

export function getRiskTextColor(level: RiskLevel): string {
  switch (level) {
    case 'low':      return '#065f46';
    case 'medium':   return '#92400e';
    case 'high':     return '#9a3412';
    case 'critical': return '#991b1b';
  }
}
