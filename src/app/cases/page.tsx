'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Download, Eye, ChevronRight } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { StatusBadge, RiskBadge } from '@/components/ui/Badge';
import { DEMO_CASES } from '@/lib/data/demo';
import { getRiskColor } from '@/lib/risk/calculator';
import type { CaseStatus, RiskLevel } from '@/lib/types';

export default function CasesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('submittedAt');

  const filtered = DEMO_CASES.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.caseId.toLowerCase().includes(q) ||
      c.producer.name.toLowerCase().includes(q) ||
      c.materialCategory.toLowerCase().includes(q) ||
      c.producer.registrationNumber.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchRisk   = riskFilter   === 'all' || c.riskLevel === riskFilter;
    return matchSearch && matchStatus && matchRisk;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'riskScore')    return b.riskScore - a.riskScore;
    if (sortBy === 'claimedQty')   return b.claimedQuantityKg - a.claimedQuantityKg;
    return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
  });

  return (
    <>
      <TopBar
        title="Verification Cases"
        subtitle={`${DEMO_CASES.length} total cases · ${DEMO_CASES.filter(c => c.status === 'pending').length} pending review`}
      />

      <main className="page-content" id="cases-main">
        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 24 }}>
          {(['pending','in_review','approved','rejected','escalated'] as CaseStatus[]).map((s) => {
            const count = DEMO_CASES.filter(c => c.status === s).length;
            const colors: Record<CaseStatus, string> = {
              pending: 'var(--color-warning)', in_review: 'var(--color-blue-500)',
              approved: 'var(--color-success)', rejected: 'var(--color-danger)',
              escalated: 'var(--color-purple)',
            };
            const labels: Record<CaseStatus, string> = {
              pending: 'Pending', in_review: 'In Review',
              approved: 'Approved', rejected: 'Rejected', escalated: 'Escalated',
            };
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
                style={{
                  background: 'white',
                  border: `1px solid ${statusFilter === s ? colors[s] : 'var(--color-gray-200)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  boxShadow: statusFilter === s ? `0 0 0 2px ${colors[s]}22` : 'var(--shadow-card)',
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 800, color: colors[s], lineHeight: 1 }}>{count}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-gray-500)', marginTop: 4, textTransform: 'capitalize' }}>{labels[s]}</div>
              </button>
            );
          })}
        </div>

        {/* Filter Bar */}
        <div className="card" style={{ padding: '14px 20px', marginBottom: 16 }}>
          <div className="filter-bar" style={{ margin: 0 }}>
            <div className="topbar-search" style={{ flex: 1 }}>
              <Search size={14} style={{ color: 'var(--color-gray-400)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search by case ID, producer, category…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%' }}
                id="cases-search"
              />
            </div>
            <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} id="status-filter">
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="escalated">Escalated</option>
            </select>
            <select className="filter-select" value={riskFilter} onChange={e => setRiskFilter(e.target.value)} id="risk-filter">
              <option value="all">All Risk Levels</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)} id="sort-filter">
              <option value="submittedAt">Sort: Latest First</option>
              <option value="riskScore">Sort: Risk Score</option>
              <option value="claimedQty">Sort: Quantity</option>
            </select>
            <button className="btn btn-secondary btn-sm">
              <Download size={13} /> Export
            </button>
          </div>
        </div>

        {/* Results count */}
        <div style={{ fontSize: '13px', color: 'var(--color-gray-500)', marginBottom: 12 }}>
          Showing <strong style={{ color: 'var(--color-gray-800)' }}>{sorted.length}</strong> of {DEMO_CASES.length} cases
        </div>

        {/* Cases Table */}
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Producer</th>
                <th>Category</th>
                <th>State</th>
                <th>Claimed (kg)</th>
                <th>Verified (kg)</th>
                <th>Risk Score</th>
                <th>Risk</th>
                <th>Findings</th>
                <th>Status</th>
                <th>Submitted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr key={c.caseId} onClick={() => window.location.href = `/cases/${c.caseId}`}>
                  <td>
                    <span className="mono" style={{ color: 'var(--color-blue-600)', fontWeight: 700 }}>
                      {c.caseId}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--color-gray-900)', maxWidth: 180 }} className="truncate">
                      {c.producer.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-gray-400)' }}>
                      {c.producer.registrationNumber}
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-gray-600)', fontSize: '12px', maxWidth: 140 }}>
                    <span className="truncate" style={{ display: 'block' }}>{c.producer.category}</span>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block', padding: '2px 7px', borderRadius: 4,
                      background: 'var(--color-gray-100)', fontSize: '11px', fontWeight: 500,
                      color: 'var(--color-gray-600)'
                    }}>
                      {c.producer.state}
                    </span>
                  </td>
                  <td><span className="mono">{c.claimedQuantityKg.toLocaleString('en-IN')}</span></td>
                  <td>
                    {c.verifiedQuantityKg !== null
                      ? <span className="mono">{c.verifiedQuantityKg.toLocaleString('en-IN')}</span>
                      : <span style={{ color: 'var(--color-gray-300)', fontSize: '12px' }}>—</span>
                    }
                  </td>
                  <td style={{ minWidth: 120 }}>
                    <div className="risk-bar-wrap">
                      <div className="risk-bar-track">
                        <div className="risk-bar-fill" style={{ width: `${c.riskScore}%`, background: getRiskColor(c.riskLevel) }} />
                      </div>
                      <span className="risk-score-text" style={{ color: getRiskColor(c.riskLevel) }}>{c.riskScore}</span>
                    </div>
                  </td>
                  <td><RiskBadge level={c.riskLevel} /></td>
                  <td>
                    {c.findings.length > 0
                      ? <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '2px 8px', borderRadius: 4,
                          background: 'var(--color-warning-light)',
                          color: 'var(--color-warning-dark)', fontSize: '11px', fontWeight: 600,
                        }}>
                          ⚠ {c.findings.length}
                        </span>
                      : <span style={{ color: 'var(--color-gray-300)', fontSize: '12px' }}>—</span>
                    }
                  </td>
                  <td><StatusBadge status={c.status} /></td>
                  <td style={{ color: 'var(--color-gray-400)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {new Date(c.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <Link
                      href={`/cases/${c.caseId}`}
                      onClick={e => e.stopPropagation()}
                      className="btn btn-ghost btn-sm"
                      style={{ gap: 4 }}
                    >
                      <Eye size={12} /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sorted.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon"><Search size={28} /></div>
              <div className="empty-state-title">No cases found</div>
              <div className="empty-state-desc">Try adjusting your filters or search query.</div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
