'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/apiClient';
import { SafeUser } from '@/lib/db';

type AuthContextType = {
  user: SafeUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<SafeUser>;
  register: (name: string, email: string, password: string) => Promise<SafeUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('advoost_token');
    if (!token) { setLoading(false); return; }
    api.get<{ user: SafeUser }>('/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => localStorage.removeItem('advoost_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<SafeUser> => {
    const { token, user } = await api.post<{ token: string; user: SafeUser }>('/auth/login', { email, password });
    localStorage.setItem('advoost_token', token);
    setUser(user);
    return user;
  };

  const register = async (name: string, email: string, password: string): Promise<SafeUser> => {
    const { token, user } = await api.post<{ token: string; user: SafeUser }>('/auth/register', { name, email, password });
    localStorage.setItem('advoost_token', token);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('advoost_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
