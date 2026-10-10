'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, Database, FileSearch, ShieldAlert } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import type { Case } from '@/lib/types';

export default function VerificationProcessingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [currentCase, setCurrentCase] = useState<Case | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    fetch(`/api/cases/${id}`)
      .then(res => res.json())
      .then(data => {
        if (!data || data.error) router.push('/cases');
        else setCurrentCase(data);
      });
  }, [id, router]);

  useEffect(() => {
    if (!currentCase) return;

    // Simulate processing steps, but inject real extraction for Step 2
    const steps = [
      { delay: 1000, action: () => setStep(1) },
      { delay: 2500, action: async () => {
          setStep(2);
          // Trigger Bedrock Extraction for all evidence files sequentially or in parallel
          // We'll do it sequentially to avoid rate limits in demo mode
          try {
            for (const ev of currentCase.evidence) {
              const res = await fetch(`/api/cases/${id}/evidence/${ev.evidenceId}/extract`, { method: 'POST' });
              // We ignore failures here to ensure the demo continues even if Bedrock is offline
              if (!res.ok) console.warn(`Extraction failed for ${ev.evidenceId}`);
            }
          } catch (e) {
            console.warn('Extraction API call failed:', e);
          }
      }},
      { delay: 5500, action: () => setStep(3) },
      { delay: 7500, action: async () => {
          try {
            const res = await fetch(`/api/cases/${id}/verify`, { method: 'POST' });
            if (!res.ok) throw new Error('API failed');
          } catch (err) {
            console.warn('API error during verification:', err);
          }
          router.push(`/verification/${id}/result`);
      }}
    ];

    const timeouts = steps.map(s => setTimeout(s.action, s.delay));
    return () => timeouts.forEach(clearTimeout);
  }, [currentCase, id, router]);

  const stepsData = [
    { icon: Database, label: 'Reading uploaded documents and metadata', desc: 'Validating formats and extracting preliminary information.' },
    { icon: FileSearch, label: 'Extracting structured facts', desc: 'Demo engine is pulling quantities, dates, and locations from evidence.' },
    { icon: ShieldAlert, label: 'Cross-referencing evidence', desc: 'Checking for contradictions and calculating risk signals.' },
    { icon: CheckCircle, label: 'Generating verification result', desc: 'Finalizing risk score and producing actionable findings.' }
  ];

  if (!currentCase) return null;

  return (
    <>
      <TopBar title={`Verification in Progress: ${currentCase.caseId}`} />
      <main className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)' }}>
        <div className="card" style={{ width: '100%', maxWidth: 540, padding: 40, textAlign: 'center' }}>
          
          <div style={{ marginBottom: 32 }}>
            <Loader2 className="animate-spin" size={48} color="var(--color-blue-500)" style={{ margin: '0 auto', animation: 'spin 1.5s linear infinite' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-slate-900)', marginTop: 20 }}>Running Demo Verification</h2>
            <p style={{ color: 'var(--color-slate-500)', fontSize: '14px', marginTop: 8 }}>Please wait while we process the evidence for {currentCase.producer.name}.</p>
          </div>

          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {stepsData.map((s, idx) => {
              const isActive = step === idx;
              const isPast = step > idx;
              const Icon = isPast ? CheckCircle : s.icon;
              
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, opacity: isActive || isPast ? 1 : 0.4, transition: 'opacity 0.3s' }}>
                  <div style={{ 
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isPast ? 'var(--color-success-light)' : isActive ? 'var(--color-blue-100)' : 'var(--color-slate-100)',
                    color: isPast ? 'var(--color-success)' : isActive ? 'var(--color-blue-600)' : 'var(--color-slate-400)'
                  }}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-slate-800)' }}>{s.label}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-slate-500)' }}>{s.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}} />
    </>
  );
}
