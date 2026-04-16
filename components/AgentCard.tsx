"use client";

import { useState, useRef, useEffect } from "react";

type AgentType = "sns" | "news";

interface AgentConfig {
  id: AgentType;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  gradient: string;
  borderColor: string;
  buttonColor: string;
  badgeColor: string;
  endpoint: string;
  placeholder: string;
  defaultQuery: string;
}

const agentConfigs: Record<AgentType, AgentConfig> = {
  sns: {
    id: "sns",
    title: "SNS 트렌드 리서처",
    subtitle: "Agent 1",
    description: "최신 소셜 미디어 트렌드를 실시간으로 조사하고 분석합니다",
    icon: "📱",
    gradient: "from-violet-600 to-indigo-600",
    borderColor: "border-violet-500/30",
    buttonColor:
      "bg-violet-600 hover:bg-violet-500 focus:ring-violet-500 text-white",
    badgeColor: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    endpoint: "/api/agent-sns",
    placeholder: "예: 오늘 인스타그램 트렌드 조사해줘",
    defaultQuery: "오늘 날짜 기준 최신 SNS 트렌드를 조사하고 분석해주세요.",
  },
  news: {
    id: "news",
    title: "AI 마케팅 뉴스 분석가",
    subtitle: "Agent 2",
    description: "AI 마케팅 관련 최신 뉴스를 수집하고 심층 분석합니다",
    icon: "🤖",
    gradient: "from-emerald-600 to-teal-600",
    borderColor: "border-emerald-500/30",
    buttonColor:
      "bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-500 text-white",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    endpoint: "/api/agent-news",
    placeholder: "예: 생성형 AI 광고 최신 트렌드 분석해줘",
    defaultQuery:
      "최신 AI 마케팅 뉴스와 트렌드를 수집하고 분석해주세요.",
  },
};

interface StreamEvent {
  type: string;
  content?: string;
  name?: string;
  message?: string;
}

