# 📋 Supabase 설정 가이드 - 필요한 정보 체크리스트

Golden Race 프로젝트에서 Supabase를 사용하기 위해 필요한 모든 정보를 정리했습니다.

---

## ✅ Supabase에서 받아야 할 정보

Supabase 프로젝트 생성 후 다음 정보들을 받아야 합니다:

### 1. 📊 데이터베이스 연결 정보 (필수)

Supabase Dashboard → **Settings** → **Database** → **Connection string**

```bash
# 직접 연결 (Direct connection)
SUPABASE_DB_HOST=db.xxxxxxxxxxx.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-database-password
SUPABASE_DB_NAME=postgres
```

**어디서 확인?**

- Host: Connection string에서 `@` 뒤의 도메인 부분
- Password: 프로젝트 생성 시 설정한 비밀번호 (한 번만 표시됨!)
- Database name: 기본값은 `postgres`

### 2. 🔑 Connection Pooling 정보 (권장 - 프로덕션)

Supabase Dashboard → **Settings** → **Database** → **Connection Pooler**

```bash
# Connection Pooling (프로덕션 권장)
SUPABASE_DB_HOST=aws-0-ap-northeast-2.pooler.supabase.com
SUPABASE_DB_PORT=6543  # Pooling Port (트랜잭션 모드)
SUPABASE_DB_USER=postgres.xxxxxxxxxxx
SUPABASE_DB_PASSWORD=your-database-password
SUPABASE_DB_NAME=postgres
```

**왜 Connection Pooling?**

- ✅ 더 많은 동시 연결 처리
- ✅ 성능 향상
- ✅ 프로덕션 환경 필수

### 3. 🌐 API Keys (선택사항 - 추가 기능 사용 시)

Supabase Dashboard → **Settings** → **API**

```bash
# Supabase API (Auth, Storage, Realtime 사용 시)
SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**언제 필요?**

- Supabase Auth 사용 시 (현재는 Google OAuth 사용 중)
- Supabase Storage 사용 시 (파일 업로드)
- Supabase Realtime 사용 시 (실시간 구독)

> 현재 프로젝트는 TypeORM만 사용하므로 **선택사항**입니다.

---

## 📝 Supabase 프로젝트 생성 단계

### Step 1: 회원가입 및 로그인

1. https://app.supabase.com 접속
2. GitHub 계정으로 로그인 (권장)

### Step 2: 프로젝트 생성

1. **New Project** 클릭
2. Organization 선택 (없으면 새로 생성)
3. 다음 정보 입력:
   - **Name**: `goldenrace` (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 **⚠️ 복사 필수!** (다시 볼 수 없음)
   - **Region**: `Northeast Asia (Seoul)` 선택 ✅
   - **Pricing Plan**: Free tier (시작용)

4. **Create new project** 클릭
5. 생성 완료 대기 (약 2-3분)

### Step 3: 연결 정보 복사

프로젝트 생성 완료 후:

1. **Settings** (왼쪽 메뉴) 클릭
2. **Database** 클릭
3. **Connection string** 섹션에서 정보 확인:

   #### Direct Connection (개발/테스트용)

   ```
   Host: db.xxxxxxxxxxx.supabase.co
   Database name: postgres
   Port: 5432
   User: postgres
   Password: [프로젝트 생성 시 설정한 비밀번호]
   ```

   #### Connection pooling (프로덕션용 - 권장)
   - **Mode**: `Transaction` 선택
   - **Port**: `6543`
   - **Host**: Connection pooling용 호스트 주소

4. 이 정보들을 복사해서 `.env` 파일에 입력

---

## 🔧 .env 파일 설정 예시

프로젝트 루트의 `server/.env` 파일:

```bash
# ==========================================
# Supabase Database (필수)
# ==========================================
# 개발 환경: Direct Connection
SUPABASE_DB_HOST=db.abcdefghijk.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-strong-password-here
SUPABASE_DB_NAME=postgres

# 프로덕션 환경: Connection Pooling (배포 시 사용)
# SUPABASE_DB_HOST=aws-0-ap-northeast-2.pooler.supabase.com
# SUPABASE_DB_PORT=6543
# SUPABASE_DB_USER=postgres.abcdefghijk
# SUPABASE_DB_PASSWORD=your-strong-password-here

