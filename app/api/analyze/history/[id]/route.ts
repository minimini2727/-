import { NextRequest, NextResponse } from 'next/server';
import { getDB, initDB, Analysis } from '@/lib/db';
import { authenticate } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    initDB();
    const payload = authenticate(req);
    const db = getDB();
    const row = db.prepare('SELECT * FROM analyses WHERE id = ? AND user_id = ?')
      .get(Number(params.id), payload.userId) as Analysis | undefined;
    if (!row) return NextResponse.json({ error: '분석 결과를 찾을 수 없습니다.' }, { status: 404 });
    return NextResponse.json({ ...row, result: JSON.parse(row.result_json) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '서버 오류가 발생했습니다.' }, { status: err.status || 500 });
  }
}
