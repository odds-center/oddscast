# Railway 배포 가이드

OddsCast 서버를 Railway에 배포할 때의 절차와 개념 정리.

---

## 목차

1. [개요](#1-개요)
2. [Prisma vs DB (개념 정리)](#2-prisma-vs-db-개념-정리)
3. [DB 구축/선택](#3-db-구축선택)
4. [Railway 설정](#4-railway-설정)
5. [프로덕션 마이그레이션 (필요 시)](#5-프로덕션-마이그레이션-필요-시)
6. [요약](#6-요약)

---

## 1. 개요

| 구분 | 설명 |
|------|------|
| **호스팅** | Railway에 Server(NestJS) 배포 |
| **DB** | Railway PostgreSQL add-on 또는 외부 PostgreSQL 사용 (직접 구축/선택) |
| **Prisma** | 무료 ORM. dev/prod 동일 스키마 사용, `DATABASE_URL`만 다르게 설정 |

- **개발:** `server/.env` → 로컬/개발용 PostgreSQL
- **프로덕션:** Railway 환경 변수 `DATABASE_URL` → 운영용 PostgreSQL

---

## 2. Prisma vs DB (개념 정리)

| 항목 | Prisma | DB (PostgreSQL) |
|------|--------|------------------|
| **역할** | 앱에서 DB 접근할 때 쓰는 라이브러리(ORM) | 실제 데이터를 저장하는 서버 |
| **비용** | 무료 (유료 상품 아님) | Railway/외부 서비스 요금 발생 |
| **용량·한도** | 없음 (라이브러리) | 스토리지·연결 수 등 한도 있음 |
| **업그레이드** | 대상 아님 | 한도 넘으면 DB 호스팅 플랜 업그레이드 |

- Prisma는 **우리가 고른 DB**에 `DATABASE_URL`로 연결만 한다. Prisma 전용 “DB 사용료”나 “용량 플랜”은 없다.
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

### 4.2 환경 변수 (Server)

Railway 서비스 → **Variables**에 다음 설정:

| 변수 | 필수 | 설명 |
|------|------|------|
| `DATABASE_URL` | ✅ | 프로덕션 PostgreSQL 연결 문자열 |
| `PORT` | ✅ | 서버 포트 (Railway가 주입할 수 있음) |
| `NODE_ENV` | ✅ | `production` |
| `JWT_SECRET` | ✅ | JWT 서명용 시크릿 |
| `GEMINI_API_KEY` | 선택 | Gemini API (예측 등) |
| `KRA_SERVICE_KEY` | 선택 | KRA 공공데이터 API |

- dev용 DB는 로컬 `server/.env`에만 두고, Railway에는 **운영 DB URL만** 넣는다.

### 4.3 빌드 & 실행

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

**테스트 기간:** 마이그레이션 없이 **구동 테스트만** 해도 됨. DB 연결·API·`/health` 응답만 확인.  
**이후:** 스키마 적용이 필요하면 [5. 프로덕션 마이그레이션](#5-프로덕션-마이그레이션)에서 `prisma migrate deploy` 실행하거나 Start 커맨드에 포함하면 됨.

---

## 5. 프로덕션 마이그레이션 (필요 시)

지금 당장은 할 필요 없음. 테스트 기간에는 구동 확인만 하고, 나중에 프로덕션 DB에 스키마를 맞출 때 아래를 사용하면 됨.

- 로컬에서는 `prisma migrate dev`로 개발 DB에만 적용.
- 프로덕션 DB에는 **필요할 때** 아래 한 번(또는 배포 스크립트에서) 실행:

- 로컬에서는 `prisma migrate dev`로 개발 DB에만 적용.
- 프로덕션 DB에는 **배포 시** 아래 한 번(또는 배포 스크립트에서) 실행:

```bash
cd server
npx prisma migrate deploy
```

- 이미 적용된 마이그레이션은 건너뛰고, 미적용분만 적용된다.
- seed 필요 시: `npx prisma db execute --file prisma/seed.sql` (실행 환경의 `DATABASE_URL`이 프로덕션 DB를 가리켜야 함).

---

## 6. 요약

- **Railway:** Server 배포. DB는 Railway PostgreSQL 또는 외부 PostgreSQL.
- **Prisma:** dev/prod 동일 사용. 연결만 `DATABASE_URL`로 구분. 용량·업그레이드는 DB 쪽만 해당.
- **비용:** Railway(및 DB 호스팅)만 발생. Prisma는 무료 ORM.
