'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, MessageSquare, AlertTriangle, User, Clock, Loader2 } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { StatusBadge, RiskBadge } from '@/components/ui/Badge';
import { getRiskColor } from '@/lib/risk/calculator';
import type { Case } from '@/lib/types';

export default function ReviewQueuePage() {
  const [comment, setComment] = useState<Record<string, string>>({});
  const [decided, setDecided] = useState<Record<string, string>>({});
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cases')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCases(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const reviewable = cases.filter((c) => c.status === 'pending' || c.status === 'in_review' || c.status === 'escalated');

  const decide = async (caseId: string, decision: string) => {
    try {
      const res = await fetch(`/api/cases/${caseId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comments: comment[caseId] })
      });
      if (res.ok) {
        setDecided((prev) => ({ ...prev, [caseId]: decision }));
      } else {
        alert('Failed to submit decision (unauthorized?)');
      }
    } catch (e) {
      alert('Network error submitting decision');
    }
  };

  return (
    <>
      <TopBar
        title="Human Review Queue"
        subtitle={`${reviewable.length} cases awaiting decision`}
      />

      <main className="page-content" id="review-queue-main">
        {/* Queue Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Needs Review', count: reviewable.filter(c => c.status === 'pending').length, color: 'var(--color-warning)' },
            { label: 'In Review', count: reviewable.filter(c => c.status === 'in_review').length, color: 'var(--color-blue-500)' },
            { label: 'Escalated', count: reviewable.filter(c => c.status === 'escalated').length, color: 'var(--color-danger)' },
          ].map((s) => (
            <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
              <div style={{ fontSize: '32px', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.count}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-gray-600)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {reviewable.map((c) => {
            const resolution = decided[c.caseId];
            return (
              <div key={c.caseId} className="review-card" style={{
                opacity: resolution ? 0.7 : 1,
                borderLeft: `4px solid ${c.riskLevel === 'critical' ? 'var(--color-danger)' : c.riskLevel === 'high' ? 'var(--color-orange)' : 'var(--color-blue-400)'}`,
              }}>
                <div className="review-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-gray-900)' }}>
                        {c.producer.name}
                        <span className="mono" style={{ marginLeft: 8, fontSize: '12px', color: 'var(--color-blue-600)', fontWeight: 600 }}>{c.caseId}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-gray-500)', marginTop: 2 }}>
                        {c.materialCategory} · {c.producer.state} · FY {c.financialYear}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <RiskBadge level={c.riskLevel} />
                    <StatusBadge status={c.status} />
                    <div style={{ textAlign: 'right', marginLeft: 8 }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: getRiskColor(c.riskLevel), lineHeight: 1 }}>{c.riskScore}</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-gray-400)' }}>risk</div>
                    </div>
                  </div>
                </div>

                <div className="review-card-body">
                  {/* Key Facts */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px 20px', marginBottom: 12, padding: '12px', background: 'var(--color-gray-50)', borderRadius: 8 }}>
                    {[
                      ['Claimed', `${c.claimedQuantityKg.toLocaleString('en-IN')} kg`],
                      ['Verified', c.verifiedQuantityKg !== null ? `${c.verifiedQuantityKg.toLocaleString('en-IN')} kg` : 'Not yet'],
                      ['Evidence', `${c.evidenceIds.length} file(s)`],
                      ['Findings', c.findings.length > 0 ? `${c.findings.length} flag(s)` : 'None'],
                    ].map(([l, v]) => (
                      <div key={l}>
                        <div style={{ fontSize: '10px', color: 'var(--color-gray-400)', fontWeight: 600, textTransform: 'uppercase' }}>{l}</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-gray-800)', marginTop: 2 }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Findings Summary */}
                  {c.findings.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      {c.findings.slice(0, 2).map((f) => (
                        <div key={f.findingId} style={{
                          display: 'flex', alignItems: 'flex-start', gap: 8,
                          padding: '8px 10px', borderRadius: 6, marginBottom: 6,
                          background: f.severity === 'critical' ? 'var(--color-danger-light)' :
                                      f.severity === 'high' ? 'var(--color-orange-light)' : 'var(--color-warning-light)',
                          border: `1px solid ${f.severity === 'critical' ? '#fca5a5' : f.severity === 'high' ? '#fdba74' : '#fcd34d'}`,
                          fontSize: '12px',
                        }}>
                          <AlertTriangle size={13} style={{ color: getRiskColor(f.severity), flexShrink: 0, marginTop: 1 }} />
                          <div>
                            <strong>{f.title}</strong> — {f.description}
                          </div>
                        </div>
                      ))}
                      {c.findings.length > 2 && (
                        <div style={{ fontSize: '12px', color: 'var(--color-gray-400)', paddingLeft: 4 }}>
                          +{c.findings.length - 2} more finding{c.findings.length - 2 > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Comment Box */}
                  {!resolution && (
                    <textarea
                      value={comment[c.caseId] || ''}
                      onChange={(e) => setComment(prev => ({ ...prev, [c.caseId]: e.target.value }))}
                      placeholder="Add review comments before deciding…"
                      rows={2}
                      style={{
                        width: '100%', padding: '8px 12px',
                        border: '1px solid var(--color-gray-200)', borderRadius: 'var(--radius-md)',
                        fontSize: '12px', fontFamily: 'var(--font-family)', resize: 'vertical',
                      }}
                    />
                  )}

                  {resolution && (
                    <div style={{
                      padding: '10px 14px', borderRadius: 'var(--radius-md)',
                      background: resolution === 'approved' ? 'var(--color-success-light)' : resolution === 'rejected' ? 'var(--color-danger-light)' : 'var(--color-blue-50)',
                      border: `1px solid ${resolution === 'approved' ? '#6ee7b7' : resolution === 'rejected' ? '#fca5a5' : 'var(--color-blue-100)'}`,
                      fontSize: '13px', fontWeight: 600,
                      color: resolution === 'approved' ? 'var(--color-success-dark)' : resolution === 'rejected' ? 'var(--color-danger-dark)' : 'var(--color-blue-600)',
                    }}>
                      ✓ Decision recorded: <strong style={{ textTransform: 'capitalize' }}>{resolution.replace(/_/g, ' ')}</strong>
                    </div>
                  )}
                </div>

                {!resolution && (
                  <div className="review-card-footer">
                    <Link href={`/cases/${c.caseId}`} className="btn btn-ghost btn-sm" style={{ marginRight: 'auto' }}>
                      View Full Case →
                    </Link>
                    <button className="btn btn-secondary btn-sm" onClick={() => decide(c.caseId, 'needs_more_info')}>
                      <MessageSquare size={13} /> Request More Info
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => decide(c.caseId, 'escalated')}>
                      <AlertTriangle size={13} /> Escalate
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => decide(c.caseId, 'rejected')}>
                      <XCircle size={13} /> Reject
                    </button>
                    <button className="btn btn-success btn-sm" onClick={() => decide(c.caseId, 'approved')}>
                      <CheckCircle size={13} /> Approve
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {reviewable.length === 0 && (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon" style={{ background: 'var(--color-success-light)' }}>
                  <CheckCircle size={28} style={{ color: 'var(--color-success)' }} />
                </div>
                <div className="empty-state-title">Queue is clear!</div>
                <div className="empty-state-desc">No cases currently awaiting review.</div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
