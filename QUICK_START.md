# 🚀 Golden Race 프로젝트 빠른 시작 가이드

## 📋 개요

Golden Race 프로젝트를 빠르게 실행하고 테스트하는 가이드입니다.

---

## ⚡ 5분 만에 프로젝트 실행하기

### 1단계: 프로젝트 클론 및 의존성 설치

```bash
# 프로젝트 디렉토리로 이동
cd goldenrace

# 서버 의존성 설치
cd server
npm install

# 프론트엔드 의존성 설치
cd ../app
npm install
```

### 2단계: 환경변수 설정

```bash
# 서버 디렉토리로 이동
cd ../server

# .env 파일 생성 (이미 존재하는 경우 건너뛰기)
cat > .env << EOF
# 서버 설정
NODE_ENV=development
PORT=3002

# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=goldenrace_user
DB_PASSWORD=goldenrace_password
DB_DATABASE=goldenrace

# KRA API 설정
KRA_API_KEY=yyRDa%2FaXc9SsDdY67IqkdXJmZgZXOzsKqnf%2BR%2FSZjR6iAxYLzKiq%2BgXTmdUj%2FFe%2BFtEsMXnMYrLaiX6PZ%2FemsQ%3D%3D

# JWT 설정
JWT_SECRET=your-super-secret-jwt-key-here

# 구글 OAuth 설정
GOOGLE_CLIENT_ID=297222267377-husiseemja8abddjujt78g5bhlnne2do.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:3002/api/auth/google/callback

# CORS 설정
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,exp://localhost:19000
EOF
```

### 3단계: 서버 실행

```bash
# 서버 시작
npm run start:dev
```

### 4단계: 프론트엔드 실행 (새 터미널)

```bash
# 새 터미널에서
cd app
npm start
```

---

## 🧪 빠른 테스트

### 1. 서버 상태 확인

```bash
curl http://localhost:3002/api/health
```

**예상 응답:**

```json
{
  "status": "ok",
  "timestamp": "2025-08-20T10:52:39.114Z",
  "service": "Golden Race API",
  "version": "1.0.0"
}
```

### 2. KRA API 상태 확인

```bash
curl http://localhost:3002/api/kra-api/status
```

### 3. 경주기록 조회 테스트

```bash
curl "http://localhost:3002/api/kra-api/race-records?date=2025-08-20"
```

---

## 🔐 Google Sign-In 테스트

### 1. 앱에서 Google Sign-In 버튼 클릭

### 2. Google 계정 선택

### 3. 권한 허용

### 4. JWT 토큰 발급 확인

---

## 🐳 Docker로 빠른 실행

### 1. MySQL 컨테이너 실행

```bash
cd server
docker-compose -f docker-compose.mysql.yml up -d
```

### 2. 개발 환경 실행

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 3. 서비스 접속

```
NestJS 서버: http://localhost:3002
MySQL: localhost:3306
phpMyAdmin: http://localhost:8080
```

---

## 📱 모바일 앱 테스트

### 1. Expo Go 앱 설치

- **iOS**: App Store에서 "Expo Go" 검색
- **Android**: Google Play에서 "Expo Go" 검색

### 2. QR 코드 스캔

- `npm start` 실행 후 표시되는 QR 코드 스캔
- 또는 Expo 개발자 도구에서 URL 입력

### 3. 앱 테스트

- Google Sign-In 버튼 클릭
- 인증 플로우 테스트
- API 호출 테스트

---

## 🔍 문제 해결

### 1. **포트 충돌**

```bash
# 포트 사용 중인 프로세스 확인
sudo lsof -i :3002
sudo lsof -i :3306

# 프로세스 종료
sudo pkill -f "nest start"
sudo brew services stop mysql
```

### 2. **의존성 오류**

```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### 3. **빌드 오류**

```bash
# TypeScript 컴파일 오류 확인
npm run build

# 캐시 정리
npm run build -- --clean
```

---

## 📊 성공 지표

### ✅ 정상 작동 확인 항목

- [ ] 서버 시작 성공 (포트 3002)
- [ ] Health check API 응답
- [ ] KRA API 상태 확인
- [ ] 프론트엔드 시작 성공
- [ ] Google Sign-In 버튼 표시
- [ ] 데이터베이스 연결 (Docker 사용 시)

### ⚠️ 주의사항

- Google OAuth 설정이 완료되어야 Sign-In 작동
- KRA API는 공공데이터 포털 응답 구조에 따라 500 에러 발생 가능
- MySQL 포트 3306 충돌 시 Docker 컨테이너 사용 권장

---

## 🚀 다음 단계

### 1. **Google Cloud Console 설정**

- [GOOGLE_CLOUD_SETUP.md](./GOOGLE_CLOUD_SETUP.md) 참조

### 2. **Docker 환경 설정**

- [DOCKER_SETUP.md](./DOCKER_SETUP.md) 참조

### 3. **상세 마이그레이션 보고서**

- [MIGRATION_REPORT.md](./MIGRATION_REPORT.md) 참조

---

## 📞 지원

**문제가 발생하거나 추가 도움이 필요한 경우:**

- **이메일**: vcjsm2283@gmail.com
- **프로젝트**: Golden Race
- **담당자**: go-park

---

## 🎉 축하합니다!

**Golden Race 프로젝트가 성공적으로 실행되었습니다! 🚀✨**

이제 더욱 강력하고 확장 가능한 아키텍처로 경마 정보 앱을 개발할 수 있습니다.
