# 🔐 Google Cloud Console 설정 가이드

## 📋 개요

Golden Race 앱의 Google Sign-In 기능을 위한 Google Cloud Console 설정 가이드입니다.

---

## 🚀 1단계: Google Cloud Console 접속

### 콘솔 접속

- **URL**: https://console.cloud.google.com/
- **계정**: vcjsm2283@gmail.com으로 로그인

### 프로젝트 생성 (필요한 경우)

1. 상단의 프로젝트 선택 드롭다운 클릭
2. "새 프로젝트" 클릭
3. 프로젝트 정보 입력:
   ```
   프로젝트 이름: goldenrace
   프로젝트 ID: goldenrace-xxxxx (자동 생성)
   위치: 조직 없음
   ```
4. "만들기" 클릭

---

## 🔑 2단계: OAuth 동의 화면 설정

### OAuth 동의 화면 이동

1. 왼쪽 메뉴 → **APIs & Services**
2. **OAuth consent screen** 클릭

### 앱 정보 입력

#### 1. OAuth 동의 화면 유형 선택

```
User Type: External
```

#### 2. 앱 정보

```
App name: Golden Race
User support email: vcjsm2283@gmail.com
App logo: (선택사항 - 512x512 PNG)
```

#### 3. 앱 도메인 (선택사항)

```
Application home page: https://goldenrace.app
Application privacy policy link: https://goldenrace.app/privacy
Application terms of service link: https://goldenrace.app/terms
```

#### 4. 승인된 도메인

```
localhost (개발용)
goldenrace.app (프로덕션용)
```

#### 5. 개발자 연락처 정보

```
Developer contact information: vcjsm2283@gmail.com
```

### 범위 (Scopes) 설정

필수 범위 추가:

```
openid
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
```

### 테스트 사용자 추가

```
vcjsm2283@gmail.com
(추가 테스터 이메일 주소)
```

---

## 🆔 3단계: OAuth 2.0 클라이언트 ID 생성

### Credentials 이동

1. 왼쪽 메뉴 → **APIs & Services**
2. **Credentials** 클릭

### 웹 애플리케이션 클라이언트 ID 생성

#### 1. 클라이언트 ID 생성

```
Create Credentials → OAuth client ID
Application type: Web application
Name: Golden Race Web Client
```

#### 2. 승인된 JavaScript 원본

```
# 로컬 개발
http://localhost:3000
http://localhost:3002
http://localhost:19000
http://127.0.0.1:3000
http://127.0.0.1:3002
http://127.0.0.1:19000
```

#### 3. 승인된 리디렉션 URI

```
# 서버 콜백
http://localhost:3002/api/auth/google/callback

# 웹 환경
http://localhost:3000/auth/callback
http://localhost:3002/auth/callback

# Expo 개발 환경
exp://localhost:19000
exp://192.168.1.100:19000
exp://10.0.2.2:19000

# 커스텀 스키마
com.goldenrace.app://auth/callback
```

### 안드로이드 클라이언트 ID 생성

#### 1. 클라이언트 ID 생성

```
Create Credentials → OAuth client ID
Application type: Android
Name: Golden Race Android
```

#### 2. 패키지 이름 및 SHA-1

```bash
# 패키지 이름
com.goldenrace.app

# SHA-1 인증서 지문 생성 (디버그)
cd mobile/android
keytool -list -v -keystore ./app/debug.keystore -alias androiddebugkey -storepass android -keypass android

# SHA-1 복사하여 입력
```

### iOS 클라이언트 ID 생성

#### 1. 클라이언트 ID 생성

```
Create Credentials → OAuth client ID
Application type: iOS
Name: Golden Race iOS
```

#### 2. Bundle ID

```
Bundle ID: com.goldenrace.app
```

---

## 📱 4단계: 플랫폼별 클라이언트 ID

### 웹 클라이언트 ID

```
클라이언트 ID: 297222267377-husiseemja8abddjujt78g5bhlnne2do.apps.googleusercontent.com
클라이언트 보안 비밀: [Google Cloud Console에서 확인]
```

### 안드로이드 클라이언트 ID

```
클라이언트 ID: 297222267377-esub3cahnjsaqfml8f9mai2ag6o9s78l.apps.googleusercontent.com
```

