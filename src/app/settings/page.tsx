'use client';
import { TopBar } from '@/components/layout/TopBar';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <>
      <TopBar title="Settings" subtitle="Platform configuration" />
      <main className="page-content">
        <div className="empty-state">
          <div className="empty-state-icon"><Settings size={28} /></div>
          <div className="empty-state-title">Settings</div>
          <div className="empty-state-desc">Platform configuration and AWS integration settings coming soon.</div>
        </div>
      </main>
    </>
  );
}
