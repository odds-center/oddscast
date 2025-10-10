# 🚀 Golden Race 빠른 시작 가이드

## 📋 개요

Golden Race 프로젝트를 5분 안에 실행하는 가이드입니다.

---

## ⚡ 빠른 설치

### 1단계: 프로젝트 클론 및 의존성 설치

```bash
# 프로젝트 클론
git clone https://github.com/your-username/goldenrace.git
cd goldenrace

# 서버 의존성 설치
cd server
npm install

# 모바일 앱 의존성 설치
cd ../mobile
npm install
```

### 2단계: 환경변수 설정

```bash
cd ../server

# .env 파일 생성
cp env.example .env

# 필수 환경변수 설정
# .env 파일을 열어서 다음 값들을 설정하세요:
# - DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD
# - KRA_API_KEY (한국마사회 API 키)
# - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
# - JWT_SECRET
```

**환경변수 상세 설정**: [환경변수 가이드](ENVIRONMENT.md)

### 3단계: 데이터베이스 시작

```bash
# Docker로 MySQL 시작
docker-compose up -d

# 데이터베이스 초기화 (선택사항)
npm run db:complete
```

### 4단계: 서버 실행

```bash
# 개발 서버 시작
npm run start:dev
```

서버가 `http://localhost:3002`에서 실행됩니다.

### 5단계: 모바일 앱 실행

```bash
# 새 터미널에서
cd mobile
npx expo start
```

Expo Go 앱에서 QR 코드를 스캔하여 앱을 실행하세요.

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
  "timestamp": "2025-10-10T10:00:00.000Z",
  "service": "Golden Race API",
  "version": "1.0.0"
}
```

### 2. KRA API 상태 확인

```bash
curl http://localhost:3002/kra-api/status
```

### 3. 경주 일정 조회

```bash
curl http://localhost:3002/races/schedule
```

### 4. Google Sign-In 테스트

1. 모바일 앱에서 Google Sign-In 버튼 클릭
2. Google 계정 선택
3. 권한 허용
4. JWT 토큰 발급 확인

---

## 🐳 Docker를 사용한 빠른 실행

### 방법 1: MySQL만 Docker로 실행

```bash
cd server
docker-compose -f docker-compose.mysql.yml up -d
npm run start:dev
```

### 방법 2: 전체 스택 Docker로 실행

```bash
cd server
docker-compose -f docker-compose.dev.yml up -d
```

**서비스 접속:**

- NestJS 서버: `http://localhost:3002`
- MySQL: `localhost:3306`
- phpMyAdmin: `http://localhost:8080`

---

## 📱 모바일 앱 테스트

### Expo Go 설치

- **iOS**: App Store에서 "Expo Go" 검색
- **Android**: Google Play에서 "Expo Go" 검색

### QR 코드 스캔

1. 터미널에서 `npx expo start` 실행
2. 표시된 QR 코드를 Expo Go 앱으로 스캔
3. 앱이 자동으로 로드됨

### 테스트 시나리오

1. ✅ 로그인 화면 표시 확인
2. ✅ Google Sign-In 버튼 클릭
3. ✅ 인증 플로우 완료
4. ✅ 홈 화면 표시 확인
5. ✅ 경주 일정 조회
6. ✅ 경주 상세 정보 확인

---

## 🔍 문제 해결

### 포트 충돌

```bash
# 포트 사용 중인 프로세스 확인
lsof -i :3002  # 서버 포트
lsof -i :3306  # MySQL 포트

# 프로세스 종료
kill -9 <PID>
```

### 데이터베이스 연결 실패

```bash
# MySQL 컨테이너 상태 확인
docker ps

# MySQL 로그 확인
docker logs goldenrace-mysql-dev

# 컨테이너 재시작
docker restart goldenrace-mysql-dev
```

### 의존성 오류

```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### KRA API 오류

- API 키가 올바른지 확인
- 인터넷 연결 확인
- API 일일 제한 확인 (10,000회)

---

## ✅ 성공 체크리스트

완료된 항목에 체크하세요:

- [ ] 서버 시작 성공 (포트 3002)
- [ ] Health check API 응답
- [ ] KRA API 상태 확인
- [ ] 데이터베이스 연결 확인
- [ ] 모바일 앱 시작 성공
- [ ] Google Sign-In 작동
- [ ] 경주 데이터 조회 확인

---

## 📚 다음 단계

### 설정 가이드

- [Docker 설정](DOCKER_SETUP.md) - 상세한 Docker 설정
- [Google Cloud 설정](GOOGLE_CLOUD_SETUP.md) - OAuth 설정
- [환경변수 설정](ENVIRONMENT.md) - 환경변수 상세

### 개발 가이드

- [서버 개발](../../server/README.md) - NestJS 백엔드
- [모바일 개발](../../mobile/README.md) - React Native 앱
- [API 레퍼런스](../reference/API.md) - API 문서

---

## 🎉 축하합니다!

Golden Race 프로젝트가 성공적으로 실행되었습니다! 🚀

이제 경마 예측 게임 개발을 시작할 수 있습니다.

---

**문의**: vcjsm2283@gmail.com  
**마지막 업데이트**: 2025년 10월 10일