### iOS 클라이언트 ID

```
클라이언트 ID: 297222267377-fa5gmt47asoodmngekdvbbdm7cl0mubh.apps.googleusercontent.com
iOS URL 스키마: com.googleusercontent.apps.297222267377-fa5gmt47asoodmngekdvbbdm7cl0mubh
```

---

## 🔧 5단계: 환경변수 설정

### 서버 환경변수 (.env)

```bash
# server/.env
GOOGLE_CLIENT_ID=297222267377-husiseemja8abddjujt78g5bhlnne2do.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:3002/api/auth/google/callback
```

### 모바일 앱 설정

**mobile/config/api/index.ts**

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

### 서버 실행

```bash
cd server
npm run start:dev
```

### 모바일 앱 실행

```bash
cd mobile
npx expo start
```

### Google Sign-In 테스트

1. ✅ 앱에서 Google Sign-In 버튼 클릭
2. ✅ Google 계정 선택 화면 표시
3. ✅ 권한 허용 화면 표시
4. ✅ 로그인 성공 및 JWT 토큰 발급
5. ✅ 사용자 정보 표시

---

## ⚠️ 주의사항

### 1. OAuth 동의 화면 상태

- **Testing** 상태: 최대 100명의 테스트 사용자
- **In production**: 검토 후 모든 사용자 사용 가능
- Publishing status가 "Testing"으로 설정되어 있어야 개발 가능

### 2. 테스트 사용자

- OAuth 동의 화면이 Testing 상태일 때는 테스트 사용자만 로그인 가능
- 테스트 사용자 목록에 개발자 계정 추가 필수
- 프로덕션 배포 시 "In production" 상태로 변경 필요

### 3. 리디렉션 URI

- 정확한 URL 형식 사용 (슬래시 주의)
- `exp://` 프로토콜은 Expo 개발 환경에서만 사용
- 프로덕션 URL은 HTTPS 필수

### 4. 클라이언트 시크릿

- 웹 클라이언트에서만 사용
- 모바일 앱에서는 클라이언트 시크릿 불필요
- 절대 공개 저장소에 커밋하지 말 것

---

## 🔍 문제 해결

### "잘못된 요청" 오류

**원인:**

- 승인된 리디렉션 URI 불일치
- OAuth 동의 화면 설정 미완료

**해결:**

1. Google Cloud Console에서 리디렉션 URI 확인
2. 정확히 일치하는지 확인 (슬래시, 프로토콜)
3. OAuth 동의 화면 설정 완료 확인

### "OAuth2Strategy requires a clientID option" 오류

**원인:**

- 환경변수 설정 누락
- .env 파일 로드 실패

**해결:**

```bash
# .env 파일 확인
cat server/.env | grep GOOGLE

# 서버 재시작
npm run start:dev
```

### "액세스 차단됨" 오류

**원인:**

- 테스트 사용자 미등록
- OAuth 동의 화면 상태 문제

**해결:**

1. OAuth consent screen → Test users 확인
2. 사용자 이메일 추가
3. Publishing status 확인

---

## 📚 참고 자료

- [Google OAuth 2.0 공식 문서](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console 도움말](https://cloud.google.com/apis/docs/overview)
- [Expo Google Sign-In 가이드](https://docs.expo.dev/guides/authentication/#google)
- [React Native Google Sign-In](https://github.com/react-native-google-signin/google-signin)

---

## ✅ 설정 완료 체크리스트

- [ ] Google Cloud Console 프로젝트 생성
- [ ] OAuth 동의 화면 설정 완료
- [ ] 웹 OAuth 2.0 클라이언트 ID 생성
- [ ] 안드로이드 OAuth 2.0 클라이언트 ID 생성
- [ ] iOS OAuth 2.0 클라이언트 ID 생성
- [ ] 승인된 리디렉션 URI 설정
- [ ] 승인된 JavaScript 원본 설정
- [ ] 서버 환경변수 설정
- [ ] 모바일 앱 설정 파일 업데이트
- [ ] 테스트 사용자 추가
- [ ] Google Sign-In 테스트 성공

---

**마지막 업데이트**: 2025년 10월 10일
