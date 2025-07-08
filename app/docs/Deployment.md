# 배포 (Deployment)

본 문서는 Golden Race 앱을 빌드하고 배포하는 방법에 대한 기본적인 지침을 제공합니다. Expo 프로젝트는 EAS Build를 통해 iOS 및 Android 앱 바이너리를 쉽게 생성할 수 있습니다.

## 1. EAS CLI 설치

EAS Build를 사용하려면 먼저 EAS CLI를 설치해야 합니다.

```bash
npm install -g eas-cli
```

## 2. Expo 계정 로그인

EAS CLI를 사용하여 Expo 계정에 로그인합니다.

```bash
eas login
```

## 3. EAS 프로젝트 설정

프로젝트를 EAS에 연결하고 `eas.json` 파일을 생성합니다.

```bash
eas project:init
```

이 명령은 `eas.json` 파일을 생성하며, 빌드 프로파일(예: `development`, `preview`, `production`)을 정의할 수 있습니다.

## 4. 환경 변수 관리

`.env` 파일에 정의된 환경 변수(예: Supabase URL, API 키, Google 클라이언트 ID)는 EAS Build 과정에서 안전하게 주입되어야 합니다. EAS Secrets를 사용하여 환경 변수를 관리하는 것이 좋습니다.

```bash
eas secret:push --env-file .env
```

이 명령은 `.env` 파일의 내용을 EAS Secrets로 업로드합니다. 빌드 시 EAS는 이 Secrets를 사용하여 환경 변수를 앱에 주입합니다.

## 5. 앱 빌드

iOS 또는 Android 앱 바이너리를 빌드합니다.

### iOS 빌드

```bash
eas build --platform ios --profile production
```

### Android 빌드

```bash
eas build --platform android --profile production
```

*   `--platform`: `ios`, `android`, 또는 `all`을 지정합니다.
*   `--profile`: `eas.json`에 정의된 빌드 프로파일을 지정합니다. (예: `production`, `development`, `preview`)

빌드가 완료되면 Expo 대시보드에서 빌드 상태를 확인하고, 생성된 `.ipa` (iOS) 또는 `.apk` / `.aab` (Android) 파일을 다운로드할 수 있습니다.

## 6. 앱 스토어 배포

생성된 앱 바이너리(`ipa`, `aab`)는 각 앱 스토어(Apple App Store, Google Play Store)의 가이드라인에 따라 수동으로 업로드하고 배포할 수 있습니다.

*   **Apple App Store**: Apple Developer 계정을 통해 App Store Connect에 업로드합니다.
*   **Google Play Store**: Google Play Console을 통해 앱을 업로드하고 출시합니다.

## 7. OTA (Over-the-Air) 업데이트

Expo는 OTA 업데이트를 지원하여 앱 스토어에 새 버전을 제출하지 않고도 JavaScript 코드 및 에셋을 업데이트할 수 있습니다.

```bash
eas update
```

이 명령은 최신 JavaScript 번들을 Expo 서버에 게시하고, 사용자의 앱은 다음 실행 시 자동으로 업데이트를 다운로드합니다.

---