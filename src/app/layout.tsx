import type { Metadata } from 'next';
import { Sidebar } from '@/components/layout/Sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'EPR PROOF — Evidence Verification Platform',
  description:
    'AI-assisted EPR compliance verification: cross-check recycling claims, detect inconsistencies, assess risk, and route cases for human review.',
  keywords: ['EPR', 'compliance', 'e-waste', 'recycling verification', 'evidence platform'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <Sidebar />
          <div className="main-content">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
