'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { resultsAPI } from '@/lib/api';
import { RadialBarChart, RadialBar, ResponsiveContainer, Cell } from 'recharts';

interface SemanticInsights {
  strongMatches: string[];
  partialMatches: string[];
  gaps: string[];
}

interface ComponentScores {
  semantic: number;
  skill: number;
  experience: number;
}

interface ResultDetail {
  _id: string;
  similarityScore: number;
  scoreCategory: string;
  semanticScore?: number;
  skillScore?: number;
  experienceScore?: number;
  matchedSkills: string[];
  missingSkills: string[];
  semanticInsights: SemanticInsights;
  analysis: string;
  jobTitle?: string;
  company?: string;
  jobDescription: string;
  createdAt: string;
  resumeId?: { originalName: string; wordCount: number };
  processingTimeMs?: number;
}

const scoreColor = (score: number) => {
  if (score >= 80) return '#22c55e';
  if (score >= 65) return '#3a9fee';
  if (score >= 45) return '#f59e0b';
  return '#ef4444';
};

const scoreLabel = (score: number) => {
  if (score >= 80) return 'Excellent Match';
  if (score >= 65) return 'Good Match';
  if (score >= 45) return 'Fair Match';
  return 'Poor Match';
};

function AnimatedScoreRing({ score }: { score: number }) {
  const [displayed, setDisplayed] = useState(0);
  const color = scoreColor(score);
  const r = 70;
  const circ = 2 * Math.PI * r;

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

  const offset = circ - (displayed / 100) * circ;

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="170" height="170" viewBox="0 0 170 170">
        {/* Background track */}
        <circle cx="85" cy="85" r={r} fill="none" stroke="var(--c-surface-3)" strokeWidth="10" />
        {/* Glow effect */}
        <circle cx="85" cy="85" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 85 85)"
          style={{ filter: `drop-shadow(0 0 8px ${color}80)`, transition: 'stroke-dashoffset 0.05s' }}
        />
        {/* Score number */}
        <text x="85" y="78" textAnchor="middle" fontSize="38" fontWeight="800"
          fontFamily="var(--font-mono)" fill={color}>
          {displayed}
        </text>
        <text x="85" y="100" textAnchor="middle" fontSize="13" fill="var(--c-text-muted)">
          out of 100
        </text>
      </svg>
      <div style={{
        marginTop: '0.25rem', fontFamily: 'var(--font-display)', fontWeight: 700,
        fontSize: '1.1rem', color,
      }}>
        {scoreLabel(score)}
      </div>
    </div>
  );
}

