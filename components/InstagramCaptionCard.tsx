"use client";

import { useState, useRef } from "react";

const TONES = [
  { value: "casual", label: "감성적", emoji: "🌸" },
  { value: "fun", label: "유머·트렌디", emoji: "😄" },
  { value: "inspirational", label: "동기부여", emoji: "✨" },
  { value: "professional", label: "정보·전문", emoji: "📊" },
];

const CONTENT_TYPES = [
  { value: "daily", label: "일상", emoji: "☀️" },
  { value: "food", label: "음식·카페", emoji: "☕" },
  { value: "travel", label: "여행", emoji: "✈️" },
  { value: "product", label: "제품·브랜드", emoji: "🛍️" },
  { value: "event", label: "이벤트", emoji: "🎉" },
  { value: "fashion", label: "패션·뷰티", emoji: "👗" },
];

interface ParsedCaption {
  id: number;
  content: string;
}

function parseCaptions(text: string): ParsedCaption[] {
  const captions: ParsedCaption[] = [];
  for (let i = 1; i <= 3; i++) {
    const start = text.indexOf(`---CAPTION_${i}---`);
    const end = text.indexOf(`---END_${i}---`);
    if (start !== -1 && end !== -1) {
      const content = text
        .slice(start + `---CAPTION_${i}---`.length, end)
        .trim();
      captions.push({ id: i, content });
    }
  }
  return captions;
}

export default function InstagramCaptionCard() {
  const [keyword, setKeyword] = useState("");
  const [tone, setTone] = useState("casual");
  const [contentType, setContentType] = useState("daily");
  const [rawOutput, setRawOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "generating" | "done" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerate = async () => {
    if (isRunning) {
      abortRef.current?.abort();
      setIsRunning(false);
      setStatus("idle");
      return;
    }
    if (!keyword.trim()) return;

    setIsRunning(true);
    setStatus("generating");
    setRawOutput("");
    setErrorMsg("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/instagram-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, tone, contentType }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "요청 실패");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalStatus: "done" | "error" = "done";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const event = JSON.parse(raw);
            if (event.type === "text") {
              setRawOutput((prev) => prev + (event.content as string));
            } else if (event.type === "done") {
              finalStatus = "done";
            } else if (event.type === "error") {
              setErrorMsg(event.message as string);
              finalStatus = "error";
            }
          } catch {
            // skip malformed
          }
        }
      }

      setStatus(finalStatus);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setErrorMsg((err as Error).message);
      setStatus("error");
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = async (content: string, id: number) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const captions = status === "done" ? parseCaptions(rawOutput) : [];

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📸</span>
            <div>
              <span className="inline-block rounded-full border border-pink-300/20 bg-pink-500/10 px-2 py-0.5 text-xs font-medium text-pink-200 mb-1">
                Agent 3
              </span>
              <h2 className="text-xl font-bold text-white">
                인스타그램 캡션 생성기
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {isRunning ? (
              <>
                <span className="h-2 w-2 rounded-full bg-pink-300 animate-pulse" />
                <span className="text-pink-200">생성 중...</span>
              </>
            ) : status === "done" ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-emerald-300">완료</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-white/30" />
                <span className="text-white/50">대기 중</span>
              </>
            )}
          </div>
        </div>
        <p className="mt-2 text-sm text-white/70">
          키워드나 제목을 입력하면 이모지와 해시태그가 포함된 캡션 3가지를
          즉시 생성합니다
        </p>
      </div>

      {/* Controls */}
      <div className="p-5 border-b border-gray-800 space-y-4">
        {/* Keyword input */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            키워드 또는 제목
          </label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && !isRunning && handleGenerate()
            }
            placeholder="예: 가을 카페, 신제품 출시, 제주도 여행"
            disabled={isRunning}
            className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:border-pink-500/50 focus:outline-none focus:ring-1 focus:ring-pink-500/50 disabled:opacity-50"
          />
        </div>

        {/* Tone selector */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            톤
          </label>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTone(t.value)}
                disabled={isRunning}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${
                  tone === t.value
                    ? "border-pink-500/50 bg-pink-500/15 text-pink-300"
                    : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                }`}
              >
                <span>{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content type selector */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            콘텐츠 유형
          </label>
          <div className="flex flex-wrap gap-2">
            {CONTENT_TYPES.map((ct) => (
              <button
                key={ct.value}
                onClick={() => setContentType(ct.value)}
                disabled={isRunning}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${
                  contentType === ct.value
                    ? "border-purple-500/50 bg-purple-500/15 text-purple-300"
                    : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                }`}
              >
                <span>{ct.emoji}</span>
                {ct.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!keyword.trim() && !isRunning}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:from-pink-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              생성 중지
            </>
          ) : (
            <>
              <span>✨</span>
              캡션 생성하기
            </>
          )}
        </button>
      </div>

      {/* Output area */}
      <div className="p-5">
        {status === "idle" && (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <span className="text-5xl opacity-20">📸</span>
            <p className="text-gray-500 text-sm">
              키워드를 입력하고 캡션을 생성하세요
            </p>
            <p className="text-gray-600 text-xs">
              이모지·본문·해시태그가 포함된 3가지 버전이 생성됩니다
            </p>
          </div>
        )}

        {status === "generating" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-pink-400">
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-pink-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </span>
              AI가 캡션을 작성하고 있습니다...
            </div>
            {rawOutput && (
              <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-4 text-xs text-gray-500 font-mono leading-relaxed max-h-48 overflow-y-auto scrollbar-thin whitespace-pre-wrap">
                {rawOutput}
                <span className="inline-block w-0.5 h-3 bg-pink-400 animate-pulse ml-0.5" />
              </div>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            <p className="font-semibold mb-1">오류가 발생했습니다</p>
            <p className="text-xs opacity-80">{errorMsg}</p>
            <p className="text-xs opacity-60 mt-2">
              ANTHROPIC_API_KEY 환경변수를 확인하세요
            </p>
          </div>
        )}

        {status === "done" && captions.length > 0 && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <svg
                className="h-3.5 w-3.5 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {captions.length}가지 캡션이 생성되었습니다. 복사해서 바로
              사용하세요!
            </p>
            {captions.map((caption, idx) => (
              <CaptionCard
                key={caption.id}
                caption={caption}
                index={idx + 1}
                isCopied={copiedId === caption.id}
                onCopy={() => handleCopy(caption.content, caption.id)}
              />
            ))}
          </div>
        )}

        {/* Fallback: parsing failed but we have output */}
        {status === "done" && captions.length === 0 && rawOutput && (
          <div className="rounded-xl border border-gray-700 bg-gray-800 p-4 text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
            {rawOutput}
          </div>
        )}
      </div>
    </div>
  );
}

