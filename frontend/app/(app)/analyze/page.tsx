'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { resumeAPI, analyzeAPI, resultsAPI } from '@/lib/api';

type Step = 'resume' | 'job' | 'analyzing';

interface UploadedResume {
  id: string;
  originalName: string;
  wordCount: number;
}

export default function AnalyzePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('resume');
  const [resume, setResume] = useState<UploadedResume | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [jobForm, setJobForm] = useState({ title: '', company: '', description: '' });
  const [jobError, setJobError] = useState('');

  const [analyzeProgress, setAnalyzeProgress] = useState('');

  // ─── Dropzone ─────────────────────────────────────────────────────────────
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadError('');
    setUploading(true);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await resumeAPI.upload(formData);
      setResume(res.data.resume);
      setStep('job');
    } catch (err: any) {
      setUploadError(err.response?.data?.error || 'Upload failed. Try a PDF or TXT file.');
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  // ─── Submit Analysis ───────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!resume) return;
    if (jobForm.description.trim().length < 50) {
      setJobError('Job description must be at least 50 characters.');
      return;
    }

    setJobError('');
    setStep('analyzing');
    setAnalyzeProgress('Preprocessing text…');

    const messages = [
      'Extracting skills and roles…',
      'Running semantic embedding…',
      'Scoring skill overlap…',
      'Analysing experience signals…',
      'Generating reasoning…',
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < messages.length) {
        setAnalyzeProgress(messages[i++]);
      }
    }, 2500);

    try {
      const res = await analyzeAPI.run({
        resumeId: resume.id,
        jobDescription: jobForm.description,
        jobTitle: jobForm.title,
        company: jobForm.company,
      });

      clearInterval(interval);
      router.push(`/results/${res.data.result.id}`);
    } catch (err: any) {
      clearInterval(interval);
      setJobError(err.response?.data?.error || 'Analysis failed. Is the NLP service running?');
      setStep('job');
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in" style={{ maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', marginBottom: '0.4rem' }}>
        New Analysis
      </h1>
      <p style={{ color: 'var(--c-text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
        Upload your resume and paste a job description to get a semantic match score.
      </p>

      {/* ─── Step Indicator ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.5rem', alignItems: 'center' }}>
        {(['resume', 'job', 'analyzing'] as Step[]).map((s, idx) => {
          const labels = ['Upload Resume', 'Job Details', 'Analysing'];
          const done = step === 'job' && idx === 0
            || step === 'analyzing' && idx <= 1;
          const active = step === s;
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700,
                background: done ? 'var(--c-success)' : active ? 'var(--c-brand)' : 'var(--c-surface-3)',
                color: (done || active) ? 'white' : 'var(--c-text-muted)',
                transition: 'all 0.3s',
              }}>
                {done ? '✓' : idx + 1}
              </div>
              <span style={{ fontSize: '0.8rem', color: active ? 'var(--c-text)' : 'var(--c-text-muted)', fontWeight: active ? 600 : 400 }}>
                {labels[idx]}
              </span>
              {idx < 2 && <div style={{ width: 40, height: 1, background: 'var(--c-border)', margin: '0 0.25rem' }} />}
            </div>
          );
        })}
      </div>

      {/* ─── STEP 1: Upload Resume ─────────────────────────────────────────── */}
      {step === 'resume' && (
        <div className="animate-slide-up">
          <div
            {...getRootProps()}
            style={{
              border: `2px dashed ${isDragActive ? 'var(--c-brand)' : uploadError ? 'var(--c-danger)' : 'var(--c-border)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '3.5rem 2rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragActive ? 'var(--c-brand-glow)' : 'var(--c-surface)',
              transition: 'all 0.2s ease',
            }}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div>
                <div className="spinner" style={{ margin: '0 auto 1rem', width: 32, height: 32, borderWidth: 3 }} />
                <p style={{ color: 'var(--c-text-muted)' }}>Uploading and extracting text…</p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
                <p style={{ fontWeight: 600, marginBottom: '0.5rem', fontFamily: 'var(--font-display)' }}>
                  {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
                </p>
                <p style={{ color: 'var(--c-text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  or click to browse — PDF or TXT, max 5MB
                </p>
                <span className="btn-secondary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}>
                  Browse File
                </span>
              </div>
            )}
          </div>

          {uploadError && (
            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '0.875rem' }}>
              {uploadError}
            </div>
          )}

          {/* Use existing resume */}

        </div>
      )}

      {/* ─── STEP 2: Job Details ───────────────────────────────────────────── */}
      {step === 'job' && (
        <div className="animate-slide-up">
          {resume && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>✅</span>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4ade80' }}>{resume.originalName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--c-text-muted)' }}>{resume.wordCount} words extracted</div>
              </div>
              <button onClick={() => { setResume(null); setStep('resume'); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--c-text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>
                Change
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="label">Job Title (optional)</label>
                <input
                  className="input"
                  placeholder="e.g. Full-Stack Engineer"
                  value={jobForm.title}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Company (optional)</label>
                <input
                  className="input"
                  placeholder="e.g. Acme Corp"
                  value={jobForm.company}
                  onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Job Description *</label>
              <textarea
                className="input"
                placeholder="Paste the full job description here… (minimum 50 characters)"
                value={jobForm.description}
                onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                rows={10}
                style={{ resize: 'vertical', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--c-text-faint)', marginTop: '0.4rem', textAlign: 'right' }}>
                {jobForm.description.length} chars {jobForm.description.length < 50 && '(min 50)'}
              </div>
            </div>

            {jobError && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '0.875rem' }}>
                {jobError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-secondary" onClick={() => setStep('resume')} style={{ flex: 1 }}>
                ← Back
              </button>
              <button
                className="btn-primary"
                onClick={handleAnalyze}
                disabled={jobForm.description.trim().length < 50}
                style={{ flex: 2 }}
              >
                Run Semantic Analysis →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 3: Analysing ─────────────────────────────────────────────── */}
      {step === 'analyzing' && (
        <div className="animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 2rem' }}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="none" stroke="var(--c-surface-3)" strokeWidth="4" />
              <circle cx="40" cy="40" r="36" fill="none" stroke="var(--c-brand)" strokeWidth="4"
                strokeDasharray="226" strokeDashoffset="56"
                strokeLinecap="round"
                style={{ transformOrigin: 'center', animation: 'spin 1.5s linear infinite' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
              🧠
            </div>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', marginBottom: '0.75rem' }}>
            Analysing your profile…
          </h2>
          <p style={{ color: 'var(--c-brand)', fontSize: '0.9rem', fontFamily: 'var(--font-mono)', minHeight: '1.5rem', transition: 'all 0.3s' }}>
            {analyzeProgress}
          </p>
          <p style={{ color: 'var(--c-text-muted)', fontSize: '0.8rem', marginTop: '1.5rem' }}>
            Running hybrid AI engine — this takes a few seconds.
          </p>
        </div>
      )}
    </div>
  );
}
