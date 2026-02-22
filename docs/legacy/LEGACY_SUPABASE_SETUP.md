# PostgreSQL 마이그레이션 가이드 (레거시)

MySQL에서 PostgreSQL로 백엔드 데이터베이스를 성공적으로 마이그레이션했습니다.

---

## 🎉 변경 사항

### 1. Package 업데이트

- ✅ `mysql2` 제거
- ✅ `pg` (PostgreSQL 드라이버) 추가
- ✅ `pg` (PostgreSQL 클라이언트) 추가

### 2. Database 설정

- ✅ `app.module.ts`: MySQL → PostgreSQL 설정 변경
- ✅ SSL 지원 추가 (프로덕션 환경)
- ✅ 환경변수 이름 변경 (`SUPABASE_DB_*`)

### 3. Docker 설정

- ✅ `docker-compose.yml`: MySQL → PostgreSQL 15-alpine
- ✅ npm scripts 업데이트 (PostgreSQL 명령어)

### 4. 환경변수

- ✅ `.env.example` 생성 (PostgreSQL 연결 정보 템플릿)

---

## 📋 다음 단계

### 1단계: PostgreSQL DB 준비

1. **PostgreSQL 호스팅 준비**
   - 로컬 PostgreSQL, 또는 클라우드 PostgreSQL 호스팅 사용
   - 데이터베이스 생성

2. **연결 정보 확인**
   - **Host**: DB 호스트 주소
   - **Database name**: `postgres` (또는 생성한 DB명)
   - **Port**: `5432` (또는 풀러 사용 시 `6543`)
   - **User**: DB 사용자명
   - **Password**: 비밀번호

   > **팁**: Connection pooling 사용 시 포트 6543 사용

---

### 2단계: 환경변수 설정

1. **`env.example` 파일 복사**

   ```bash
   cd server
   cp env.example .env
   ```

2. **`.env` 파일 수정**

   에디터로 `.env` 파일을 열고 PostgreSQL 연결 정보 입력:

   **옵션 1: Connection String 사용 (권장)**

   ```bash
   # PostgreSQL Connection string
   DATABASE_URL=postgresql://user:password@host:5432/postgres?sslmode=require
   ```

   **옵션 2: 개별 환경변수 사용 (레거시 서버)**

   ```bash
   # PostgreSQL Database Configuration
   SUPABASE_DB_HOST=your-db-host.example.com
   SUPABASE_DB_PORT=5432
   SUPABASE_DB_USER=postgres
   SUPABASE_DB_PASSWORD=your-actual-password-here
   SUPABASE_DB_NAME=postgres

   # 개발 환경 설정
   NODE_ENV=development
   PORT=3002
   DB_LOGGING=true  # 개발시 쿼리 로그 확인
   DB_SYNC=false    # 프로덕션에서는 절대 true로 설정하지 마세요!

   # Google OAuth, JWT, API keys 등...
   ```

---

### 3단계: 패키지 설치

```bash
cd server
npm install
```

이 명령어로 새로운 의존성 (`pg`)이 설치됩니다.

---

### 4단계: 데이터베이스 연결 테스트

```bash
# PostgreSQL 연결 테스트
npm run test:db
```

**성공 메시지 확인:**

```
✅ PostgreSQL 연결 성공!
📊 데이터베이스 정보:
  PostgreSQL Version: PostgreSQL 15.x
  Database: postgres
  User: postgres
```

### 5단계: 테이블 생성

**옵션 A: TypeORM 자동 동기화 (개발 환경만 - 빠른 테스트)**

⚠️ **주의**: 개발 환경에서만 사용하세요!

1. `.env` 파일에서 `DB_SYNC=true` 설정
2. 서버 실행:
   ```bash
   npm run start:dev
   ```
   서버가 시작되면서 자동으로 테이블이 생성됩니다.
3. **중요**: 테이블 생성 후 `.env`에서 `DB_SYNC=false`로 변경!

**옵션 B: TypeORM 마이그레이션 사용 (권장 - 프로덕션 준비)**

```bash
# 마이그레이션 생성 (엔티티 변경 시)
npm run migration:generate -- migrations/InitialSchema

# 마이그레이션 실행
npm run migration:run

# 마이그레이션 상태 확인
npm run migration:show

# 마이그레이션 되돌리기 (필요시)
npm run migration:revert
```

---

### 6단계: 서버 실행 및 테스트

```bash
cd server
npm run start:dev
```

**성공 메시지 확인:**

```
[TypeORM] Connection established
[NestApplication] Nest application successfully started +2ms
```

**에러 발생 시:**

- 환경변수 확인 (`.env` 파일의 PostgreSQL 연결 정보)
- DB 호스팅 상태 확인 (대시보드에서 정상 상태인지)
- 네트워크 연결 확인

---

## ✅ 검증 방법

### 1. 데이터베이스 연결 테스트

```bash
npm run test:db
```

### 2. Health Check API

```bash
curl http://localhost:3002/api/health
```

**예상 응답:**

```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-01-26T11:45:00.000Z"
}
```

### 3. 테이블 목록 확인

