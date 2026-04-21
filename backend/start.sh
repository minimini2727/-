#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Create venv if needed
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi

source .venv/bin/activate

pip install -q --upgrade pip
pip install -q -r requirements.txt

# Install playwright browsers (only if not already installed)
python -m playwright install chromium --with-deps 2>/dev/null || true

# Copy env file if .env doesn't exist
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  cp .env.example .env
  echo "⚠  .env 파일을 생성했습니다. API 키를 설정해 주세요."
fi

echo "🚀 SNS 트렌드 AI 에이전트 서버를 시작합니다..."
echo "   http://localhost:${PORT:-8000}"

python main.py
