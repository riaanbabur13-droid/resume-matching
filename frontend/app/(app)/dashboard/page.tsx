'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { resultsAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

interface Stats {
  totalAnalyses: number;
  avgScore: number;
  maxScore: number;
  minScore: number;
  excellentCount: number;
  goodCount: number;
}

interface RecentResult {
  _id: string;
  similarityScore: number;
  scoreCategory: string;
  jobTitle?: string;
  company?: string;
  createdAt: string;
}

const scoreColor = (score: number) => {
  if (score >= 80) return 'var(--c-success)';
  if (score >= 65) return 'var(--c-brand)';
  if (score >= 45) return 'var(--c-warning)';
  return 'var(--c-danger)';
};

const ScoreBadge = ({ score }: { score: number }) => (
  <span
    style={{
      display: 'inline-block',
      padding: '0.2rem 0.6rem',
      borderRadius: 999,
      fontSize: '0.8rem',
      fontWeight: 700,
      fontFamily: 'var(--font-mono)',
      color: scoreColor(score),
      background: `${scoreColor(score)}18`,
    }}
  >
    {score}%
  </span>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resultsAPI.stats()
      .then((res) => {
        setStats(res.data.stats);
        setRecent(res.data.recentResults);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const radarData = stats
    ? [
        { subject: 'Total', value: Math.min(stats.totalAnalyses * 5, 100) },
        { subject: 'Avg Score', value: stats.avgScore },
        { subject: 'Best', value: stats.maxScore },
        { subject: 'Excellent', value: Math.min(stats.excellentCount * 10, 100) },
        { subject: 'Good+', value: Math.min((stats.excellentCount + stats.goodCount) * 8, 100) },
      ]
    : [];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', marginBottom: '0.3rem' }}>
            Welcome back, {user?.name.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--c-text-muted)', fontSize: '0.9rem' }}>
            Here&apos;s your matching activity overview.
          </p>
        </div>
        <Link href="/analyze" className="btn-primary">
          + New Analysis
        </Link>
      </div>

      {/* ─── Stat Cards ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Analyses', value: stats?.totalAnalyses ?? 0, suffix: '' },
          { label: 'Avg Match Score', value: stats?.avgScore ?? 0, suffix: '%' },
          { label: 'Best Score', value: stats?.maxScore ?? 0, suffix: '%' },
          { label: 'Excellent Matches', value: stats?.excellentCount ?? 0, suffix: '' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700, color: 'var(--c-brand)', marginBottom: '0.25rem' }}>
              {s.value}{s.suffix}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--c-text-muted)', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* ─── Recent Results ──────────────────────────────────────────────────── */}
        <div className="card" style={{ gridColumn: 'span 1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>Recent Analyses</h2>
            <Link href="/results" style={{ fontSize: '0.8rem', color: 'var(--c-brand)', textDecoration: 'none' }}>View all →</Link>
          </div>

          {recent.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--c-text-muted)' }}>
              <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>No analyses yet.</p>
              <Link href="/analyze" className="btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>
                Run your first →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recent.map((r) => (
                <Link
                  key={r._id}
                  href={`/results/${r._id}`}
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'var(--c-surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--c-border)', transition: 'border-color 0.2s' }}
                >
                  <ScoreBadge score={r.similarityScore} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--c-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.jobTitle || 'Untitled Role'}
                    </div>
                    {r.company && <div style={{ fontSize: '0.75rem', color: 'var(--c-text-muted)' }}>{r.company}</div>}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--c-text-faint)', flexShrink: 0 }}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ─── Radar Chart ────────────────────────────────────────────────────── */}
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '1.25rem' }}>Performance Radar</h2>
          {stats && stats.totalAnalyses > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--c-border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--c-text-muted)', fontSize: 11 }} />
                <Radar name="Stats" dataKey="value" stroke="var(--c-brand)" fill="var(--c-brand)" fillOpacity={0.15} strokeWidth={2} />
                <Tooltip
                  contentStyle={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: 8, color: 'var(--c-text)', fontSize: 12 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, color: 'var(--c-text-muted)', fontSize: '0.875rem' }}>
              No data yet — run your first analysis.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
