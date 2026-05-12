import { NextRequest, NextResponse } from 'next/server';
import { getDB, initDB, getYearMonth, User } from '@/lib/db';
import { authenticate } from '@/lib/auth';

const SYSTEM_PROMPT = `당신은 2026년형 네이버 검색광고(SA) AI 엔진 'ADVoost'를 완벽 시뮬레이션하는 퍼포먼스 마케팅 전문가입니다.

# ADVoost 2026 엔진 로직 (4대 핵심 지표)
1. 광고 연관지수 (Ad Relevance): 키워드 ↔ 소재 ↔ 랜딩페이지 시맨틱 유사도. 핵심어 밀도, 의미적 일관성, 검색 의도 부합 여부.
2. 클릭 기대지수 (pCTR): 검색 의도 대비 소재 매력도. 제목 가독성(15자 이내 권장), CTA 명확성, 혜택 가시성, 감성 트리거.
3. 랜딩 경험지수 (LP Quality): 정보 완결성, 키워드 연속성, 모바일 UX, 전환 흐름, 약속-이행 일치 여부.
4. 콘텐츠 신선도 (Freshness): 2026년 최신 트렌드 반영, 차별화 요소, 시즌성.

# 채점 기준 (1~10점)
9~10: 최상위 노출 (상위 3%) | 7~8: 경쟁력 있음 (상위 15%) | 5~6: 평균 (개선 필요) | 3~4: 취약 | 1~2: 전면 재검토

반드시 아래 JSON만 출력하세요. 백틱·마크다운·설명 없이 순수 JSON:
{"adRelevance":{"score":0,"grade":"상|중상|중|중하|하","summary":"30자이내","details":["근거1","근거2","근거3"]},"pCTR":{"score":0,"grade":"상|중상|중|중하|하","summary":"30자이내","details":["근거1","근거2","근거3"]},"lpQuality":{"score":0,"grade":"상|중상|중|중하|하","summary":"30자이내","details":["근거1","근거2","근거3"]},"freshness":{"score":0,"grade":"상|중상|중|중하|하","summary":"30자이내","details":["근거1","근거2","근거3"]},"overallScore":0.0,"rankingGrade":"상위 N% 예상","estimatedCTR":"N.N%","competitiveLevel":"매우 높음|높음|보통|낮음|매우 낮음","optimizationGuide":[{"priority":1,"title":"제목","problem":"문제점","action":"실행방법","expectedEffect":"기대효과","impact":"높음|중간|낮음"},{"priority":2,"title":"제목","problem":"문제점","action":"실행방법","expectedEffect":"기대효과","impact":"높음|중간|낮음"},{"priority":3,"title":"제목","problem":"문제점","action":"실행방법","expectedEffect":"기대효과","impact":"높음|중간|낮음"}]}`;

function extractJSON(str: string): string {
  const start = str.indexOf('{');
  if (start === -1) throw new Error('JSON 시작점 없음');
  let depth = 0, inStr = false, escape = false;
  for (let i = start; i < str.length; i++) {
    const ch = str[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inStr) { escape = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{') depth++;
    if (ch === '}') { depth--; if (depth === 0) return str.slice(start, i + 1); }
  }
  throw new Error('JSON이 완전하지 않습니다');
}

// POST /api/analyze — run analysis
export async function POST(req: NextRequest) {
  try {
    initDB();
    const payload = authenticate(req);
    const { keyword, adTitle, adDesc, landingContent } = await req.json();

    if (!keyword || !adTitle || !adDesc || !landingContent)
      return NextResponse.json({ error: '모든 항목을 입력해주세요.' }, { status: 400 });

    const db = getDB();
    const user = db.prepare('SELECT plan, monthly_limit FROM users WHERE id = ?').get(payload.userId) as Pick<User, 'plan' | 'monthly_limit'>;
    const yearMonth = getYearMonth();
    const usage = db.prepare('SELECT count FROM monthly_usage WHERE user_id = ? AND year_month = ?')
      .get(payload.userId, yearMonth) as { count: number } | undefined;
    const used = usage?.count || 0;

    if (user.plan === 'free' && used >= user.monthly_limit) {
      return NextResponse.json({
        error: `무료 플랜 월 ${user.monthly_limit}회 한도 초과. Pro 플랜으로 업그레이드하세요.`,
        code: 'QUOTA_EXCEEDED',
      }, { status: 429 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('서버 설정 오류: ANTHROPIC_API_KEY 없음');

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `분석 대상:\n- 키워드: ${keyword}\n- 광고 제목: ${adTitle}\n- 광고 설명: ${adDesc}\n- 랜딩 페이지: ${landingContent}\n\n순수 JSON만 출력하세요.`,
        }],
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.json().catch(() => ({})) as any;
      throw new Error('Claude API 오류: ' + (err.error?.message || claudeRes.status));
    }

    const claudeData = await claudeRes.json() as any;
    const raw = claudeData.content.map((b: any) => b.type === 'text' ? b.text : '').join('');
    const result = JSON.parse(extractJSON(raw));

    const tx = db.transaction(() => {
      db.prepare(`
        INSERT INTO analyses (user_id, keyword, ad_title, ad_desc, landing_content, overall_score, result_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(payload.userId, keyword, adTitle, adDesc, landingContent, result.overallScore, JSON.stringify(result));

      db.prepare(`
        INSERT INTO monthly_usage (user_id, year_month, count) VALUES (?, ?, 1)
        ON CONFLICT(user_id, year_month) DO UPDATE SET count = count + 1
      `).run(payload.userId, yearMonth);
    });
    tx();

    return NextResponse.json({
      result,
      usage: { used: used + 1, limit: user.monthly_limit, plan: user.plan },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '서버 오류가 발생했습니다.', code: err.code }, { status: err.status || 500 });
  }
}

// GET /api/analyze — history list
export async function GET(req: NextRequest) {
  try {
    initDB();
    const payload = authenticate(req);
    const db = getDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = 10;
    const offset = (page - 1) * limit;

    const total = (db.prepare('SELECT COUNT(*) as n FROM analyses WHERE user_id = ?').get(payload.userId) as { n: number }).n;
    const items = db.prepare(`
      SELECT id, keyword, ad_title, ad_desc, overall_score, created_at
      FROM analyses WHERE user_id = ?
      ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(payload.userId, limit, offset);

    return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '서버 오류가 발생했습니다.' }, { status: err.status || 500 });
  }
}