function ComponentBar({ label, value, color }: { label: string; value: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    setTimeout(() => setWidth(value), 100);
  }, [value]);

  return (
    <div style={{ marginBottom: '0.85rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.82rem' }}>
        <span style={{ color: 'var(--c-text-muted)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color }}>{value}%</span>
      </div>
      <div style={{ height: 8, background: 'var(--c-surface-3)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${width}%`, background: color,
          borderRadius: 999, transition: 'width 1s cubic-bezier(0.34,1.56,0.64,1)',
          boxShadow: `0 0 8px ${color}60`,
        }} />
      </div>
    </div>
  );
}

export default function ResultDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [result, setResult] = useState<ResultDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showJD, setShowJD] = useState(false);

  useEffect(() => {
    resultsAPI.get(id)
      .then((res) => setResult(res.data.result))
      .catch(() => setError('Result not found or access denied.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem', maxWidth: 500, margin: '2rem auto' }}>
        <p style={{ color: '#f87171', marginBottom: '1.5rem' }}>{error || 'Result not found.'}</p>
        <Link href="/results" className="btn-secondary">← Back to History</Link>
      </div>
    );
  }

  const mainColor = scoreColor(result.similarityScore);

  return (
    <div className="animate-fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* ─── Breadcrumb ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--c-text-muted)' }}>
        <Link href="/results" style={{ color: 'var(--c-text-muted)', textDecoration: 'none' }}>History</Link>
        <span>›</span>
        <span style={{ color: 'var(--c-text)' }}>{result.jobTitle || 'Analysis Result'}</span>
      </div>

      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', marginBottom: '0.3rem' }}>
            {result.jobTitle || 'Job Match Analysis'}
          </h1>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {result.company && <span style={{ color: 'var(--c-text-muted)', fontSize: '0.9rem' }}>@ {result.company}</span>}
            <span style={{ fontSize: '0.8rem', color: 'var(--c-text-faint)' }}>
              {new Date(result.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            {result.processingTimeMs && (
              <span style={{ fontSize: '0.75rem', color: 'var(--c-text-faint)', fontFamily: 'var(--font-mono)' }}>
                ⚡ {result.processingTimeMs}ms
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/analyze" className="btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.875rem' }}>
            + New Analysis
          </Link>
        </div>
      </div>

      {/* ─── Top Row: Score + Component Scores ──────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'stretch' }}>
        {/* Score Ring */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 2.5rem', minWidth: 220 }}>
          <AnimatedScoreRing score={result.similarityScore} />
          {result.resumeId && (
            <p style={{ fontSize: '0.75rem', color: 'var(--c-text-faint)', marginTop: '1rem', textAlign: 'center' }}>
              📄 {result.resumeId.originalName}
            </p>
          )}
        </div>

        {/* Component Breakdown */}
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '1.5rem' }}>
            Score Breakdown
          </h2>
          <ComponentBar label="Semantic Similarity (40%)" value={result.semanticScore ?? 0} color="#3a9fee" />
          <ComponentBar label="Skill Match (40%)" value={result.skillScore ?? 0} color="#7c6aff" />
          <ComponentBar label="Experience Alignment (20%)" value={result.experienceScore ?? 0} color="#22c55e" />

          <div style={{ marginTop: '1.25rem', padding: '0.75rem 1rem', background: 'var(--c-surface-2)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--c-text-muted)' }}>
            <span style={{ fontFamily: 'var(--font-mono)' }}>
              Final = (Semantic × 0.40) + (Skill × 0.40) + (Experience × 0.20) = <strong style={{ color: mainColor }}>{result.similarityScore}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ─── Skills Grid ────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Matched Skills */}
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#4ade80' }}>✓</span> Matched Skills
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#4ade80', fontWeight: 700 }}>
              {result.matchedSkills.length}
            </span>
          </h2>
          {result.matchedSkills.length === 0 ? (
            <p style={{ color: 'var(--c-text-muted)', fontSize: '0.875rem' }}>No direct skill matches found.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {result.matchedSkills.map((skill) => (
                <span key={skill} className="pill-matched">{skill}</span>
              ))}
            </div>
          )}
        </div>

        {/* Missing Skills */}
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#f87171' }}>✕</span> Missing Skills
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#f87171', fontWeight: 700 }}>
              {result.missingSkills.length}
            </span>
          </h2>
          {result.missingSkills.length === 0 ? (
            <p style={{ color: '#4ade80', fontSize: '0.875rem' }}>No skill gaps detected — great coverage! 🎉</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {result.missingSkills.map((skill) => (
                <span key={skill} className="pill-missing">{skill}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Semantic Insights ──────────────────────────────────────────────── */}
      {(result.semanticInsights.strongMatches.length > 0 ||
        result.semanticInsights.partialMatches.length > 0 ||
        result.semanticInsights.gaps.length > 0) && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '1.25rem' }}>
            Semantic Insights
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {result.semanticInsights.strongMatches.length > 0 && (
              <div>
                <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  ⚡ Strong Matches
                </h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {result.semanticInsights.strongMatches.map((item, i) => (
                    <li key={i} style={{ fontSize: '0.82rem', color: 'var(--c-text-muted)', paddingLeft: '0.75rem', borderLeft: '2px solid rgba(34,197,94,0.4)', lineHeight: 1.5 }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.semanticInsights.partialMatches.length > 0 && (
              <div>
                <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  ≈ Partial Matches
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {result.semanticInsights.partialMatches.map((skill) => (
                    <span key={skill} className="pill-partial">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {result.semanticInsights.gaps.length > 0 && (
              <div>
                <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  ✕ Key Gaps
                </h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {result.semanticInsights.gaps.map((item, i) => (
                    <li key={i} style={{ fontSize: '0.82rem', color: 'var(--c-text-muted)', paddingLeft: '0.75rem', borderLeft: '2px solid rgba(239,68,68,0.4)', lineHeight: 1.5 }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── AI Reasoning ───────────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '1.5rem', borderColor: `${mainColor}30` }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🧠 AI Reasoning
        </h2>
        <p style={{ color: 'var(--c-text-muted)', lineHeight: 1.8, fontSize: '0.925rem' }}>
          {result.analysis}
        </p>
      </div>

      {/* ─── Job Description Toggle ──────────────────────────────────────────── */}
      <div className="card">
        <button
          onClick={() => setShowJD((v) => !v)}
          style={{ width: '100%', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', color: 'var(--c-text)', fontSize: '0.95rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}
        >
          <span>Job Description</span>
          <span style={{ color: 'var(--c-text-muted)', fontSize: '0.85rem', fontFamily: 'var(--font-body)', fontWeight: 400 }}>
            {showJD ? '▲ Hide' : '▼ Show'}
          </span>
        </button>

        {showJD && (
          <pre style={{ marginTop: '1rem', padding: '1rem', background: 'var(--c-surface-2)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--c-text-muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'var(--font-body)', overflowY: 'auto', maxHeight: '300px' }}>
            {result.jobDescription}
          </pre>
        )}
      </div>

      {/* ─── Footer Actions ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <Link href="/results" className="btn-secondary">← Back to History</Link>
        <Link href="/analyze" className="btn-primary">Run Another Analysis →</Link>
      </div>
    </div>
  );
}
