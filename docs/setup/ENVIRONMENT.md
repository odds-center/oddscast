# 🔧 환경변수 설정 가이드

## 📋 개요

Golden Race 프로젝트의 환경변수 설정 및 관리 가이드입니다.

---

## 🌍 환경 구분

### 개발 환경 (Development)

```
NODE_ENV=development
```

- 로컬 개발용
- 상세한 로그 출력
- Hot reload 활성화

### 프로덕션 환경 (Production)

```
NODE_ENV=production
```

- 실제 서비스용
- 최적화된 빌드
- 에러 로그만 출력

---

## 🖥️ 서버 환경변수

### 환경변수 파일 생성

```bash
cd server
cp env.example .env
```

### 필수 환경변수

#### 1. 서버 설정

```bash
# 서버 포트 (기본값: 3002)
PORT=3002

# 실행 환경
NODE_ENV=development
```

#### 2. 데이터베이스 설정

```bash
# MySQL 호스트
DB_HOST=localhost

# MySQL 포트
DB_PORT=3306

# 데이터베이스 이름
DB_DATABASE=goldenrace

# 데이터베이스 사용자
DB_USERNAME=goldenrace_user

# 데이터베이스 비밀번호
DB_PASSWORD=goldenrace_password
```

#### 3. Google OAuth 설정

```bash
# 웹 클라이언트 ID
GOOGLE_CLIENT_ID=297222267377-husiseemja8abddjujt78g5bhlnne2do.apps.googleusercontent.com

# 클라이언트 시크릿 (Google Cloud Console에서 생성)
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# OAuth 콜백 URL
GOOGLE_CALLBACK_URL=http://localhost:3002/api/auth/google/callback
```

**Google OAuth 설정**: [Google Cloud 설정 가이드](GOOGLE_CLOUD_SETUP.md)

#### 4. JWT 설정

```bash
# JWT 비밀키 (랜덤 문자열 생성 권장)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# JWT 만료 시간 (기본: 7일)
JWT_EXPIRES_IN=7d

# Refresh Token 만료 시간 (기본: 30일)
JWT_REFRESH_EXPIRES_IN=30d
```

**JWT 비밀키 생성:**

```bash
# 랜덤 문자열 생성 (macOS/Linux)
openssl rand -base64 32

# 또는
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 5. KRA API 설정

```bash
# 한국마사회 API 키 (공공데이터 포털에서 발급)
KRA_API_KEY=yyRDa%2FaXc9SsDdY67IqkdXJmZgZXOzsKqnf%2BR%2FSZjR6iAxYLzKiq%2BgXTmdUj%2FFe%2BFtEsMXnMYrLaiX6PZ%2FemsQ%3D%3D
```

**KRA API 키 발급**: [공공데이터 포털](https://www.data.go.kr/)에서 신청

#### 6. CORS 설정

```bash
# 허용할 Origin 목록 (쉼표로 구분)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,exp://localhost:19000
```

#### 7. 배치 작업 설정

```bash
# 배치 작업 활성화 여부 (true/false)
BATCH_ENABLED=true

# 배치 타임존
BATCH_TIMEZONE=Asia/Seoul

# 일일 동기화 시간 (HH:mm 형식)
BATCH_DAILY_SYNC_TIME=06:00
```

### 선택적 환경변수

```bash
# 로그 레벨 (error, warn, info, debug)
LOG_LEVEL=info

# API 요청 타임아웃 (밀리초)
API_TIMEOUT=30000

# 데이터베이스 로깅 (true/false)
DB_LOGGING=false

# Swagger API 문서 활성화
SWAGGER_ENABLED=true
```

---

## 📱 모바일 앱 환경변수

### 환경변수 파일 생성

```bash
cd mobile
cp .env.example .env
```

### 필수 환경변수

#### 1. API 서버 설정

```bash
# 개발 서버 URL
API_BASE_URL=http://localhost:3002

# 프로덕션 서버 URL
# API_BASE_URL=https://api.goldenrace.app
```

#### 2. Google OAuth 설정

**mobile/config/api/index.ts** 파일에서 설정:

```typescript
export const API_KEYS = {
  google: {
    // 웹 클라이언트 ID
    clientId: '297222267377-husiseemja8abddjujt78g5bhlnne2do.apps.googleusercontent.com',

    // 안드로이드 클라이언트 ID
    androidClientId: '297222267377-esub3cahnjsaqfml8f9mai2ag6o9s78l.apps.googleusercontent.com',

    // iOS 클라이언트 ID
    iosClientId: '297222267377-fa5gmt47asoodmngekdvbbdm7cl0mubh.apps.googleusercontent.com',

    // iOS URL 스키마
    iosUrlScheme: 'com.googleusercontent.apps.297222267377-fa5gmt47asoodmngekdvbbdm7cl0mubh',
  },
};
```

---

## 🔒 보안 주의사항

### 1. 비밀키 관리

❌ **절대 하지 말 것:**

```bash
# Git에 .env 파일 커밋
git add .env  # ❌ 절대 안 됨!
```

✅ **반드시 할 것:**

```bash
# .gitignore에 추가 (이미 추가되어 있음)
echo ".env" >> .gitignore

# 환경변수 템플릿만 커밋
git add env.example
```

### 2. 프로덕션 환경

- JWT_SECRET은 강력한 랜덤 문자열 사용
- 데이터베이스 비밀번호는 복잡하게 설정
- Google Client Secret은 안전하게 보관
- 환경변수는 서버 환경에서만 설정

### 3. API 키 보호

```bash
# API 키 노출 방지
# .env 파일 권한 설정
chmod 600 .env

# 소유자만 읽기/쓰기 가능
ls -la .env
# -rw------- 1 user group ... .env
```

---

## 🐳 Docker 환경변수

### docker-compose.yml에서 설정

```yaml
services:
  app:
    environment:
      - NODE_ENV=production
      - PORT=3002
      - DB_HOST=mysql
      - DB_PORT=3306
    env_file:
      - .env
```

### Docker 환경에서 주의사항

1. **호스트 이름**: `localhost` 대신 서비스 이름 사용

   ```bash
   # ❌ 잘못된 설정
   DB_HOST=localhost

   # ✅ 올바른 설정 (Docker Compose 사용 시)
   DB_HOST=mysql
   ```

2. **네트워크**: 같은 Docker 네트워크 내에서 통신
3. **볼륨**: .env 파일을 컨테이너에 마운트

---

## 🧪 환경변수 검증

### 서버 시작 시 검증

```bash
cd server
npm run start:dev
```

**확인 사항:**

- ✅ 데이터베이스 연결 성공
- ✅ Google OAuth 설정 확인
- ✅ KRA API 키 유효성 확인

### 환경변수 확인 스크립트

```bash
# .env 파일 내용 확인 (비밀 정보 제외)
cat server/.env | grep -v "SECRET\|PASSWORD"

# 환경변수 로드 테스트
node -e "require('dotenv').config({path: './server/.env'}); console.log(process.env.PORT)"
```

---

## 🔄 환경별 설정 예시

### 개발 환경 (.env.development)

```bash
NODE_ENV=development
PORT=3002

# 로컬 MySQL
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=goldenrace_dev

# 상세 로깅
LOG_LEVEL=debug
DB_LOGGING=true

# 로컬 콜백
GOOGLE_CALLBACK_URL=http://localhost:3002/api/auth/google/callback
```

### 프로덕션 환경 (.env.production)

```bash
NODE_ENV=production
PORT=3002

# 프로덕션 DB
DB_HOST=your-db-host.com
DB_PORT=3306
DB_DATABASE=goldenrace_prod

# 에러 로깅만
LOG_LEVEL=error
DB_LOGGING=false

# 프로덕션 콜백
GOOGLE_CALLBACK_URL=https://api.goldenrace.app/api/auth/google/callback
```

---

## 📝 환경변수 템플릿

### server/env.example

```bash
# 서버 설정
NODE_ENV=development
PORT=3002

# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=goldenrace_user
DB_PASSWORD=change-me-in-production
DB_DATABASE=goldenrace

# JWT 설정
JWT_SECRET=change-me-to-a-random-string-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Google OAuth 설정
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3002/api/auth/google/callback

# KRA API 설정
KRA_API_KEY=your-kra-api-key

# CORS 설정
CORS_ORIGINS=http://localhost:3000,exp://localhost:19000

# 배치 작업 설정
BATCH_ENABLED=true
BATCH_TIMEZONE=Asia/Seoul
BATCH_DAILY_SYNC_TIME=06:00

# 로그 설정 (선택)
LOG_LEVEL=info
```

---

## 🔍 문제 해결

### "환경변수를 찾을 수 없습니다" 오류

**원인:**

- .env 파일이 없거나 잘못된 위치
- 환경변수 이름 오타

**해결:**

```bash
# .env 파일 존재 확인
ls -la server/.env

# 환경변수 파일 생성
cp server/env.example server/.env

# 환경변수 내용 확인
cat server/.env
```

### "데이터베이스 연결 실패" 오류

**원인:**

- DB 환경변수 설정 오류
- MySQL 서비스 미실행

**해결:**

```bash
# MySQL 상태 확인
docker ps | grep mysql

# 환경변수 확인
echo $DB_HOST
echo $DB_PORT

# MySQL 재시작
docker restart goldenrace-mysql-dev
```

---

## 📚 참고 자료

- [dotenv 공식 문서](https://github.com/motdotla/dotenv)
- [NestJS 환경변수](https://docs.nestjs.com/techniques/configuration)
- [Expo 환경변수](https://docs.expo.dev/guides/environment-variables/)

---

## ✅ 환경변수 설정 체크리스트

- [ ] server/.env 파일 생성
- [ ] 데이터베이스 설정 입력
- [ ] Google OAuth 클라이언트 ID/시크릿 입력
- [ ] JWT 비밀키 생성 및 입력
- [ ] KRA API 키 입력
- [ ] CORS Origins 설정
- [ ] 서버 시작 및 연결 확인
- [ ] .env 파일이 .gitignore에 있는지 확인

---

**마지막 업데이트**: 2025년 10월 10일
