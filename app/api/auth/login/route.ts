import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDB, initDB, SafeUser, User } from '@/lib/db';
import { signToken } from '@/lib/auth';

function safeUser(u: User): SafeUser {
  const { password_hash, ...rest } = u;
  return rest;
}

export async function POST(req: NextRequest) {
  try {
    initDB();
    const { email, password } = await req.json();

    if (!email || !password)
      return NextResponse.json({ error: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 });

    const db = getDB();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return NextResponse.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });

    return NextResponse.json({ token: signToken(user.id, user.email), user: safeUser(user) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
