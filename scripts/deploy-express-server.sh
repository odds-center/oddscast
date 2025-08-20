#!/bin/bash

# Express 서버 배포 스크립트
# 사용법: ./scripts/deploy-express-server.sh

set -e

echo "🚀 Express 서버 배포를 시작합니다..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수 정의
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 1. Node.js 확인
if ! command -v node &> /dev/null; then
    log_error "Node.js가 설치되지 않았습니다."
    echo "Node.js 18 이상을 설치해주세요: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    log_error "Node.js 18 이상이 필요합니다. 현재 버전: $(node --version)"
    exit 1
fi

log_info "Node.js 확인 완료: $(node --version)"

# 2. 서버 디렉토리로 이동
cd server

# 3. 의존성 설치
log_step "의존성 설치 중..."
npm install

log_info "의존성 설치 완료"

# 4. 환경변수 파일 확인
if [ ! -f ".env" ]; then
    log_warn ".env 파일이 없습니다. env.example을 복사합니다."
    cp env.example .env
    log_warn "환경변수를 설정해주세요:"
    echo "1. KRA_API_KEY"
    echo ""
    echo "예시:"
    echo "KRA_API_KEY=yyRDa%2FaXc9SsDdY67IqkdXJmZgZXOzsKqnf%2BR%2FSZjR6iAxYLzKiq%2BgXTmdUj%2FFe%2BFtEsMXnMYrLaiX6PZ%2FemsQ%3D%3D"
    echo ""
    read -p "환경변수를 설정한 후 Enter를 눌러주세요..."
else
    log_info ".env 파일 확인 완료"
fi

# 5. 로그 디렉토리 생성
log_step "로그 디렉토리 생성 중..."
mkdir -p logs

# 6. 서버 테스트
log_step "서버 테스트 중..."
if npm start &> /dev/null & then
    SERVER_PID=$!
    sleep 5
    
    # 헬스체크
    if curl -s http://localhost:3000/health > /dev/null; then
        log_info "서버 테스트 성공!"
    else
        log_warn "서버 응답이 느립니다. 수동으로 확인해주세요."
    fi
    
    # 서버 종료
    kill $SERVER_PID 2>/dev/null || true
else
    log_error "서버 시작 실패"
    exit 1
fi

# 7. 배포 옵션 선택
echo ""
log_step "배포 방법을 선택하세요:"
echo "1) 로컬 실행"
echo "2) Docker 배포"
echo "3) Heroku 배포"
echo "4) Railway 배포"
echo "5) Vercel 배포"
echo "6) 종료"

read -p "선택 (1-6): " choice

case $choice in
    1)
        log_info "로컬에서 서버를 실행합니다..."
        echo ""
        echo "서버를 시작하려면:"
        echo "cd server && npm start"
        echo ""
        echo "개발 모드로 실행하려면:"
        echo "cd server && npm run dev"
        ;;
    2)
        log_step "Docker 배포 준비 중..."
        
        # Dockerfile 생성
        cat > Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
EOF
        
        # .dockerignore 생성
        cat > .dockerignore << 'EOF'
node_modules
npm-debug.log
logs
.env
.git
.gitignore
README.md
EOF
        
        log_info "Docker 이미지 빌드 중..."
        docker build -t goldenrace-server .
        
        log_info "Docker 컨테이너 실행 중..."
        docker run -d \
          --name goldenrace-server \
          -p 3000:3000 \
          --env-file .env \
          goldenrace-server
        
        log_info "Docker 배포 완료!"
        echo "서버 URL: http://localhost:3000"
        ;;
    3)
        log_step "Heroku 배포 준비 중..."
        
        if ! command -v heroku &> /dev/null; then
            log_error "Heroku CLI가 설치되지 않았습니다."
            echo "설치 방법: https://devcenter.heroku.com/articles/heroku-cli"
            exit 1
        fi
        
        # Heroku 앱 생성
        heroku create goldenrace-server-$(date +%s)
        
        # 환경변수 설정
        heroku config:set NODE_ENV=production
        
        # .env 파일에서 환경변수 읽어서 설정
        while IFS='=' read -r key value; do
            if [[ ! $key =~ ^# ]] && [[ -n $key ]]; then
                heroku config:set "$key=$value"
            fi
        done < .env
        
        log_info "Heroku에 배포 중..."
        git add .
        git commit -m "Deploy to Heroku"
        git push heroku main
        
        log_info "Heroku 배포 완료!"
        heroku open
        ;;
    4)
        log_step "Railway 배포 준비 중..."
        
        if ! command -v railway &> /dev/null; then
            log_error "Railway CLI가 설치되지 않았습니다."
            echo "설치 방법: npm install -g @railway/cli"
            exit 1
        fi
        
        log_info "Railway에 배포 중..."
        railway login
        railway init
        railway up
        
        log_info "Railway 배포 완료!"
        ;;
    5)
        log_step "Vercel 배포 준비 중..."
        
        if ! command -v vercel &> /dev/null; then
            log_error "Vercel CLI가 설치되지 않았습니다."
            echo "설치 방법: npm install -g vercel"
            exit 1
        fi
        
        # vercel.json 생성
        cat > vercel.json << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.js"
    }
  ]
}
EOF
        
        log_info "Vercel에 배포 중..."
        vercel --prod
        
        log_info "Vercel 배포 완료!"
        ;;
    6)
        log_info "배포를 취소합니다."
        exit 0
        ;;
    *)
        log_error "잘못된 선택입니다."
        exit 1
        ;;
esac

# 8. 배포 완료 안내
echo ""
log_info "배포 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. 서버가 정상적으로 실행되는지 확인"
echo "2. API 엔드포인트 테스트"
echo "3. Cron Job이 정상 작동하는지 확인"
echo ""
echo "🔗 유용한 명령어:"
echo "- 서버 상태 확인: curl http://localhost:3000/health"
echo "- 시스템 상태: curl http://localhost:3000/api/health/system"
echo "- 데이터 동기화: curl -X POST http://localhost:3000/api/data/sync"
echo "- 로그 확인: tail -f logs/combined.log"

log_info "배포 스크립트 완료!" 