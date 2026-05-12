import { NextRequest, NextResponse } from 'next/server';
import { getDB, initDB, SafeUser, User } from '@/lib/db';
import { authenticate } from '@/lib/auth';

function safeUser(u: User): SafeUser {
  const { password_hash, ...rest } = u;
  return rest;
}

export async function GET(req: NextRequest) {
  try {
    initDB();
    const payload = authenticate(req);
    const db = getDB();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.userId) as User | undefined;
    if (!user) return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    return NextResponse.json({ user: safeUser(user) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '서버 오류가 발생했습니다.' }, { status: err.status || 500 });
  }
}
