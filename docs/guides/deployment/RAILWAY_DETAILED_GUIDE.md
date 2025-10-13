# 🚂 Railway 상세 설정 가이드

## 📋 개요

Railway.app을 Golden Race 프로젝트에 실전 적용하기 위한 완벽 가이드입니다.

---

## 🎯 Railway란?

```
Railway = Git Push로 배포되는 현대적 PaaS

특징:
- 자동 CI/CD
- 무중단 배포
- 원클릭 DB/Redis
- 자동 SSL
- 내장 로드밸런서
```

---

## 🚀 1. 프로젝트 설정 (10분)

### Step 1: Railway CLI 설치

```bash
# npm으로 설치
npm install -g @railway/cli

# 또는 Homebrew (macOS)
brew install railway

# 버전 확인
railway --version
```

### Step 2: 로그인

```bash
# 로그인 (브라우저 열림)
railway login

# 성공 메시지 확인
# ✅ Logged in as your-email@gmail.com
```

### Step 3: 프로젝트 생성

```bash
# Golden Race 프로젝트 루트로 이동
cd /path/to/goldenrace

# Railway 프로젝트 초기화
railway init

# 프로젝트 이름 입력
# → goldenrace-production

# 자동으로 생성됨:
# - railway.json (설정 파일)
# - .railway (로컬 설정)
```

---

## 📦 2. 서비스 추가

### MySQL 추가

```bash
# MySQL 플러그인 추가
railway add mysql

# 자동으로 환경변수 주입:
# - MYSQL_URL
# - MYSQL_HOST
# - MYSQL_PORT
# - MYSQL_USER
# - MYSQL_PASSWORD
# - MYSQL_DATABASE

# server/.env에서 참조
DB_HOST=${{MYSQL_HOST}}
DB_PORT=${{MYSQL_PORT}}
DB_USERNAME=${{MYSQL_USER}}
DB_PASSWORD=${{MYSQL_PASSWORD}}
DB_DATABASE=${{MYSQL_DATABASE}}
```

**MySQL 설정:**

```
초기 스토리지: 1GB (무료)
최대 연결: 100개
백업: 자동 (매일)
확장: UI에서 클릭으로 가능

비용:
- 1GB: 포함 (Developer 플랜)
- 추가: $0.25/GB
```

### Redis 추가 ⭐

```bash
# Redis 플러그인 추가
railway add redis

# 자동으로 환경변수 주입:
# - REDIS_URL
# - REDIS_HOST
# - REDIS_PORT
# - REDIS_PASSWORD

# server/.env에서 참조
REDIS_HOST=${{REDIS_HOST}}
REDIS_PORT=${{REDIS_PORT}}
REDIS_PASSWORD=${{REDIS_PASSWORD}}
```

**NestJS에서 Redis 사용:**

```typescript
// server/src/app.module.ts
import { RedisModule } from '@nestjs-modules/ioredis';

@Module({
  imports: [
    // Railway 환경변수 자동 사용
    RedisModule.forRoot({
      config: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
        // 또는 간단히
        // url: process.env.REDIS_URL
      },
    }),
  ],
})
export class AppModule {}
```

**Redis 설정:**

```
초기 메모리: 512MB
최대 연결: 1000개
Persistence: RDB + AOF
비용: $10/월 (1GB)
```

---

## ⚙️ 3. 환경변수 설정

### CLI로 설정

```bash
# 환경변수 추가
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your-super-secret-key
railway variables set JWT_EXPIRES_IN=7d
railway variables set GOOGLE_CLIENT_ID=your-client-id
railway variables set GOOGLE_CLIENT_SECRET=your-client-secret

# 환경변수 확인
railway variables

# 환경변수 삭제
railway variables delete VARIABLE_NAME
```

### UI로 설정

```
1. Railway Dashboard 접속
2. 프로젝트 선택
3. Variables 탭
4. New Variable 클릭
5. Key-Value 입력
6. Add 클릭

자동으로 서비스 재시작 (무중단)
```

### 환경변수 우선순위

```
Railway는 다음 순서로 환경변수를 로드:

1. Railway Dashboard Variables (최우선)
2. railway.json 파일
3. .env 파일 (로컬 개발만)

프로덕션: Railway Variables 사용 추천
로컬: .env 파일 사용
```

---

## 🔧 4. Nginx 설정 - **불필요!** ⭐

Railway는 **Nginx가 이미 내장**되어 있습니다!

### Railway가 자동 제공

```
✅ 로드 밸런싱
   - 여러 인스턴스에 자동 분산

✅ 리버스 프록시
   - 자동 프록시 설정

✅ SSL/TLS 종료
   - Let's Encrypt 자동 발급/갱신

✅ HTTP/2, HTTP/3 지원
   - 최신 프로토콜 자동 적용

✅ 자동 헬스체크
   - /health 엔드포인트 자동 체크

✅ 무중단 배포
   - 점진적 트래픽 전환
```

