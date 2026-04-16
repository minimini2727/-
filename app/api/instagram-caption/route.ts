import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const runtime = "nodejs";
export const maxDuration = 60;

const TONE_LABELS: Record<string, string> = {
  casual: "감성적·일상적",
  fun: "유머·트렌디",
  inspirational: "동기부여·감동적",
  professional: "전문적·정보적",
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  daily: "일상 기록",
  food: "음식·카페",
  travel: "여행",
  product: "제품·브랜드",
  event: "이벤트·공지",
  fashion: "패션·뷰티",
};

export async function POST(request: NextRequest) {
  try {
    const { keyword, tone, contentType } = await request.json();

    if (!keyword?.trim()) {
      return Response.json({ error: "키워드를 입력해주세요" }, { status: 400 });
    }

    const toneLabel = TONE_LABELS[tone] ?? "감성적·일상적";
    const contentTypeLabel = CONTENT_TYPE_LABELS[contentType] ?? "일상 기록";

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: object) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          const messageStream = await client.messages.stream({
            model: "claude-sonnet-4-6",
            max_tokens: 2000,
            system: `당신은 인스타그램 콘텐츠 전문 카피라이터입니다.
주어진 키워드나 제목을 바탕으로 인스타그램에 최적화된 캡션을 3가지 생성합니다.

**캡션 작성 원칙:**
- 이모지를 자연스럽게 활용하여 시각적 매력 극대화
- 줄바꿈으로 가독성 높이기
- 팔로워 공감·교감을 유도하는 문구 포함
- 마지막에 행동 유도(CTA) 또는 질문으로 마무리
- 인기 해시태그 + 니치 해시태그 15-20개 혼합 구성

**출력 형식 — 아래 구분자를 정확히 사용하세요:**

---CAPTION_1---
(캡션 본문: 이모지·줄바꿈 포함)

(해시태그 줄)
---END_1---

---CAPTION_2---
(캡션 본문: 이모지·줄바꿈 포함)

(해시태그 줄)
---END_2---

---CAPTION_3---
(캡션 본문: 이모지·줄바꿈 포함)

(해시태그 줄)
---END_3---`,
            messages: [
              {
                role: "user",
                content: `키워드/제목: ${keyword}
톤: ${toneLabel}
콘텐츠 유형: ${contentTypeLabel}

위 정보를 바탕으로 인스타그램 캡션 3가지를 생성해주세요.`,
              },
            ],
          });

          for await (const event of messageStream) {
            if (event.type === "content_block_start") {
              if (event.content_block.type === "text") {
                send({ type: "text_start" });
              }
            } else if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                send({ type: "text", content: event.delta.text });
              }
            } else if (event.type === "message_stop") {
              send({ type: "done" });
            }
          }

          controller.close();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          send({ type: "error", message });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
