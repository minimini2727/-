'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const G = '#03C75A';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => { logout(); router.push('/'); };

  const NavLink = ({ to, label }: { to: string; label: string }) => (
    <Link href={to} style={{
      fontSize: 14, fontWeight: 500,
      color: pathname === to ? G : '#4a5568',
      padding: '4px 2px',
      borderBottom: pathname === to ? `2px solid ${G}` : '2px solid transparent',
    }}>{label}</Link>
  );

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: '#fff', borderBottom: '1px solid #e8edf5',
      display: 'flex', alignItems: 'center', padding: '0 24px', height: 60,
    }}>
      <Link href={user ? '/analyze' : '/'} style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 32, textDecoration: 'none' }}>
        <div style={{
          background: '#1a2035', color: G, fontWeight: 800,
          fontSize: 10, padding: '3px 7px', borderRadius: 5, letterSpacing: 1,
        }}>NAVER</div>
        <span style={{ fontWeight: 800, fontSize: 16, color: '#1a2035' }}>ADVoost</span>
      </Link>

      {user && (
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <NavLink to="/analyze" label="광고 분석" />
          <NavLink to="/dashboard" label="대시보드" />
        </div>
      )}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        {user ? (
          <>
            <span style={{ fontSize: 13, color: '#718096' }}>
              {user.name} · <span style={{ color: G, fontWeight: 600 }}>{user.plan.toUpperCase()}</span>
            </span>
            <button onClick={handleLogout} style={{
              fontSize: 13, padding: '6px 14px', borderRadius: 8,
              border: '1px solid #e2e8f0', background: '#fff', color: '#4a5568', cursor: 'pointer',
            }}>로그아웃</button>
          </>
        ) : (
          <>
            <Link href="/login" style={{ fontSize: 14, color: '#4a5568', fontWeight: 500, textDecoration: 'none' }}>로그인</Link>
            <Link href="/register" style={{
              fontSize: 14, fontWeight: 700, padding: '8px 18px',
              background: G, color: '#fff', borderRadius: 8, textDecoration: 'none',
            }}>무료로 시작</Link>
          </>
        )}
      </div>
    </nav>
  );
}