### EC2와 비교

**EC2 (복잡함):**

```nginx
# nginx.conf 직접 작성 필요
upstream api_servers {
    server localhost:3002;
    keepalive 64;
}

server {
    listen 80;
    server_name api.goldenrace.com;

    location / {
        proxy_pass http://api_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# SSL 설정
server {
    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/api.goldenrace.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.goldenrace.com/privkey.pem;
    # ... 복잡한 SSL 설정
}
```

**Railway (자동):**

```bash
# 아무것도 안 해도 됨!
git push

# Railway가 자동으로:
# - 로드 밸런싱 설정
# - SSL 인증서 발급
# - HTTPS 리다이렉트
# - HTTP/2 활성화
# - 헬스체크 설정
```

---

## 🚀 5. CI/CD 자동화 - **완전 자동!** ⭐

### Git 연동 (한 번만)

```bash
# GitHub 저장소와 연동
railway link

# 또는 Railway Dashboard에서:
# 1. Project Settings
# 2. GitHub 연결
# 3. Repository 선택
# 4. Branch 선택 (main)
```

### 자동 배포 플로우

```bash
# 1. 코드 수정
vim server/src/app.controller.ts

# 2. 커밋 & 푸시
git add .
git commit -m "feat: 새 기능 추가"
git push origin main

# 3. Railway가 자동으로:
# ✅ 코드 변경 감지 (5초 이내)
# ✅ 빌드 시작
# ✅ 테스트 실행
# ✅ 헬스체크 (3회 시도)
# ✅ 무중단 배포
# ✅ 이전 버전 유지 (롤백 대비)

# 소요 시간: 2분
# 다운타임: 0초
```

### 배포 타임라인

```
00:00 - git push origin main
00:05 - Railway: 변경 감지
00:10 - 빌드 시작
      └─ npm install
      └─ npm run build
01:00 - 빌드 완료
01:05 - 새 컨테이너 시작
01:10 - 헬스체크 (GET /health)
      └─ 1차 시도: 200 OK ✅
      └─ 2차 시도: 200 OK ✅
      └─ 3차 시도: 200 OK ✅
01:20 - 트래픽 전환 시작
      └─ 10% → 새 버전
      └─ 50% → 새 버전
      └─ 100% → 새 버전
02:00 - 배포 완료 ✅
05:00 - 이전 버전 종료
```

### 헬스체크 설정

**NestJS 헬스체크 엔드포인트:**

```typescript
// server/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(private health: HealthCheckService) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // DB 연결 체크
      () => this.db.pingCheck('database'),
      // Redis 연결 체크
      () => this.redis.pingCheck('redis'),
    ]);
  }
}

// Railway가 자동으로 /health를 체크
// 200 OK가 3번 연속 나와야 배포 진행
```

### Railway.toml 설정 (선택사항)

```toml
# railway.toml
[build]
builder = "NIXPACKS"
buildCommand = "npm install && npm run build"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[env]
NODE_ENV = "production"
```

---

## 📊 6. 모니터링 및 로그

### 실시간 로그

```bash
# CLI로 로그 확인
railway logs

# 특정 서비스 로그
railway logs --service api

# 실시간 스트리밍
railway logs --follow

# 최근 100줄
railway logs --tail 100
```

### Dashboard 모니터링

```
Railway Dashboard → Project → Observability

실시간 메트릭:
✅ CPU 사용률 (%)
✅ 메모리 사용률 (MB)
✅ 네트워크 In/Out (MB)
✅ 요청 수 (req/s)
✅ 응답 시간 (ms)
✅ 에러율 (%)

로그:
✅ 실시간 스트리밍
✅ 색상 하이라이팅
✅ 검색 및 필터
✅ 시간대별 필터
✅ 다운로드
```

### 알림 설정

```
Dashboard → Project → Settings → Notifications

알림 채널:
- Slack
- Discord
- Email
- Webhook

알림 이벤트:
✅ 배포 시작
✅ 배포 완료
✅ 배포 실패
✅ 서비스 다운
✅ 높은 메모리 사용
✅ 높은 CPU 사용
```

---

## 🔄 7. 롤백

### 원클릭 롤백

```bash
# CLI로 롤백
railway rollback

# 특정 배포로 롤백
railway deployments
railway rollback <deployment-id>
```

### Dashboard로 롤백

```
1. Dashboard → Deployments
2. 이전 배포 선택
3. "Redeploy" 클릭
4. 30초 안에 롤백 완료 ✅

다운타임: 0초
```

---

## 💰 8. 비용 최적화

### 플랜별 비용

```
Hobby 플랜 ($5/월):
- 512MB RAM
- 0.5 vCPU
- 1GB DB
- 100GB 대역폭
❌ Golden Race에는 부족

Developer 플랜 ($20/월): ⭐ 추천
- 8GB RAM
- 8 vCPU
- 무제한 DB
- 100GB 대역폭
✅ Golden Race 초기에 완벽

Team 플랜 ($50/월):
- 32GB RAM
- 32 vCPU
- 무제한 모든 것
✅ 성장기 (1,000명+)
```

