# Prisma 설정 가이드 (Golden Race Server)

> Prisma 7 + PostgreSQL 기반의 NestJS 서버 데이터베이스 설정

---

## 1. 포트 구성 (전체 프로젝트)

| 앱 | 포트 | 실행 명령 | URL |
|----|------|----------|-----|
| **Webapp** | 3000 | `cd webapp && npm run dev` | http://localhost:3000 |
| **Server (API)** | 3001 | `cd server && npm run dev` | http://localhost:3001 |
| **Admin** | 3002 | `cd admin && pnpm dev` | http://localhost:3002 |
| **Mobile** | 3006 | `cd mobile && npm run start` | Metro bundler (Expo) |

### API 연동 URL

- **Server API**: `http://localhost:3001/api`
- **Webapp** (Mobile WebView base): `http://localhost:3000`
- **Swagger 문서**: http://localhost:3001/docs

---

## 2. 데이터베이스 연결 방식

PrismaService는 `DATABASE_URL` 형식에 따라 자동으로 연결 방식을 선택합니다.

| URL 형식 | 연결 방식 | 용도 |
|----------|----------|------|
| `prisma://` 또는 `prisma+postgres://` | Prisma Accelerate | 원격 풀링, 저지연 |
| `postgresql://` | PrismaPg 어댑터 (직접 연결) | Supabase, 로컬 PostgreSQL 등 |

### Prisma Accelerate

```env
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=__API_KEY__"
```

- Prisma Data Platform에서 API 키 발급
- **주의**: API 키 절대 공개 금지 (채팅, Git 커밋, 스크린샷 등)
- 연결 풀링 및 저지연 쿼리 제공

### 직접 연결 (Supabase / PostgreSQL)

```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

**Supabase 예시 (Transaction Pooler):**
```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"
```

---

## 3. .env 설정

`server/.env` 파일 (`.env.example` 복사 후 값 설정):

```env
# PostgreSQL — Prisma Accelerate 또는 Direct URL
DATABASE_URL="prisma+postgres://..."  # 또는 postgresql://...

# 서버 포트
PORT=3001

# Google OAuth
GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key

# JWT 시크릿 (openssl rand -base64 32)
JWT_SECRET=your-jwt-secret-at-least-32-chars
```

---

## 4. 데이터베이스 초기화

```bash
cd server

# 1) Prisma Client 생성
npm run db:generate

# 2) 스키마를 DB에 반영 (마이그레이션 없음)
npm run db:push

# 3) 시드 데이터 삽입
npm run db:seed

# 한 번에 실행
npm run db:init
```

### package.json 스크립트

| 스크립트 | 설명 |
|----------|------|
| `db:generate` | Prisma Client 생성 |
| `db:push` | schema.prisma → DB 반영 |
| `db:seed` | seed.sql 실행 |
| `db:init` | db:push + db:seed |

---

## 5. prisma.config.ts (CLI용)

Prisma CLI 명령(`db push`, `db execute`, `generate` 등)에서 사용:

```typescript
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

- **Prisma Accelerate 사용 시**: `db push`, `db execute`는 `prisma+postgres://` URL로 동작 (PostgreSQL의 경우)
- **직접 연결만 사용 시**: `postgresql://` URL 사용

---

## 6. 주요 파일 구조

```
server/
├── .env                 # 환경 변수 (DATABASE_URL 필수)
├── .env.example         # 예시 템플릿
├── prisma.config.ts    # Prisma CLI 설정
├── prisma/
│   ├── schema.prisma   # 모델 정의
│   └── seed.sql        # 초기 데이터 (PointConfig, SubscriptionPlan, GlobalConfig 등)
└── src/prisma/
    ├── prisma.service.ts  # Accelerate / pg 어댑터 자동 선택
    └── prisma.module.ts
```

---

## 7. Prisma 7 변경 사항

| 항목 | 설명 |
|------|------|
| **Driver Adapter** | `postgresql://` URL 시 `@prisma/adapter-pg` + `pg` 사용 |
| **Accelerate** | `prisma+postgres://` URL 시 `accelerateUrl` 사용 (어댑터 불필요) |
| **prisma.config.ts** | `url`은 schema가 아닌 config에서 설정 |
| **dotenv** | `import "dotenv/config"`로 env 로드 (prisma.config.ts 상단) |

---

## 8. 트러블슈팅

### ETIMEDOUT

- **원인**: Accelerate URL을 pg 어댑터에 전달한 경우
- **해결**: PrismaService가 URL 형식으로 자동 분기 (이미 적용됨)

### DATABASE_URL is not defined

- `.env` 파일이 `server/` 디렉토리에 있는지 확인
- `cp .env.example .env` 후 값 설정

### EADDRINUSE: address already in use :::3000

- **원인**: `PORT=3000`인데 Webapp이 이미 3000 사용 중이거나, 이전 서버 프로세스가 남아 있음
- **해결**:
  1. `server/.env`에 `PORT=3001` 설정
  2. 사용 중인 프로세스 종료: `lsof -i :3000` 후 `kill -9 <PID>`
  3. 또는 Webapp(3000)과 Server(3001) 포트가 겹치지 않도록 확인

### prisma generate 실패

- `dotenv` 패키지 설치: `npm install -D dotenv`
- `prisma.config.ts` 상단에 `import "dotenv/config"` 확인
