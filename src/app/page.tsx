/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, ShieldCheck, Clock, CheckCircle,
  XCircle, AlertTriangle, BarChart2, FileText, Layers,
  ArrowRight, Zap, Activity,
} from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { StatusBadge, RiskBadge } from '@/components/ui/Badge';
import {
  DEMO_KPI, DEMO_RISK_DISTRIBUTION, DEMO_MONTHLY_TRENDS, DEMO_CASES,
} from '@/lib/data/demo';
import { getRiskColor } from '@/lib/risk/calculator';
import Link from 'next/link';

// ── Custom Chart Tooltip ─────────────────────
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

// ── KPI Card Component ─────────────────────
function KPICard({
  label, value, icon: Icon, iconBg, iconColor,
  delta, deltaDir, suffix,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  delta?: string;
  deltaDir?: 'up' | 'down' | 'neutral';
  suffix?: string;
}) {
  return (
    <div className="kpi-card">
      <div className="kpi-card-header">
        <span className="kpi-card-label">{label}</span>
        <div className="kpi-card-icon" style={{ background: iconBg }}>
          <Icon size={18} color={iconColor} strokeWidth={2} />
        </div>
      </div>
      <div className="kpi-card-value">
        {value}{suffix && <span style={{ fontSize: '18px', fontWeight: 500, color: 'var(--color-gray-400)', marginLeft: 2 }}>{suffix}</span>}
      </div>
      {delta && (
        <div className={`kpi-card-delta kpi-delta-${deltaDir}`}>
          {deltaDir === 'up' && <TrendingUp size={12} />}
          {deltaDir === 'down' && <TrendingDown size={12} />}
          <span>{delta} vs last month</span>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const kpi = DEMO_KPI;
  const recentCases = DEMO_CASES.slice(0, 5);

  const RISK_COLORS = {
    low:      'var(--color-success)',
    medium:   'var(--color-warning)',
    high:     'var(--color-orange)',
    critical: 'var(--color-danger)',
  };

  const pieData = DEMO_RISK_DISTRIBUTION.map((d) => ({
    name: d.level.charAt(0).toUpperCase() + d.level.slice(1),
    value: d.count,
    color: getRiskColor(d.level),
  }));

  return (
    <>
      <TopBar
        title="Dashboard"
        subtitle={`Financial Year 2024–25 · Last updated: ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
      />

      <main className="page-content" id="dashboard-main">
        {/* ── Hero Banner ── */}
        <div className="dashboard-hero">
          <div className="hero-content">
            <div className="hero-eyebrow">EPR Compliance Overview</div>
            <h2 className="hero-title">Evidence Verification Platform</h2>
            <p className="hero-sub">
              Monitoring {kpi.totalCases} cases across 5 producers • AI-assisted risk detection active
            </p>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-val">{kpi.verificationRate}%</span>
                <span className="hero-stat-label">Verification Rate</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-val">
                  {(kpi.totalQuantityVerifiedKg / 1000).toFixed(0)}T
                </span>
                <span className="hero-stat-label">Quantity Verified</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-val">{kpi.avgRiskScore}</span>
                <span className="hero-stat-label">Avg Risk Score</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-val">{kpi.pendingReview}</span>
                <span className="hero-stat-label">Pending Review</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── KPI Grid ── */}
        <div className="kpi-grid">
          <KPICard
            label="Total Cases"
            value={kpi.totalCases}
            icon={Layers}
            iconBg="var(--color-blue-50)"
            iconColor="var(--color-blue-600)"
            delta="+12%"
            deltaDir="up"
          />
          <KPICard
            label="Pending Review"
            value={kpi.pendingReview}
            icon={Clock}
            iconBg="var(--color-warning-light)"
            iconColor="var(--color-warning)"
            delta="+3"
            deltaDir="down"
          />
          <KPICard
            label="Approved This Month"
            value={kpi.approvedThisMonth}
            icon={CheckCircle}
            iconBg="var(--color-success-light)"
            iconColor="var(--color-success)"
            delta="+28%"
            deltaDir="up"
          />
          <KPICard
            label="Rejected This Month"
            value={kpi.rejectedThisMonth}
            icon={XCircle}
            iconBg="var(--color-danger-light)"
            iconColor="var(--color-danger)"
            delta="-1"
            deltaDir="up"
          />
          <KPICard
            label="Avg Risk Score"
            value={kpi.avgRiskScore}
            icon={Activity}
            iconBg="var(--color-orange-light)"
            iconColor="var(--color-orange)"
            delta="-3.1 pts"
            deltaDir="up"
          />
          <KPICard
            label="Verification Rate"
            value={kpi.verificationRate}
            suffix="%"
            icon={ShieldCheck}
            iconBg="var(--color-blue-50)"
            iconColor="var(--color-blue-600)"
            delta="+2.3%"
            deltaDir="up"
          />
          <KPICard
            label="Quantity Verified"
            value={(kpi.totalQuantityVerifiedKg / 1000).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            suffix=" T"
            icon={BarChart2}
            iconBg="var(--color-purple-light)"
            iconColor="var(--color-purple)"
            delta="+18%"
            deltaDir="up"
          />
          <KPICard
            label="AI Flags This Week"
            value={14}
            icon={Zap}
            iconBg="var(--color-warning-light)"
            iconColor="var(--color-warning)"
            delta="+2"
            deltaDir="neutral"
          />
        </div>

        {/* ── Charts Row ── */}
        <div className="charts-grid">
          {/* Monthly Trend Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">Monthly Case Trends</div>
                <div className="chart-sub">Submitted, Approved, Rejected — FY 2024–25</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={DEMO_MONTHLY_TRENDS} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gSubmitted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--color-blue-500)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--color-blue-500)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gApproved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--color-success)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-100)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-gray-400)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-gray-400)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="submitted" name="Submitted" stroke="var(--color-blue-500)" strokeWidth={2} fill="url(#gSubmitted)" dot={false} activeDot={{ r: 4 }} />
                <Area type="monotone" dataKey="approved"  name="Approved"  stroke="var(--color-success)"   strokeWidth={2} fill="url(#gApproved)"   dot={false} activeDot={{ r: 4 }} />
                <Area type="monotone" dataKey="rejected"  name="Rejected"  stroke="var(--color-danger)"    strokeWidth={2} fill="none" strokeDasharray="4 3" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Distribution Pie */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">Risk Distribution</div>
                <div className="chart-sub">All cases by risk level</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {DEMO_RISK_DISTRIBUTION.map((d) => (
                <div key={d.level} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: getRiskColor(d.level), flexShrink: 0 }} />
                  <span style={{ flex: 1, color: 'var(--color-gray-600)', textTransform: 'capitalize' }}>{d.level}</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-gray-800)' }}>{d.count}</span>
                  <span style={{ color: 'var(--color-gray-400)', minWidth: 36, textAlign: 'right' }}>{d.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recent Cases Table ── */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="section-header">
            <div>
              <div className="section-title">Recent Cases</div>
              <div className="section-sub">Latest verification submissions</div>
            </div>
            <Link href="/cases" className="btn btn-secondary btn-sm">
              View All <ArrowRight size={12} />
            </Link>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Producer</th>
                  <th>Category</th>
                  <th>Claimed (kg)</th>
                  <th>Risk Score</th>
                  <th>Risk Level</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {recentCases.map((c) => (
                  <tr
                    key={c.caseId}
                    onClick={() => window.location.href = `/cases/${c.caseId}`}
                  >
                    <td>
                      <span className="mono" style={{ color: 'var(--color-blue-600)', fontWeight: 600 }}>
                        {c.caseId}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>
                        {c.producer.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-gray-400)' }}>
                        {c.producer.registrationNumber}
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-gray-600)' }}>
                      {c.producer.category}
                    </td>
                    <td>
                      <span className="mono">{c.claimedQuantityKg.toLocaleString('en-IN')}</span>
                    </td>
                    <td style={{ minWidth: 120 }}>
                      <div className="risk-bar-wrap">
                        <div className="risk-bar-track">
                          <div
                            className="risk-bar-fill"
                            style={{
                              width: `${c.riskScore}%`,
                              background: getRiskColor(c.riskLevel),
                            }}
                          />
                        </div>
                        <span className="risk-score-text" style={{ color: getRiskColor(c.riskLevel) }}>
                          {c.riskScore}
                        </span>
                      </div>
                    </td>
                    <td><RiskBadge level={c.riskLevel} /></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td style={{ color: 'var(--color-gray-400)', fontSize: '12px' }}>
                      {new Date(c.submittedAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Bottom Row: Findings + Activity ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* AI Findings Summary */}
          <div className="card">
            <div className="section-header">
              <div>
                <div className="section-title">Recent AI Findings</div>
                <div className="section-sub">Top risk signals detected this week</div>
              </div>
              <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />
            </div>
            {DEMO_CASES.flatMap((c) => c.findings).slice(0, 4).map((f) => (
              <div key={f.findingId} className="finding-card">
                <div className="finding-card-header">
                  <div className="finding-title">{f.title}</div>
                  <RiskBadge level={f.severity} />
                </div>
                <div className="finding-desc">{f.description}</div>
                <div className="finding-ai">
                  <div className="finding-ai-label">
                    <Zap size={11} /> AI Reasoning
                  </div>
                  {f.aiReasoning.slice(0, 120)}…
                </div>
              </div>
            ))}
          </div>

          {/* Audit Activity Feed */}
          <div className="card">
            <div className="section-header">
              <div>
                <div className="section-title">Recent Activity</div>
                <div className="section-sub">System and analyst actions</div>
              </div>
            </div>
            <div className="activity-feed">
              {[
                { action: 'EP-2026-00124 escalated — Critical risk score (88)', actor: 'Risk Engine', role: 'system', time: '2m ago', color: 'var(--color-danger)' },
                { action: 'Evidence extracted from EP-2026-00121 (3 documents)', actor: 'AI Engine', role: 'system', time: '18m ago', color: 'var(--color-blue-500)' },
                { action: 'EP-2026-00123 approved by Priya Sharma', actor: 'Priya Sharma', role: 'reviewer', time: '2h ago', color: 'var(--color-success)' },
                { action: 'EP-2026-00122 flagged — Location mismatch detected', actor: 'Risk Engine', role: 'system', time: '5h ago', color: 'var(--color-orange)' },
                { action: 'EP-2026-00125 rejected — Date sequence violation', actor: 'Arjun Mehta', role: 'reviewer', time: '1d ago', color: 'var(--color-danger)' },
                { action: 'Monthly batch upload — 28 cases submitted', actor: 'System', role: 'system', time: '2d ago', color: 'var(--color-gray-400)' },
              ].map((item, i, arr) => (
                <div key={i} className="activity-item">
                  <div className="activity-dot-wrap">
                    <div className="activity-dot" style={{ background: item.color }} />
                    {i < arr.length - 1 && <div className="activity-line" />}
                  </div>
                  <div className="activity-body">
                    <div className="activity-title">{item.action}</div>
                    <div className="activity-meta">{item.actor} · {item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
