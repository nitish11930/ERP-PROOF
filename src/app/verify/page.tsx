'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, FileText, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { getProducers, saveCase } from '@/lib/services/store';
import type { Case, Evidence, EvidenceType, ExtractedData } from '@/lib/types';

interface FileUpload {
  file: File;
  type: EvidenceType;
  preview: string;
}

export default function VerifyClaimPage() {
  const router = useRouter();
  const producers = getProducers();

  // Form State
  const [producerId, setProducerId] = useState('');
  const [claimQuantity, setClaimQuantity] = useState('');
  const [claimDate, setClaimDate] = useState('');
  const [location, setLocation] = useState('');
  
  // Evidence State
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileAdd(e.dataTransfer.files[0], 'certificate');
    }
  };

  const handleFileAdd = (file: File, type: EvidenceType) => {
    // In a real app, we'd upload to S3 here. For demo, we just store it in state.
    setUploads(prev => [...prev, { file, type, preview: URL.createObjectURL(file) }]);
  };

  const removeUpload = (index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!producerId || !claimQuantity) return;
    setIsSubmitting(true);

    const producer = producers.find(p => p.producerId === producerId)!;
    // eslint-disable-next-line react-hooks/purity
    const newCaseId = `EP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    // Upload files to S3 via presigned URLs
    const evidence: Evidence[] = [];
    
    for (let i = 0; i < uploads.length; i++) {
      const u = uploads[i];
      try {
        // 1. Request upload URL from API
        const res = await fetch('/api/evidence/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caseId: newCaseId,
            fileName: u.file.name,
            contentType: u.file.type
          })
        });
        
        if (!res.ok) throw new Error('Failed to get upload URL');
        
        const { uploadUrl, key, mock } = await res.json();
        
        // 2. Browser uploads file directly to S3 (unless mock fallback)
        if (!mock) {
          const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': u.file.type },
            body: u.file
          });
          if (!uploadRes.ok) throw new Error('Failed to upload to S3');
        }
        
        // 3. Store evidence metadata
        const extracted: ExtractedData = {
          quantity: u.type === 'certificate' ? Number(claimQuantity) : Number(claimQuantity) - 550, // Intentional gap for demo
          unit: 'kg',
          date: claimDate,
          location: location
        };
  
        evidence.push({
          // eslint-disable-next-line react-hooks/purity
          evidenceId: `EV-${Date.now()}-${i}`,
          caseId: newCaseId,
          type: u.type,
          fileName: u.file.name,
          s3Key: key, // Using actual S3 key
          extractedData: extracted,
          contradictions: [],
          confidenceScore: 0.85,
          uploadedAt: new Date().toISOString(),
          fileSize: u.file.size,
          mimeType: u.file.type
        });
      } catch (err) {
        console.error('File upload failed:', err);
      }
    }

    const newCase: Case = {
      caseId: newCaseId,
      producer,
      submittedAt: new Date().toISOString(),
      status: 'pending',
      claimedQuantityKg: Number(claimQuantity),
      verifiedQuantityKg: null,
      riskScore: 0,
      riskLevel: 'low',
      evidenceIds: evidence.map(e => e.evidenceId),
      evidence,
      findings: [],
      reviewDecision: null,
      auditLog: [{
        // eslint-disable-next-line react-hooks/purity
        entryId: `AUD-${Date.now()}-1`,
        caseId: newCaseId,
        action: 'Case Created',
        actor: producer.name,
        actorRole: 'system',
        timestamp: new Date().toISOString(),
        details: 'Claim submitted with attached evidence via portal.'
      }],
      financialYear: '2026-27',
      materialCategory: producer.category,
      targetQuantityKg: Number(claimQuantity) * 1.5,
    };

    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCase)
      });
      if (!res.ok) throw new Error('Failed to persist case to API boundary');
    } catch (e) {
      console.warn('API error, falling back to local memory:', e);
      saveCase(newCase);
    }
    
    // Slight delay to simulate network
    setTimeout(() => {
      router.push(`/verification/${newCaseId}`);
    }, 800);
  };

  return (
    <>
      <TopBar title="Verify New Claim" subtitle="Start a new verification workflow" />
      
      <main className="page-content" style={{ maxWidth: 900, margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          
          {/* Claim Information */}
          <div className="card" style={{ padding: 24, marginBottom: 24 }}>
            <div className="section-header" style={{ marginBottom: 20 }}>
              <div>
                <div className="section-title">Claim Information</div>
                <div className="section-sub">Producer details and claimed quantities</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-slate-700)', marginBottom: 8 }}>Recycler / Producer *</label>
                <select className="filter-select" style={{ width: '100%', height: 40 }} value={producerId} onChange={e => setProducerId(e.target.value)} required>
                  <option value="">Select an organization...</option>
                  {producers.map(p => (
                    <option key={p.producerId} value={p.producerId}>{p.name} ({p.registrationNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-slate-700)', marginBottom: 8 }}>Claimed Quantity (kg) *</label>
                <input type="number" className="filter-input" style={{ width: '100%', height: 40 }} placeholder="e.g. 2400" value={claimQuantity} onChange={e => setClaimQuantity(e.target.value)} required />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-slate-700)', marginBottom: 8 }}>Claim Date *</label>
                <input type="date" className="filter-input" style={{ width: '100%', height: 40 }} value={claimDate} onChange={e => setClaimDate(e.target.value)} required />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-slate-700)', marginBottom: 8 }}>Location / Facility</label>
                <input type="text" className="filter-input" style={{ width: '100%', height: 40 }} placeholder="e.g. Mumbai, MH" value={location} onChange={e => setLocation(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Evidence Uploads */}
          <div className="card" style={{ padding: 24, marginBottom: 24 }}>
            <div className="section-header" style={{ marginBottom: 20 }}>
              <div>
                <div className="section-title">Supporting Evidence</div>
                <div className="section-sub">Upload documentation for cross-verification</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: 'var(--color-danger)' }}><AlertCircle size={14} /> <strong>Required:</strong> Recycling Certificate</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: 'var(--color-warning)' }}><AlertCircle size={14} /> <strong>Recommended:</strong> Collection Receipt, Transport Manifest</div>
            </div>

            <div 
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragActive ? 'var(--color-blue-500)' : 'var(--color-slate-300)'}`,
                background: dragActive ? 'var(--color-blue-50)' : 'white',
                borderRadius: 'var(--radius-lg)',
                padding: '40px 20px',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                marginBottom: 20
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-full)', background: 'var(--color-slate-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Upload size={20} color="var(--color-slate-500)" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-slate-800)', marginBottom: 4 }}>Drag & drop evidence files here</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-slate-500)', marginBottom: 16 }}>PDF, JPEG, PNG up to 10MB each</p>
              
              <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                Browse Files
                <input type="file" multiple style={{ display: 'none' }} onChange={(e) => {
                  if (e.target.files) {
                    Array.from(e.target.files).forEach(f => handleFileAdd(f, 'invoice')); // Default to invoice, user can change later
                  }
                }} />
              </label>
            </div>

            {/* Uploaded Files List */}
            {uploads.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-slate-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Attached Documents ({uploads.length})</h4>
                {uploads.map((upload, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid var(--color-slate-200)', borderRadius: 'var(--radius-md)', background: 'var(--color-slate-50)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <FileText size={20} color="var(--color-slate-400)" />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-slate-800)' }}>{upload.file.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-slate-500)' }}>{(upload.file.size / 1024).toFixed(0)} KB</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <select 
                        className="filter-select" 
                        value={upload.type}
                        onChange={(e) => {
                          const newUploads = [...uploads];
                          newUploads[idx].type = e.target.value as EvidenceType;
                          setUploads(newUploads);
                        }}
                      >
                        <option value="certificate">Recycling Certificate</option>
                        <option value="invoice">Collection Receipt / Invoice</option>
                        <option value="manifest">Transport Manifest</option>
                        <option value="report">Other Report</option>
                      </select>
                      
                      <button type="button" onClick={() => removeUpload(idx)} style={{ background: 'none', border: 'none', color: 'var(--color-slate-400)', cursor: 'pointer', padding: 4 }}>
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => router.back()}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !producerId || !claimQuantity || uploads.length === 0}>
              {isSubmitting ? 'Creating Case...' : 'Start Verification'} <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
