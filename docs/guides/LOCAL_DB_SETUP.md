# 로컬 PostgreSQL + DBeaver + Prisma (스키마 oddscast)

로컬에서 PostgreSQL로 개발하고, DBeaver로 연결하며, 스키마 이름을 `oddscast`로 두고 Prisma 마이그레이션을 모두 적용하는 방법입니다.

**Last updated:** 2026-03-01

---

## 0. 한 번에 로컬 셋업 (스크립트)

1. **Docker Desktop** 실행 후 터미널에서:
   ```bash
   ./scripts/local-setup.sh
   ```
   - PostgreSQL 컨테이너 기동 시도 → DB 마이그레이션 + 시드까지 실행.
   - `server/.env` 가 없으면 `.env.example` 기반으로 생성 (로컬용 `DATABASE_URL`).
2. **로컬에서 서버 실행** 시에도 같은 DB를 쓰려면 `server/.env` 의 `DATABASE_URL` 이 로컬 URL 인지 확인:
   `postgresql://oddscast:oddscast@localhost:5432/oddscast?schema=oddscast`

---

## 1. 로컬에서 DB 실행하기

PostgreSQL을 로컬에서 띄우는 방법입니다. **Docker**가 가장 간단합니다.

### 1.1 Docker (권장)

프로젝트 루트에 `docker-compose.yml`이 있습니다. PostgreSQL만 띄우려면:

```bash
# 프로젝트 루트에서
docker compose up -d postgres
```

- **Host:** `localhost`
- **Port:** `5432`
- **Database:** `oddscast`
- **User / Password:** `oddscast` / `oddscast`
- **스키마:** 최초 기동 시 `oddscast` 스키마가 자동 생성됩니다 (`server/prisma/scripts/docker-init-oddscast.sql`).

`.env` 예시:

```env
DATABASE_URL="postgresql://oddscast:oddscast@localhost:5432/oddscast?schema=oddscast"
```

컨테이너 중지:

```bash
docker compose stop postgres
```

다시 시작 (데이터 유지):

```bash
docker compose up -d postgres
```

### 1.2 Homebrew (macOS)

```bash
brew install postgresql@16
brew services start postgresql@16
createdb oddscast
psql -d oddscast -c "CREATE SCHEMA IF NOT EXISTS oddscast;"
```

연결 정보는 설치한 사용자/포트에 맞게 설정합니다.

### 1.3 공식 설치 프로그램

- [PostgreSQL 다운로드](https://www.postgresql.org/download/) 에서 OS에 맞게 설치 후, DB·스키마는 [2. DB·스키마 생성 (SQL)](#2-db스키마-생성-sql) 절대로 생성합니다.

---

## 2. DB·스키마 생성 (SQL)

### 2.1 데이터베이스 생성

`postgres`(또는 superuser)로 접속해서 한 번만 실행:

```sql
CREATE DATABASE oddscast
  ENCODING 'UTF8'
  LC_COLLATE 'en_US.UTF-8'
  LC_CTYPE 'en_US.UTF-8'
  TEMPLATE template0;
```

(이미 `oddscast` DB가 있으면 생략. **Docker**로 띄운 경우 DB와 스키마가 이미 있으므로 이 단계는 건너뛰어도 됩니다.)

### 2.2 oddscast DB에 접속 후 스키마 생성

**Docker를 쓰지 않고** 직접 PostgreSQL을 설치한 경우, **데이터베이스 `oddscast`에 연결한 뒤** 실행:

```sql
CREATE SCHEMA IF NOT EXISTS oddscast;
```

- 테이블은 Prisma 마이그레이션으로 생성하므로, 여기서는 스키마만 만들면 됩니다.
- 스크립트 파일: `server/prisma/scripts/init-local-db.sql`

---

## 4. DBeaver 연결 설정

| 항목 | 값 |
|------|-----|
| **Host** | `localhost` (또는 `127.0.0.1`) |
| **Port** | `5432` |
| **Database** | `oddscast` |
| **Schema** | `oddscast` (기본 스키마로 지정 권장) |
| **Username / Password** | 로컬 PostgreSQL 사용자 |

- 연결 후 기본 스키마를 `oddscast`로 두면, SQL 실행·테이블 목록이 모두 `oddscast` 스키마 기준으로 보입니다.

---

## 5. Prisma 연결 (스키마 oddscast)

`server/.env`에 **반드시 `?schema=oddscast`** 를 붙입니다:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/oddscast?schema=oddscast"
```

- `USER`, `PASSWORD`는 로컬 PostgreSQL 계정으로 교체합니다.
- 이렇게 해야 Prisma가 `oddscast` 스키마에 테이블을 만들고, 마이그레이션/쿼리도 해당 스키마만 사용합니다.

---

## 6. Prisma 마이그레이션 전체 적용

```bash
cd server

# 1) 클라이언트 생성
pnpm run db:generate

# 2) 마이그레이션 적용 (oddscast 스키마에 테이블 생성)
pnpm run db:migrate:deploy

# 3) 시드 데이터 삽입
pnpm run db:seed
```

- `db:migrate:deploy`가 **모든** 마이그레이션을 순서대로 적용합니다.
- 첫 번째 마이그레이션에서 `oddscast` 스키마와 전체 테이블이 생성되고, 이후 마이그레이션은 `ADD COLUMN IF NOT EXISTS` 등으로 스키마를 맞춥니다.

---

## 7. 요약

| 단계 | 작업 |
|------|------|
| 1 | **로컬에서 DB 실행** — `docker compose up -d postgres` (권장) 또는 Homebrew/설치판 |
| 2 | (Docker 아닐 때만) PostgreSQL에서 DB `oddscast` 생성 후, 접속해 스키마 `oddscast` 생성 |
| 3 | DBeaver로 Host/Port/DB=`oddscast`, Schema=`oddscast` 연결 |
| 4 | `server/.env`에 `DATABASE_URL=...?schema=oddscast` 설정 |
| 5 | `pnpm run db:migrate:deploy` → `pnpm run db:seed` |

이후 로컬에서는 이 DB만 사용하고, Prisma 무료 사용량(Accelerate 등)은 사용하지 않습니다.
