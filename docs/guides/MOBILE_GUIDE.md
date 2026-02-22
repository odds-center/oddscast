# OddsCast Mobile 가이드

> React Native (Expo) — WebView 기반 경마 예측 앱

---

## 주요 기능

- **WebView 기반** — WebApp URL 로드로 모든 UI/기능 제공
- **반응형 WebApp** — Desktop/Mobile 자동 전환
- **Google 로그인** — Native 구글 로그인 → WebApp으로 idToken 전달

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Framework | React Native + Expo |
| Language | TypeScript |
| WebView | react-native-webview |
| Navigation | Expo Router |
| Google Auth | @react-native-google-signin/google-signin |

---

## 빠른 시작

```bash
cd mobile
npm install
npm run start   # Metro port 3006
```

### 실행 모드

```bash
npm run ios      # iOS 시뮬레이터 (macOS)
npm run android  # Android 에뮬레이터
npm run web     # 웹 브라우저
```

---

## 프로젝트 구조

```
mobile/
├── app/
│   ├── index.tsx      # → /webview 리다이렉트
│   ├── webview.tsx    # WebView (WebApp URL, Google 로그인 Bridge)
│   ├── _layout.tsx
│   └── +not-found.tsx
├── assets/
├── app.config.js     # webClientId 등
└── package.json
```

---

## WebApp URL 설정

`webview.tsx`에서 설정:

| 환경 | URL |
|------|-----|
| Dev Android | `http://10.0.2.2:3000` |
| Dev iOS | `http://localhost:3000` |
| Prod | `https://gold-race-webapp.vercel.app` |

---

## Native ↔ WebApp Bridge

| WebView → Native | 설명 |
|------------------|------|
| `LOGIN_GOOGLE` | Native 구글 로그인 요청 |

| Native → WebView | 설명 |
|------------------|------|
| `LOGIN_SUCCESS` | `{ token: idToken }` |
| `LOGIN_FAILURE` | `{ error: string }` |

### 플랫폼 감지 (알림 설정 푸시 토글)

`webview.tsx`에서 `injectedJavaScriptBeforeContentLoaded="window.__IS_NATIVE_APP__=true;"` 주입. WebApp의 `useIsNativeApp()` 훅이 이를 감지하여 `/settings/notifications`에서 푸시 알림 토글을 mobile에서만 표시.

---

## 참조

- [시스템 아키텍처](../architecture/ARCHITECTURE.md)
- [API 명세](../architecture/API_SPECIFICATION.md)
- [WebApp 개발 가이드](WEBAPP_DEVELOPMENT.md)
- [경마 용어](../reference/HORSE_RACING_TERMINOLOGY.md)
