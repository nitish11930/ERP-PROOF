/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { Download, FileText, BarChart2, Calendar, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TopBar } from '@/components/layout/TopBar';
import type { Case, MonthlyTrend } from '@/lib/types';

const REPORT_TEMPLATES = [
  {
    id: 'compliance-summary',
    title: 'Compliance Summary Report',
    desc: 'Overall EPR compliance status across all producers for FY 2024–25',
    icon: BarChart2,
    format: 'PDF',
    bg: 'var(--color-blue-50)',
    color: 'var(--color-blue-600)',
  },
  {
    id: 'case-register',
    title: 'Case Register Export',
    desc: 'Full list of all verification cases with status, risk, and findings',
    icon: FileText,
    format: 'CSV',
    bg: 'var(--color-success-light)',
    color: 'var(--color-success)',
  },
  {
    id: 'risk-analysis',
    title: 'Risk Analysis Report',
    desc: 'Detailed risk breakdown by producer, category, and finding type',
    icon: BarChart2,
    format: 'PDF',
    bg: 'var(--color-orange-light)',
    color: 'var(--color-orange)',
  },
  {
    id: 'audit-export',
    title: 'Audit Trail Export',
    desc: 'Complete audit log of all system and analyst actions',
    icon: Calendar,
    format: 'CSV',
    bg: 'var(--color-purple-light)',
    color: 'var(--color-purple)',
  },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="custom-tooltip-label">{label}</div>
      {payload.map((entry: any) => (
        <div key={entry.name} className="custom-tooltip-item">
          <span className="custom-tooltip-dot" style={{ background: entry.color }} />
          <span>{entry.name}: <strong>{entry.value}</strong></span>
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const [cases, setCases] = useState<Case[]>([]);

  useEffect(() => {
    fetch('/api/cases')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCases(data);
      })
      .catch(console.error);
  }, []);

  const materialData = Object.entries(
    cases.reduce<Record<string, { claimed: number; cases: number }>>((acc, c) => {
      const cat = c.producer.category;
      if (!acc[cat]) acc[cat] = { claimed: 0, cases: 0 };
      acc[cat].claimed += c.claimedQuantityKg;
      acc[cat].cases += 1;
      return acc;
    }, {})
  ).map(([name, data]) => ({ name, ...data }));

  // Dynamically calculate monthly trends from cases
  const trendsMap: Record<string, MonthlyTrend> = {};
  cases.forEach(c => {
    const d = new Date(c.submittedAt);
    const month = d.toLocaleString('default', { month: 'short' });
    if (!trendsMap[month]) {
      trendsMap[month] = { month, submitted: 0, approved: 0, rejected: 0 };
    }
    trendsMap[month].submitted++;
    if (c.status === 'approved') trendsMap[month].approved++;
    if (c.status === 'rejected') trendsMap[month].rejected++;
  });
  const monthlyTrends = Object.values(trendsMap);

  return (
    <>
      <TopBar title="Reports & Exports" subtitle="Generate and download compliance reports" />

      <main className="page-content" id="reports-main">
        {/* Report Templates */}
        <div className="section-header" style={{ marginBottom: 16 }}>
          <div>
            <div className="section-title">Report Templates</div>
            <div className="section-sub">Generate standard compliance reports instantly</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginBottom: 28 }}>
          {REPORT_TEMPLATES.map((r) => (
            <div key={r.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', transition: 'all 0.2s', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
            >
              <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <r.icon size={20} style={{ color: r.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-gray-900)' }}>{r.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-gray-500)', marginTop: 3 }}>{r.desc}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'var(--color-gray-100)', color: 'var(--color-gray-600)' }}>{r.format}</span>
                <button className="btn btn-secondary btn-sm" style={{ gap: 4 }}>
                  <Download size={12} /> Download
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">Monthly Case Volume</div>
                <div className="chart-sub">Cases submitted, approved, rejected — FY 2024–25</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyTrends} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barSize={10} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-100)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-gray-400)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-gray-400)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="submitted" name="Submitted" fill="var(--color-blue-400)" radius={[3,3,0,0]} />
                <Bar dataKey="approved"  name="Approved"  fill="var(--color-success)"   radius={[3,3,0,0]} />
                <Bar dataKey="rejected"  name="Rejected"  fill="var(--color-danger)"    radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">Claimed Quantity by Category</div>
                <div className="chart-sub">Total kg claimed per material type</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={materialData} layout="vertical" margin={{ top: 4, right: 4, bottom: 0, left: 80 }} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-100)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-gray-400)' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}T`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-gray-600)' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} formatter={(v: any) => [`${v.toLocaleString('en-IN')} kg`, 'Claimed']} />
                <Bar dataKey="claimed" name="Claimed (kg)" fill="var(--color-blue-500)" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Custom Date Range Export */}
        <div className="card" style={{ marginTop: 16 }}>
          <div className="section-title" style={{ marginBottom: 16 }}>Custom Date Range Export</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-gray-500)', display: 'block', marginBottom: 6 }}>From Date</label>
              <input type="date" className="filter-input" defaultValue="2024-04-01" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-gray-500)', display: 'block', marginBottom: 6 }}>To Date</label>
              <input type="date" className="filter-input" defaultValue="2025-03-31" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-gray-500)', display: 'block', marginBottom: 6 }}>Format</label>
              <select className="filter-select">
                <option>PDF Report</option>
                <option>CSV Export</option>
                <option>Excel (XLSX)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-gray-500)', display: 'block', marginBottom: 6 }}>Include</label>
              <select className="filter-select">
                <option>All Cases</option>
                <option>Approved Only</option>
                <option>Rejected Only</option>
                <option>High Risk Only</option>
              </select>
            </div>
            <button className="btn btn-primary">
              <Download size={14} /> Generate & Download
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
