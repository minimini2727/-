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
    const { email, password, name } = await req.json();

    if (!email || !password || !name)
      return NextResponse.json({ error: '이름, 이메일, 비밀번호를 모두 입력해주세요.' }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ error: '올바른 이메일 형식이 아닙니다.' }, { status: 400 });
    if (password.length < 8)
      return NextResponse.json({ error: '비밀번호는 8자 이상이어야 합니다.' }, { status: 400 });

    const db = getDB();
    if (db.prepare('SELECT id FROM users WHERE email = ?').get(email))
      return NextResponse.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 409 });

    const hash = await bcrypt.hash(password, 12);
    const { lastInsertRowid } = db
      .prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)')
      .run(email, hash, name);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(lastInsertRowid)) as User;
    return NextResponse.json({ token: signToken(user.id, user.email), user: safeUser(user) }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
