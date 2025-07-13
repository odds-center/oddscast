#!/bin/bash

# 프로덕션 환경 시작 스크립트
echo "🚀 Golden Race Server - 프로덕션 환경 시작"

# 환경변수 파일 확인
if [ ! -f ".env" ]; then
    echo "⚠️  .env 파일이 없습니다."
    echo "📝 .env 파일을 생성하고 다음 내용을 설정해주세요:"
    echo ""
    echo "NODE_ENV=production"
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
    npm ci --only=production
fi

# 로그 디렉토리 생성
mkdir -p logs

# TypeScript 빌드
echo "🔨 TypeScript 빌드 중..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 빌드 실패. 오류를 수정 후 다시 시도해주세요."
    exit 1
fi

# 프로세스 관리자 확인
if ! command -v pm2 &> /dev/null; then
    echo "📦 PM2를 설치합니다..."
    npm install -g pm2
fi

# 기존 프로세스 중지
echo "🛑 기존 프로세스를 중지합니다..."
pm2 stop goldenrace-server 2>/dev/null || true
pm2 delete goldenrace-server 2>/dev/null || true

# PM2로 프로덕션 서버 시작
echo "🌟 프로덕션 서버를 시작합니다..."
pm2 start dist/index.js --name "goldenrace-server" --env production

# PM2 상태 확인
echo "📊 PM2 상태 확인..."
pm2 status

# 헬스체크
echo "🏥 서버 헬스체크 중..."
sleep 5

if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ 프로덕션 서버가 성공적으로 시작되었습니다!"
    echo "📍 서버 주소: http://localhost:3000"
    echo "📊 헬스체크: http://localhost:3000/api/health"
    echo "📋 로그 확인: pm2 logs goldenrace-server"
    echo "🛑 중지: pm2 stop goldenrace-server"
else
    echo "❌ 서버 시작 실패"
    pm2 logs goldenrace-server --lines 20
    exit 1
fi 