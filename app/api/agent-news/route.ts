import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    const userQuery =
      query || "최신 AI 마케팅 뉴스와 트렌드를 수집하고 분석해주세요.";

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const send = (data: object) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
            );
          };

          const messageStream = await client.messages.stream({
            model: "claude-opus-4-6",
            max_tokens: 8000,
            thinking: { type: "adaptive" },
            tools: [
              {
                type: "web_search_20260209",
                name: "web_search",
                max_uses: 5,
              } as Anthropic.Messages.WebSearchTool20260209,
            ],
            system: `당신은 AI 마케팅 뉴스 전문 분석가입니다.
마케터들을 위해 최신 AI 관련 마케팅 뉴스를 수집하고 심층 분석합니다.

다음 카테고리의 뉴스를 조사하고 분석하세요:
- AI 마케팅 도구 및 플랫폼 출시/업데이트
- 생성형 AI를 활용한 마케팅 캠페인 사례
- AI 광고 기술 (타겟팅, 개인화, 자동화)
- 주요 브랜드의 AI 마케팅 전략
- AI 콘텐츠 생성 트렌드
- 마케팅 AI 규제 및 윤리 이슈
- 국내외 AI 마케팅 성공/실패 사례

분석 결과는 다음 형식으로 제공하세요:
1. 📰 오늘의 주요 AI 마케팅 뉴스 (5-7개)
2. 🔍 심층 분석: 가장 중요한 뉴스 2-3개 상세 분석
3. 📈 AI 마케팅 시장 동향
4. ⚡ 마케터가 즉시 활용할 수 있는 AI 도구/기법
5. 🚨 주의사항: 리스크 및 윤리적 고려사항
6. 🔮 다음 주 예상 트렌드

각 뉴스에는 출처와 날짜를 명시하고, 마케터 관점에서의 실질적인 인사이트를 제공하세요.
한국 시장 관련 뉴스가 있다면 특별히 강조해주세요.`,
            messages: [
              {
                role: "user",
                content: userQuery,
              },
            ],
          });

          for await (const event of messageStream) {
            if (event.type === "content_block_start") {
              if (event.content_block.type === "thinking") {
                send({ type: "thinking_start" });
              } else if (event.content_block.type === "text") {
                send({ type: "text_start" });
              } else if (event.content_block.type === "tool_use") {
                send({
                  type: "tool_start",
                  name: event.content_block.name,
                });
              }
            } else if (event.type === "content_block_delta") {
              if (event.delta.type === "thinking_delta") {
                send({ type: "thinking", content: event.delta.thinking });
              } else if (event.delta.type === "text_delta") {
                send({ type: "text", content: event.delta.text });
              } else if (event.delta.type === "input_json_delta") {
                send({ type: "tool_input", content: event.delta.partial_json });
              }
            } else if (event.type === "content_block_stop") {
              send({ type: "block_stop" });
            } else if (event.type === "message_stop") {
              send({ type: "done" });
            }
          }

          controller.close();
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message: errorMessage })}\n\n`
            )
          );
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
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
