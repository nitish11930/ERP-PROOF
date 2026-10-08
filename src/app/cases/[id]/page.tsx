'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, FileText, Shield, Clock, CheckCircle, XCircle,
  AlertTriangle, Zap, MapPin, Calendar, Weight, Award,
  ChevronDown, ChevronUp, ExternalLink, User,
} from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { StatusBadge, RiskBadge, EvidenceTypeBadge } from '@/components/ui/Badge';
import { DEMO_CASES } from '@/lib/data/demo';
import { getRiskColor, getRiskBgColor } from '@/lib/risk/calculator';

const FINDING_ICONS: Record<string, React.ElementType> = {
  quantity_mismatch: Weight,
  date_inconsistency: Calendar,
  location_mismatch: MapPin,
  forged_document: Shield,
  missing_certificate: Award,
  low_confidence: AlertTriangle,
};

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  const c = DEMO_CASES.find((x) => x.caseId === caseId);

  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview'|'evidence'|'findings'|'audit'>('overview');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewComment, setReviewComment] = useState('');

  if (!c) {
    return (
      <>
        <TopBar title="Case Not Found" />
        <main className="page-content">
          <div className="empty-state">
            <div className="empty-state-icon"><Shield size={28} /></div>
            <div className="empty-state-title">Case not found</div>
            <div className="empty-state-desc">The case ID &quot;{caseId}&quot; does not exist.</div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => router.push('/cases')}>
              Back to Cases
            </button>
          </div>
        </main>
      </>
    );
  }

  const quantityDelta = c.verifiedQuantityKg !== null
    ? ((c.claimedQuantityKg - c.verifiedQuantityKg) / c.claimedQuantityKg * 100).toFixed(1)
    : null;

  const TABS = [
    { id: 'overview',  label: 'Overview' },
    { id: 'evidence',  label: `Evidence (${c.evidence.length})` },
    { id: 'findings',  label: `AI Findings (${c.findings.length})` },
    { id: 'audit',     label: `Audit Trail (${c.auditLog.length})` },
  ] as const;

  return (
    <>
      <TopBar title={`Case ${c.caseId}`} subtitle={c.producer.name} />

      <main className="page-content" id={`case-detail-${c.caseId}`}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: '13px', color: 'var(--color-gray-500)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => router.push('/cases')} style={{ gap: 4 }}>
            <ArrowLeft size={14} /> Cases
          </button>
          <span>/</span>
          <span style={{ color: 'var(--color-gray-800)', fontWeight: 600 }}>{c.caseId}</span>
        </div>

        {/* Case Header */}
        <div className="card card-lg" style={{ marginBottom: 20, background: `linear-gradient(135deg, ${getRiskBgColor(c.riskLevel)} 0%, white 60%)` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <StatusBadge status={c.status} />
                <RiskBadge level={c.riskLevel} />
                <span style={{ fontSize: '12px', color: 'var(--color-gray-400)' }}>FY {c.financialYear}</span>
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-gray-900)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                {c.producer.name}
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--color-gray-500)', marginBottom: 16 }}>
                {c.materialCategory} · {c.producer.state} · {c.producer.registrationNumber}
              </p>

              <div style={{ display: 'flex', gap: 32 }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Claimed</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-gray-900)' }}>
                    {c.claimedQuantityKg.toLocaleString('en-IN')} <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--color-gray-400)' }}>kg</span>
                  </div>
                </div>
                {c.verifiedQuantityKg !== null && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Verified</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-success)' }}>
                      {c.verifiedQuantityKg.toLocaleString('en-IN')} <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--color-gray-400)' }}>kg</span>
                    </div>
                  </div>
                )}
                {quantityDelta !== null && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Δ Gap</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-warning)' }}>
                      {quantityDelta}%
                    </div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Target</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-gray-900)' }}>
                    {c.targetQuantityKg.toLocaleString('en-IN')} <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--color-gray-400)' }}>kg</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Score Circle */}
            <div style={{ textAlign: 'center' }}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-gray-200)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke={getRiskColor(c.riskLevel)}
                  strokeWidth="8"
                  strokeDasharray={`${(c.riskScore / 100) * 263.9} 263.9`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
                <text x="50" y="46" textAnchor="middle" fontSize="24" fontWeight="800" fill={getRiskColor(c.riskLevel)}>{c.riskScore}</text>
                <text x="50" y="62" textAnchor="middle" fontSize="10" fill="var(--color-gray-400)">Risk Score</text>
              </svg>
              <div style={{ fontSize: '12px', fontWeight: 700, color: getRiskColor(c.riskLevel), marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {c.riskLevel}
              </div>
              {c.findings.length > 0 && (
                <div style={{ fontSize: '11px', color: 'var(--color-gray-400)', marginTop: 4 }}>
                  {c.findings.length} finding{c.findings.length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid var(--color-gray-200)', background: 'white', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', padding: '0 4px' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 18px',
                fontSize: '13px',
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? 'var(--color-blue-600)' : 'var(--color-gray-500)',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--color-blue-600)' : '2px solid transparent',
                marginBottom: '-1px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Overview ── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Producer Info */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>Producer Details</div>
              {[
                ['Name', c.producer.name],
                ['Registration', c.producer.registrationNumber],
                ['Category', c.producer.category],
                ['State', c.producer.state],
                ['Contact', c.producer.contactEmail],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid var(--color-gray-100)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-gray-400)', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-gray-800)', textAlign: 'right', maxWidth: '55%' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Case Summary */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>Case Summary</div>
              {[
                ['Case ID', c.caseId],
                ['Submitted', new Date(c.submittedAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
                ['Financial Year', c.financialYear],
                ['Material Category', c.materialCategory],
                ['Evidence Files', `${c.evidenceIds.length} document${c.evidenceIds.length !== 1 ? 's' : ''}`],
                ['AI Findings', c.findings.length > 0 ? `${c.findings.length} finding${c.findings.length > 1 ? 's' : ''}` : 'None detected'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid var(--color-gray-100)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-gray-400)', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-gray-800)', textAlign: 'right', maxWidth: '55%' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Review Decision (if present) */}
            {c.reviewDecision && (
              <div className="card" style={{ gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div className="section-title">Review Decision</div>
                  <span className={`badge badge-${c.reviewDecision.decision === 'approved' ? 'approved' : c.reviewDecision.decision === 'rejected' ? 'rejected' : 'pending'}`}>
                    <span className="badge-dot" />
                    {c.reviewDecision.decision.replace(/_/g, ' ')}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--color-gray-400)', marginBottom: 4 }}>Reviewer</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', fontWeight: 600 }}>
                      <User size={14} style={{ color: 'var(--color-blue-500)' }} />
                      {c.reviewDecision.reviewerName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-gray-400)', marginTop: 4 }}>
                      {new Date(c.reviewDecision.reviewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--color-gray-400)', marginBottom: 4 }}>Comments</div>
                    <div style={{ fontSize: '13px', color: 'var(--color-gray-700)', lineHeight: 1.6 }}>{c.reviewDecision.comments}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Review Actions (if pending/in_review) */}
            {(c.status === 'pending' || c.status === 'in_review') && (
              <div className="card" style={{ gridColumn: 'span 2' }}>
                <div className="section-title" style={{ marginBottom: 12 }}>Quick Review Actions</div>
                {!showReviewForm ? (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-success" onClick={() => setShowReviewForm(true)}>
                      <CheckCircle size={14} /> Approve Case
                    </button>
                    <button className="btn btn-danger" onClick={() => setShowReviewForm(true)}>
                      <XCircle size={14} /> Reject Case
                    </button>
                    <button className="btn btn-secondary" onClick={() => setShowReviewForm(true)}>
                      Request More Info
                    </button>
                    <button className="btn btn-secondary">
                      <AlertTriangle size={14} /> Escalate
                    </button>
                  </div>
                ) : (
                  <div>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Add review comments (required)…"
                      rows={3}
                      style={{
                        width: '100%', padding: '10px 12px',
                        border: '1px solid var(--color-gray-200)',
                        borderRadius: 'var(--radius-md)', fontSize: '13px',
                        fontFamily: 'var(--font-family)', resize: 'vertical', marginBottom: 10,
                      }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-primary btn-sm">Submit Decision</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setShowReviewForm(false)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Evidence ── */}
        {activeTab === 'evidence' && (
          <div>
            {c.evidence.length === 0 ? (
              <div className="card">
                <div className="empty-state" style={{ padding: '40px 20px' }}>
                  <div className="empty-state-icon"><FileText size={24} /></div>
                  <div className="empty-state-title">No evidence loaded</div>
                  <div className="empty-state-desc">Evidence files for this case have not been loaded into demo data.</div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {c.evidence.map((ev) => (
                  <div className="card" key={ev.evidenceId} style={{ border: ev.contradictions.length > 0 ? '1px solid var(--color-warning)' : undefined }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div className="evidence-icon" style={{
                        background: ev.type === 'certificate' ? 'var(--color-success-light)' :
                                    ev.type === 'invoice'     ? 'var(--color-blue-50)'       :
                                    ev.type === 'manifest'   ? 'var(--color-purple-light)'   : 'var(--color-gray-100)',
                      }}>
                        <FileText size={20} style={{ color: 'var(--color-blue-600)' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-gray-900)' }}>{ev.fileName}</div>
                          <EvidenceTypeBadge type={ev.type} />
                          {ev.contradictions.length > 0 && (
                            <span style={{
                              padding: '2px 8px', borderRadius: 4, fontSize: '11px', fontWeight: 600,
                              background: 'var(--color-warning-light)', color: 'var(--color-warning-dark)',
                            }}>⚠ {ev.contradictions.length} contradiction{ev.contradictions.length > 1 ? 's' : ''}</span>
                          )}
                        </div>

                        {/* Extracted Data Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px 20px', marginBottom: 12 }}>
                          {ev.extractedData.quantity && (
                            <div>
                              <div style={{ fontSize: '10px', color: 'var(--color-gray-400)', fontWeight: 600, textTransform: 'uppercase' }}>Quantity</div>
                              <div style={{ fontSize: '13px', fontWeight: 700 }}>{ev.extractedData.quantity.toLocaleString('en-IN')} {ev.extractedData.unit}</div>
                            </div>
                          )}
                          {ev.extractedData.date && (
                            <div>
                              <div style={{ fontSize: '10px', color: 'var(--color-gray-400)', fontWeight: 600, textTransform: 'uppercase' }}>Date</div>
                              <div style={{ fontSize: '13px', fontWeight: 700 }}>{new Date(ev.extractedData.date).toLocaleDateString('en-IN')}</div>
                            </div>
                          )}
                          {ev.extractedData.location && (
                            <div>
                              <div style={{ fontSize: '10px', color: 'var(--color-gray-400)', fontWeight: 600, textTransform: 'uppercase' }}>Location</div>
                              <div style={{ fontSize: '13px', fontWeight: 700 }}>{ev.extractedData.location}</div>
                            </div>
                          )}
                          {ev.extractedData.recyclerName && (
                            <div>
                              <div style={{ fontSize: '10px', color: 'var(--color-gray-400)', fontWeight: 600, textTransform: 'uppercase' }}>Recycler</div>
                              <div style={{ fontSize: '13px', fontWeight: 700 }}>{ev.extractedData.recyclerName}</div>
                            </div>
                          )}
                          {ev.extractedData.certificateNumber && (
                            <div>
                              <div style={{ fontSize: '10px', color: 'var(--color-gray-400)', fontWeight: 600, textTransform: 'uppercase' }}>Certificate No.</div>
                              <div className="mono" style={{ fontSize: '12px', fontWeight: 600 }}>{ev.extractedData.certificateNumber}</div>
                            </div>
                          )}
                          <div>
                            <div style={{ fontSize: '10px', color: 'var(--color-gray-400)', fontWeight: 600, textTransform: 'uppercase' }}>AI Confidence</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                              <div style={{ flex: 1, height: 4, background: 'var(--color-gray-200)', borderRadius: 99 }}>
                                <div style={{ height: '100%', width: `${ev.confidenceScore * 100}%`, background: ev.confidenceScore >= 0.8 ? 'var(--color-success)' : ev.confidenceScore >= 0.65 ? 'var(--color-warning)' : 'var(--color-danger)', borderRadius: 99 }} />
                              </div>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: ev.confidenceScore >= 0.8 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                                {(ev.confidenceScore * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {ev.extractedData.aiSummary && (
                          <div className="finding-ai" style={{ marginBottom: ev.contradictions.length > 0 ? 12 : 0 }}>
                            <div className="finding-ai-label"><Zap size={10} /> AI Summary</div>
                            {ev.extractedData.aiSummary}
                          </div>
                        )}

                        {ev.contradictions.map((con) => (
                          <div key={con.contradictionId} style={{
                            marginTop: 8, padding: '10px 12px', borderRadius: 6,
                            background: 'var(--color-warning-light)', border: '1px solid #fcd34d',
                          }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-warning-dark)', marginBottom: 4 }}>
                              ⚠ Contradiction — {con.field}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-gray-700)' }}>{con.description}</div>
                            <div style={{ fontSize: '11px', color: 'var(--color-gray-500)', marginTop: 4 }}>
                              Expected: <strong>{con.expectedValue}</strong> · Found: <strong>{con.foundValue}</strong>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                        <div style={{ fontSize: '11px', color: 'var(--color-gray-400)' }}>
                          {(ev.fileSize / 1024).toFixed(0)} KB
                        </div>
                        <button className="btn btn-secondary btn-sm" style={{ gap: 4 }}>
                          <ExternalLink size={11} /> View Doc
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: AI Findings ── */}
        {activeTab === 'findings' && (
          <div>
            {c.findings.length === 0 ? (
              <div className="card">
                <div className="empty-state" style={{ padding: '40px 20px' }}>
                  <div className="empty-state-icon" style={{ background: 'var(--color-success-light)' }}>
                    <CheckCircle size={24} style={{ color: 'var(--color-success)' }} />
                  </div>
                  <div className="empty-state-title">No findings detected</div>
                  <div className="empty-state-desc">AI analysis found no inconsistencies or risk signals in the submitted evidence.</div>
                </div>
              </div>
            ) : (
              c.findings.map((f) => {
                const Icon = FINDING_ICONS[f.type] || AlertTriangle;
                const expanded = expandedFinding === f.findingId;
                return (
                  <div key={f.findingId} className="finding-card">
                    <div className="finding-card-header" style={{ cursor: 'pointer' }} onClick={() => setExpandedFinding(expanded ? null : f.findingId)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                          background: getRiskBgColor(f.severity), display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <Icon size={16} style={{ color: getRiskColor(f.severity) }} />
                        </div>
                        <div>
                          <div className="finding-title">{f.title}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-gray-400)', marginTop: 2 }}>
                            {new Date(f.detectedAt).toLocaleDateString('en-IN')} · {f.riskPoints} risk pts
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <RiskBadge level={f.severity} />
                        {expanded ? <ChevronUp size={16} style={{ color: 'var(--color-gray-400)' }} /> : <ChevronDown size={16} style={{ color: 'var(--color-gray-400)' }} />}
                      </div>
                    </div>

                    <div className="finding-desc">{f.description}</div>

                    {expanded && (
                      <div>
                        <div className="finding-ai">
                          <div className="finding-ai-label"><Zap size={11} /> AI Reasoning</div>
                          {f.aiReasoning}
                        </div>
                        <div style={{ marginTop: 10, fontSize: '12px', color: 'var(--color-gray-500)' }}>
                          Affects: {f.affectedEvidenceIds.join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Tab: Audit Trail ── */}
        {activeTab === 'audit' && (
          <div className="card">
            <div className="section-title" style={{ marginBottom: 16 }}>Audit Trail</div>
            {c.auditLog.map((entry) => (
              <div key={entry.entryId} className="audit-entry">
                <div>
                  <div className="audit-time">{new Date(entry.timestamp).toLocaleString('en-IN')}</div>
                  <div style={{ marginTop: 4 }}>
                    <span style={{
                      padding: '2px 7px', borderRadius: 4, fontSize: '10px', fontWeight: 600,
                      background: entry.actorRole === 'system' ? 'var(--color-blue-50)' :
                                  entry.actorRole === 'reviewer' ? 'var(--color-success-light)' : 'var(--color-gray-100)',
                      color: entry.actorRole === 'system' ? 'var(--color-blue-600)' :
                             entry.actorRole === 'reviewer' ? 'var(--color-success-dark)' : 'var(--color-gray-600)',
                    }}>
                      {entry.actorRole}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="audit-action">{entry.action}</div>
                  <div className="audit-actor">{entry.actor}</div>
                  <div className="audit-detail">{entry.details}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
