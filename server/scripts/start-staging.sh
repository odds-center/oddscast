#!/bin/bash

# 스테이징 환경 시작 스크립트
echo "🚀 Golden Race Server - 스테이징 환경 시작"

# 환경변수 파일 확인
if [ ! -f ".env" ]; then
    echo "⚠️  .env 파일이 없습니다."
    echo "📝 .env 파일을 생성하고 다음 내용을 설정해주세요:"
    echo ""
    echo "NODE_ENV=staging"
    echo "PORT=3000"
    
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

# TypeScript 빌드
echo "🔨 TypeScript 빌드 중..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 빌드 실패. 오류를 수정 후 다시 시도해주세요."
    exit 1
fi

# 헬스체크 함수
health_check() {
    echo "🏥 서버 헬스체크 중..."
    for i in {1..30}; do
        if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
            echo "✅ 서버가 정상적으로 시작되었습니다!"
            return 0
        fi
        echo "⏳ 서버 시작 대기 중... ($i/30)"
        sleep 2
    done
    echo "❌ 서버 시작 실패"
    return 1
}

# 스테이징 서버 시작
echo "🌟 스테이징 서버를 시작합니다..."
echo "📍 서버 주소: http://localhost:3000"
echo "📊 헬스체크: http://localhost:3000/api/health"

# 백그라운드에서 서버 시작
npm start &
SERVER_PID=$!

# 헬스체크 실행
health_check

if [ $? -eq 0 ]; then
    echo "🎉 스테이징 서버가 성공적으로 시작되었습니다!"
    echo "🛑 중지하려면: kill $SERVER_PID"
    
    # 로그 모니터링
    echo "📋 로그 모니터링 시작..."
    tail -f logs/combined.log
else
    echo "❌ 서버 시작 실패"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi 