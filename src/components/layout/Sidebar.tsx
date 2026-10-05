'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShieldCheck, FileSearch, Users,
  BarChart3, Clock, ChevronRight, Leaf, Settings,
  LogOut, Bell
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Verification',
    items: [
      { href: '/cases', label: 'Verification Cases', icon: ShieldCheck, badge: 23 },
      { href: '/evidence', label: 'Evidence Explorer', icon: FileSearch },
      { href: '/review', label: 'Human Review Queue', icon: Users, badge: 8 },
    ],
  },
  {
    label: 'Reporting',
    items: [
      { href: '/reports', label: 'Reports & Exports', icon: BarChart3 },
      { href: '/audit', label: 'Audit Trail', icon: Clock },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <div className="sidebar-logo-icon">
            <Leaf size={20} strokeWidth={2.5} />
          </div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-name">EPR PROOF</span>
            <span className="sidebar-logo-sub">Verification Platform</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="sidebar-section-label">{section.label}</div>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-nav-item ${isActive(item.href) ? 'active' : ''}`}
              >
                <span className="sidebar-nav-icon">
                  <item.icon size={16} strokeWidth={2} />
                </span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="sidebar-nav-badge">{item.badge}</span>
                )}
              </Link>
            ))}
          </div>
        ))}

        <div style={{ height: 12 }} />
        <div className="sidebar-section-label">System</div>
        <Link href="/settings" className="sidebar-nav-item">
          <span className="sidebar-nav-icon"><Settings size={16} strokeWidth={2} /></span>
          <span>Settings</span>
        </Link>
      </nav>

      {/* Footer / User */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">AM</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">Arjun Mehta</div>
            <div className="sidebar-user-role">Senior Analyst</div>
          </div>
          <LogOut size={14} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  );
}
