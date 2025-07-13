#!/bin/bash

# 개발 환경 시작 스크립트
echo "🚀 Golden Race Server - 개발 환경 시작"

# 환경변수 파일 확인
if [ ! -f ".env" ]; then
    echo "⚠️  .env 파일이 없습니다."
    echo "📝 .env 파일을 생성하고 다음 내용을 설정해주세요:"
    echo ""
    echo "NODE_ENV=development"
    echo "PORT=3000"
    echo "SUPABASE_URL=your_supabase_url"
    echo "SUPABASE_ANON_KEY=your_supabase_anon_key"
    echo "KRA_API_KEY=your_kra_api_key"
    echo ""
    exit 1
fi

# 의존성 설치 확인
if [ ! -d "node_modules" ]; then
    echo "📦 의존성을 설치합니다..."
    npm install
fi

# 로그 디렉토리 생성
mkdir -p logs

# TypeScript 타입 체크
echo "🔍 TypeScript 타입 체크..."
npm run type-check

if [ $? -ne 0 ]; then
    echo "❌ 타입 오류가 있습니다. 수정 후 다시 시도해주세요."
    exit 1
fi

# 개발 서버 시작
echo "🌟 개발 서버를 시작합니다..."
echo "📍 서버 주소: http://localhost:3000"
echo "📊 헬스체크: http://localhost:3000/api/health"
echo "🛑 중지하려면 Ctrl+C를 누르세요."

npm run dev 