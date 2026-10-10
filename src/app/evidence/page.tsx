'use client';

import { useState, useEffect } from 'react';
import { Upload, Search, FileText, Filter, CheckCircle, AlertTriangle, Zap } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { EvidenceTypeBadge } from '@/components/ui/Badge';
import type { Evidence, Case } from '@/lib/types';

export default function EvidencePage() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Evidence & { producerName?: string } | null>(null);
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

  // Flatten all evidence from loaded cases
  const allEvidence = cases.flatMap((c) =>
    c.evidence.map((ev) => ({ ...ev, producerName: c.producer.name, caseId: c.caseId }))
  );

  const filtered = allEvidence.filter((ev) => {
    const q = search.toLowerCase();
    const matchType = typeFilter === 'all' || ev.type === typeFilter;
    const matchSearch = !q || ev.fileName.toLowerCase().includes(q) || ev.caseId.toLowerCase().includes(q) || ev.producerName.toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  return (
    <>
      <TopBar
        title="Evidence Explorer"
        subtitle={`${allEvidence.length} documents across ${cases.filter(c => c.evidence.length > 0).length} cases`}
      />

      <main className="page-content" id="evidence-main">
        {/* Upload Area */}
        <div style={{
          border: '2px dashed var(--color-gray-300)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          textAlign: 'center',
          background: 'white',
          marginBottom: 20,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-blue-400)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-gray-300)')}
        >
          <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'var(--color-blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Upload size={22} style={{ color: 'var(--color-blue-500)' }} />
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-gray-800)', marginBottom: 4 }}>
            Drop evidence files here or click to upload
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-gray-400)' }}>
            PDF, JPEG, PNG — Bedrock AI will automatically extract structured data
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button className="btn btn-primary btn-sm"><Upload size={12} /> Upload Documents</button>
            <button className="btn btn-secondary btn-sm">Select Case ID</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: 16 }}>
          <div>
            {/* Filters */}
            <div className="filter-bar">
              <div className="topbar-search">
                <Search size={14} style={{ color: 'var(--color-gray-400)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search by file name, case ID, producer…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: 240 }}
                  id="evidence-search"
                />
              </div>
              {(['all','invoice','certificate','manifest','photo','report'] as const).map((t) => (
                <button
                  key={t}
                  className={`btn btn-sm ${typeFilter === t ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTypeFilter(t)}
                >
                  {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* Evidence List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon"><FileText size={24} /></div>
                  <div className="empty-state-title">No documents found</div>
                  <div className="empty-state-desc">Try adjusting filters or search.</div>
                </div>
              )}
              {filtered.map((ev) => (
                <div
                  key={ev.evidenceId}
                  className="evidence-item"
                  style={{ border: selected?.evidenceId === ev.evidenceId ? '1px solid var(--color-blue-400)' : undefined, boxShadow: selected?.evidenceId === ev.evidenceId ? '0 0 0 2px rgba(59,130,246,0.15)' : undefined }}
                  onClick={() => setSelected(selected?.evidenceId === ev.evidenceId ? null : ev)}
                >
                  <div className="evidence-icon" style={{
                    background: ev.type === 'certificate' ? 'var(--color-success-light)' : ev.type === 'invoice' ? 'var(--color-blue-50)' : 'var(--color-gray-100)'
                  }}>
                    <FileText size={18} style={{ color: 'var(--color-blue-600)' }} />
                  </div>
                  <div className="evidence-info">
                    <div className="evidence-name">{ev.fileName}</div>
                    <div className="evidence-meta">
                      {ev.caseId} · {ev.producerName} · {(ev.fileSize / 1024).toFixed(0)} KB
                    </div>
                  </div>
                  <EvidenceTypeBadge type={ev.type} />
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontSize: '12px', fontWeight: 700,
                      color: ev.confidenceScore >= 0.8 ? 'var(--color-success)' : ev.confidenceScore >= 0.65 ? 'var(--color-warning)' : 'var(--color-danger)',
                    }}>
                      {(ev.confidenceScore * 100).toFixed(0)}%
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--color-gray-400)' }}>confidence</div>
                  </div>
                  {ev.contradictions.length > 0 && (
                    <AlertTriangle size={16} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
                  )}
                  {ev.contradictions.length === 0 && ev.confidenceScore >= 0.8 && (
                    <CheckCircle size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Detail Panel */}
          {selected && (
            <div className="card" style={{ position: 'sticky', top: 0, alignSelf: 'flex-start', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div className="section-title">Document Details</div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <EvidenceTypeBadge type={selected.type} />
                {selected.contradictions.length > 0
                  ? <span className="badge badge-medium"><span className="badge-dot" />Contradictions</span>
                  : <span className="badge badge-approved"><span className="badge-dot" />Clean</span>
                }
              </div>

              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: 4 }}>{selected.fileName}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-gray-400)', marginBottom: 16 }}>
                {selected.caseId} · {(selected.fileSize / 1024).toFixed(0)} KB · {new Date(selected.uploadedAt).toLocaleDateString('en-IN')}
              </div>

              <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                Extracted Data
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {Object.entries(selected.extractedData).filter(([k]) => k !== 'aiSummary').map(([key, val]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-gray-100)', fontSize: '13px' }}>
                    <span style={{ color: 'var(--color-gray-400)', fontWeight: 500, textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-gray-800)' }}>{String(val)}</span>
                  </div>
                ))}
              </div>

              {selected.extractedData.aiSummary && (
                <div className="finding-ai">
                  <div className="finding-ai-label"><Zap size={10} /> AI Summary</div>
                  {selected.extractedData.aiSummary}
                </div>
              )}

              {selected.contradictions.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--color-warning-dark)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    ⚠ Contradictions
                  </div>
                  {selected.contradictions.map((con) => (
                    <div key={con.contradictionId} style={{ padding: '10px', background: 'var(--color-warning-light)', borderRadius: 6, border: '1px solid #fcd34d', marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--color-warning-dark)', marginBottom: 4 }}>{con.field}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-gray-700)' }}>{con.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
