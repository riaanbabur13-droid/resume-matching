'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { resultsAPI } from '@/lib/api';

interface Result {
  _id: string;
  similarityScore: number;
  scoreCategory: string;
  jobTitle?: string;
  company?: string;
  matchedSkills: string[];
  missingSkills: string[];
  createdAt: string;
  resumeId?: { originalName: string };
}

interface Pagination {
  total: number;
  page: number;
  pages: number;
  hasMore: boolean;
}

const scoreColor = (score: number) => {
  if (score >= 80) return '#22c55e';
  if (score >= 65) return '#3a9fee';
  if (score >= 45) return '#f59e0b';
  return '#ef4444';
};

const ScoreRing = ({ score }: { score: number }) => {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = scoreColor(score);

  return (
    <svg width="56" height="56" viewBox="0 0 56 56" style={{ flexShrink: 0 }}>
      <circle cx="28" cy="28" r={r} fill="none" stroke="var(--c-surface-3)" strokeWidth="4" />
      <circle
        cx="28" cy="28" r={r} fill="none"
        stroke={color} strokeWidth="4"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 28 28)"
      />
      <text x="28" y="33" textAnchor="middle" fontSize="11" fontWeight="700"
        fontFamily="var(--font-mono)" fill={color}>
        {score}
      </text>
    </svg>
  );
};

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchResults = async (p: number) => {
    setLoading(true);
    try {
      const res = await resultsAPI.list(p, 10);
      setResults(res.data.results);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResults(page); }, [page]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this result?')) return;
    setDeleting(id);
    try {
      await resultsAPI.delete(id);
      setResults((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', marginBottom: '0.3rem' }}>
            Analysis History
          </h1>
          <p style={{ color: 'var(--c-text-muted)', fontSize: '0.9rem' }}>
            {pagination ? `${pagination.total} total analyses` : 'Loading…'}
          </p>
        </div>
        <Link href="/analyze" className="btn-primary">
          + New Analysis
        </Link>
      </div>

      {/* Results List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        </div>
      ) : results.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.75rem' }}>No analyses yet</h2>
          <p style={{ color: 'var(--c-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Upload a resume and paste a job description to get started.
          </p>
          <Link href="/analyze" className="btn-primary">
            Run First Analysis →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {results.map((result) => (
            <div key={result._id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem 1.5rem' }}>
              <ScoreRing score={result.similarityScore} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700 }}>
                    {result.jobTitle || 'Untitled Role'}
                  </h3>
                  {result.company && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--c-text-muted)' }}>@ {result.company}</span>
                  )}
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.55rem',
                    borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.05em',
                    background: `${scoreColor(result.similarityScore)}18`,
                    color: scoreColor(result.similarityScore),
                  }}>
                    {result.scoreCategory}
                  </span>
                </div>

                {result.resumeId && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--c-text-muted)', marginBottom: '0.5rem' }}>
                    📄 {result.resumeId.originalName}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {result.matchedSkills.slice(0, 4).map((s) => (
                    <span key={s} className="pill-matched" style={{ fontSize: '0.72rem', padding: '0.15rem 0.55rem' }}>{s}</span>
                  ))}
                  {result.matchedSkills.length > 4 && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--c-text-muted)' }}>+{result.matchedSkills.length - 4} more</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.6rem', flexShrink: 0 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--c-text-faint)' }}>
                  {new Date(result.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link href={`/results/${result._id}`} className="btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(result._id)}
                    disabled={deleting === result._id}
                    style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem', background: 'transparent', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-md)', color: '#f87171', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    {deleting === result._id ? '…' : '🗑'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
          <button
            className="btn-secondary"
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
          >
            ← Prev
          </button>
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', fontSize: '0.875rem', color: 'var(--c-text-muted)' }}>
            Page {page} of {pagination.pages}
          </span>
          <button
            className="btn-secondary"
            onClick={() => setPage((p) => p + 1)}
            disabled={!pagination.hasMore}
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
