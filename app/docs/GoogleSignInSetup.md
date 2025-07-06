# Google Sign-In 설정 가이드 (`@react-native-google-signin`)

본 문서는 `@react-native-google-signin/google-signin` 라이브러리를 사용하여 Google 로그인을 설정하는 과정을 안내합니다.

## 1. 라이브러리 설치

먼저, 필요한 라이브러리를 설치합니다.

```bash
npm install @react-native-google-signin/google-signin
```

## 2. Google Cloud Console 설정

Google 로그인을 위해서는 Google Cloud Platform(GCP)에서 **웹 애플리케이션** 유형의 OAuth 2.0 클라이언트 ID가 필요합니다. 이 ID는 안드로이드와 iOS 양쪽에서 모두 사용됩니다.

1.  **Google Cloud Console**에 접속하여 프로젝트를 선택합니다.
2.  **API 및 서비스 > 사용자 인증 정보** 메뉴로 이동합니다.
3.  **사용자 인증 정보 만들기 > OAuth 클라이언트 ID**를 선택합니다.
4.  애플리케이션 유형을 **웹 애플리케이션**으로 선택합니다.
5.  이름을 지정하고 **만들기**를 클릭합니다. (승인된 리디렉션 URI는 설정할 필요 없습니다.)
6.  생성된 **클라이언트 ID**를 복사하여 보관합니다. 이 ID가 코드에서 `webClientId`로 사용됩니다.

## 3. 코드 적용

발급받은 `webClientId`를 로그인 화면 코드에 적용합니다.

- **파일 위치**: `/screens/auth/LoginScreen.tsx`

아래 코드의 `YOUR_WEB_CLIENT_ID` 부분을 실제 발급받은 값으로 교체해야 합니다.

```typescript
// /screens/auth/LoginScreen.tsx

GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID', // 여기에 Web Client ID 붙여넣기
});
```

## 4. 네이티브 프로젝트 설정 (중요)

`@react-native-google-signin/google-signin`는 네이티브 설정이 필요합니다. Expo 앱에서는 `app.json` (또는 `app.config.js`) 파일을 통해 이 설정을 추가할 수 있습니다.

### Android 설정

1.  Google Cloud Console에서 생성한 **웹 클라이언트 ID**가 필요합니다.
2.  `app.json` 파일에 `android.googleServicesFile` 항목을 직접 추가하는 대신, Expo의 플러그인 시스템을 활용합니다.

`app.json` 파일에 다음 `plugins` 설정을 추가하세요.

```json
{
  "expo": {
    // ... 기존 expo 설정
    "plugins": [
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": "com.googleusercontent.apps.YOUR_REVERSED_IOS_CLIENT_ID"
        }
      ]
    ],
    "android": {
      "package": "com.yourcompany.yourappname"
      // ... 기존 android 설정
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourappname"
      // ... 기존 ios 설정
    }
  }
}
```

### iOS 설정

1.  Google Cloud Console에서 **iOS** 유형의 OAuth 클라이언트 ID를 별도로 생성해야 합니다.
2.  생성된 iOS 클라이언트 ID를 뒤집은 형태의 **Reversed iOS Client ID**가 필요합니다. (예: `com.googleusercontent.apps.123456-abcdefg`)
3.  `app.json`의 `plugins` 설정에 위 예시처럼 `iosUrlScheme` 값을 추가합니다.

## 5. 사용법

설정이 완료되면 코드에서 `GoogleSignin.signIn()` 메소드를 호출하여 로그인 흐름을 시작할 수 있습니다. 성공 시 `userInfo` 객체를 통해 사용자 정보를 얻을 수 있습니다.

```typescript
const signIn = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    // 로그인 성공 처리
  } catch (error) {
    // 에러 처리
  }
};
```
