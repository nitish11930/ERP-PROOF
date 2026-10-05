'use client';

import { useState } from 'react';
import { Clock, Filter, Search, Download } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { DEMO_CASES } from '@/lib/data/demo';
import type { AuditEntry } from '@/lib/types';

export default function AuditPage() {
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');

  const allEntries: (AuditEntry & { caseId: string })[] = DEMO_CASES.flatMap((c) =>
    c.auditLog.map((entry) => ({ ...entry, caseId: c.caseId }))
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filtered = allEntries.filter((e) => {
    const q = search.toLowerCase();
    const matchRole = roleFilter === 'all' || e.actorRole === roleFilter;
    const matchSearch = !q || e.action.toLowerCase().includes(q) || e.actor.toLowerCase().includes(q) || e.caseId.toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
    system:   { bg: 'var(--color-blue-50)',      text: 'var(--color-blue-600)' },
    analyst:  { bg: 'var(--color-purple-light)',  text: 'var(--color-purple)' },
    reviewer: { bg: 'var(--color-success-light)', text: 'var(--color-success-dark)' },
    admin:    { bg: 'var(--color-danger-light)',  text: 'var(--color-danger-dark)' },
  };

  return (
    <>
      <TopBar
        title="Audit Trail"
        subtitle={`${allEntries.length} immutable log entries`}
      />

      <main className="page-content" id="audit-main">
        {/* Controls */}
        <div className="card" style={{ padding: '14px 20px', marginBottom: 16 }}>
          <div className="filter-bar" style={{ margin: 0 }}>
            <div className="topbar-search" style={{ flex: 1 }}>
              <Search size={14} style={{ color: 'var(--color-gray-400)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search by action, actor, case ID…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%' }}
                id="audit-search"
              />
            </div>
            <select className="filter-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} id="audit-role-filter">
              <option value="all">All Roles</option>
              <option value="system">System</option>
              <option value="reviewer">Reviewer</option>
              <option value="analyst">Analyst</option>
              <option value="admin">Admin</option>
            </select>
            <button className="btn btn-secondary btn-sm">
              <Download size={13} /> Export Log
            </button>
          </div>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--color-gray-500)', marginBottom: 12 }}>
          Showing <strong style={{ color: 'var(--color-gray-800)' }}>{filtered.length}</strong> entries
        </div>

        {/* Audit Table */}
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Case ID</th>
                <th>Action</th>
                <th>Actor</th>
                <th>Role</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => {
                const roleStyle = ROLE_COLORS[entry.actorRole] || ROLE_COLORS.system;
                return (
                  <tr key={entry.entryId} style={{ cursor: 'default' }}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '11px', color: 'var(--color-gray-400)', fontFamily: 'monospace' }}>
                      {new Date(entry.timestamp).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <span className="mono" style={{ color: 'var(--color-blue-600)', fontWeight: 600, fontSize: '12px' }}>
                        {entry.caseId}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--color-gray-800)', fontSize: '13px' }}>
                      {entry.action}
                    </td>
                    <td style={{ color: 'var(--color-gray-600)', fontSize: '13px' }}>
                      {entry.actor}
                    </td>
                    <td>
                      <span style={{
                        padding: '2px 8px', borderRadius: 4, fontSize: '11px', fontWeight: 600,
                        background: roleStyle.bg, color: roleStyle.text,
                        textTransform: 'capitalize',
                      }}>
                        {entry.actorRole}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-gray-500)', fontSize: '12px', maxWidth: 300 }}>
                      <span className="truncate" style={{ display: 'block' }}>{entry.details}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon"><Clock size={24} /></div>
              <div className="empty-state-title">No entries found</div>
              <div className="empty-state-desc">Adjust filters or search terms.</div>
            </div>
          )}
        </div>

        {/* Immutability Notice */}
        <div style={{
          marginTop: 20, padding: '12px 16px', background: 'var(--color-blue-50)',
          border: '1px solid var(--color-blue-100)', borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', gap: 10, fontSize: '12px', color: 'var(--color-navy-800)',
        }}>
          <Clock size={14} style={{ color: 'var(--color-blue-500)', flexShrink: 0 }} />
          <span>
            <strong>Audit trail is immutable.</strong> All entries are cryptographically signed and stored in AWS DynamoDB with point-in-time recovery enabled. Entries cannot be modified or deleted.
          </span>
        </div>
      </main>
    </>
  );
}
