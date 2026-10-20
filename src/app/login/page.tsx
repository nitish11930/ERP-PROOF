'use client';

import { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('demo@eprproof.ai');
  const [password, setPassword] = useState('EPRProof@2026');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        // Hard redirect so the browser sends the new auth_token cookie
        // with the next request — middleware then lets the user through.
        window.location.href = '/';
        return;
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid credentials.');
      }
    } catch {
      setError('An error occurred during login.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-slate-50)',
      padding: '24px'
    }}>
      <div className="card" style={{ maxWidth: 420, width: '100%', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '16px',
          background: 'linear-gradient(135deg, var(--color-blue-500) 0%, var(--color-blue-700) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24, boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)'
        }}>
          <ShieldCheck size={32} color="white" />
        </div>
        
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-navy-900)', marginBottom: 8 }}>EPR Proof</h1>
        <p style={{ fontSize: '14px', color: 'var(--color-slate-500)', textAlign: 'center', marginBottom: 32 }}>
          AI-assisted EPR/e-waste recycling claim evidence verification platform.
        </p>

        {error && (
          <div style={{ width: '100%', padding: '12px', background: 'var(--color-danger-light)', border: '1px solid #fca5a5', borderRadius: '8px', color: 'var(--color-danger-dark)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-slate-600)', marginBottom: 6 }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--color-slate-400)' }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid var(--color-slate-200)', borderRadius: '8px', fontSize: '14px' }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-slate-600)', marginBottom: 6 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--color-slate-400)' }} />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid var(--color-slate-200)', borderRadius: '8px', fontSize: '14px' }}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '12px', justifyContent: 'center', marginTop: 8, opacity: loading ? 0.75 : 1 }}>
            {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Signing in…</> : <>Access Demo Platform <ArrowRight size={16} /></>}
          </button>
        </form>

        <div style={{ marginTop: 24, fontSize: '12px', color: 'var(--color-slate-400)', textAlign: 'center' }}>
          This is a synthetic demo environment.<br/>Do not use real credentials.
        </div>
      </div>
    </div>
  );
}
