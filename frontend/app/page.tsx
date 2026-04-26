'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--c-bg)' }}>
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen noise" style={{ background: 'var(--c-bg)', position: 'relative' }}>
      <div className="mesh-bg" />

      <div className="relative z-10">
        {/* ─── Nav ──────────────────────────────────────────────────────────── */}
        <nav style={{ borderBottom: '1px solid var(--c-border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(13,15,28,0.8)', backdropFilter: 'blur(12px)' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--c-brand)' }}>
            JobMatch<span style={{ color: 'var(--c-text)' }}> AI</span>
          </span>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/auth/login" className="btn-secondary" style={{ padding: '0.5rem 1.2rem' }}>
              Sign In
            </Link>
            <Link href="/auth/register" className="btn-primary" style={{ padding: '0.5rem 1.2rem' }}>
              Get Started
            </Link>
          </div>
        </nav>

        {/* ─── Hero ─────────────────────────────────────────────────────────── */}
        <main style={{ maxWidth: 900, margin: '0 auto', padding: '7rem 2rem 4rem', textAlign: 'center' }}>
          <div className="animate-fade-in" style={{ marginBottom: '1.5rem' }}>
            <span style={{ display: 'inline-block', padding: '0.3rem 1rem', background: 'rgba(58,159,238,0.1)', border: '1px solid rgba(58,159,238,0.25)', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600, color: 'var(--c-brand)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '2rem' }}>
              Dissertation Project · Semantic AI Matching
            </span>
          </div>

          <h1 className="animate-slide-up" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem', animationDelay: '0.1s', animationFillMode: 'both' }}>
            Beyond Keywords.<br />
            <span style={{ background: 'linear-gradient(135deg, var(--c-brand), var(--c-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Real Intelligence.
            </span>
          </h1>

          <p className="animate-slide-up" style={{ fontSize: '1.15rem', color: 'var(--c-text-muted)', maxWidth: 580, margin: '0 auto 2.5rem', lineHeight: 1.7, animationDelay: '0.2s', animationFillMode: 'both' }}>
            Upload your resume and job description. Our hybrid AI engine — powered by SBERT semantic embeddings, skill extraction, and reasoning — gives you a score, matched skills, gaps, and a plain-English explanation.
          </p>

          <div className="animate-slide-up" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', animationDelay: '0.3s', animationFillMode: 'both' }}>
            <Link href="/auth/register" className="btn-primary" style={{ padding: '0.9rem 2rem', fontSize: '1rem' }}>
              Start Matching Free →
            </Link>
            <Link href="/auth/login" className="btn-secondary" style={{ padding: '0.9rem 2rem', fontSize: '1rem' }}>
              Sign In
            </Link>
          </div>

          {/* ─── Feature Grid ────────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '5rem', textAlign: 'left' }}>
            {[
              { icon: '🧠', title: 'Semantic Embeddings', desc: 'SBERT model understands meaning, not just words.' },
              { icon: '🎯', title: 'Skill Extraction', desc: '80+ technology taxonomy with semantic expansion.' },
              { icon: '📊', title: 'Hybrid Scoring', desc: 'Semantic + Skill + Experience weighted formula.' },
              { icon: '💬', title: 'Plain-English Reasoning', desc: 'Understand exactly why your score is high or low.' },
            ].map((f) => (
              <div key={f.title} className="card" style={{ animationDelay: '0.4s' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>{f.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--c-text-muted)', lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
