'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/context/AuthContext';

const G = '#03C75A';

function LoginForm() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      router.push('/analyze');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f9fc' }}>
      <div style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 20, padding: '40px 36px', border: '1px solid #e8edf5' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24, textDecoration: 'none' }}>
            <div style={{ background: '#1a2035', color: G, fontWeight: 800, fontSize: 10, padding: '3px 7px', borderRadius: 5 }}>NAVER</div>
            <span style={{ fontWeight: 800, fontSize: 18, color: '#1a2035' }}>ADVoost</span>
          </Link>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a2035', marginBottom: 6 }}>로그인</h1>
          <p style={{ fontSize: 14, color: '#718096' }}>계속하려면 로그인하세요</p>
        </div>

        <form onSubmit={submit}>
          {([
            { label: '이메일', key: 'email' as const, type: 'email', placeholder: 'you@example.com' },
            { label: '비밀번호', key: 'password' as const, type: 'password', placeholder: '••••••••' },
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
              ? <><div style={{ width: 18, height: 18, border: '2px solid #a0aec0', borderTopColor: G, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> 로그인 중...</>
              : '로그인'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#718096', marginTop: 24 }}>
          계정이 없으신가요?{' '}
          <Link href="/register" style={{ color: G, fontWeight: 700 }}>무료로 시작</Link>
        </p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function LoginPage() {
  return <AuthProvider><LoginForm /></AuthProvider>;
}
