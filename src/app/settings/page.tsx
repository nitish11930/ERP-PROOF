'use client';
import { useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Cloud, Upload, CheckCircle, RefreshCw } from 'lucide-react';

type Connection = { connected: boolean; bucket?: string; region?: string; error?: string };
type Receipt = { fileName: string; key: string; size: number; uploadedAt: string; downloadUrl: string };

export default function SettingsPage() {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [checking, setChecking] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState('');
  async function checkConnection() {
    setChecking(true);
    try { const response = await fetch('/api/aws/s3'); setConnection(await response.json()); }
    catch { setConnection({ connected: false, error: 'Connection check failed. Please retry.' }); }
    finally { setChecking(false); }
  }
  useEffect(() => {
    let active = true;
    fetch('/api/aws/s3').then(response => response.json()).then(data => {
      if (active) setConnection(data);
    }).catch(() => {
      if (active) setConnection({ connected: false, error: 'Connection check failed. Please retry.' });
    }).finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);
  async function upload(file?: File) {
    if (!file) return;
    setUploading(true); setError(''); setReceipt(null);
    try {
      const form = new FormData(); form.append('file', file);
      const response = await fetch('/api/aws/s3', { method: 'POST', body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      setReceipt(data); void checkConnection();
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Upload failed'); }
    finally { setUploading(false); }
  }
  return <>
    <TopBar title="AWS Integration" subtitle="Amazon S3 evidence storage" />
    <main className="page-content">
      <section style={{ background: 'white', border: '1px solid var(--color-gray-200)', borderRadius: 16, padding: 28, maxWidth: 850 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Cloud size={30} /><h2>Amazon S3</h2></div>
        <p style={{ margin: '12px 0', color: 'var(--color-gray-600)' }}>Store evidence documents in AWS with encryption at rest and retrieve them through temporary signed download links.</p>
        <p role="status" style={{ margin: '16px 0', fontWeight: 600 }}>{checking ? 'Checking AWS connection…' : connection?.connected ? '✓ Connected to Amazon S3' : 'AWS connection needs attention'}</p>
        <p>Region: {connection?.region || 'ap-south-1'}</p>
        <p style={{ margin: '8px 0 16px', overflowWrap: 'anywhere' }}>Bucket: {connection?.bucket || 'Checking…'}</p>
        {connection?.error && <p role="alert" style={{ color: '#b45309', marginBottom: 16 }}>{connection.error}</p>}
        <button className="btn btn-secondary" disabled={checking} onClick={() => void checkConnection()}><RefreshCw size={16} /> Refresh connection</button>
        <hr style={{ margin: '24px 0', border: 0, borderTop: '1px solid #e5e7eb' }} />
        <h3 style={{ marginBottom: 12 }}>Upload evidence to AWS</h3>
        <p style={{ marginBottom: 16 }}>Choose a PDF, PNG, JPEG or TXT document (up to 10 MB). This demonstrates S3 storage independently of case verification.</p>
        <label className="btn btn-primary" style={{ display: 'inline-flex', cursor: uploading ? 'wait' : 'pointer' }}>
          <Upload size={16} /> {uploading ? 'Uploading to S3…' : 'Choose evidence file'}
          <input type="file" aria-label="Upload evidence to Amazon S3" accept=".pdf,.png,.jpg,.jpeg,.txt" disabled={uploading} style={{ display: 'none' }} onChange={event => { void upload(event.target.files?.[0]); event.target.value = ''; }} />
        </label>
        {error && <p role="alert" style={{ marginTop: 16, color: '#b91c1c' }}>{error}</p>}
        {receipt && <div style={{ marginTop: 24, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 20 }}>
          <h3 style={{ display: 'flex', gap: 8, alignItems: 'center' }}><CheckCircle size={20} /> Evidence saved to Amazon S3</h3>
          <p style={{ marginTop: 12 }}>{receipt.fileName} · {receipt.size.toLocaleString()} bytes</p>
          <p style={{ margin: '8px 0', overflowWrap: 'anywhere' }}>Object key: {receipt.key}</p>
          <p style={{ marginBottom: 16 }}>Uploaded: {new Date(receipt.uploadedAt).toLocaleString()}</p>
          <a className="btn btn-secondary" href={receipt.downloadUrl} target="_blank" rel="noreferrer">Open stored document</a>
          <p style={{ marginTop: 12, fontSize: 12 }}>Download link expires in one hour.</p>
        </div>}
      </section>
    </main>
  </>;
}