function CaptionCard({
  caption,
  index,
  isCopied,
  onCopy,
}: {
  caption: ParsedCaption;
  index: number;
  isCopied: boolean;
  onCopy: () => void;
}) {
  const charCount = caption.content.length;

  // Split hashtags from main body
  const lines = caption.content.split("\n");
  const hashtagLineIdx = lines.findIndex((l) => l.trim().startsWith("#"));
  const mainContent =
    hashtagLineIdx !== -1
      ? lines.slice(0, hashtagLineIdx).join("\n").trim()
      : caption.content;
  const hashtags =
    hashtagLineIdx !== -1
      ? lines.slice(hashtagLineIdx).join("\n").trim()
      : "";

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800/60 overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700/50 bg-gray-800">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center h-5 w-5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-xs font-bold text-white">
            {index}
          </span>
          <span className="text-xs font-medium text-gray-400">
            캡션 옵션 {index}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs ${charCount > 2200 ? "text-red-400" : "text-gray-500"}`}
          >
            {charCount}자
          </span>
          <button
            onClick={onCopy}
            className="flex items-center gap-1.5 rounded-lg border border-gray-600 bg-gray-700 px-2.5 py-1 text-xs text-gray-300 hover:border-pink-500/50 hover:text-pink-300 transition-all"
          >
            {isCopied ? (
              <>
                <svg
                  className="h-3.5 w-3.5 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-emerald-400">복사됨</span>
              </>
            ) : (
              <>
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
                복사
              </>
            )}
          </button>
        </div>
      </div>

      {/* Caption body */}
      <div className="p-4 space-y-3">
        <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
          {mainContent}
        </p>
        {hashtags && (
          <p className="text-sm text-blue-400 leading-relaxed break-words">
            {hashtags}
          </p>
        )}
      </div>
    </div>
  );
}
