#!/bin/bash

echo "🚀 Golden Race 서버를 로컬에서 시작합니다..."

# 환경 변수 파일 확인
if [ ! -f .env ]; then
    echo "⚠️  .env 파일이 없습니다. env.example을 복사합니다..."
    cp env.example .env
    echo "✅ .env 파일이 생성되었습니다. GOOGLE_CLIENT_SECRET을 설정해주세요."
fi

# MySQL만 Docker로 실행 (데이터베이스는 Docker 사용)
echo "🐳 MySQL을 Docker로 시작합니다..."
docker-compose -f docker-compose.dev.yml up -d mysql

# MySQL 시작 대기
echo "⏳ MySQL 시작을 기다리는 중..."
sleep 10

# 의존성 설치 확인
if [ ! -d "node_modules" ]; then
    echo "📦 의존성을 설치합니다..."
    npm install
fi

# 개발 모드로 서버 시작
echo "🔥 개발 모드로 서버를 시작합니다..."
npm run start:dev 