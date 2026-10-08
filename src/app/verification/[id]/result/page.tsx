'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCase } from '@/lib/services/store';
import { FactNormalizer } from '@/lib/services/factNormalizer';
import { TopBar } from '@/components/layout/TopBar';
import { RiskBadge } from '@/components/ui/Badge';
import { getRiskColor, getRiskBgColor } from '@/lib/risk/calculator';
import { ShieldAlert, CheckCircle, ArrowRight, FileText, Activity, AlertTriangle, Play, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { Case } from '@/lib/types';

export default function VerificationResultPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const c = getCase(params.id);
  
  useEffect(() => {
    if (!c) router.push('/cases');
  }, [c, router]);

  if (!c) return null;

  // Extract totals for visual
  const claim = c.claimedQuantityKg;
  
  let col = 0;
  let rec = 0;
  
  c.evidence.forEach(e => {
    const norm = FactNormalizer.normalize(e);
    if (norm.documentType === 'invoice' || norm.documentType === 'collection') col += (norm.quantityKg || 0);
    if (norm.documentType === 'certificate' || norm.documentType === 'recycling') rec += (norm.quantityKg || 0);
  });

  const gap = claim - (rec || col); // Prefer cert, fallback to collection

  return (
    <>
      <TopBar title="Verification Result" subtitle={c.caseId} />
      
      <main className="page-content">
        {/* Header Summary */}
        <div className="card" style={{ padding: 24, marginBottom: 24, borderLeft: `4px solid ${getRiskColor(c.riskLevel)}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-slate-900)', marginBottom: 4 }}>
                {c.producer.name}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--color-slate-500)', display: 'flex', gap: 12, alignItems: 'center' }}>
                <span className="mono">{c.caseId}</span>
                <span>•</span>
                <span>{c.materialCategory}</span>
                <span>•</span>
                <span>Claim: {claim.toLocaleString()} kg</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Risk Score</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: getRiskColor(c.riskLevel), lineHeight: 1 }}>{c.riskScore}</div>
              </div>
              <RiskBadge level={c.riskLevel} />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          {/* Main Visual & Findings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Evidence Consistency Visual */}
            <div className="card" style={{ padding: 24 }}>
              <div className="section-header" style={{ marginBottom: 24 }}>
                <div>
                  <div className="section-title">Evidence Consistency Analysis</div>
                  <div className="section-sub">End-to-end material flow verification</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '40px 20px', background: 'var(--color-slate-50)', borderRadius: 'var(--radius-lg)' }}>
                {/* Node: Claim */}
                <div style={{ textAlign: 'center', width: 120 }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-slate-500)', textTransform: 'uppercase', marginBottom: 8 }}>Claimed Target</div>
                  <div style={{ background: 'white', border: '2px solid var(--color-slate-200)', borderRadius: 'var(--radius-md)', padding: '12px', fontWeight: 700, color: 'var(--color-slate-900)' }}>
                    {claim.toLocaleString()} kg
                  </div>
                </div>

                <ChevronRight color="var(--color-slate-300)" size={32} />

                {/* Node: Collection */}
                <div style={{ textAlign: 'center', width: 120, position: 'relative' }} className="group">
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-slate-500)', textTransform: 'uppercase', marginBottom: 8 }}>Collection</div>
                  <div style={{ background: 'white', border: `2px solid ${col === 0 ? 'var(--color-slate-200)' : 'var(--color-blue-400)'}`, borderRadius: 'var(--radius-md)', padding: '12px', fontWeight: 700, color: col === 0 ? 'var(--color-slate-400)' : 'var(--color-blue-700)', cursor: 'help' }}>
                    {col === 0 ? 'Missing' : `${col.toLocaleString()} kg`}
                  </div>
                </div>

                <ChevronRight color="var(--color-slate-300)" size={32} />

                {/* Node: Recycling */}
                <div style={{ textAlign: 'center', width: 120 }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-slate-500)', textTransform: 'uppercase', marginBottom: 8 }}>Recycling Record</div>
                  <div style={{ background: 'white', border: `2px solid ${rec === 0 ? 'var(--color-slate-200)' : 'var(--color-success)'}`, borderRadius: 'var(--radius-md)', padding: '12px', fontWeight: 700, color: rec === 0 ? 'var(--color-slate-400)' : 'var(--color-success-dark)' }}>
                    {rec === 0 ? 'Missing' : `${rec.toLocaleString()} kg`}
                  </div>
                </div>

              </div>

              {gap !== 0 && (
                <div style={{ marginTop: 24, padding: 16, background: 'var(--color-danger-light)', borderRadius: 'var(--radius-md)', border: '1px dashed #fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <AlertTriangle color="var(--color-danger)" size={24} />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-danger-dark)' }}>Evidence Gap Detected</div>
                      <div style={{ fontSize: '13px', color: 'var(--color-danger-dark)', opacity: 0.8 }}>Supported evidence falls short of the claimed quantity.</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-danger)' }}>
                    {Math.abs(gap).toLocaleString()} kg
                  </div>
                </div>
              )}
            </div>

            {/* Findings List */}
            <div className="card" style={{ padding: 24 }}>
              <div className="section-header" style={{ marginBottom: 20 }}>
                <div>
                  <div className="section-title">Risk Findings</div>
                  <div className="section-sub">Signals requiring human review</div>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, padding: '4px 10px', background: 'var(--color-slate-100)', borderRadius: 20 }}>
                  {c.findings.length} Signals
                </span>
              </div>

              {c.findings.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px 0' }}>
                  <CheckCircle size={32} color="var(--color-success)" style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-slate-900)' }}>No contradictions found</div>
                  <div style={{ fontSize: '14px', color: 'var(--color-slate-500)', marginTop: 4 }}>The evidence is consistent and supports the claim.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {c.findings.map(f => (
                    <div key={f.findingId} style={{ 
                      padding: 16, 
                      borderRadius: 'var(--radius-md)', 
                      background: getRiskBgColor(f.severity),
                      border: `1px solid ${f.severity === 'critical' ? '#fca5a5' : f.severity === 'high' ? '#fdba74' : '#fcd34d'}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <AlertTriangle size={16} color={getRiskColor(f.severity)} />
                          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-slate-900)' }}>{f.title}</div>
                        </div>
                        <RiskBadge level={f.severity} />
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--color-slate-700)', marginBottom: 12 }}>
                        {f.description}
                      </div>
                      <div style={{ padding: 12, background: 'rgba(255,255,255,0.6)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--color-slate-800)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <Activity size={14} style={{ flexShrink: 0, marginTop: 2, color: 'var(--color-blue-600)' }} />
                        <span><strong>Analysis:</strong> {f.aiReasoning || 'Evidence inconsistency detected. Requires human review.'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Sidebar: Actions & Metadata */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="card" style={{ padding: 24 }}>
              <div className="section-title" style={{ marginBottom: 16 }}>Next Actions</div>
              
              <Link href={`/evidence?case=${c.caseId}`} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={16} /> Inspect Evidence</span>
                <ArrowRight size={16} color="var(--color-slate-400)" />
              </Link>

              <Link href={`/review?case=${c.caseId}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ShieldAlert size={16} /> Send to Human Review</span>
                <ArrowRight size={16} color="white" />
              </Link>
            </div>

            <div className="card" style={{ padding: 24 }}>
              <div className="section-title" style={{ marginBottom: 16 }}>Documents Received</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {c.evidence.map(e => (
                  <div key={e.evidenceId} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--color-slate-100)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--color-slate-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={16} color="var(--color-slate-500)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="truncate" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-slate-800)' }}>{e.fileName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-slate-500)', textTransform: 'capitalize' }}>{e.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
