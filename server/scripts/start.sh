#!/bin/bash

# Golden Race 서버 통합 시작 스크립트
echo "🚀 Golden Race 서버 시작"
echo "========================"

# 함수 정의
check_docker_status() {
    echo "🐳 Docker 상태 확인 중..."
    
    # Docker 데몬 확인 (기본 소켓 사용)
    if docker info > /dev/null 2>&1; then
        echo "✅ Docker가 정상적으로 실행 중입니다."
        return 0
    else
        echo "❌ Docker가 실행되지 않았습니다."
        
        # macOS에서 Docker Desktop 시작 시도
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "🍎 macOS에서 Docker Desktop을 시작합니다..."
            open -a Docker
            
            echo "⏳ Docker 시작 대기 중... (최대 3분)"
            for i in {1..36}; do
                if docker info > /dev/null 2>&1; then
                    echo "✅ Docker가 준비되었습니다!"
                    sleep 10  # 안정화 대기
                    return 0
                fi
                echo "Docker 시작 대기... ($i/36)"
                sleep 5
            done
        else
            echo "🐧 Linux에서 Docker 서비스 시작을 시도합니다..."
            if command -v systemctl > /dev/null 2>&1; then
                sudo systemctl start docker
                sleep 10
                if docker info > /dev/null 2>&1; then
                    echo "✅ Docker가 준비되었습니다!"
                    return 0
                fi
            fi
        fi
        
        echo "❌ Docker 시작 실패. 로컬 모드로 진행합니다."
        return 1
    fi
}

start_docker_mode() {
    echo "🐳 Docker 모드로 시작합니다..."
    
    # 현재 디렉토리 확인
    if [ ! -f "docker-compose.yml" ]; then
        echo "❌ docker-compose.yml 파일을 찾을 수 없습니다."
        echo "📁 현재 디렉토리: $(pwd)"
        echo "📋 파일 목록:"
        ls -la
        return 1
    fi
    
    # 포트 정리
    PORT_PROCESSES=$(lsof -ti:3002 2>/dev/null)
    if [ ! -z "$PORT_PROCESSES" ]; then
        echo "🧹 3002번 포트 정리 중..."
        echo $PORT_PROCESSES | xargs kill -9 2>/dev/null
        sleep 2
    fi
    
    # 환경변수 파일 확인
    local env_file=".env.development"
    if [ ! -f "$env_file" ]; then
        echo "⚠️  $env_file 파일이 없습니다. .env 파일을 사용합니다."
        env_file=".env"
        if [ ! -f "$env_file" ]; then
            echo "❌ 환경변수 파일을 찾을 수 없습니다."
            return 1
        fi
    fi
    
    # 기존 컨테이너 정리
    echo "🧹 기존 컨테이너 정리 중..."
    docker-compose down --remove-orphans 2>/dev/null
    
    # 컨테이너 시작
    echo "🚀 컨테이너 시작 중..."
    if [ -f "$env_file" ]; then
        docker-compose --env-file "$env_file" up -d
    else
        docker-compose up -d
    fi
    
    if [ $? -ne 0 ]; then
        echo "❌ 컨테이너 시작 실패"
        echo "📋 Docker 상태 재확인 중..."
        if ! docker info > /dev/null 2>&1; then
            echo "❌ Docker가 여전히 실행되지 않았습니다."
            echo " Docker Desktop을 수동으로 시작해주세요."
        fi
        echo "📋 Docker Compose 로그:"
        docker-compose logs --tail 20
        return 1
    fi
    
    # 서비스 대기
    echo "⏳ 서비스 시작 대기 중... (30초)"
    sleep 30
    
    # MySQL 연결 확인
    echo "🔍 MySQL 연결 확인 중..."
    for i in {1..12}; do
        if docker exec goldenrace-mysql mysqladmin ping -h localhost -u root -prootpassword --silent 2>/dev/null; then
            echo "✅ MySQL 연결 성공!"
            break
        fi
        if [ $i -eq 12 ]; then
            echo "❌ MySQL 연결 실패"
            echo "📋 MySQL 로그:"
            docker logs goldenrace-mysql --tail 10
            echo "📋 실행 중인 컨테이너:"
            docker ps
            return 1
        fi
        echo "MySQL 대기 중... ($i/12)"
        sleep 5
    done
    
    # 서버 상태 확인
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
            echo "  로그 확인: docker-compose logs -f"
            echo "  중지: docker-compose down"
            echo "  재시작: docker-compose restart"
            return 0
        fi
        if [ $i -eq 12 ]; then
            echo "❌ 서버 시작 실패"
            echo "📋 서버 로그:"
            docker logs goldenrace-app --tail 20
            echo "📋 실행 중인 컨테이너:"
            docker ps
            return 1
        fi
        echo "서버 대기 중... ($i/12)"
        sleep 5
    done
}

start_local_mode() {
    echo "💻 로컬 모드로 시작합니다..."
    
    # 환경변수 파일 확인
    if [ ! -f ".env" ]; then
        echo "📝 .env 파일 생성 중..."
        if [ -f "env.example" ]; then
            cp env.example .env
        else
            echo "❌ env.example 파일을 찾을 수 없습니다."
            return 1
        fi
    fi
    
    # 의존성 설치
    if [ ! -d "node_modules" ]; then
        echo "📦 의존성 설치 중..."
        npm install
    fi
    
    # 빌드
    echo "🔨 빌드 중..."
    npm run build
    
    if [ $? -ne 0 ]; then
        echo "❌ 빌드 실패"
        exit 1
    fi
    
    echo "✅ 빌드 완료!"
    echo "🌟 서버 시작 중..."
    echo "📍 서버: http://localhost:3002"
    echo "🛑 중지: Ctrl+C"
    
    npm run start:dev
}

# 메인 실행
main() {
    # 현재 디렉토리 확인
    echo "📁 현재 디렉토리: $(pwd)"
    
    # 환경변수 파일 확인
    if [ ! -f ".env" ] && [ -f "env.example" ]; then
        echo "📝 .env 파일 생성 중..."
        cp env.example .env
    fi
    
    # Docker 상태 확인
    if check_docker_status; then
        start_docker_mode
    else
        echo "⚠️  Docker를 사용할 수 없습니다."
        echo " 로컬 모드로 시작하시겠습니까? (y/N)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            start_local_mode
        else
            echo "❌ 시작을 취소했습니다."
            exit 1
        fi
    fi
}

# 스크립트 실행
main "$@"
