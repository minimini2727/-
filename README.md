# 마케팅 AI 에이전트 플랫폼

마케터를 위한 AI 기반 인텔리전스 플랫폼입니다. 두 전문 AI 에이전트가 실시간으로 SNS 트렌드와 AI 마케팅 뉴스를 수집·분석합니다.

## 에이전트 소개

### Agent 1: SNS 트렌드 리서처 📱
- Instagram, TikTok, YouTube, X(Twitter), LinkedIn 등 주요 SNS 플랫폼 트렌드 분석
- 한국 특화 플랫폼(네이버, 카카오) 트렌드 포함
- 마케터 관점의 콘텐츠 아이디어 제공

### Agent 2: AI 마케팅 뉴스 분석가 🤖
- 최신 AI 마케팅 도구, 캠페인 사례, 업계 뉴스 수집
- 심층 분석 및 마케터 실용 인사이트 제공
- 리스크 및 윤리 이슈 포함

## 기술 스택

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **AI**: Anthropic Claude Opus 4.6 + Web Search Tool
- **Streaming**: Server-Sent Events (SSE)

## 시작하기

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일 생성:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어보세요.

## 주요 기능

- **실시간 스트리밍**: 에이전트 분석 결과가 실시간으로 스트리밍됩니다
- **웹 검색 통합**: Claude가 실시간으로 웹을 검색하여 최신 정보를 수집합니다
- **사고 과정 확인**: 에이전트의 추론 과정을 투명하게 확인할 수 있습니다
- **커스텀 쿼리**: 원하는 주제를 직접 입력하여 맞춤 분석을 받을 수 있습니다
- **결과 복사**: 분석 결과를 클립보드에 바로 복사할 수 있습니다
