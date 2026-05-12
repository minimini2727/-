import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ADVoost — 네이버 SA AI 엔진 시뮬레이터",
  description:
    "광고 키워드·소재·랜딩페이지를 입력하면 ADVoost 엔진이 4대 핵심 지표(광고 연관지수·클릭 기대지수·랜딩 경험지수·콘텐츠 신선도)를 즉시 분석합니다.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className} style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
