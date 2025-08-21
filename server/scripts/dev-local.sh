#!/bin/bash

echo "🚀 Golden Race 서버를 시작합니다..."

# 함수 정의들
start_docker_mode() {
    echo "🐳 전체 서버를 Docker로 시작합니다..."
    
    # 기존 컨테이너 정리
    echo "🧹 기존 Docker 컨테이너를 정리합니다..."
    docker-compose -f docker-compose.dev.yml down 2>/dev/null
    
    # 전체 서버를 Docker로 실행
    echo "🚀 Docker 컨테이너를 시작합니다..."
    docker-compose -f docker-compose.dev.yml up -d
    
    # 서버 시작 대기
    echo "⏳ 서버 시작을 기다리는 중... (15초)"
    sleep 15
    
    # 서버 상태 확인
    check_server_status
}

start_local_mode() {
    echo "💻 로컬에서 서버를 시작합니다..."
    
    # MySQL만 Docker로 실행
    echo "🐳 MySQL을 Docker로 시작합니다..."
    docker-compose -f docker-compose.dev.yml up -d mysql
    
    # MySQL 시작 대기
    echo "⏳ MySQL 시작을 기다리는 중... (10초)"
    sleep 10
    
    # 의존성 설치 확인
    if [ ! -d "node_modules" ]; then
        echo "📦 의존성을 설치합니다..."
        npm install
    fi
    
    # 로컬에서 서버 시작
    echo "🔥 로컬에서 개발 모드로 서버를 시작합니다..."
    echo "💡 서버를 중지하려면 Ctrl+C를 누르세요"
    npm run start:dev
}

start_hybrid_mode() {
    echo "🔀 하이브리드 모드로 시작합니다..."
    
    # MySQL만 Docker로 실행
    echo "🐳 MySQL을 Docker로 시작합니다..."
    docker-compose -f docker-compose.dev.yml up -d mysql
    
    # MySQL 시작 대기
    echo "⏳ MySQL 시작을 기다리는 중... (10초)"
    sleep 10
    
    # 의존성 설치 확인
    if [ ! -d "node_modules" ]; then
        echo "📦 의존성을 설치합니다..."
        npm install
    fi
    
    # 로컬에서 서버 시작
    echo "🔥 로컬에서 개발 모드로 서버를 시작합니다..."
    echo "💡 서버를 중지하려면 Ctrl+C를 누르세요"
    npm run start:dev
}

check_server_status() {
    echo "🔍 서버 상태를 확인합니다..."
    
    # 최대 30초 대기
    for i in {1..6}; do
        if curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
            echo "✅ 서버가 성공적으로 시작되었습니다!"
            echo "🌐 서버 URL: http://localhost:3002"
            echo "📚 API 문서: http://localhost:3002/api/docs"
            echo ""
            echo "📋 유용한 명령어:"
            echo "  로그 확인: npm run docker:dev:logs"
            echo "  서버 중지: npm run docker:dev:down"
            echo "  서버 재시작: npm run docker:dev:restart"
            echo "  포트 정리: lsof -ti:3002 | xargs kill -9"
            return 0
        else
            echo "⏳ 서버 시작 대기 중... ($((i*5))/30초)"
            sleep 5
        fi
    done
    
    echo "❌ 서버 시작에 실패했습니다."
    echo "📋 로그를 확인하세요: npm run docker:dev:logs"
    echo "🔄 다시 시도하려면: npm run dev:local"
    return 1
}

cleanup() {
    echo ""
    echo "🧹 정리 작업을 수행합니다..."
    # 필요한 정리 작업이 있다면 여기에 추가
}

# 스크립트 종료 시 정리
trap cleanup EXIT

# 환경 변수 파일 확인
if [ ! -f .env ]; then
    echo "⚠️  .env 파일이 없습니다. env.example을 복사합니다..."
    cp env.example .env
    echo "✅ .env 파일이 생성되었습니다. GOOGLE_CLIENT_SECRET을 설정해주세요."
fi

# 3002번 포트 사용 중인 프로세스 정리
echo "🧹 3002번 포트를 정리합니다..."
PORT_PROCESSES=$(lsof -ti:3002 2>/dev/null)
if [ ! -z "$PORT_PROCESSES" ]; then
    echo "⚠️  3002번 포트를 사용하는 프로세스 발견: $PORT_PROCESSES"
    echo "🔄 프로세스를 종료합니다..."
    echo $PORT_PROCESSES | xargs kill -9 2>/dev/null
    sleep 2
    echo "✅ 포트 정리 완료"
else
    echo "✅ 3002번 포트가 사용되지 않음"
fi

# 개발 모드 선택
echo ""
echo "🔧 개발 모드를 선택하세요:"
echo "1) Docker (권장) - 전체 환경을 Docker로 관리"
echo "2) 로컬 - 로컬에서 직접 실행 (MySQL만 Docker)"
echo "3) 하이브리드 - MySQL은 Docker, 서버는 로컬"
echo ""
read -p "선택 (1-3, 기본값: 1): " choice
choice=${choice:-1}

case $choice in
    1)
        echo "🐳 Docker 모드로 시작합니다..."
        start_docker_mode
        ;;
    2)
        echo "💻 로컬 모드로 시작합니다..."
        start_local_mode
        ;;
    3)
        echo "🔀 하이브리드 모드로 시작합니다..."
        start_hybrid_mode
        ;;
    *)
        echo "❌ 잘못된 선택입니다. Docker 모드로 시작합니다..."
        start_docker_mode
        ;;
esac 