'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/context/AuthContext';

const G = '#03C75A';

function RegisterForm() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      router.push('/analyze');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f9fc' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 20, padding: '40px 36px', border: '1px solid #e8edf5' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24, textDecoration: 'none' }}>
            <div style={{ background: '#1a2035', color: G, fontWeight: 800, fontSize: 10, padding: '3px 7px', borderRadius: 5 }}>NAVER</div>
            <span style={{ fontWeight: 800, fontSize: 18, color: '#1a2035' }}>ADVoost</span>
          </Link>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a2035', marginBottom: 6 }}>무료 계정 만들기</h1>
          <p style={{ fontSize: 14, color: '#718096' }}>신용카드 없이 월 10회 무료 제공</p>
        </div>

        <form onSubmit={submit}>
          {([
            { label: '이름', key: 'name' as const, type: 'text', placeholder: '홍길동' },
            { label: '이메일', key: 'email' as const, type: 'email', placeholder: 'you@example.com' },
            { label: '비밀번호 (8자 이상)', key: 'password' as const, type: 'password', placeholder: '••••••••' },
          ]).map(({ label, key, type, placeholder }) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#2d3748', display: 'block', marginBottom: 6 }}>{label}</label>
              <input
                type={type} value={form[key]} onChange={set(key)}
                placeholder={placeholder} required
                style={{
                  width: '100%', padding: '11px 14px', fontSize: 14,
                  border: '1.5px solid #e2e8f0', borderRadius: 10, background: '#fafbfc',
                  outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => (e.target.style.borderColor = G)}
                onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>
          ))}

          {error && (
            <div style={{ padding: '10px 14px', background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 8, fontSize: 13, color: '#cf1322', marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '13px', fontSize: 15, fontWeight: 700,
            background: loading ? '#e2e8f0' : G, color: loading ? '#a0aec0' : '#fff',
            border: 'none', borderRadius: 10, marginTop: 8, cursor: loading ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {loading
              ? <><div style={{ width: 18, height: 18, border: '2px solid #a0aec0', borderTopColor: G, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> 가입 중...</>
              : '무료로 시작하기 →'}
          </button>
        </form>

        <p style={{ fontSize: 11, color: '#a0aec0', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
          가입하면 서비스 이용약관에 동의한 것으로 간주됩니다.
        </p>
        <p style={{ textAlign: 'center', fontSize: 13, color: '#718096', marginTop: 16 }}>
          이미 계정이 있으신가요?{' '}
          <Link href="/login" style={{ color: G, fontWeight: 700 }}>로그인</Link>
        </p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function RegisterPage() {
  return <AuthProvider><RegisterForm /></AuthProvider>;
}
