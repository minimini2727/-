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

    const userQuery = query || "오늘 날짜의 최신 SNS 트렌드를 조사해주세요.";

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const send = (data: object) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
            );
          };

          // Use streaming with web search tool
          const messageStream = await client.messages.stream({
            model: "claude-opus-4-6",
            max_tokens: 8000,
            thinking: { type: "adaptive" } as any,
            tools: [
              {
                type: "web_search_20260209",
                name: "web_search",
                max_uses: 5,
              } as any,
            ],
            system: `당신은 최신 SNS(소셜 미디어) 트렌드 전문 리서처입니다.
마케터들을 위해 매일 최신 SNS 트렌드를 조사하고 분석합니다.

다음 플랫폼들의 트렌드를 조사하세요:
- Instagram (릴스, 스토리, 피드 트렌드)
- TikTok (바이럴 콘텐츠, 챌린지, 해시태그)
- YouTube (Shorts, 인기 주제)
- X(Twitter) (트렌딩 토픽, 밈)
- LinkedIn (B2B 트렌드, 업계 이슈)
- 네이버 블로그/카페, 카카오스토리 (한국 특화)

분석 결과는 다음 형식으로 제공하세요:
1. 📊 오늘의 핵심 트렌드 요약 (3-5개)
2. 🔥 플랫폼별 트렌딩 콘텐츠
3. 💡 마케터를 위한 활용 인사이트
4. 📅 내일 예상 트렌드
5. 🎯 추천 콘텐츠 아이디어

오늘 날짜를 기준으로 실시간 정보를 검색하여 최신 트렌드를 파악하세요.`,
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