export default function AgentCard({ agentType }: { agentType: AgentType }) {
  const config = agentConfigs[agentType];
  const [query, setQuery] = useState("");
  const [output, setOutput] = useState("");
  const [thinking, setThinking] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "thinking" | "searching" | "writing" | "done" | "error"
  >("idle");
  const [searchCount, setSearchCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showThinking, setShowThinking] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const outputRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const handleRun = async () => {
    if (isRunning) {
      abortRef.current?.abort();
      setIsRunning(false);
      setStatus("idle");
      return;
    }

    setIsRunning(true);
    setStatus("thinking");
    setOutput("");
    setThinking("");
    setSearchCount(0);
    setErrorMsg("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(config.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query || config.defaultQuery }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "요청 실패");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          try {
            const event: StreamEvent = JSON.parse(raw);
            handleEvent(event);
          } catch {
            // skip malformed
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setErrorMsg((err as Error).message);
      setStatus("error");
    } finally {
      setIsRunning(false);
      if (status !== "error") {
        setLastUpdated(new Date());
        setStatus("done");
      }
    }
  };

  const handleEvent = (event: StreamEvent) => {
    switch (event.type) {
      case "thinking_start":
        setStatus("thinking");
        break;
      case "thinking":
        setThinking((prev) => prev + (event.content || ""));
        break;
      case "tool_start":
        setStatus("searching");
        setSearchCount((prev) => prev + 1);
        break;
      case "text_start":
        setStatus("writing");
        break;
      case "text":
        setOutput((prev) => prev + (event.content || ""));
        break;
      case "done":
        setStatus("done");
        setLastUpdated(new Date());
        setIsRunning(false);
        break;
      case "error":
        setErrorMsg(event.message || "오류가 발생했습니다");
        setStatus("error");
        setIsRunning(false);
        break;
    }
  };

  const statusLabels = {
    idle: { label: "대기 중", color: "text-gray-500", dot: "bg-gray-500" },
    thinking: {
      label: "분석 중...",
      color: "text-amber-400",
      dot: "bg-amber-400 animate-pulse",
    },
    searching: {
      label: `웹 검색 중 (${searchCount}회)`,
      color: "text-sky-400",
      dot: "bg-sky-400 animate-pulse",
    },
    writing: {
      label: "리포트 작성 중...",
      color: "text-violet-400",
      dot: "bg-violet-400 animate-pulse",
    },
    done: { label: "완료", color: "text-emerald-400", dot: "bg-emerald-400" },
    error: { label: "오류 발생", color: "text-red-400", dot: "bg-red-400" },
  };

  const currentStatus = statusLabels[status];

  return (
    <div
      className={`agent-card ${config.borderColor} flex flex-col h-full min-h-[600px]`}
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${config.gradient} p-5`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{config.icon}</span>
            <div>
              <span
                className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium mb-1 ${config.badgeColor}`}
              >
                {config.subtitle}
              </span>
              <h2 className="text-lg font-bold text-white">{config.title}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={`status-dot ${currentStatus.dot}`} />
            <span className={currentStatus.color}>{currentStatus.label}</span>
          </div>
        </div>
        <p className="mt-2 text-sm text-white/70">{config.description}</p>
      </div>

      {/* Controls */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isRunning && handleRun()}
            placeholder={config.placeholder}
            disabled={isRunning}
            className="flex-1 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:opacity-50"
          />
          <button
            onClick={handleRun}
            className={`btn-primary ${config.buttonColor}`}
          >
            {isRunning ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                중지
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
                </svg>
                실행
              </>
            )}
          </button>
        </div>

        {/* Stats bar */}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            {searchCount > 0 && (
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                웹 검색 {searchCount}회
              </span>
            )}
          </div>
          {lastUpdated && (
            <span>
              마지막 업데이트:{" "}
              {lastUpdated.toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      </div>

      {/* Thinking toggle */}
      {thinking && (
        <div className="px-4 pt-3">
          <button
            onClick={() => setShowThinking(!showThinking)}
            className="flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            사고 과정 {showThinking ? "숨기기" : "보기"}
          </button>
          {showThinking && (
            <div className="mt-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/60 font-mono leading-relaxed max-h-40 overflow-y-auto scrollbar-thin">
              {thinking}
            </div>
          )}
        </div>
      )}

      {/* Output area */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto scrollbar-thin p-4"
      >
        {status === "idle" && !output && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
            <div className={`text-5xl opacity-20`}>{config.icon}</div>
            <div>
              <p className="text-gray-500 text-sm">
                실행 버튼을 눌러 에이전트를 시작하세요
              </p>
              <p className="text-gray-600 text-xs mt-1">
                웹을 검색하여 최신 정보를 수집합니다
              </p>
            </div>
          </div>
        )}

        {status === "thinking" && !output && (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
            <div className="relative">
              <div
                className={`h-12 w-12 rounded-full bg-gradient-to-r ${config.gradient} animate-pulse`}
              />
              <div className="absolute inset-0 flex items-center justify-center text-2xl">
                {config.icon}
              </div>
            </div>
            <p className="text-amber-400 text-sm animate-pulse">
              에이전트가 분석 중입니다...
            </p>
          </div>
        )}

        {status === "searching" && !output && (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-2 w-2 rounded-full bg-sky-500 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <p className="text-sky-400 text-sm">
              웹에서 정보 수집 중... ({searchCount}회 검색)
            </p>
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

        {output && (
          <div className="output-content whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
            {output}
            {isRunning && status === "writing" && (
              <span className="inline-block w-0.5 h-4 bg-gray-400 animate-pulse ml-0.5" />
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {status === "done" && output && (
        <div className="border-t border-gray-800 px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-emerald-400 flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            분석 완료
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(output);
            }}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            복사
          </button>
        </div>
      )}
    </div>
  );
}
