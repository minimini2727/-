'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/context/AuthContext';

const G = '#03C75A';
const DARK = '#1a2035';

const metrics = [
  { icon: '🎯', title: '광고 연관지수', desc: '키워드·소재·랜딩페이지 간 시맨틱 유사도를 AI로 정밀 분석' },
  { icon: '👆', title: '클릭 기대지수', desc: '검색 의도 대비 소재 매력도·CTA·혜택 가시성 종합 평가' },
  { icon: '📄', title: '랜딩 경험지수', desc: '정보 완결성, 모바일 UX, 전환 흐름의 품질 측정' },
  { icon: '✨', title: '콘텐츠 신선도', desc: '2026 최신 트렌드 반영도와 소재 차별성 스캐닝' },
];

const plans = [
  {
    name: 'Free', price: '₩0', period: '/월', color: '#718096',
    limit: '월 10회 분석',
    features: ['4대 핵심 지표 분석', 'AI 최적화 가이드 3종', '분석 히스토리 30일', '기본 지원'],
    cta: '무료로 시작', to: '/register', highlight: false,
  },
  {
    name: 'Pro', price: '₩29,000', period: '/월', color: G,
    limit: '무제한 분석',
    features: ['무제한 광고 분석', '상세 점수 리포트', 'CSV 내보내기', '히스토리 무제한', '우선 이메일 지원'],
    cta: 'Pro 시작하기', to: '/register', highlight: true,
  },
  {
    name: 'Enterprise', price: '문의', period: '', color: '#805ad5',
    limit: '맞춤형 한도',
    features: ['팀 멤버 공유', 'API 직접 연동', 'SLA 보장', '전담 매니저'],
    cta: '문의하기', to: 'mailto:hello@advoost.io', highlight: false,
  },
];

export default function LandingPage() {
  return (
    <AuthProvider>
      <div style={{ background: '#fff', minHeight: '100vh' }}>
        <Navbar />

        {/* Hero */}
        <section style={{
          paddingTop: 140, paddingBottom: 100, textAlign: 'center',
          background: `linear-gradient(180deg, #f0faf5 0%, #fff 100%)`,
        }}>
          <div style={{
            display: 'inline-block', background: '#e6f9ef', color: G,
            fontSize: 12, fontWeight: 700, padding: '4px 14px', borderRadius: 20,
            marginBottom: 20, letterSpacing: 0.5,
          }}>2026 ADVoost ENGINE · POWERED BY CLAUDE AI</div>

          <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, color: DARK, lineHeight: 1.2, marginBottom: 20 }}>
            네이버 검색광고 성과를<br />
            <span style={{ color: G }}>AI로 예측하고 최적화</span>하세요
          </h1>
          <p style={{ fontSize: 18, color: '#718096', maxWidth: 540, margin: '0 auto 40px', lineHeight: 1.7 }}>
            광고 키워드·소재·랜딩페이지를 입력하면<br />
            ADVoost 엔진이 4대 핵심 지표를 즉시 분석합니다
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{
              background: G, color: '#fff', fontWeight: 700, fontSize: 16,
              padding: '14px 32px', borderRadius: 10, display: 'inline-block', textDecoration: 'none',
            }}>무료로 시작하기 →</Link>
            <Link href="/login" style={{
              background: '#fff', color: DARK, fontWeight: 600, fontSize: 16,
              padding: '14px 32px', borderRadius: 10, border: '1.5px solid #e2e8f0', display: 'inline-block', textDecoration: 'none',
            }}>로그인</Link>
          </div>

          <p style={{ fontSize: 12, color: '#a0aec0', marginTop: 16 }}>신용카드 불필요 · 월 10회 무료 제공</p>
        </section>

        {/* 4 Metrics */}
        <section style={{ padding: '80px 24px', maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, color: DARK, marginBottom: 8 }}>
            4대 핵심 최적화 지표
          </h2>
          <p style={{ textAlign: 'center', color: '#718096', fontSize: 15, marginBottom: 48 }}>
            네이버 ADVoost 엔진의 실제 로직을 AI로 시뮬레이션합니다
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {metrics.map(({ icon, title, desc }) => (
              <div key={title} style={{
                background: '#fff', border: '1px solid #e8edf5', borderRadius: 16,
                padding: '28px 24px', transition: 'box-shadow 0.2s',
              }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>{icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: DARK, marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" style={{ padding: '80px 24px', background: '#f7f9fc' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, color: DARK, marginBottom: 8 }}>
              합리적인 요금제
            </h2>
            <p style={{ textAlign: 'center', color: '#718096', fontSize: 15, marginBottom: 48 }}>
              팀 규모에 맞게 선택하세요
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
              {plans.map(p => (
                <div key={p.name} style={{
                  background: '#fff', borderRadius: 16, padding: '32px 24px',
                  border: p.highlight ? `2px solid ${G}` : '1px solid #e2e8f0',
                  position: 'relative',
                }}>
                  {p.highlight && (
                    <div style={{
                      position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                      background: G, color: '#fff', fontSize: 11, fontWeight: 700,
                      padding: '4px 14px', borderRadius: 20, whiteSpace: 'nowrap',
                    }}>가장 인기</div>
                  )}
                  <div style={{ fontSize: 13, fontWeight: 700, color: p.color, marginBottom: 8 }}>{p.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: DARK }}>{p.price}</span>
                    <span style={{ fontSize: 13, color: '#a0aec0' }}>{p.period}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#a0aec0', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #f0f4f8' }}>
                    {p.limit}
                  </div>
                  {p.features.map(f => (
                    <div key={f} style={{ display: 'flex', gap: 8, marginBottom: 10, fontSize: 13, color: '#4a5568' }}>
                      <span style={{ color: G, flexShrink: 0 }}>✓</span>{f}
                    </div>
                  ))}
                  <Link href={p.to} style={{
                    display: 'block', textAlign: 'center', marginTop: 24,
                    padding: '12px 0', borderRadius: 10, fontWeight: 700, fontSize: 14,
                    background: p.highlight ? G : '#f7f9fc',
                    color: p.highlight ? '#fff' : DARK,
                    border: p.highlight ? 'none' : '1px solid #e2e8f0',
                    textDecoration: 'none',
                  }}>{p.cta}</Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ padding: '40px 24px', textAlign: 'center', borderTop: '1px solid #e8edf5' }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: DARK, marginBottom: 8 }}>ADVoost</div>
          <p style={{ fontSize: 12, color: '#a0aec0' }}>
            © 2026 ADVoost. 네이버 공식 서비스가 아닙니다. AI 예측 기반 참고용 서비스입니다.
          </p>
        </footer>
      </div>
    </AuthProvider>
  );
}
