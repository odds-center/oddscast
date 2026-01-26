# Supabase 마이그레이션 완료 가이드

MySQL에서 Supabase PostgreSQL로 백엔드 데이터베이스를 성공적으로 마이그레이션했습니다.

---

## 🎉 변경 사항

### 1. Package 업데이트

- ✅ `mysql2` 제거
- ✅ `pg` (PostgreSQL 드라이버) 추가
- ✅ `@supabase/supabase-js` 추가

### 2. Database 설정

- ✅ `app.module.ts`: MySQL → PostgreSQL 설정 변경
- ✅ SSL 지원 추가 (프로덕션 환경)
- ✅ 환경변수 이름 변경 (`SUPABASE_DB_*`)

### 3. Docker 설정

- ✅ `docker-compose.yml`: MySQL → PostgreSQL 15-alpine
- ✅ npm scripts 업데이트 (PostgreSQL 명령어)

### 4. 환경변수

- ✅ `.env.example` 생성 (Supabase 연결 정보 템플릿)

---

## 📋 다음 단계

### 1단계: Supabase 프로젝트 생성

1. **Supabase 대시보드 접속**
   - https://app.supabase.com 접속
   - "New Project" 클릭

2. **프로젝트 설정**
   - Organization 선택 (없으면 생성)
   - Project Name: `goldenrace` (또는 원하는 이름)
   - Database Password: 강력한 비밀번호 설정 (복사해두기!)
   - Region: `Northeast Asia (Seoul)` 선택 (한국 서비스용)
   - 생성 완료 대기 (약 2-3분)

3. **연결 정보 확인**
   - Settings → Database 클릭
   - "Connection string" 섹션에서 정보 확인:
     - **Host**: `db.your-project-ref.supabase.co`
     - **Database name**: `postgres`
     - **Port**: `5432`
     - **User**: `postgres`
     - **Password**: (위에서 설정한 비밀번호)

   > **팁**: "Connection pooling" 사용 권장 (성능 향상)
   >
   > - Mode는 "Transaction" 선택
   > - Port는 6543 (pooling port)

---

### 2단계: 환경변수 설정

1. **`env.example` 파일 복사**

   ```bash
   cd server
   cp env.example .env
   ```

2. **`.env` 파일 수정**

   에디터로 `.env` 파일을 열고 Supabase 정보 입력:

   **옵션 1: Connection String 사용 (권장)**

   ```bash
   # Supabase 대시보드 → Settings → Database → Connection string에서 복사
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
   ```

   **옵션 2: 개별 환경변수 사용**

   ```bash
   # Supabase Database Configuration
   SUPABASE_DB_HOST=db.your-project-ref.supabase.co
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

이 명령어로 새로운 의존성 (`pg`, `@supabase/supabase-js`)이 설치됩니다.

---

### 4단계: 데이터베이스 연결 테스트

```bash
# Supabase 연결 테스트
npm run test:db
```

**성공 메시지 확인:**

```
✅ Supabase 연결 성공!
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

- 환경변수 확인 (`.env` 파일의 Supabase 정보)
- Supabase 프로젝트 상태 확인 (대시보드에서 "Active" 상태인지)
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

### 3. Supabase Table Editor 확인

1. Supabase 대시보드 접속
2. **Table Editor** 클릭
3. 36개 테이블 생성 확인:
   - `users`
   - `races`
   - `predictions`
   - `subscriptions`
   - `bets`
   - 등등...

### 4. 데이터베이스 직접 쿼리 (Supabase SQL Editor)

Supabase 대시보드 → **SQL Editor**:

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
# Supabase 연결 테스트
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
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?sslmode=require
   NODE_ENV=production
   ```

   **옵션 2: 개별 환경변수 사용**

   ```
   SUPABASE_DB_HOST=aws-0-ap-northeast-2.pooler.supabase.com
   SUPABASE_DB_PORT=6543  # Connection pooling port 권장!
   SUPABASE_DB_USER=postgres.[PROJECT-REF]
   SUPABASE_DB_PASSWORD=***
   SUPABASE_DB_NAME=postgres
   NODE_ENV=production
   DB_SYNC=false  # 프로덕션에서는 절대 true로 설정하지 마세요!
   ```

2. **Connection Pooling 사용** 필수!
   - Supabase 대시보드 → Database → Connection pooling
   - Port: `6543`
   - Mode: `Transaction`
   - Host: `aws-0-ap-northeast-2.pooler.supabase.com` (한국 리전)

3. **SSL 자동 활성화**
   - `app.module.ts`의 설정으로 `NODE_ENV=production`일 때 자동으로 SSL 사용

4. **마이그레이션 자동 실행**
   - 프로덕션에서는 `migrationsRun: true`로 설정되어 마이그레이션이 자동 실행됩니다

---

## 📝 주의사항

### ✅ Do's

- ✅ `.env` 파일은 절대 Git에 커밋하지 마세요
- ✅ Supabase 비밀번호는 강력하게 설정
- ✅ Connection pooling 사용 (성능 향상)
- ✅ 프로덕션에서는 `synchronize: false` 유지

### ❌ Don'ts

- ❌ 프로덕션에서 `synchronize: true` 사용 금지
- ❌ Supabase API keys를 코드에 하드코딩 금지
- ❌ 로컬 개발 비밀번호를 프로덕션에 사용 금지

---

## 🆘 문제 해결

### 1. "Connection refused" 또는 "ECONNREFUSED" 에러

**원인**: Supabase 연결 정보 오류 또는 네트워크 문제

**해결**:

- Supabase 대시보드에서 프로젝트 상태 확인 (Active인지)
- `.env` 파일의 Connection String 확인
- Supabase 대시보드 → Connect → Connection String에서 정확한 문자열 복사
- 네트워크/VPN 설정 확인

### 2. "DNS 조회 실패" 또는 "ENOTFOUND" 에러

**원인**: DNS 서버가 Supabase 호스트를 찾을 수 없음

**해결**:

- DNS 캐시 초기화: `sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder`
- DNS 서버 변경 (8.8.8.8, 1.1.1.1)
- 다른 네트워크에서 테스트
- VPN 사용 중이면 비활성화

### 3. "Authentication failed" 에러

**원인**: 비밀번호 오류

**해결**:

- `.env` 파일의 `DATABASE_URL`에서 비밀번호 확인
- Supabase 대시보드 → Settings → Database → Database password 확인
- 비밀번호 재설정 후 `.env` 파일 업데이트

### 4. "Not IPv4 compatible" 경고

**원인**: Direct connection은 IPv4를 지원하지 않음

**해결**:

- Session Pooler 사용 (포트 6543)
- Supabase 대시보드 → Connect → Connection String → Method: "Session" 선택

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

- [Supabase 공식 문서](https://supabase.com/docs)
- [TypeORM PostgreSQL 가이드](https://typeorm.io/#/connection-options/postgres-connection-options)
- [NestJS TypeORM 통합](https://docs.nestjs.com/techniques/database)

---

## 🎊 완료!

이제 Golden Race가 Supabase PostgreSQL로 실행됩니다! 🚀
