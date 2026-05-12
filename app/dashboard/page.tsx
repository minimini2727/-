'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/apiClient';

const G = '#03C75A';
const DARK = '#1a2035';

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e8edf5', borderRadius: 14, padding: '20px 22px' }}>
      <div style={{ fontSize: 12, color: '#718096', marginBottom: 8, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || DARK }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: 12, color: '#a0aec0', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function UsageBar({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min(100, (used / limit) * 100);
  const color = pct >= 90 ? '#ff4d4f' : pct >= 70 ? '#faad14' : G;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#718096', marginBottom: 6 }}>
        <span>이번 달 사용량</span>
        <span style={{ fontWeight: 700, color }}>{used} / {limit}회</span>
      </div>
      <div style={{ height: 10, background: '#e8edf5', borderRadius: 5, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 5, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const c = score >= 8 ? G : score >= 6 ? '#4096ff' : score >= 4 ? '#faad14' : '#ff4d4f';
  return <span style={{ fontWeight: 700, color: c, fontSize: 14 }}>{Number(score).toFixed(1)}</span>;
}

type UsageData = {
  user: { id: number; email: string; name: string; plan: string; monthly_limit: number };
  currentMonth: { used: number; limit: number; yearMonth: string };
  stats: { totalAnalyses: number; avgScore: number | null; recentScores: any[] };
};

type HistoryItem = {
  id: number; keyword: string; ad_title: string; ad_desc: string;
  overall_score: number | null; created_at: string;
};

function DashboardContent() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UsageData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<UsageData>('/usage').then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get<{ items: HistoryItem[]; totalPages: number }>(`/analyze?page=${page}`)
      .then(({ items, totalPages: tp }) => { setHistory(items); setTotalPages(tp); })
      .catch(console.error);
  }, [page]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: G, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const isPro = user?.plan !== 'free';

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '32px 16px 80px' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: DARK }}>{user?.name}님의 대시보드</h1>
          <p style={{ fontSize: 14, color: '#718096', marginTop: 4 }}>
            플랜: <span style={{ color: G, fontWeight: 700 }}>{user?.plan?.toUpperCase()}</span>
          </p>
        </div>
        <Link href="/analyze" style={{
          background: G, color: '#fff', fontWeight: 700, fontSize: 14,
          padding: '10px 20px', borderRadius: 10, display: 'inline-block', textDecoration: 'none',
        }}>+ 새 분석</Link>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20, animation: 'fadeUp 0.4s ease' }}>
        <StatCard label="총 분석 횟수" value={stats?.stats.totalAnalyses ?? 0} sub="누적" />
        <StatCard label="평균 점수" value={stats?.stats.avgScore ? `${stats.stats.avgScore}/10` : '—'} sub="전체 분석 기준" color={G} />
        <StatCard label="이번 달 사용" value={`${stats?.currentMonth.used ?? 0}회`} sub={`한도: ${stats?.currentMonth.limit ?? 10}회`} />
        <StatCard label="남은 횟수" value={isPro ? '무제한' : `${Math.max(0, (stats?.currentMonth.limit ?? 10) - (stats?.currentMonth.used ?? 0))}회`} sub={isPro ? 'Pro 플랜' : '무료 플랜'} color={isPro ? G : '#faad14'} />
      </div>

      {/* 사용량 & 업그레이드 */}
      {!isPro && stats && (
        <div style={{ background: '#fff', border: '1px solid #e8edf5', borderRadius: 14, padding: '20px 22px', marginBottom: 20, animation: 'fadeUp 0.45s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: DARK }}>이번 달 사용량</div>
            <Link href="/#pricing" style={{
              fontSize: 12, fontWeight: 700, color: '#fff', background: G,
              padding: '6px 14px', borderRadius: 8, display: 'inline-block', textDecoration: 'none',
            }}>Pro 업그레이드</Link>
          </div>
          <UsageBar used={stats.currentMonth.used} limit={stats.currentMonth.limit} />
          <p style={{ fontSize: 12, color: '#a0aec0', marginTop: 10 }}>
            Pro 플랜은 월 무제한 분석 + 히스토리 무제한 제공
          </p>
        </div>
      )}

      {/* 분석 히스토리 */}
      <div style={{ background: '#fff', border: '1px solid #e8edf5', borderRadius: 16, padding: '20px 24px', animation: 'fadeUp 0.5s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <div style={{ width: 4, height: 20, background: DARK, borderRadius: 2 }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: DARK }}>분석 히스토리</span>
        </div>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#a0aec0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
            <p style={{ fontSize: 14 }}>아직 분석 기록이 없습니다.</p>
            <Link href="/analyze" style={{ color: G, fontWeight: 700, fontSize: 14 }}>첫 번째 광고 분석하기 →</Link>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f7f9fc' }}>
                    {['키워드', '광고 제목', '종합 점수', '분석 일시'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#718096', borderBottom: '1px solid #e8edf5', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f0f4f8' }}>
                      <td style={{ padding: '12px', fontWeight: 600, color: DARK }}>{item.keyword}</td>
                      <td style={{ padding: '12px', color: '#4a5568', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.ad_title}</td>
                      <td style={{ padding: '12px' }}>
                        {item.overall_score ? <ScoreBadge score={item.overall_score} /> : '—'}
                      </td>
                      <td style={{ padding: '12px', color: '#718096', whiteSpace: 'nowrap', fontSize: 12 }}>
                        {new Date(item.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: page === 1 ? '#f7f9fc' : '#fff', color: page === 1 ? '#a0aec0' : DARK, fontWeight: 600, fontSize: 13, cursor: page === 1 ? 'default' : 'pointer' }}>
                  ← 이전
                </button>
                <span style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: '#718096' }}>{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: page === totalPages ? '#f7f9fc' : '#fff', color: page === totalPages ? '#a0aec0' : DARK, fontWeight: 600, fontSize: 13, cursor: page === totalPages ? 'default' : 'pointer' }}>
                  다음 →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ProtectedDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: G, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!user) {
    if (typeof window !== 'undefined') router.replace('/login');
    return null;
  }

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: 60 }}>
        <DashboardContent />
      </div>
    </>
  );
}

export default function DashboardPage() {
  return <AuthProvider><ProtectedDashboard /></AuthProvider>;
}
