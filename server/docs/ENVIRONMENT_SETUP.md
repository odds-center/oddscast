# 환경별 설정 및 시작 가이드

## 📋 개요

Golden Race Server는 개발, 스테이징, 프로덕션 환경에 맞는 설정과 시작 스크립트를 제공합니다.

## 🛠️ 환경별 설정

### 1. 개발 환경 (Development)

**특징:**

- 핫 리로드 지원
- 상세한 로깅
- 디버깅 모드 지원
- 느슨한 보안 설정

**설정 파일:** `env.development`

**시작 방법:**

```bash
# 방법 1: npm 스크립트
npm run start:dev

# 방법 2: 직접 실행
npm run dev

# 방법 3: 스크립트 파일
./scripts/start-dev.sh

# 방법 4: Docker
npm run docker:dev
```

### 2. 스테이징 환경 (Staging)

**특징:**

- 프로덕션과 유사한 설정
- 중간 수준의 보안
- 테스트용 데이터베이스

**설정 파일:** `env.staging`

**시작 방법:**

```bash
# 방법 1: npm 스크립트
npm run start:staging

# 방법 2: 스크립트 파일
./scripts/start-staging.sh

# 방법 3: Docker
docker-compose -f docker-compose.staging.yml up
```

### 3. 프로덕션 환경 (Production)

**특징:**

- 최고 수준의 보안
- 성능 최적화
- 프로세스 관리 (PM2)
- 모니터링 및 로깅

**설정 파일:** `env.production`

**시작 방법:**

```bash
# 방법 1: npm 스크립트
npm run start:prod

# 방법 2: 스크립트 파일
./scripts/start-prod.sh

# 방법 3: Docker
npm run docker:prod

# 방법 4: 직접 실행
npm run build && npm start
```

## 🔧 환경변수 설정

### 필수 환경변수

```env
# 서버 설정
NODE_ENV=development|staging|production
PORT=3000

# Supabase 설정
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# 한국마사회 API 설정
KRA_API_KEY=your_kra_api_key
```

### 환경변수 파일 생성

```bash
# .env 파일 생성
touch .env

# 또는 에디터로 직접 생성
nano .env
```

### 환경별 권장 설정

#### 개발 환경

```env
NODE_ENV=development
PORT=3000
SUPABASE_URL=your_development_supabase_url
SUPABASE_ANON_KEY=your_development_supabase_anon_key
KRA_API_KEY=your_kra_api_key
```

#### 스테이징 환경

```env
NODE_ENV=staging
PORT=3000
SUPABASE_URL=your_staging_supabase_url
SUPABASE_ANON_KEY=your_staging_supabase_anon_key
KRA_API_KEY=your_kra_api_key
```

#### 프로덕션 환경

```env
NODE_ENV=production
PORT=3000
SUPABASE_URL=your_production_supabase_url
SUPABASE_ANON_KEY=your_production_supabase_anon_key
KRA_API_KEY=your_kra_api_key
```

## 🐳 Docker 사용법

### 개발 환경

```bash
# Docker 이미지 빌드
npm run docker:build

# 개발용 컨테이너 실행
npm run docker:dev

# 또는 직접 실행
docker-compose -f docker-compose.dev.yml up
```

### 프로덕션 환경

```bash
# 프로덕션용 컨테이너 실행
npm run docker:prod

# 또는 직접 실행
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 모니터링 및 로깅

### 로그 확인

```bash
# 전체 로그
npm run logs

# 에러 로그만
npm run logs:error

# PM2 로그 (프로덕션)
pm2 logs goldenrace-server
```

### 헬스체크

```bash
# 기본 헬스체크
npm run health

# 상세 헬스체크
npm run health:detailed

# 직접 확인
curl http://localhost:3000/api/health
```

## 🔄 배포 프로세스

### 1. 개발 → 스테이징

```bash
# 스테이징 환경으로 배포
npm run deploy:staging

# 또는 스크립트 사용
./scripts/start-staging.sh
```

### 2. 스테이징 → 프로덕션

```bash
# 프로덕션 환경으로 배포
npm run deploy:prod

# 또는 스크립트 사용
./scripts/start-prod.sh
```

### 3. Docker 배포

```bash
# 이미지 빌드 및 실행
npm run docker:build
npm run docker:run
```

## 🚨 문제 해결

### 일반적인 문제들

1. **포트 충돌**

   ```bash
   # 포트 사용 확인
   lsof -i :3000

   # 다른 포트 사용
   PORT=3001 npm run dev
   ```

2. **환경변수 누락**

   ```bash
   # 환경변수 파일 확인
   cat .env

   # 템플릿에서 복사
   cp env.development .env
   ```

3. **의존성 문제**

   ```bash
   # 의존성 재설치
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **빌드 실패**

   ```bash
   # 타입 체크
   npm run type-check

   # 린팅
   npm run lint
   ```

### 로그 분석

```bash
# 실시간 로그 모니터링
tail -f logs/combined.log

# 에러 로그만 확인
grep "ERROR" logs/combined.log

# 특정 시간대 로그
grep "2024-01-01" logs/combined.log
```

## 📚 추가 리소스

- [API 가이드라인](./API_GUIDELINES.md)
- [아키텍처 문서](./ARCHITECTURE.md)
- [코딩 표준](./CODING_STANDARDS.md)
- [README.md](../README.md)

---

**Golden Race Team** - 환경별 설정 및 배포 가이드
