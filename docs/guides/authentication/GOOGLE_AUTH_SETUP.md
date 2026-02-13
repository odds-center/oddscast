# 구글 로그인 설정 가이드

> Mobile WebView ↔ WebApp ↔ Server 협업 구조

**로그인 정책**
- **WebApp (사용자)**: 이메일/비밀번호 + 구글 로그인 (앱스토어 심사 대응). 구글 버튼은 `show_google_login` 설정으로 표시/숨김 가능.
- **Admin (관리자)**: 이메일/비밀번호 (`POST /auth/admin/login`)

---

## 1. 아키텍처 흐름

```
[사용자] → [WebApp 로그인 버튼] → [Native Bridge LOGIN_GOOGLE]
    → [Mobile: GoogleSignin.signIn()] → idToken 획득
    → [Native Bridge LOGIN_SUCCESS { token: idToken }]
    → [WebApp: AuthApi.googleLogin(idToken)]
    → [Server: POST /auth/google] → idToken 검증 → JWT 발급
    → [WebApp: JWT 저장, axios 헤더 설정]
```

---

## 2. 사전 요구사항

### Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
3. **Web application** (서버 검증용) + **Android** / **iOS** (모바일 앱용) 클라이언트 생성

### 필요한 Client ID

| 용도 | Client ID | 사용처 |
|------|-----------|--------|
| **Web Client ID** | `xxx.apps.googleusercontent.com` | Server (idToken 검증) + Mobile (GoogleSignin.configure) |
| Android Client ID | ... | Android 앱 |
| iOS Client ID | ... | iOS 앱 |

---

## 3. Server 설정

### env 변수

```env
GOOGLE_CLIENT_ID=297222267377-husiseemja8abddjujt78g5bhlnne2do.apps.googleusercontent.com
```

- `GOOGLE_CLIENT_ID`: **Web Client ID** (Mobile과 동일한 값 사용)
- 없으면 `POST /auth/google` 호출 시 `Google 로그인이 설정되지 않았습니다` 에러

---

## 4. Mobile 설정

### app.config.js

`app.config.js`의 `config.google.webClientId`에 Web Client ID 설정:

```javascript
google: {
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  iosClientId: '...',
  androidClientId: '...',
},
```

- `webClientId`: Server와 동일한 Web Client ID
- `webview.tsx`에서 `Constants.expoConfig?.extra?.webClientId`로 자동 주입

---

## 5. WebApp 설정

### 웹 (데스크톱)

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=297222267377-husiseemja8abddjujt78g5bhlnne2do.apps.googleusercontent.com
```

- `pages/login.tsx` — 이메일/비밀번호 + 구글 로그인 (config `show_google_login`이 true일 때만 구글 버튼 표시)
- `pages/register.tsx` — 이메일/비밀번호 + 구글 회원가입
- `components/GoogleSignInButton.tsx` — Google Identity Services (GSI) JavaScript API 사용
- `https://accounts.google.com/gsi/client` 스크립트 로드 후 `google.accounts.id.renderButton` 호출

### Mobile WebView (Bridge)

- 별도 설치는 없음
- `NativeBridge`가 WebView 내에서 `window.ReactNativeWebView`로 인식되면 Native와 통신
- `LOGIN_GOOGLE` → Native → idToken → `LOGIN_SUCCESS` → WebApp이 `AuthApi.googleLogin(idToken)` 호출

---

## 6. 글로벌 설정 (GlobalConfig)

`prisma/seed.sql`에 `show_google_login` (기본값 `true`)가 포함됨. `db:seed` 실행 시 자동 삽입.

구글 로그인 버튼 표시 여부를 서버에서 제어:

```sql
-- 구글 로그인 버튼 숨김
UPDATE global_config SET value = 'false', "updatedAt" = NOW() WHERE key = 'show_google_login';

-- 구글 로그인 버튼 표시
UPDATE global_config SET value = 'true', "updatedAt" = NOW() WHERE key = 'show_google_login';
```

Admin API: `PUT /api/config/show_google_login` body: `{ "value": "false" }` (Admin JWT 필요)

---

## 7. 테스트 체크리스트

- [ ] Server: `GOOGLE_CLIENT_ID` env 설정
- [ ] Server: `npm run db:init` (또는 `db push` 후 `db:seed`)
- [ ] WebApp: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` env 설정 (웹 구글 로그인)
- [ ] Mobile: `app.config.js`에 `webClientId` 설정
- [ ] **웹**: `/login` 페이지에서 "Sign in with Google" 버튼 클릭 → 로그인 성공
- [ ] **Mobile**: WebView에서 WebApp 로드 후 "Google 로그인" 클릭
- [ ] Google 로그인 팝업 → 계정 선택 → 완료
- [ ] WebApp에 "로그인됨" 표시
- [ ] API 호출 시 `Authorization: Bearer <JWT>` 정상 동작

---

## 7. 참고

- [Google Sign-In for Web](https://developers.google.com/identity/sign-in/web)
- [Verify ID Token (Backend)](https://developers.google.com/identity/sign-in/web/backend-auth)
- [@react-native-google-signin/google-signin](https://github.com/react-native-google-signin/google-signin)
