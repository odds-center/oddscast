# Prisma 설정 가이드 (OddsCast Server)

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

## 2. 로컬 PostgreSQL + 스키마 oddscast + DBeaver

로컬 개발 시 **PostgreSQL**만 사용하고, **스키마 이름 `oddscast`**, **DBeaver** 연결까지 한 번에 하려면 **[LOCAL_DB_SETUP.md](LOCAL_DB_SETUP.md)** 를 따르면 됩니다. 요약:

- DB·스키마 생성 SQL 실행 후 `DATABASE_URL="...?schema=oddscast"` 설정
- `pnpm run db:migrate:deploy` 로 모든 마이그레이션 적용 → `pnpm run db:seed`

---

## 3. 데이터베이스 연결 방식

PrismaService는 `DATABASE_URL` 형식에 따라 자동으로 연결 방식을 선택합니다.

| URL 형식 | 연결 방식 | 용도 |
|----------|----------|------|
| `prisma://` 또는 `prisma+postgres://` | Prisma Accelerate | 원격 풀링, 저지연 |
| `postgresql://` | PrismaPg 어댑터 (직접 연결) | 로컬/클라우드 PostgreSQL |

### Prisma Accelerate

```env
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=__API_KEY__"
```

- Prisma Data Platform에서 API 키 발급
- **주의**: API 키 절대 공개 금지 (채팅, Git 커밋, 스크린샷 등)
- 연결 풀링 및 저지연 쿼리 제공

### 직접 연결 (PostgreSQL)

```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

**Connection Pooler 사용 시 예시:**
```env
DATABASE_URL="postgresql://user:password@pooler-host:6543/database"
```

**Dev vs Prod:** Prisma 스키마·마이그레이션은 dev/prod 동일. 개발 시에는 `server/.env`의 `DATABASE_URL`(로컬/개발 DB), 프로덕션(Railway 등)에서는 배포 환경에 설정한 `DATABASE_URL`(별도 운영 DB)만 다르게 두면 됨. → [Railway 배포 가이드](../RAILWAY_DEPLOYMENT.md)

---

## 4. .env 설정

`server/.env` 파일 (루트에서 `./scripts/setup-env.sh` 실행으로 생성 또는 직접 작성):

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

## 5. 로컬 개발용 DB (무료 한도 없음)

지금은 **개발만** 하므로 Prisma/호스팅 무료 한도와 관계없이 **로컬 PostgreSQL**만 사용하면 됩니다.

1. **로컬 PostgreSQL** 설치 후 DB 생성 (예: `createdb oddscast`).
2. **`server/.env`** 에서 `DATABASE_URL`을 로컬로 설정 (스키마 `oddscast` 필수):

   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/oddscast?schema=oddscast"
   ```

   (USER/PASSWORD는 본인 환경에 맞게. DB·스키마 생성·DBeaver 연결은 [LOCAL_DB_SETUP.md](LOCAL_DB_SETUP.md) 참고.)

3. **스키마·테이블 생성:** DB와 스키마 `oddscast`를 만든 뒤 마이그레이션 적용:

   ```bash
   cd server
   pnpm run db:migrate:deploy
   pnpm run db:seed
   ```

   (DB·스키마 생성 SQL은 [LOCAL_DB_SETUP.md](LOCAL_DB_SETUP.md) 참고.)

- **로컬:** `DATABASE_URL`에 `?schema=oddscast` 포함 → `db:migrate:deploy`로 모든 마이그레이션 적용. DBeaver에서 DB=`oddscast`, 스키마=`oddscast`로 연결.
- **배포(프로덕션)** 시에도 `db:migrate:deploy` 사용 (해당 환경의 `DATABASE_URL`만 다르게 설정).

---

## 6. 데이터베이스 초기화 요약

```bash
cd server

# 1) Prisma Client 생성
pnpm run db:generate

# 2) 스키마를 DB에 반영 (로컬 개발: db push)
pnpm run db:push

# 3) 시드 데이터 삽입
pnpm run db:seed

# 한 번에 실행
pnpm run db:init
```

### package.json 스크립트

| 스크립트 | 설명 |
|----------|------|
| `db:generate` | Prisma Client 생성 |
| `db:migrate` | (로컬) migrate dev — 현재 baseline 구조상 새 DB에선 실패할 수 있음 |
| `db:migrate:deploy` | (배포) 마이그레이션만 적용, shadow DB 없음 |
| `db:push` | schema.prisma → DB 반영 (로컬 개발 권장) |
| `db:seed` | seed.sql 실행 |
| `db:init` | db:push + db:seed |

---

## 7. prisma.config.ts (CLI용)

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
- **직접 연결만 사용 시**: `postgresql://` URL 사용 (로컬 개발 권장)

---

## 8. 주요 파일 구조

```
server/
├── .env                 # 환경 변수 (./scripts/setup-env.sh 로 생성)
├── prisma.config.ts    # Prisma CLI 설정
├── prisma/
│   ├── schema.prisma   # 모델 정의
│   └── seed.sql        # 초기 데이터 (PointConfig, SubscriptionPlan, GlobalConfig 등)
└── src/prisma/
    ├── prisma.service.ts  # Accelerate / pg 어댑터 자동 선택
    └── prisma.module.ts
```

---

## 9. Prisma 7 변경 사항

| 항목 | 설명 |
|------|------|
| **Driver Adapter** | `postgresql://` URL 시 `@prisma/adapter-pg` + `pg` 사용 |
| **Accelerate** | `prisma+postgres://` URL 시 `accelerateUrl` 사용 (어댑터 불필요) |
| **prisma.config.ts** | `url`은 schema가 아닌 config에서 설정 |
| **dotenv** | `import "dotenv/config"`로 env 로드 (prisma.config.ts 상단) |

---

## 10. 트러블슈팅

### ETIMEDOUT

- **원인**: Accelerate URL을 pg 어댑터에 전달한 경우
- **해결**: PrismaService가 URL 형식으로 자동 분기 (이미 적용됨)

### DATABASE_URL is not defined

- `.env` 파일이 `server/` 디렉토리에 있는지 확인
- 루트에서 `./scripts/setup-env.sh` 실행 후 값 확인

### EADDRINUSE: address already in use :::3000

- **원인**: `PORT=3000`인데 Webapp이 이미 3000 사용 중이거나, 이전 서버 프로세스가 남아 있음
- **해결**:
  1. `server/.env`에 `PORT=3001` 설정
  2. 사용 중인 프로세스 종료: `lsof -i :3000` 후 `kill -9 <PID>`
  3. 또는 Webapp(3000)과 Server(3001) 포트가 겹치지 않도록 확인

### prisma generate 실패

- `dotenv` 패키지 설치: `npm install -D dotenv`
- `prisma.config.ts` 상단에 `import "dotenv/config"` 확인
