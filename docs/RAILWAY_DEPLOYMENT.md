# Railway 배포 가이드

OddsCast 서버를 Railway에 배포할 때의 절차와 개념 정리.

---

## 목차

1. [개요](#1-개요)
2. [TypeORM vs DB (개념 정리)](#2-typeorm-vs-db-개념-정리)
3. [DB 구축/선택](#3-db-구축선택)
4. [Railway 설정](#4-railway-설정)
5. [프로덕션 스키마 적용 (필요 시)](#5-프로덕션-스키마-적용-필요-시)
6. [첫 배포 체크리스트](#6-첫-배포-체크리스트)
7. [요약](#7-요약)

---

## 1. 개요

| 구분 | 설명 |
|------|------|
| **호스팅** | Railway에 Server(NestJS) 배포 |
| **DB** | Railway PostgreSQL add-on 또는 외부 PostgreSQL 사용 (직접 구축/선택) |
| **TypeORM** | 무료 ORM. dev/prod 동일 스키마 사용, `DATABASE_URL`만 다르게 설정 |

- **개발:** `server/.env` → 로컬/개발용 PostgreSQL
- **프로덕션:** Railway 환경 변수 `DATABASE_URL` → 운영용 PostgreSQL

---

## 2. TypeORM vs DB (개념 정리)

| 항목 | TypeORM | DB (PostgreSQL) |
|------|--------|------------------|
| **역할** | 앱에서 DB 접근할 때 쓰는 라이브러리(ORM) | 실제 데이터를 저장하는 서버 |
| **비용** | 무료 (유료 상품 아님) | Railway/외부 서비스 요금 발생 |
| **용량·한도** | 없음 (라이브러리) | 스토리지·연결 수 등 한도 있음 |
| **업그레이드** | 대상 아님 | 한도 넘으면 DB 호스팅 플랜 업그레이드 |

- TypeORM은 **우리가 고른 DB**에 `DATABASE_URL`로 연결만 한다. ORM 전용 “DB 사용료”나 “용량 플랜”은 없다.
- Railway에 PostgreSQL을 추가하면 **DB를 Railway에서 직접 구축해 쓰는 것**과 같다. 그 비용은 Railway 요금이다.

---

## 3. DB 구축/선택

- **Railway PostgreSQL:** 프로젝트에서 Add-on → PostgreSQL 추가 후, 발급되는 연결 문자열을 사용.
- **외부 PostgreSQL:** Supabase, Neon 등에서 만든 DB의 connection string 사용.
- 프로덕션 DB URL 하나를 확보한 뒤, 아래 [4.2 환경 변수](#42-환경-변수-server)의 `DATABASE_URL`에 설정한다.

---

## 4. Railway 설정

### 4.1 프로젝트 / 서비스

1. [Railway](https://railway.app)에서 새 프로젝트 생성.
2. **PostgreSQL** 서비스 추가 (또는 외부 DB URL 준비).
3. **Server(NestJS)** 서비스 추가 (GitHub 연동 또는 `railway up`).

### 4.2 GitHub Actions로 자동 배포 (선택)

저장소에 `.github/workflows/deploy.yml`이 있음. `main`(또는 `master`) 푸시 시 Railway로 배포하려면:

1. Railway Dashboard → Project → **Settings** → **Tokens**에서 프로젝트 토큰 생성.
2. GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions**에서 `RAILWAY_TOKEN` 추가.
3. Railway 서비스 이름이 `server`가 아니면 workflow의 `railway up --service server`에서 서비스 이름을 변경.

자세한 절차는 이 문서와 [TODO_CONTINUE.md](TODO_CONTINUE.md) 참고.

### 4.3 환경 변수 (Server)

Railway 서비스 → **Variables**에 다음 설정:

| 변수 | 필수 | 설명 |
|------|------|------|
| `DATABASE_URL` | ✅ | 프로덕션 PostgreSQL 연결 문자열 |
| `PORT` | ✅ | 서버 포트 (Railway가 주입할 수 있음) |
| `NODE_ENV` | ✅ | `production` |
| `JWT_SECRET` | ✅ | JWT 서명용 시크릿 |
| `GEMINI_API_KEY` | 선택 | Gemini API (예측 등) |
| `KRA_SERVICE_KEY` | 선택 | KRA 공공데이터 API |
| `SENTRY_DSN` | 선택 | Sentry 에러 추적 (설정 시 main.ts에서 조건부 초기화) |

- dev용 DB는 로컬 `server/.env`에만 두고, Railway에는 **운영 DB URL만** 넣는다.
- 에러 모니터링: [guides/MONITORING_SETUP.md](guides/MONITORING_SETUP.md) 참고.

### 4.4 빌드 & 실행

**방법 A — Docker (권장)**  
저장소 루트에 `server/Dockerfile`과 `.dockerignore`가 있음. Railway에서 Dockerfile로 배포할 때:

| 설정 | 값 |
|------|-----|
| **Root directory** | `.` (저장소 루트) |
| **Dockerfile path** | `server/Dockerfile` |
| **Build** | (Docker 빌드로 자동) |
| **Start** | (이미지 내 `CMD` 사용) |

- 로컬 테스트: 저장소 루트에서 `docker build -f server/Dockerfile .` 후 `docker run -p 3000:3000 -e DATABASE_URL=... <image>` 로 실행.

**방법 B — Nixpacks / 수동 빌드**  
Railway가 Dockerfile 없이 빌드하는 경우:

| 설정 | 값 |
|------|-----|
| **Root directory** | `server` |
| **Build** | `pnpm install && pnpm run build` (루트에서 shared 빌드 후 server 빌드 필요 시 상위에서 실행) |
| **Start** | `pnpm start` 또는 `node dist/main` |

**테스트 기간:** 스키마 적용 없이 **구동 테스트만** 해도 됨. DB 연결·API·`/health` 응답만 확인.  
**이후:** 스키마 적용이 필요하면 [5. 프로덕션 스키마 적용](#5-프로덕션-스키마-적용-필요-시)에서 DDL 또는 TypeORM 마이그레이션 실행.

---

## 5. 프로덕션 스키마 적용 (필요 시)

신규 프로덕션 DB에는 테이블·Enum이 없으므로 한 번 적용해야 합니다.

- **방법 A — DDL 수동 적용:** `docs/db/schema.sql`을 프로덕션 DB에 실행 (psql 또는 DB 클라이언트).
- **방법 B — TypeORM 마이그레이션:** 서버에서 `pnpm run migration:run` 실행 (배포 스크립트 또는 수동).

```bash
cd server
pnpm run migration:run
```

- 시드 데이터(PointConfig, SubscriptionPlan 등)가 필요하면 별도 SQL 또는 시드 스크립트로 적용.

---

## 6. 첫 배포 체크리스트

| 순서 | 항목 | 비고 |
|------|------|------|
| 1 | Railway 프로젝트 + PostgreSQL 서비스 생성 | Add-on 또는 외부 DB URL |
| 2 | Server 서비스 추가 (GitHub 연동 또는 `railway up`) | Root/Dockerfile 경로 확인 |
| 3 | Variables: `DATABASE_URL`, `PORT`, `NODE_ENV`, `JWT_SECRET` | 필수 4개 |
| 4 | 프로덕션 스키마 적용 | §5 — schema.sql 또는 migration:run |
| 5 | `GET /health` 또는 `GET /api/health` 확인 | 브라우저/curl |
| 6 | (선택) `SENTRY_DSN`, `GEMINI_API_KEY`, `KRA_SERVICE_KEY` | 모니터링·기능용 |
| 7 | (선택) GitHub Actions `RAILWAY_TOKEN` → push 시 자동 배포 | §4.2 |

---

## 7. 요약

- **Railway:** Server 배포. DB는 Railway PostgreSQL 또는 외부 PostgreSQL.
- **TypeORM:** dev/prod 동일 사용. 연결만 `DATABASE_URL`로 구분. 용량·업그레이드는 DB 쪽만 해당.
- **비용:** Railway(및 DB 호스팅)만 발생. TypeORM은 무료 ORM.
