# Golden Race Server

Golden Race NestJS Server for KRA API integration

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

```bash
cp env.example .env
# .env 파일을 편집하여 필요한 설정을 추가
```

### 3. 데이터베이스 초기화

```bash
# MySQL 컨테이너 시작
npm run docker:mysql

# 데이터베이스 완전 초기화 (모든 테이블 생성)
npm run db:complete

# 또는 단계별 초기화
npm run db:init
```

### 4. 서버 시작

```bash
# 로컬 개발 모드
npm run dev:local

# 또는 일반 개발 모드
npm run start:dev
```

## 📊 데이터베이스 관리

### 데이터베이스 초기화

```bash
# 완전한 초기화 (권장)
npm run db:complete

# 기존 데이터 유지하면서 스키마만 업데이트
npm run db:init

# 데이터베이스 완전 리셋 (주의: 모든 데이터 삭제)
npm run db:reset
```

### 데이터베이스 컨테이너 관리

```bash
# MySQL 시작
npm run docker:mysql

# MySQL 중지
npm run docker:mysql:down

# MySQL 로그 확인
npm run db:logs
```

## 🏗️ 프로젝트 구조

```
src/
├── auth/           # 인증 관련 (Google OAuth, JWT)
├── users/          # 사용자 관리
├── races/          # 경마 정보
├── bets/           # 베팅 시스템
├── points/         # 포인트 시스템
├── results/        # 경주 결과
└── shared/         # 공통 엔티티 및 유틸리티
```

## 🔐 인증 시스템

- **Google OAuth 2.0**: 소셜 로그인
- **JWT**: API 인증 토큰
- **소셜 인증**: Google, Facebook, Apple 지원 (확장 가능)

## 🗄️ 데이터베이스 스키마

### 주요 테이블

- `users`: 사용자 정보
- `user_social_auth`: 소셜 인증 정보
- `races`: 경마 정보
- `bets`: 베팅 정보
- `user_point_balances`: 포인트 잔액
- `user_points`: 포인트 거래 내역

### 스키마 초기화 파일

- `mysql/init/01_create_database.sql`: 기본 데이터베이스 생성
- `mysql/init/02_update_schema.sql`: 기존 스키마 업데이트
- `mysql/init/03_complete_schema.sql`: 완전한 스키마 (권장)

## 🐳 Docker 지원

```bash
# 개발 환경
docker-compose -f docker-compose.dev.yml up -d

# 프로덕션 환경
docker-compose -f docker-compose.prod.yml up -d
```

## 📝 API 문서

서버 실행 후 `http://localhost:3002/api`에서 Swagger API 문서를 확인할 수 있습니다.

## 🧪 테스트

```bash
# 단위 테스트
npm run test

# E2E 테스트
npm run test:e2e

# 테스트 커버리지
npm run test:cov
```
