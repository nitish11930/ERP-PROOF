'use client';

import { Bell, Search, HelpCircle, RefreshCw } from 'lucide-react';

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar-title">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="topbar-actions">
        {/* Search */}
        <div className="topbar-search">
          <Search size={14} style={{ color: 'var(--color-gray-400)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search cases, producers..."
            id="global-search"
            aria-label="Search cases and producers"
          />
        </div>

        {/* Refresh */}
        <button className="topbar-icon-btn" aria-label="Refresh data" title="Refresh">
          <RefreshCw size={16} />
        </button>

        {/* Help */}
        <button className="topbar-icon-btn" aria-label="Help" title="Help & Documentation">
          <HelpCircle size={16} />
        </button>

        {/* Notifications */}
        <button className="topbar-icon-btn" aria-label="Notifications" title="Notifications">
          <Bell size={16} />
          <span className="notification-dot" />
        </button>

        {/* Environment badge */}
        <div style={{
          padding: '4px 10px',
          background: 'var(--color-warning-light)',
          color: 'var(--color-warning-dark)',
          borderRadius: 'var(--radius-full)',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.04em',
        }}>
          DEMO
        </div>
      </div>
    </header>
  );
}
