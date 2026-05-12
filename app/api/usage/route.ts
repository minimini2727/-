import { NextRequest, NextResponse } from 'next/server';
import { getDB, initDB, getYearMonth, User } from '@/lib/db';
import { authenticate } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    initDB();
    const payload = authenticate(req);
    const db = getDB();
    const yearMonth = getYearMonth();

    const user = db.prepare('SELECT id, email, name, plan, monthly_limit FROM users WHERE id = ?').get(payload.userId) as Pick<User, 'id' | 'email' | 'name' | 'plan' | 'monthly_limit'>;
    const usage = db.prepare('SELECT count FROM monthly_usage WHERE user_id = ? AND year_month = ?')
      .get(payload.userId, yearMonth) as { count: number } | undefined;
    const totalAnalyses = (db.prepare('SELECT COUNT(*) as n FROM analyses WHERE user_id = ?').get(payload.userId) as { n: number }).n;
    const avgScore = (db.prepare('SELECT AVG(overall_score) as avg FROM analyses WHERE user_id = ?').get(payload.userId) as { avg: number | null }).avg;
    const recentScores = db.prepare(`
      SELECT overall_score, created_at FROM analyses
      WHERE user_id = ? ORDER BY created_at DESC LIMIT 6
    `).all(payload.userId);

    return NextResponse.json({
      user,
      currentMonth: { used: usage?.count || 0, limit: user.monthly_limit, yearMonth },
      stats: {
        totalAnalyses,
        avgScore: avgScore ? Math.round(avgScore * 10) / 10 : null,
        recentScores,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '서버 오류가 발생했습니다.' }, { status: err.status || 500 });
  }
}
