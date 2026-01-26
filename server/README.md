# 🖥️ Golden Race Server

**NestJS 기반 경마 예측 게임 백엔드 API 서버**

> TypeScript + Supabase PostgreSQL + TypeORM

---

## 📋 목차

- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [빠른 시작](#-빠른-시작)
- [프로젝트 구조](#-프로젝트-구조)
- [API 문서](#-api-문서)

---

## ✨ 주요 기능

### 인증 시스템

- 🔐 **Google OAuth 2.0** - 소셜 로그인
- 🎫 **JWT 토큰** - API 인증
- 🔄 **Refresh Token** - 자동 갱신

### KRA API 통합

- 📡 **한국마사회 API** - 공식 데이터 연동
- 📊 **4개 API 통합**
  - 경주계획표 (API72_2)
  - 경주기록 (API4_3)
  - 출전표 (API26_2)
  - 확정배당율 (API160)
- 🔄 **자동 수집** - 배치 작업 스케줄링

### 데이터 관리

- 💾 **로컬 DB 캐싱** - 빠른 응답 속도
- 🔄 **자동 동기화** - 매일 06:00 배치 실행
- 📈 **통계 생성** - 경주마/기수 분석

### 게임 시스템

- 🎯 **예측(베팅) 관리** - 7가지 승식 지원
- 🎁 **포인트 시스템** - 가상 화폐 관리
- 📊 **결과 계산** - 자동 정산

---

## 🛠️ 기술 스택

### Backend

```typescript
Framework: NestJS 10.x
Language: TypeScript 5.x
Runtime: Node.js 18+
```

### Database

```sql
Database: Supabase PostgreSQL 15
ORM: TypeORM
Migration: TypeORM CLI
```

### Authentication

```typescript
Strategy: Passport.js
OAuth: Google OAuth 2.0
Token: JWT (jsonwebtoken)
```

### Infrastructure

```yaml
Container: Docker + Docker Compose
Proxy: Nginx (프로덕션)
Scheduler: @nestjs/schedule
Logger: Winston
```

---

## 🚀 빠른 시작

### 사전 요구사항

```bash
Node.js 18+
npm or yarn
Supabase Account (무료)
```

### 1. 의존성 설치

```bash
cd server
npm install
```

### 2. 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집 (Supabase 연결 정보 필수!)
# - Supabase DB 설정 (SUPABASE_DB_HOST, PASSWORD 등)
# - Google OAuth 설정
# - JWT Secret
# - KRA API Key
```

**⚠️ Supabase 설정 필수**: [SUPABASE_REQUIREMENTS.md](../SUPABASE_REQUIREMENTS.md) 참고

**환경변수 가이드**: [환경 변수 설정](../docs/setup/ENVIRONMENT.md)

### 3. 환경변수 설정

시스템 환경변수로 Supabase 연결 정보를 설정합니다.

**자세한 가이드**: [ENV_SETUP.md](ENV_SETUP.md) 참고

```bash
# 예시: Supabase 환경변수
export SUPABASE_DB_HOST=db.your-project.supabase.co
export SUPABASE_DB_PASSWORD=your-password
export KRA_API_KEY=your-kra-key
# ... 나머지 환경변수
```

### 4. 데이터베이스 스키마 생성

**자동 동기화 (개발 - 빠른 테스트)**

`src/app.module.ts`에서 일시적으로:

```typescript
synchronize: true; // 개발 환경에서만!
```

**마이그레이션 (프로덕션 권장)**

```bash
npm run typeorm migration:generate -- -n InitialSchema
npm run typeorm migration:run
```

### 5. 서버 시작

```bash
# 개발 모드
npm run start:dev

# 프로덕션 모드
npm run build
npm run start:prod
```

서버가 `http://localhost:3002`에서 실행됩니다.

---

## 📁 프로젝트 구조

```
server/src/
├── 🔐 auth/                 # 인증 및 권한
│   ├── strategies/          # Passport 전략
│   ├── guards/              # 인증 가드
│   └── dto/                 # 인증 DTO
│
├── 👤 users/                # 사용자 관리
│   ├── entities/            # User 엔티티
│   └── dto/                 # 사용자 DTO
│
├── 📡 kra-api/              # 한국마사회 API
│   ├── services/            # 개별 API 서비스
│   ├── constants/           # API 상수
│   └── utils/               # 유틸리티
│
├── 🏇 races/                # 경주 정보
│   ├── entities/            # Race 엔티티
│   └── dto/                 # 경주 DTO
│
├── 🎯 bets/                 # 예측(베팅)
│   ├── entities/            # Bet 엔티티
│   └── dto/                 # 베팅 DTO
│
├── 🎁 points/               # 포인트 시스템
│   ├── entities/            # Point 엔티티
│   └── dto/                 # 포인트 DTO
│
├── 📊 results/              # 경주 결과
│   ├── entities/            # Result 엔티티
│   └── dto/                 # 결과 DTO
│
├── ⏰ batch/                # 배치 작업
│   └── batch.service.ts     # 스케줄러
│
└── 🔧 common/               # 공통 모듈
    ├── filters/             # 예외 필터
    ├── interceptors/        # 인터셉터
    └── pipes/               # 파이프
```

---

## 🗄️ 데이터베이스

### 주요 테이블

| 테이블               | 설명        | 엔티티          |
| -------------------- | ----------- | --------------- |
| `users`              | 사용자 정보 | User            |
| `race_plans`         | 경주 계획   | RacePlan        |
| `races`              | 경주 정보   | Race            |
| `entry_details`      | 출전표      | EntryDetail     |
| `race_horse_results` | 경주 결과   | RaceHorseResult |
| `dividend_rates`     | 배당율      | DividendRate    |
| `bets`               | 예측(베팅)  | Bet             |
| `user_points`        | 포인트 내역 | UserPoint       |

### 데이터베이스 관리 명령어

```bash
# 로컬 PostgreSQL 컨테이너 관리 (로컬 개발용)
npm run docker:postgres      # 시작
npm run docker:postgres:stop # 중지
npm run db:logs              # 로그 확인

# 데이터베이스 초기화 (로컬 PostgreSQL)
npm run db:drop              # 드롭
npm run db:create            # 생성
npm run db:reset             # 전체 리셋
npm run db:status            # 상태 확인
```

**Supabase 사용 시**: Supabase Dashboard → Table Editor에서 관리

### Supabase Dashboard

```
URL: https://app.supabase.com
기능: Table Editor, SQL Editor, Database 관리
```

**상세 가이드**:

- [Supabase 설정 가이드](SUPABASE_SETUP.md)
- [Supabase 필요 정보](../SUPABASE_REQUIREMENTS.md)

---

## 📡 KRA API

### 지원 API

| API         | 기능       | 문서                                     |
| ----------- | ---------- | ---------------------------------------- |
| **API72_2** | 경주계획표 | [📄](docs/한국마사회_경주계획표.md)      |
| **API4_3**  | 경주기록   | [📄](docs/한국마사회_경주기록.md)        |
| **API26_2** | 출전표     | [📄](docs/한국마사회_출전표_상세정보.md) |
| **API160**  | 확정배당율 | [📄](docs/한국마사회_확정_배당율.md)     |

### 배치 작업

```bash
# 자동 스케줄 (매일 06:00)
- 전날 경주 결과 수집
- 오늘 경주 계획 수집
- 확정 배당율 수집

# 수동 실행
npm run batch:sync -- --date=2025-10-10
```

자세한 내용: [KRA API 마이그레이션 가이드](KRA_API_MIGRATION_GUIDE.md)

---

## 📖 API 문서

### Swagger UI

서버 실행 후 접속:

```
http://localhost:3002/api
```

### 주요 엔드포인트

#### 인증

```http
POST   /api/auth/google             # Google OAuth 시작
GET    /api/auth/google/callback    # OAuth 콜백
POST   /api/auth/refresh            # 토큰 갱신
POST   /api/auth/logout             # 로그아웃
```

#### 경주

```http
GET    /api/races                   # 경주 목록
GET    /api/races/:id               # 경주 상세
GET    /api/races/schedule          # 경주 일정
GET    /api/races/:id/entries       # 출전표
GET    /api/races/:id/results       # 경주 결과
GET    /api/races/:id/dividends     # 배당율
```

#### 예측(베팅)

```http
POST   /api/bets                    # 예측 생성
GET    /api/bets                    # 예측 목록
GET    /api/bets/:id                # 예측 상세
DELETE /api/bets/:id                # 예측 취소
```

#### 포인트

```http
GET    /api/points/balance          # 포인트 잔액
GET    /api/points/history          # 포인트 내역
POST   /api/points/charge           # 포인트 충전
```

#### KRA API (직접 호출)

```http
GET    /api/kra-api/status          # API 상태
GET    /api/kra-api/race-plans      # 경주계획표
GET    /api/kra-api/race-records    # 경주기록
GET    /api/kra-api/entry-sheet     # 출전표
GET    /api/kra-api/dividend-rates  # 확정배당율
```

---

## 🐳 Docker

### 개발 환경

```bash
# MySQL만 Docker로
npm run docker:mysql

# 전체 개발 환경
docker-compose -f docker-compose.dev.yml up -d
```

### 프로덕션 환경

```bash
# 빌드
docker-compose -f docker-compose.prod.yml build

# 실행
docker-compose -f docker-compose.prod.yml up -d
```

### 서비스 구성

| 서비스     | 포트    | 설명                     |
| ---------- | ------- | ------------------------ |
| app        | 3002    | NestJS 서버              |
| mysql      | 3306    | MySQL 데이터베이스       |
| phpmyadmin | 8080    | DB 관리 도구             |
| nginx      | 80, 443 | 리버스 프록시 (프로덕션) |

자세한 내용: [Docker 설정 가이드](../docs/setup/DOCKER_SETUP.md)

---

## 🧪 테스트

```bash
# 단위 테스트
npm test

# E2E 테스트
npm run test:e2e

# 테스트 커버리지
npm run test:cov

# 특정 파일 테스트
npm test -- users.service.spec.ts
```

---

## 🔧 개발 도구

### 코드 품질

```bash
# ESLint
npm run lint
npm run lint:fix

# Prettier
npm run format

# TypeScript 타입 체크
npm run build
```

### 로그 확인

```bash
# 서버 로그
tail -f logs/combined.log

# KRA API 로그
tail -f logs/combined.log | grep "KRA API"

# 에러 로그만
tail -f logs/error.log
```

---

## 📚 문서

**통합 문서 허브**: [../docs/](../docs/README.md)

### 빠른 링크

#### 아키텍처

- [데이터 저장소](../docs/architecture/server/DATA_STORAGE.md) - DB 구조 및 엔티티
- [엔티티 상태](../docs/architecture/server/ENTITY_STATUS.md) - 엔티티 관리

#### 개발 가이드

- [데이터 수집](../docs/guides/server/DATA_COLLECTION_GUIDE.md) - KRA API 수집
- [KRA API 마이그레이션](../docs/guides/server/KRA_API_MIGRATION_GUIDE.md) - API 통합

#### API 문서

- [경주기록 API](../docs/api/kra/한국마사회_경주기록.md) - API4_3
- [출전표 API](../docs/api/kra/한국마사회_출전표_상세정보.md) - API26_2
- [확정배당율 API](../docs/api/kra/한국마사회_확정_배당율.md) - API160
- [API 매핑](../docs/api/rest/SERVER_MOBILE_API_MAPPING.md) - 서버-모바일 연동

#### 설정 가이드

- [빠른 시작](../docs/setup/QUICK_START.md) - 5분 안에 실행
- [Docker 설정](../docs/setup/DOCKER_SETUP.md) - 컨테이너 환경
- [환경 변수](../docs/setup/ENVIRONMENT.md) - 설정 관리

---

## 🔍 문제 해결

### 데이터베이스 연결 실패

```bash
# MySQL 상태 확인
docker ps | grep mysql

# MySQL 재시작
docker restart goldenrace-mysql-dev

# 환경변수 확인
cat .env | grep DB_
```

### KRA API 오류

```bash
# API 키 확인
cat .env | grep KRA_API_KEY

# API 상태 확인
curl http://localhost:3002/kra-api/status

# 로그 확인
tail -f logs/combined.log | grep "KRA"
```

### 포트 충돌

```bash
# 포트 사용 확인
lsof -i :3002  # 서버 포트
lsof -i :3306  # MySQL 포트

# 프로세스 종료
kill -9 <PID>
```

---

## 📦 배포

### 빌드

```bash
# TypeScript 컴파일
npm run build

# 빌드 확인
npm run start:prod
```

### 환경별 설정

```bash
# 개발 환경
NODE_ENV=development npm run start:dev

# 프로덕션 환경
NODE_ENV=production npm run start:prod
```

---

## 🤝 기여

기여를 환영합니다!

1. Fork the Project
2. Create Feature Branch (`git checkout -b feature/Feature`)
3. Commit Changes (`git commit -m 'Add Feature'`)
4. Push to Branch (`git push origin feature/Feature`)
5. Open Pull Request

---

## 📞 문의

- **이메일**: vcjsm2283@gmail.com
- **프로젝트**: [Golden Race](../README.md)
- **이슈**: GitHub Issues

---

<div align="center">

**마지막 업데이트**: 2026년 1월 26일 - Supabase PostgreSQL 마이그레이션

🖥️ **Golden Race Server** - NestJS + Supabase Backend API

</div>
