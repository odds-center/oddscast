# 🔐 환경변수 설정 가이드

Golden Race는 `.env` 파일 대신 **시스템 환경변수**를 사용합니다.

---

## 🚀 빠른 시작

### 로컬 개발 (Mac/Linux)

터미널에서 환경변수를 export:

```bash
# Supabase Database
export SUPABASE_DB_HOST=db.qayqwpfpwiuutxdkihit.supabase.co
export SUPABASE_DB_PORT=5432
export SUPABASE_DB_USER=postgres
export SUPABASE_DB_PASSWORD=[YOUR-PASSWORD]
export SUPABASE_DB_NAME=postgres

# Application
export NODE_ENV=development
export PORT=3002

# KRA API
export KRA_API_KEY=yyRDa%2FaXc9SsDdY67IqkdXJmZgZXOzsKqnf%2BR%2FSZjR6iAxYLzKiq%2BgXTmdUj%2FFe%2BFtEsMXnMYrLaiX6PZ%2FemsQ%3D%3D

# Google OAuth
export GOOGLE_CLIENT_ID=297222267377-husiseemja8abddjujt78g5bhlnne2do.apps.googleusercontent.com
export GOOGLE_CLIENT_SECRET=your-google-client-secret
export GOOGLE_CALLBACK_URL=http://localhost:3002/api/v1/auth/google/callback

# JWT
export JWT_SECRET=your-super-secret-jwt-key
export JWT_EXPIRES_IN=30d
export REFRESH_TOKEN_SECRET=your-refresh-secret

# CORS
export FRONTEND_URL=http://localhost:3000
export CORS_ORIGINS=http://localhost:3000,http://localhost:3001,exp://localhost:19000

# Batch
export BATCH_ENABLED=true
```

**그 다음 서버 실행:**

```bash
npm run start:dev
```

---

## 💡 편리한 방법: Shell RC 파일 사용

매번 export하기 번거롭다면:

### zsh (Mac 기본)

```bash
# ~/.zshrc 파일에 추가
echo 'export SUPABASE_DB_HOST=db.qayqwpfpwiuutxdkihit.supabase.co' >> ~/.zshrc
echo 'export SUPABASE_DB_PASSWORD=[YOUR-PASSWORD]' >> ~/.zshrc
# ... 나머지 변수들도 추가

# 적용
source ~/.zshrc
```

### bash

```bash
# ~/.bashrc 파일에 추가
echo 'export SUPABASE_DB_HOST=db.qayqwpfpwiuutxdkihit.supabase.co' >> ~/.bashrc
source ~/.bashrc
```

---

## 🐳 Docker 사용 시

### docker-compose 실행

시스템 환경변수가 자동으로 전달됩니다:

```bash
# 시스템 환경변수 설정 후
docker-compose up -d
```

또는 직접 지정:

```bash
SUPABASE_DB_HOST=db.xxx.supabase.co \
SUPABASE_DB_PASSWORD=your-password \
KRA_API_KEY=your-key \
docker-compose up -d
```

---

## ☁️ 프로덕션 배포 (Railway, Vercel 등)

배포 플랫폼의 UI에서 환경변수 설정:

### Railway

1. Dashboard → 프로젝트 선택
2. **Variables** 탭
3. 환경변수 입력:
   ```
   SUPABASE_DB_HOST=db.qayqwpfpwiuutxdkihit.supabase.co
   SUPABASE_DB_PASSWORD=[YOUR-PASSWORD]
   KRA_API_KEY=your-key
   ...
   ```

### Vercel/Netlify

1. Project Settings → Environment Variables
2. 환경변수 입력

---

## 📋 필수 환경변수 체크리스트

### ✅ 데이터베이스 (필수)

```bash
SUPABASE_DB_HOST      # Supabase 호스트
SUPABASE_DB_PORT      # 5432 (개발) 또는 6543 (프로덕션 pooling)
SUPABASE_DB_USER      # postgres
SUPABASE_DB_PASSWORD  # 비밀번호
SUPABASE_DB_NAME      # postgres
```

### ✅ API Keys (필수)

```bash
KRA_API_KEY           # 한국마사회 API 키
GOOGLE_CLIENT_ID      # Google OAuth
GOOGLE_CLIENT_SECRET  # Google OAuth
```

### ✅ Security (필수)

```bash
JWT_SECRET            # JWT 서명 키
REFRESH_TOKEN_SECRET  # Refresh 토큰 키
```

### ⚙️ Application (선택사항 - 기본값 있음)

```bash
NODE_ENV=development
PORT=3002
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=...
```

---

## 🔍 환경변수 확인

설정된 환경변수 확인:

```bash
# 모든 환경변수 보기
printenv | grep SUPABASE

# 특정 변수 확인
echo $SUPABASE_DB_HOST
```

---

## 🆘 문제 해결

### 환경변수가 인식되지 않음

**원인**: 환경변수가 설정 안됨

**해결**:

```bash
# 현재 쉘에서 export
export SUPABASE_DB_HOST=db.xxx.supabase.co

# 또는 RC 파일에 추가 후
source ~/.zshrc
```

### Docker에서 환경변수 없음

**원인**: Docker가 시스템 환경변수를 읽지 못함

**해결**:

```bash
# docker-compose.yml의 environment 섹션 확인
# ${VAR_NAME} 형식으로 되어 있는지 확인
```

---

## 🎯 완료!

이제 `.env` 파일 없이 환경변수로만 관리합니다! 🚀

**장점:**

- ✅ 보안 향상 (파일 유출 위험 없음)
- ✅ 배포 플랫폼과 일관성
- ✅ Git에 민감 정보 커밋 방지
