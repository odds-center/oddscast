
# 인증 (Authentication)

본 앱은 Google 소셜 로그인을 사용하여 사용자를 인증합니다.

## 1. Google Cloud Console 설정

Google 로그인을 연동하기 위해서는 Google Cloud Platform(GCP)에서 OAuth 2.0 클라이언트 ID를 발급받아야 합니다. 이 과정은 수동으로 진행해야 합니다.

1.  **Google Cloud Console**에 접속하여 새 프로젝트를 생성하거나 기존 프로젝트를 선택합니다.
2.  **API 및 서비스 > 사용자 인증 정보** 메뉴로 이동합니다.
3.  **사용자 인증 정보 만들기 > OAuth 클라이언트 ID**를 선택합니다.
4.  애플리케이션 유형을 선택합니다.
    - **iOS**: 앱의 `Bundle Identifier`를 입력하여 iOS용 클라이언트 ID를 생성합니다.
    - **Android**: 앱의 `Package Name`과 `SHA-1 인증서 지문`을 입력하여 Android용 클라이언트 ID를 생성합니다.
5.  생성된 **iOS 클라이언트 ID**와 **Android 클라이언트 ID**를 복사하여 안전한 곳에 보관합니다.

> **참고:** `Package Name`은 `app.json` 파일의 `android.package` 필드에서 확인할 수 있습니다. `SHA-1` 지문은 `eas build`를 실행하거나 다음 명령어로 얻을 수 있습니다: `keytool -list -v -keystore <keystore_path> -alias <alias_name>`

## 2. 클라이언트 ID 적용

발급받은 클라이언트 ID는 코드에 직접 적용해야 합니다.

- **파일 위치**: `/screens/auth/LoginScreen.tsx`

아래 코드의 `YOUR_IOS_CLIENT_ID`와 `YOUR_ANDROID_CLIENT_ID` 부분을 실제 발급받은 값으로 교체해야 합니다.

```typescript
// /screens/auth/LoginScreen.tsx

const [request, response, promptAsync] = Google.useAuthRequest({
  iosClientId: 'YOUR_IOS_CLIENT_ID', // 여기에 iOS 클라이언트 ID 붙여넣기
  androidClientId: 'YOUR_ANDROID_CLIENT_ID', // 여기에 Android 클라이언트 ID 붙여넣기
  // ...
});
```

## 3. 인증 흐름

1.  사용자가 "Google로 로그인" 버튼을 누르면 `promptAsync()` 함수가 호출됩니다.
2.  `expo-web-browser`를 통해 Google 로그인 웹페이지가 열립니다.
3.  사용자가 로그인을 완료하면 `response` 객체에 인증 결과가 담겨 돌아옵니다.
4.  `response.type`이 `success`일 경우, `response.authentication` 객체에 포함된 `accessToken`을 사용하여 백엔드 서버와 통신하거나 사용자 정보를 가져올 수 있습니다.
