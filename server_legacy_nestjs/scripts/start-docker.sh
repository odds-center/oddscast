#!/bin/bash

# Golden Race Docker 전용 시작 스크립트
echo "🐳 Golden Race Docker 시작"
echo "=========================="

# 함수 정의
wait_for_docker() {
    echo "⏳ Docker Desktop 대기 중..."
    for i in {1..60}; do
        if docker info > /dev/null 2>&1 && docker ps > /dev/null 2>&1; then
            echo "✅ Docker가 준비되었습니다!"
            return 0
        fi
        echo "Docker 대기 중... ($i/60)"
        sleep 5
    done
    echo "❌ Docker 시작 실패"
    return 1
}

start_services() {
    echo "🚀 서비스 시작 중..."
    
    # 기존 컨테이너 정리
    docker-compose down --remove-orphans 2>/dev/null
    
    # 컨테이너 시작
    docker-compose up -d
    
    if [ $? -ne 0 ]; then
        echo "❌ 컨테이너 시작 실패"
        return 1
    fi
    
    echo "✅ 컨테이너 시작 완료!"
    
    # 서비스 대기
    echo "⏳ 서비스 준비 대기 중... (30초)"
    sleep 30
    
    # MySQL 확인
    echo "🔍 MySQL 상태 확인 중..."
    if docker exec goldenrace-mysql mysqladmin ping -h localhost -u root -prootpassword --silent 2>/dev/null; then
        echo "✅ MySQL 연결 성공!"
    else
        echo "❌ MySQL 연결 실패"
        return 1
    fi
    
    # 서버 확인
    echo "🔍 서버 상태 확인 중..."
    for i in {1..12}; do
        if curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
            echo "✅ 서버 시작 성공!"
            echo ""
            echo "🌐 서버: http://localhost:3002"
            echo "📚 API 문서: http://localhost:3002/api/docs"
            echo "📊 헬스체크: http://localhost:3002/api/health"
            echo ""
            echo "📋 유용한 명령어:"
            echo "  로그 확인: npm run docker:logs"
            echo "  중지: npm run docker:down"
            echo "  재시작: npm run docker:restart"
            return 0
        fi
        echo "서버 대기 중... ($i/12)"
        sleep 5
    done
    
    echo "❌ 서버 시작 실패"
    return 1
}

# 메인 실행
main() {
    # 현재 디렉토리 확인
    if [ ! -f "docker-compose.yml" ]; then
        echo "❌ docker-compose.yml 파일을 찾을 수 없습니다."
        exit 1
    fi
    
    # 환경변수 파일 확인
    if [ ! -f ".env" ]; then
        echo "📝 .env 파일 생성 중..."
        if [ -f "env.example" ]; then
            cp env.example .env
            sed -i '' 's/DB_HOST=localhost/DB_HOST=mysql/' .env
        else
            echo "❌ env.example 파일을 찾을 수 없습니다."
            exit 1
        fi
    fi
    
    # Docker 대기
    if ! wait_for_docker; then
        echo "❌ Docker를 사용할 수 없습니다."
        exit 1
    fi
    
    # 서비스 시작
    if start_services; then
        echo "🎉 Golden Race 서버가 성공적으로 시작되었습니다!"
    else
        echo "❌ 서비스 시작 실패"
        exit 1
    fi
}

# 스크립트 실행
main "$@" 