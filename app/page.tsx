"use client";

import AgentCard from "@/components/AgentCard";
import { useState, useEffect } from "react";

export default function Home() {
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setCurrentDate(
        now.toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "long",
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-900/30">
                <span className="text-lg">⚡</span>
              </div>
              <div>
                <h1 className="text-base font-bold text-white leading-tight">
                  마케팅 AI 에이전트
                </h1>
                <p className="text-xs text-gray-500">Marketing Intelligence Platform</p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs text-gray-500">{currentDate}</p>
                <p className="text-sm font-mono text-gray-300">{currentTime}</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400 font-medium">
                  에이전트 2개 준비됨
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <div className="border-b border-gray-800/50 bg-gradient-to-b from-gray-900 to-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs text-violet-400 font-medium mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
              Claude Opus 4.6 + 실시간 웹 검색 탑재
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              마케터를 위한{" "}
              <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
                AI 인텔리전스
              </span>
            </h2>
            <p className="text-gray-400 text-base max-w-2xl mx-auto">
              두 전문 AI 에이전트가 실시간으로 SNS 트렌드와 AI 마케팅 뉴스를
              수집·분석하여 즉시 활용 가능한 인사이트를 제공합니다.
            </p>
          </div>

          {/* Feature pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {[
              { icon: "🔍", label: "실시간 웹 검색" },
              { icon: "🧠", label: "딥 리서치 분석" },
              { icon: "📊", label: "마케팅 인사이트" },
              { icon: "🌐", label: "글로벌 + 국내 트렌드" },
              { icon: "⚡", label: "스트리밍 응답" },
            ].map((feat) => (
              <div
                key={feat.label}
                className="flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800/50 px-4 py-2 text-sm text-gray-300"
              >
                <span>{feat.icon}</span>
                <span>{feat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent cards grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AgentCard agentType="sns" />
          <AgentCard agentType="news" />
        </div>

        {/* Setup guide */}
        <div className="mt-8 rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <span>🚀</span>
            시작 가이드
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                  1
                </span>
                <span className="text-sm font-medium text-white">API 키 설정</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                <code className="rounded bg-gray-700 px-1.5 py-0.5 text-gray-300">
                  .env.local
                </code>{" "}
                파일에{" "}
                <code className="rounded bg-gray-700 px-1.5 py-0.5 text-gray-300">
                  ANTHROPIC_API_KEY
                </code>
                를 설정하세요
              </p>
            </div>
            <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                  2
                </span>
                <span className="text-sm font-medium text-white">에이전트 선택</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                SNS 트렌드 또는 AI 뉴스 에이전트를 선택하고 분석하고 싶은 주제를
                입력하세요
              </p>
            </div>
            <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                  3
                </span>
                <span className="text-sm font-medium text-white">인사이트 활용</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                실시간으로 생성되는 분석 리포트를 복사하여 마케팅 전략에 즉시 활용하세요
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-600">
              Powered by{" "}
              <span className="text-gray-500">Claude Opus 4.6</span> &{" "}
              <span className="text-gray-500">Web Search</span>
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span>🔒 API 키는 서버에서만 처리됩니다</span>
              <span>⚡ 실시간 스트리밍</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