### 실제 비용 (Golden Race)

```
Developer 플랜: $20/월 (₩27,080)
MySQL Plugin: $10/월 (₩13,540)
Redis Plugin: $10/월 (₩13,540)
━━━━━━━━━━━━━━━━━━━━━━━━━
총: $40/월 (₩54,160)

추가 비용:
- 대역폭 초과 (100GB 이후): $0.10/GB
- 스토리지 초과: $0.25/GB

예상 (1,000명):
- 대역폭: 50GB (무료 범위 내)
- 스토리지: 3GB (무료 범위 내)

총: ₩54,160/월 (고정!)
```

---

## 🛠️ 9. 고급 설정

### 멀티 서비스

```bash
# API 서버
railway add --service api
# 프로젝트 경로: /server

# Admin 패널
railway add --service admin
# 프로젝트 경로: /admin

# 모두 같은 프로젝트에서 관리
# 환경변수 공유 가능
```

### Private Networking

```
Railway Private Network:
- 서비스 간 내부 통신
- 외부 노출 없음
- 낮은 레이턴시
- 무료

예시:
API → MySQL (Private)
API → Redis (Private)
외부 → API (Public)
```

### 커스텀 도메인

```
1. Dashboard → Settings → Domains
2. Add Domain
3. 도메인 입력: api.goldenrace.com
4. DNS 레코드 추가:
   CNAME api → your-project.up.railway.app
5. SSL 자동 발급 (1분 이내)

✅ 완료!
```

---

## 📋 10. 체크리스트

### 초기 설정

```
□ Railway CLI 설치
□ 로그인 완료
□ 프로젝트 생성
□ GitHub 연동
□ MySQL 추가
□ Redis 추가
□ 환경변수 설정
□ 첫 배포 성공
□ 헬스체크 설정
□ 커스텀 도메인 연결
```

### 운영 체크리스트

```
□ 로그 모니터링 설정
□ 알림 채널 설정 (Slack/Discord)
□ 백업 자동화 확인
□ 롤백 절차 숙지
□ 비용 모니터링
□ 성능 메트릭 확인
```

---

## 🎯 실전 팁

### 1. 빠른 배포

```bash
# alias 설정 (선택사항)
echo "alias rd='git add . && git commit -m \"deploy\" && git push'" >> ~/.zshrc

# 이후 배포
rd
# 2분 후 배포 완료 ✅
```

### 2. 로컬 테스트

```bash
# Railway 환경변수를 로컬에서 사용
railway run npm run start:dev

# 또는 환경변수 파일 생성
railway variables --json > .env.railway

# .env.railway를 .env로 복사
cp .env.railway .env
```

### 3. 여러 환경 관리

```bash
# Production
railway link --environment production

# Staging
railway link --environment staging

# 환경 전환
railway environment production
railway environment staging
```

---

## 🚫 주의사항

### 하지 말아야 할 것

```
❌ .env 파일을 Git에 커밋
   → Railway Variables 사용

❌ 하드코딩된 환경변수
   → process.env.VARIABLE 사용

❌ Nginx 설정 파일 작성
   → Railway가 자동 처리

❌ PM2, Forever 등 프로세스 매니저 사용
   → Railway가 자동 관리

❌ Docker Compose 사용
   → Railway가 자동으로 컨테이너 관리
```

---

## 🆘 문제 해결

### 배포 실패

```
원인: 빌드 오류

해결:
1. railway logs 확인
2. 로컬에서 빌드 테스트
   npm run build
3. 오류 수정 후 재배포
```

### 헬스체크 실패

```
원인: /health 엔드포인트 없음

해결:
1. HealthController 추가
2. @nestjs/terminus 설치
   npm install @nestjs/terminus
3. /health 엔드포인트 구현
4. 재배포
```

### 환경변수 적용 안 됨

```
원인: 서비스 재시작 필요

해결:
1. Dashboard → Restart
2. 또는 변수 변경 후 자동 재시작 대기
3. railway logs로 확인
```

---

## 📚 추가 리소스

### 공식 문서

- Railway 문서: https://docs.railway.app
- Railway CLI: https://docs.railway.app/develop/cli
- 템플릿: https://railway.app/templates

### 커뮤니티

- Discord: https://discord.gg/railway
- Twitter: @Railway
- GitHub: https://github.com/railwayapp

---

<div align="center">

**🚂 Railway로 빠르게 배포하세요!**

Git Push만으로 프로덕션 배포 완료  
Redis, MySQL, CI/CD 모두 자동!

**Golden Race Team** 🏇

**작성일**: 2025년 10월 12일  
**버전**: 1.0.0

</div>
