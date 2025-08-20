# 🔐 Google Cloud Console 설정 가이드

## 📋 개요

Golden Race 앱의 Google Sign-In 기능을 위한 Google Cloud Console 설정 가이드입니다.

---

## 🚀 1단계: Google Cloud Console 접속

### 1.1 콘솔 접속

- **URL**: https://console.cloud.google.com/
- **계정**: vcjsm2283@gmail.com으로 로그인
- **프로젝트**: `goldenrace` 선택

### 1.2 프로젝트 생성 (필요한 경우)

```
프로젝트 이름: goldenrace
프로젝트 ID: goldenrace-xxxxx
```

---

## 🔑 2단계: OAuth 동의 화면 설정

### 2.1 OAuth 동의 화면 이동

- 왼쪽 메뉴 → **APIs & Services** → **OAuth consent screen**

### 2.2 앱 정보 입력

```
App name: Golden Race
User support email: vcjsm2283@gmail.com
Developer contact information: vcjsm2283@gmail.com
App logo: (선택사항)
```

### 2.3 범위 (Scopes) 설정

```
openid
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
```

### 2.4 테스트 사용자 추가

```
vcjsm2283@gmail.com
```

---

## 🆔 3단계: OAuth 2.0 클라이언트 ID 생성

### 3.1 Credentials 이동

- 왼쪽 메뉴 → **APIs & Services** → **Credentials**

### 3.2 OAuth 2.0 클라이언트 ID 생성

- **Create Credentials** → **OAuth client ID**

### 3.3 애플리케이션 유형 선택

```
Application type: Web application
Name: Golden Race Web Client
```

### 3.4 승인된 리다이렉션 URI 추가

```
# 서버 콜백
http://localhost:3002/api/auth/google/callback

# 웹 환경
http://localhost:3000
http://localhost:3002
http://localhost:19000

# Expo 개발 환경
exp://localhost:19000
exp://192.168.1.100:19000
exp://10.0.2.2:19000

# 커스텀 스키마
com.goldenrace.app://auth/callback
```

### 3.5 승인된 JavaScript 원본 추가

```
# 개발 환경
http://localhost:3000
http://localhost:3002
http://localhost:19000
http://127.0.0.1:3000
http://127.0.0.1:3002
http://127.0.0.1:19000

# Expo 개발 환경
http://localhost:19000
http://127.0.0.1:19000
```

---

## 📱 4단계: 플랫폼별 클라이언트 ID 설정

### 4.1 웹 클라이언트 ID

```
클라이언트 ID: 297222267377-husiseemja8abddjujt78g5bhlnne2do.apps.googleusercontent.com
```

### 4.2 안드로이드 클라이언트 ID

```
클라이언트 ID: 297222267377-esub3cahnjsaqfml8f9mai2ag6o9s78l.apps.googleusercontent.com
```

### 4.3 iOS 클라이언트 ID

```
클라이언트 ID: 297222267377-fa5gmt47asoodmngekdvbbdm7cl0mubh.apps.googleusercontent.com
```

---

## 🔧 5단계: 환경변수 설정

### 5.1 서버 환경변수 (.env)

```env
# 구글 OAuth 설정
GOOGLE_CLIENT_ID=297222267377-husiseemja8abddjujt78g5bhlnne2do.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:3002/api/auth/google/callback
```

### 5.2 프론트엔드 설정 (app/config/api/index.ts)

```typescript
export const API_KEYS = {
  google: {
    clientId: '297222267377-husiseemja8abddjujt78g5bhlnne2do.apps.googleusercontent.com',
    androidClientId: '297222267377-esub3cahnjsaqfml8f9mai2ag6o9s78l.apps.googleusercontent.com',
    iosClientId: '297222267377-fa5gmt47asoodmngekdvbbdm7cl0mubh.apps.googleusercontent.com',
    iosUrlScheme: 'com.googleusercontent.apps.297222267377-fa5gmt47asoodmngekdvbbdm7cl0mubh',
  },
};
```

---

## 🧪 6단계: 테스트 및 검증

### 6.1 서버 시작

```bash
cd server
npm run start:dev
```

### 6.2 프론트엔드 시작

```bash
cd app
npm start
```

### 6.3 Google Sign-In 테스트

1. 앱에서 Google Sign-In 버튼 클릭
2. Google 계정 선택
3. 권한 허용
4. JWT 토큰 발급 확인

---

## ⚠️ 주의사항

### 1. **OAuth 동의 화면 상태**

- **Testing** 상태여야 함
- **Publishing status**가 "Testing"으로 설정

### 2. **테스트 사용자**

- `vcjsm2283@gmail.com`이 테스트 사용자에 추가되어 있어야 함
- 프로덕션 배포 시 "In production" 상태로 변경 필요

### 3. **리다이렉션 URI**

- 정확한 URL 형식 사용
- `exp://` 프로토콜은 Expo 개발 환경에서만 사용

### 4. **클라이언트 시크릿**

- 웹 클라이언트에서만 사용
- 모바일 앱에서는 사용하지 않음

---

## 🔍 문제 해결

### 1. **"잘못된 요청" 오류**

- 승인된 리다이렉션 URI 확인
- OAuth 동의 화면 설정 확인
- 테스트 사용자 추가 확인

### 2. **"OAuth2Strategy requires a clientID option" 오류**

- 환경변수 설정 확인
- .env 파일 로드 확인
- 서버 재시작

### 3. **"액세스 차단됨" 오류**

- Google Cloud Console 설정 확인
- OAuth 동의 화면 상태 확인
- 테스트 사용자 권한 확인

---

## 📚 참고 자료

- [Google OAuth 2.0 공식 문서](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console 도움말](https://cloud.google.com/apis/docs/overview)
- [Expo Google Sign-In 가이드](https://docs.expo.dev/guides/authentication/#google)

---

## ✅ 설정 완료 체크리스트

- [ ] Google Cloud Console 프로젝트 생성
- [ ] OAuth 동의 화면 설정
- [ ] OAuth 2.0 클라이언트 ID 생성
- [ ] 승인된 리다이렉션 URI 설정
- [ ] 승인된 JavaScript 원본 설정
- [ ] 환경변수 설정
- [ ] 서버 재시작
- [ ] Google Sign-In 테스트
- [ ] JWT 토큰 발급 확인

**모든 항목이 체크되면 Google Sign-In 설정이 완료됩니다! 🎉**
