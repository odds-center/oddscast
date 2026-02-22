# WebApp ↔ Mobile 연동 가이드

> Mobile 앱은 WebView로 WebApp을 로드합니다. 이 문서는 양측 연동 구조, 환경 변수, 메시지 프로토콜을 정의합니다.

---

## 1. 아키텍처 요약

```
┌─────────────────────────────────────────────────────────────┐
│  Mobile (React Native Expo)                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Native Header (뒤로가기, OddsCast, 새로고침)      │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  WebView                                             │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │  WebApp (Next.js)                               │ │   │
│  │  │  - 헤더: Native 모드에서 숨김 (중복 방지)       │ │   │
│  │  │  - 콘텐츠 + 하단 네비                          │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

- **Mobile**: WebView로 WebApp URL 로드. Native 헤더 + Google 로그인 + 푸시 등록 제공.
- **WebApp**: 반응형 단일 클라이언트. `__IS_NATIVE_APP__`로 Native WebView 여부 판별.

---

## 2. Native 감지

| 구분 | 주입/제공 | 용도 |
|------|-----------|------|
| `window.__IS_NATIVE_APP__` | mobile `injectedJavaScriptBeforeContentLoaded` | UI 분기 (푸시 토글 노출, 헤더 숨김 등) |
| `window.ReactNativeWebView` | react-native-webview 라이브러리 | Native로 postMessage 전송 |

**WebApp 코드:**
- `useIsNativeApp()` hook → `__IS_NATIVE_APP__` 기반 (settings/notifications 등)
- `bridge.isNativeApp()` → `__IS_NATIVE_APP__` || `ReactNativeWebView`
- `bridge.canSendToNative()` → `ReactNativeWebView` 존재 여부

---

## 3. 메시지 프로토콜 (Bridge)

### WebApp → Mobile

| type | 설명 | payload |
|------|------|---------|
| `LOGIN_GOOGLE` | 네이티브 구글 로그인 요청 | - |
| `AUTH_READY` | JWT 로그인 완료 (푸시 등록용) | `{ token: string }` |

### Mobile → WebApp

| type | 설명 | payload |
|------|------|---------|
| `LOGIN_SUCCESS` | 구글 로그인 성공 | `{ token: string }` (idToken) |
| `LOGIN_FAILURE` | 구글 로그인 실패 | `{ error?: string }` |

**WebApp 사용:**
- `bridge.send('LOGIN_GOOGLE')` — GoogleSignInButton (Native 모드)
- `bridge.send('AUTH_READY', { token })` — _app.tsx (로그인 시)
- `bridge.subscribe('LOGIN_SUCCESS', cb)` — index, login 페이지

---

## 4. 환경 변수 정렬

| 변수 | WebApp | Mobile | 설명 |
|------|--------|--------|------|
| API URL | `NEXT_PUBLIC_API_URL` | `EXPO_PUBLIC_API_URL` | NestJS 서버 (푸시 등록 포함) |
| WebApp URL | `NEXT_PUBLIC_WEBAPP_URL` | `EXPO_PUBLIC_WEBAPP_URL` | WebView 로드 대상 (prod) |
| Google Client ID | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | app.config.js (webClientId) | OAuth 검증용 |

**Mobile 개발:**
- dev: WebApp `localhost:3000` (Android `10.0.2.2:3000`)
- prod: `EXPO_PUBLIC_WEBAPP_URL` 또는 기본 `https://gold-race-webapp.vercel.app`

**WebApp 개발:**
- `NEXT_PUBLIC_API_URL`: Server 기본 `http://localhost:3001/api`

---

## 5. 플랫폼별 UI 분기

| 기능 | Web | Mobile (WebView) |
|------|-----|------------------|
| 푸시 알림 토글 | 숨김 | 노출 |
| 상단 헤더 | WebApp 헤더 | Native 헤더만 (WebApp 헤더 숨김) |
| 구글 로그인 | GSI 버튼 | Native Google Sign-In |
| 하단 네비 | WebApp 네비 | 동일 |

---

## 6. 관련 파일

| 구분 | 경로 |
|------|------|
| Mobile WebView | `mobile/app/webview.tsx` |
| Bridge | `webapp/lib/bridge.ts` |
| Native 감지 Hook | `webapp/lib/hooks/useIsNativeApp.ts` |
| 구글 로그인 버튼 | `webapp/components/GoogleSignInButton.tsx` |
| 레이아웃 (헤더 숨김) | `webapp/components/Layout.tsx` |
| 알림 설정 (푸시 분기) | `webapp/pages/settings/notifications.tsx` |
