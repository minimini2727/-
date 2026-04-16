import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "마케팅 AI 에이전트 플랫폼",
  description:
    "SNS 트렌드 리서처와 AI 마케팅 뉴스 분석가 두 에이전트가 실시간으로 마케팅 인사이트를 제공합니다.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
