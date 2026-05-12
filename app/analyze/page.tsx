'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/apiClient';

const G = '#03C75A';
const DARK = '#1a2035';

function ScoreBar({ score }: { score: number }) {
  const c = score >= 8 ? G : score >= 6 ? '#4096ff' : score >= 4 ? '#faad14' : '#ff4d4f';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 8, background: '#e8edf2', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${score * 10}%`, height: '100%', background: c, borderRadius: 4, transition: 'width 0.8s ease' }} />
      </div>
      <span style={{ fontSize: 15, fontWeight: 700, color: c, minWidth: 32, textAlign: 'right' }}>{Number(score).toFixed(1)}</span>
    </div>
  );
}

function Badge({ text, type = 'grade' }: { text: string; type?: 'grade' | 'impact' }) {
  const gradeMap: Record<string, [string, string]> = {
    '상': [G, '#e6f9ef'], '중상': ['#1677ff', '#e6f3ff'],
    '중': ['#d48806', '#fff7e6'], '중하': ['#cf1322', '#fff1f0'], '하': ['#820014', '#fff1f0'],
  };
  const impactMap: Record<string, [string, string]> = {
    '높음': ['#c41d7f', '#fff0f6'], '중간': ['#0958d9', '#e6f4ff'], '낮음': ['#389e0d', '#f6ffed'],
  };
  const map = type === 'grade' ? gradeMap : impactMap;
  const [color, bg] = map[text] || ['#718096', '#f7f9fc'];
  return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: bg, color, border: `1px solid ${color}33` }}>{text}</span>;
}

function MetricCard({ icon, title, data, delay }: { icon: string; title: string; data: any; delay: number }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e8edf5', borderRadius: 14, padding: '20px', animation: `fadeUp 0.5s ease ${delay}s both` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{title}</span>
        </div>
        <Badge text={data.grade} type="grade" />
      </div>
      <ScoreBar score={data.score} />
      <p style={{ fontSize: 12, color: '#718096', margin: '10px 0 12px', lineHeight: 1.5 }}>{data.summary}</p>
      <div style={{ borderTop: '1px solid #f0f4f8', paddingTop: 12 }}>
        {data.details.map((d: string, i: number) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <span style={{ color: G, fontWeight: 700, fontSize: 12, flexShrink: 0 }}>#{i + 1}</span>
            <span style={{ fontSize: 12, color: '#4a5568', lineHeight: 1.5 }}>{d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Dial({ score }: { score: number }) {
  const c = score >= 8 ? G : score >= 6 ? '#4096ff' : score >= 4 ? '#faad14' : '#ff4d4f';
  const rad = ((score / 10) * 180 - 90) * Math.PI / 180;
  const cx = 90, cy = 80, r = 65;
  return (
    <svg viewBox="0 0 180 100" style={{ width: 180, height: 100 }}>
      <path d="M 25 80 A 65 65 0 0 1 155 80" fill="none" stroke="#e8edf5" strokeWidth="14" strokeLinecap="round" />
      <path d="M 25 80 A 65 65 0 0 1 155 80" fill="none" stroke={c} strokeWidth="14" strokeLinecap="round"
        strokeDasharray={`${(score / 10) * 204} 204`} />
      <line x1={cx} y1={cy} x2={cx + r * Math.cos(rad)} y2={cy + r * Math.sin(rad)} stroke={DARK} strokeWidth="3" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={5} fill={DARK} />
      <text x={cx} y={cy + 22} textAnchor="middle" fontSize="22" fontWeight="700" fill={c}>{Number(score).toFixed(1)}</text>
    </svg>
  );
}

type FormState = { keyword: string; adTitle: string; adDesc: string; landingContent: string };
type UsageInfo = { used: number; limit: number; plan: string };

function AnalyzerContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ keyword: '', adTitle: '', adDesc: '', landingContent: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const STEPS = ['키워드 시맨틱 분석 중...', '소재 매력도 평가 중...', '랜딩 경험 측정 중...', '콘텐츠 신선도 스캐닝...', '최종 점수 산출 중...'];

  const analyze = async () => {
    const { keyword, adTitle, adDesc, landingContent } = form;
    if (!keyword || !adTitle || !adDesc || !landingContent) return setError('모든 항목을 입력해주세요.');
    setError(''); setResult(null); setLoading(true);
    let si = 0;
    const t = setInterval(() => { si = (si + 1) % STEPS.length; setStep(STEPS[si]); }, 700);
    setStep(STEPS[0]);
    try {
      const data = await api.post<{ result: any; usage: UsageInfo }>('/analyze', { keyword, adTitle, adDesc, landingContent });
      setResult(data.result);
      setUsageInfo(data.usage);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err: any) {
      if (err.code === 'QUOTA_EXCEEDED') {
        setError(err.message);
      } else {
        setError('분석 실패: ' + err.message);
      }
    } finally {
      clearInterval(t); setLoading(false); setStep('');
    }
  };

  const copyMarkdown = () => {
    if (!result) return;
    const { adRelevance, pCTR, lpQuality, freshness, overallScore, rankingGrade, estimatedCTR, competitiveLevel, optimizationGuide } = result;
    const md = `# ADVoost 분석 결과 — "${form.keyword}"\n\n## 핵심 지표\n\n| 지표 | 점수 | 등급 | 요약 |\n|------|------|------|------|\n| 광고 연관지수 | ${adRelevance.score}/10 | ${adRelevance.grade} | ${adRelevance.summary} |\n| 클릭 기대지수 | ${pCTR.score}/10 | ${pCTR.grade} | ${pCTR.summary} |\n| 랜딩 경험지수 | ${lpQuality.score}/10 | ${lpQuality.grade} | ${lpQuality.summary} |\n| 콘텐츠 신선도 | ${freshness.score}/10 | ${freshness.grade} | ${freshness.summary} |\n| **종합** | **${overallScore}/10** | — | ${rankingGrade} · CTR ${estimatedCTR} |\n\n## 최적화 가이드\n\n${optimizationGuide.map((g: any) => `### P${g.priority}. ${g.title} [${g.impact}]\n- 문제: ${g.problem}\n- 실행: ${g.action}\n- 효과: ${g.expectedEffect}`).join('\n\n')}`;
    navigator.clipboard.writeText(md).then(() => alert('클립보드에 복사되었습니다!'));
  };

  const usedCount = usageInfo?.used ?? 0;
  const limitCount = usageInfo?.limit ?? (user?.monthly_limit || 10);
  const isPro = user?.plan !== 'free';

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '32px 16px 80px' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
      `}</style>

      {usageInfo && !isPro && (
        <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
          <span style={{ color: '#7c6100' }}>이번 달 사용: <strong>{usedCount} / {limitCount}회</strong></span>
          {usedCount >= limitCount && (
            <Link href="/#pricing" style={{ marginLeft: 'auto', background: G, color: '#fff', fontWeight: 700, padding: '6px 14px', borderRadius: 8, fontSize: 12, textDecoration: 'none' }}>
              Pro 업그레이드 →
            </Link>
          )}
        </div>
      )}

      {/* 입력 폼 */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, marginBottom: 20, animation: 'fadeUp 0.4s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <div style={{ width: 4, height: 20, background: G, borderRadius: 2 }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: DARK }}>광고 데이터 입력</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {([
            { label: '🔍 키워드', key: 'keyword' as const, ph: '예: 강남 피부과' },
            { label: '📝 광고 제목', key: 'adTitle' as const, ph: '예: [강남 NO.1] 피부과 당일예약' },
          ]).map(({ label, key, ph }) => (
            <div key={key}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>{label}</label>
              <input value={form[key]} onChange={set(key)} placeholder={ph} style={{
                width: '100%', padding: '10px 12px', fontSize: 13, border: '1.5px solid #e2e8f0',
                borderRadius: 8, background: '#fafbfc', boxSizing: 'border-box', outline: 'none',
              }}
                onFocus={e => (e.target.style.borderColor = G)}
                onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
            </div>
          ))}
        </div>

        {([
          { label: '💬 광고 설명문', key: 'adDesc' as const, rows: 2, ph: '예: 강남역 1분 거리, 여드름/미백/탄력 전문 · 초진 50% 할인' },
          { label: '🌐 랜딩 페이지 핵심 내용 또는 URL', key: 'landingContent' as const, rows: 3, ph: '예: 강남 논현동 피부과 전문의 3인 운영, 레이저토닝·보톡스·필러, 당일예약·주차무료' },
        ]).map(({ label, key, rows, ph }) => (
          <div key={key} style={{ marginTop: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>{label}</label>
            <textarea value={form[key]} onChange={set(key)} rows={rows} placeholder={ph} style={{
              width: '100%', padding: '10px 12px', fontSize: 13, border: '1.5px solid #e2e8f0',
              borderRadius: 8, background: '#fafbfc', boxSizing: 'border-box', resize: 'vertical', outline: 'none',
            }}
              onFocus={e => (e.target.style.borderColor = G)}
              onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
          </div>
        ))}

        {error && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 8, fontSize: 13, color: '#cf1322' }}>
            ⚠️ {error}
            {error.includes('초과') && (
              <Link href="/#pricing" style={{ marginLeft: 12, color: G, fontWeight: 700 }}>Pro 업그레이드 →</Link>
            )}
          </div>
        )}

        <button onClick={analyze} disabled={loading} style={{
          marginTop: 18, width: '100%', padding: '13px 0', fontSize: 15, fontWeight: 700,
          background: loading ? '#e2e8f0' : G, color: loading ? '#a0aec0' : '#fff',
          border: 'none', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: loading ? 'default' : 'pointer',
        }}>
          {loading
            ? <><div style={{ width: 18, height: 18, border: '2px solid #a0aec0', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><span style={{ animation: 'pulse 1.4s ease-in-out infinite' }}>{step}</span></>
            : '🚀 ADVoost 엔진 분석 시작'}
        </button>
      </div>

      {result && (
        <div ref={resultRef} style={{ animation: 'fadeUp 0.5s ease' }}>
          {/* 종합 */}
          <div style={{ background: DARK, borderRadius: 16, padding: '24px 28px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <Dial score={result.overallScore} />
              <div style={{ textAlign: 'center', fontSize: 12, color: '#8fa3c0', marginTop: 4 }}>종합 랭킹 점수</div>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 11, color: '#8fa3c0', marginBottom: 4 }}>분석 키워드</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 16 }}>"{form.keyword}"</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { label: '예상 노출 순위', val: result.rankingGrade, col: G },
                  { label: '예상 CTR', val: result.estimatedCTR, col: '#4096ff' },
                  { label: '경쟁 강도', val: result.competitiveLevel, col: '#faad14' },
                ].map(({ label, val, col }) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, color: '#8fa3c0', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: col }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={copyMarkdown} style={{
              background: 'rgba(3,199,90,0.15)', border: '1px solid rgba(3,199,90,0.3)', color: G,
              borderRadius: 8, padding: '10px 14px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer',
            }}>📋 마크다운 복사</button>
          </div>

          {/* 4대 지표 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <MetricCard icon="🎯" title="광고 연관지수 (Ad Relevance)" data={result.adRelevance} delay={0.1} />
            <MetricCard icon="👆" title="클릭 기대지수 (pCTR)" data={result.pCTR} delay={0.2} />
            <MetricCard icon="📄" title="랜딩 경험지수 (LP Quality)" data={result.lpQuality} delay={0.3} />
            <MetricCard icon="✨" title="콘텐츠 신선도 (Freshness)" data={result.freshness} delay={0.4} />
          </div>

          {/* 최적화 가이드 */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <div style={{ width: 4, height: 20, background: '#9254de', borderRadius: 2 }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: DARK }}>🤖 AI 최적화 가이드 TOP 3</span>
            </div>
            {result.optimizationGuide.map((g: any, i: number) => (
              <div key={i} style={{
                border: '1px solid #e8edf5', borderRadius: 12, padding: '16px 18px',
                marginBottom: i < 2 ? 12 : 0, position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: i === 0 ? '#ff4d4f' : i === 1 ? '#faad14' : G }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800,
                      background: i === 0 ? '#fff1f0' : i === 1 ? '#fffbe6' : '#f6ffed',
                      color: i === 0 ? '#cf1322' : i === 1 ? '#d48806' : '#389e0d',
                    }}>P{g.priority}</div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: DARK }}>{g.title}</span>
                  </div>
                  <Badge text={g.impact} type="impact" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {[
                    { label: '🔍 현재 문제점', val: g.problem, bg: '#fff8f8' },
                    { label: '⚡ 실행 방법', val: g.action, bg: '#f8fffe' },
                    { label: '📈 기대 효과', val: g.expectedEffect, bg: '#f8f8ff' },
                  ].map(({ label, val, bg }) => (
                    <div key={label} style={{ background: bg, borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#718096', marginBottom: 6 }}>{label}</div>
                      <div style={{ fontSize: 12, color: '#2d3748', lineHeight: 1.55 }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, padding: '10px 16px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8, fontSize: 12, color: '#7c6100' }}>
            ⚠️ AI 예측 기반 참고용 서비스입니다. 실제 네이버 ADVoost 엔진의 공식 지표와 다를 수 있습니다.
          </div>
        </div>
      )}
    </div>
  );
}

function ProtectedAnalyzer() {
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
        <AnalyzerContent />
      </div>
    </>
  );
}

export default function AnalyzePage() {
  return <AuthProvider><ProtectedAnalyzer /></AuthProvider>;
}