# ==========================================
# Supabase API (선택사항 - 현재 미사용)
# ==========================================
# SUPABASE_URL=https://abcdefghijk.supabase.co
# SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ==========================================
# 기존 설정 (유지)
# ==========================================
NODE_ENV=development
PORT=3000
DB_LOGGING=true

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# 기타 API Keys...
```

---

## 🎯 체크리스트 - Supabase 설정 완료 확인

### ✅ Supabase 프로젝트 생성

- [ ] Supabase 계정 생성 (https://app.supabase.com)
- [ ] 새 프로젝트 생성
- [ ] Project name: `goldenrace`
- [ ] Region: `Northeast Asia (Seoul)` 선택
- [ ] Database password 설정 및 **안전한 곳에 저장**

### ✅ 연결 정보 확인

- [ ] Settings → Database 접속
- [ ] Connection string 정보 복사
  - [ ] Host: `db.xxxxxxxxxxx.supabase.co`
  - [ ] Port: `5432`
  - [ ] User: `postgres`
  - [ ] Password: (저장한 비밀번호)
  - [ ] Database: `postgres`

### ✅ Connection Pooling 설정 (프로덕션용)

- [ ] Connection pooling mode: `Transaction` 선택
- [ ] Pooling port: `6543`
- [ ] Pooling host 주소 복사

### ✅ 환경변수 설정

- [ ] `server/.env` 파일 생성
- [ ] Supabase 연결 정보 입력
- [ ] 기존 API keys 유지 (Google, KRA, etc.)

### ✅ 패키지 설치

- [ ] `cd server && npm install`
- [ ] `pg` 패키지 설치 확인
- [ ] `@supabase/supabase-js` 패키지 설치 확인

### ✅ 데이터베이스 스키마 생성

- [ ] 서버 시작: `npm run start:dev`
- [ ] TypeORM 자동 동기화 또는 마이그레이션 실행
- [ ] Supabase Table Editor에서 테이블 생성 확인

### ✅ 검증

- [ ] Health check: `curl http://localhost:3000/health`
- [ ] Supabase 대시보드에서 테이블 확인 (36개)
- [ ] 서버 로그에서 "Connection established" 확인

---

## 🚨 주의사항

### ⚠️ 비밀번호 관리

- **Database Password**는 프로젝트 생성 시 한 번만 표시됩니다
- 안전한 비밀번호 관리자에 저장하세요 (1Password, LastPass 등)
- 분실 시: Supabase Dashboard → Database → Reset database password

### ⚠️ 보안

- `.env` 파일은 **절대 Git에 커밋하지 마세요**
- `SUPABASE_SERVICE_KEY`는 서버에서만 사용 (클라이언트 노출 금지)
- 프로덕션 환경: SSL 자동 활성화 (코드에 이미 적용됨)

### ⚠️ 비용

- Free tier: 500MB 데이터베이스, 2GB 파일 저장소
- 초과 시: Pro 플랜 ($25/월) 고려
- Connection Pooling: Free tier에서도 사용 가능

---

## 📊 필요한 Supabase 기능

현재 프로젝트에서 사용하는 Supabase 기능:

| 기능                      | 사용 여부 | 설명                          |
| ------------------------- | --------- | ----------------------------- |
| **Database (PostgreSQL)** | ✅ 사용   | TypeORM으로 연결              |
| **Connection Pooling**    | ✅ 권장   | 프로덕션 환경                 |
| Auth                      | ❌ 미사용 | Google OAuth 직접 구현        |
| Storage                   | ❌ 미사용 | 파일 저장 필요 시 추가 가능   |
| Realtime                  | ❌ 미사용 | 실시간 기능 필요 시 추가 가능 |
| Edge Functions            | ❌ 미사용 | -                             |

---

## 🆘 문제 해결

### 1. "Connection refused"

- Supabase 프로젝트가 "Active" 상태인지 확인
- Host 주소가 정확한지 확인 (.env 파일)
- 방화벽 설정 확인

### 2. "Authentication failed"

- Password가 정확한지 확인
- 특수문자 escape 필요 여부 확인

### 3. "Database does not exist"

- Database name이 `postgres`인지 확인
- Supabase는 기본적으로 `postgres` DB 사용

### 4. 비밀번호 분실

1. Supabase Dashboard 접속
2. Settings → Database
3. "Reset database password" 클릭
4. 새 비밀번호 설정 및 저장

---

## 📚 추가 리소스

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase Database 가이드](https://supabase.com/docs/guides/database)
- [Connection Pooling 가이드](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pool)

---

## 🎊 완료!

위 체크리스트를 따라하면 Supabase 설정이 완료됩니다! 🚀