1. DB 대시보드 또는 클라이언트 접속
2. **Table Editor** 클릭
3. 36개 테이블 생성 확인:
   - `users`
   - `races`
   - `predictions`
   - `subscriptions`
   - `bets`
   - 등등...

### 4. 데이터베이스 직접 쿼리 (SQL Editor)

DB 클라이언트 또는 SQL Editor:

```sql
-- 모든 테이블 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- users 테이블 확인
SELECT * FROM users LIMIT 5;
```

---

## 🔧 유용한 스크립트

### 데이터베이스 연결 테스트

```bash
# PostgreSQL 연결 테스트
npm run test:db
```

### 마이그레이션 관리

```bash
# 마이그레이션 생성
npm run migration:generate -- migrations/MigrationName

# 마이그레이션 실행
npm run migration:run

# 마이그레이션 상태 확인
npm run migration:show

# 마이그레이션 되돌리기
npm run migration:revert
```

### 환경변수 설정 스크립트

```bash
# 기본 연결 설정
source setup-env.sh

# Connection Pooling 사용 (프로덕션 권장)
source setup-env-pooler.sh
```

---

## 🚀 프로덕션 배포

프로덕션 환경에서는:

1. **환경변수 설정** (Railway, Vercel 등):

   **옵션 1: Connection String 사용 (권장)**

   ```
   DATABASE_URL=postgresql://user:password@pooler-host:6543/postgres?sslmode=require
   NODE_ENV=production
   ```

   **옵션 2: 개별 환경변수 사용**

   ```
   SUPABASE_DB_HOST=pooler.example.com
   SUPABASE_DB_PORT=6543  # Connection pooling port 권장!
   SUPABASE_DB_USER=postgres.[PROJECT-REF]
   SUPABASE_DB_PASSWORD=***
   SUPABASE_DB_NAME=postgres
   NODE_ENV=production
   DB_SYNC=false  # 프로덕션에서는 절대 true로 설정하지 마세요!
   ```

2. **Connection Pooling 사용** 필수!
   - DB 호스팅 → Connection pooling 설정
   - Port: `6543`
   - Mode: `Transaction`
   - Host: pooler 포트 6543 사용

3. **SSL 자동 활성화**
   - `app.module.ts`의 설정으로 `NODE_ENV=production`일 때 자동으로 SSL 사용

4. **마이그레이션 자동 실행**
   - 프로덕션에서는 `migrationsRun: true`로 설정되어 마이그레이션이 자동 실행됩니다

---

## 📝 주의사항

### ✅ Do's

- ✅ `.env` 파일은 절대 Git에 커밋하지 마세요
- ✅ DB 비밀번호는 강력하게 설정
- ✅ Connection pooling 사용 (성능 향상)
- ✅ 프로덕션에서는 `synchronize: false` 유지

### ❌ Don'ts

- ❌ 프로덕션에서 `synchronize: true` 사용 금지
- ❌ DB 비밀번호·API 키를 코드에 하드코딩 금지
- ❌ 로컬 개발 비밀번호를 프로덕션에 사용 금지

---

## 🆘 문제 해결

### 1. "Connection refused" 또는 "ECONNREFUSED" 에러

**원인**: PostgreSQL 연결 정보 오류 또는 네트워크 문제

**해결**:

- DB 호스팅 대시보드에서 프로젝트 상태 확인
- `.env` 파일의 Connection String 확인
- DB 호스팅 → Connect → Connection String에서 정확한 문자열 복사
- 네트워크/VPN 설정 확인

### 2. "DNS 조회 실패" 또는 "ENOTFOUND" 에러

**원인**: DNS 서버가 DB 호스트를 찾을 수 없음

**해결**:

- DNS 캐시 초기화: `sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder`
- DNS 서버 변경 (8.8.8.8, 1.1.1.1)
- 다른 네트워크에서 테스트
- VPN 사용 중이면 비활성화

### 3. "Authentication failed" 에러

**원인**: 비밀번호 오류

**해결**:

- `.env` 파일의 `DATABASE_URL`에서 비밀번호 확인
- DB 호스팅 → Database password 확인
- 비밀번호 재설정 후 `.env` 파일 업데이트

### 4. "Not IPv4 compatible" 경고

**원인**: Direct connection은 IPv4를 지원하지 않음

**해결**:

- Session Pooler 사용 (포트 6543)
- Connection String → Method: "Session" 선택

### 5. 테이블이 생성되지 않음

**해결**:

- 개발 환경: `.env`에서 `DB_SYNC=true` 설정 후 서버 재시작
- 프로덕션: 마이그레이션 실행 (`npm run migration:run`)

### 5. "환경변수를 찾을 수 없습니다" 오류

**원인**: 환경변수가 설정되지 않음

**해결**:

```bash
# .env 파일 확인
ls -la server/.env

# 환경변수 파일 생성
cp server/env.example server/.env

# 또는 시스템 환경변수로 설정
source server/setup-env.sh
```

---

## 📚 추가 리소스

- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)
- [TypeORM PostgreSQL 가이드](https://typeorm.io/#/connection-options/postgres-connection-options)
- [NestJS TypeORM 통합](https://docs.nestjs.com/techniques/database)

---

## 🎊 완료!

이제 OddsCast가 PostgreSQL로 실행됩니다! 🚀
