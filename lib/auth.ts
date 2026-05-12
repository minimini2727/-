import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const JWT_EXPIRES = '7d';

export type JWTPayload = { userId: number; email: string };

export function signToken(userId: number, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

export function authenticate(req: NextRequest): JWTPayload {
  const token = getTokenFromRequest(req);
  if (!token) throw Object.assign(new Error('인증이 필요합니다.'), { status: 401 });
  try {
    return verifyToken(token);
  } catch {
    throw Object.assign(new Error('토큰이 만료되었거나 유효하지 않습니다.'), { status: 401 });
  }
}
