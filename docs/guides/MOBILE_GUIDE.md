# OddsCast Mobile 가이드

> React Native **CLI** (Expo 없음) · **WebView 형식** — 네이티브는 셸만 제공하고, 실제 UI/기능은 WebView에 로드되는 WebApp에서 동작

---

## 아키텍처

- **CLI**: 빌드·실행은 모두 React Native CLI (로컬). EAS/Expo 빌드 미사용.
- **WebView 형식**: 네이티브 앱 = 상단 바(뒤로가기·새로고침) + **단일 WebView**. 모든 페이지·기능은 WebView 안의 WebApp이 담당.

## 주요 기능

- **WebView 기반** — WebApp URL 로드로 모든 UI/기능 제공
- **반응형 WebApp** — Desktop/Mobile 자동 전환
- **인증** — 이메일/비밀번호 로그인 (WebApp 로그인 페이지)
- **푸시** — FCM (Firebase Cloud Messaging), Expo Push 미사용

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Framework | React Native (CLI) |
| Language | TypeScript |
| WebView | react-native-webview |
| Navigation | React Navigation (native-stack) |
| 푸시 | @react-native-firebase/messaging, 서버는 firebase-admin (FCM) |

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
```

---

## 로컬 CLI 빌드

Expo/EAS를 사용하지 않으므로 **모든 빌드는 로컬 CLI**로 진행합니다.

### 사전 요구사항

- **Android**: JDK 17+, Android SDK, `ANDROID_HOME` 설정
- **iOS**: macOS + Xcode, CocoaPods (`cd ios && pod install`)

### 환경 변수 (선택)

`src/config.ts`가 `APP_ENV` / `EXPO_PUBLIC_WEBAPP_URL` / `EXPO_PUBLIC_API_URL`를 읽습니다. 프로덕션 빌드 시:

```bash
APP_ENV=production npm run build:android:apk
```

### Android — APK

```bash
cd mobile
npm run build:android:apk
```

- APK 경로: `android/app/build/outputs/apk/release/app-release.apk`

### Android — AAB (Play Store)

```bash
cd mobile
npm run build:android:bundle
```

- AAB 경로: `android/app/build/outputs/bundle/release/app-release.aab`

### iOS

```bash
cd mobile
cd ios && pod install && cd ..
npm run build:ios
```

- App Store 제출용 IPA는 Xcode에서 **Product → Archive** 후 Organizer에서 Distribute App.

---

## 프로젝트 구조

```
mobile/
├── index.js           # 엔트리 (AppRegistry 'main')
├── App.tsx            # 루트 (React Navigation Stack)
├── src/
│   ├── config.ts      # WebApp URL, API URL
│   ├── push.ts        # FCM 토큰/초기 알림
│   ├── screens/
│   │   ├── IndexScreen.tsx   # 스플래시 → Webview 또는 deepLink
│   │   ├── WebAppScreen.tsx  # WebView (푸시·AUTH Bridge)
│   │   └── NotFoundScreen.tsx
├── android/
├── ios/
└── package.json
```

---

## WebApp / API URL

`src/config.ts`에서 설정. `__DEV__`일 때 Android는 `10.0.2.2`, iOS는 `localhost`. 프로덕션은 `EXPO_PUBLIC_WEBAPP_URL`, `EXPO_PUBLIC_API_URL` 사용.

---

## 푸시 (FCM)

- **클라이언트**: `@react-native-firebase/app`, `@react-native-firebase/messaging`. `src/push.ts`에서 토큰 취득·초기 알림 처리.
- **서버**: `firebase-admin`. 환경 변수 `GOOGLE_APPLICATION_CREDENTIALS`(파일 경로) 또는 `FIREBASE_SERVICE_ACCOUNT_JSON`(JSON 문자열). `/api/notifications/push-subscribe`에 FCM 토큰 전달.

---

## Native ↔ WebApp Bridge

| type | 설명 |
|------|------|
| `AUTH_READY` | WebApp 로그인 완료 시 JWT 전달 (푸시 등록용) |
| `AUTH_LOGOUT` | WebApp 로그아웃 시 토큰 초기화 |

### 플랫폼 감지 (알림 설정 푸시 토글)

WebView에 `injectedJavaScriptBeforeContentLoaded="window.__IS_NATIVE_APP__=true;"` 주입. WebApp의 `useIsNativeApp()`로 푸시 토글을 mobile에서만 표시.

---

## 참조

- [시스템 아키텍처](../architecture/ARCHITECTURE.md)
- [API 명세](../architecture/API_SPECIFICATION.md)
- [WebApp 개발 가이드](WEBAPP_DEVELOPMENT.md)
