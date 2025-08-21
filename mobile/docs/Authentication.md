# 인증 (Authentication)

본 앱은 `@react-native-google-signin/google-signin` 라이브러리를 사용하여 Google 소셜 로그인을 통해 사용자를 인증합니다.

## 1. Google Cloud Console 설정

Google 로그인을 연동하기 위해서는 Google Cloud Platform(GCP)에서 OAuth 2.0 클라이언트 ID를 발급받아야 합니다.

1.  **Google Cloud Console**에 접속하여 새 프로젝트를 생성하거나 기존 프로젝트를 선택합니다.
2.  **API 및 서비스 > 사용자 인증 정보** 메뉴로 이동합니다.
3.  **사용자 인증 정보 만들기 > OAuth 클라이언트 ID**를 선택합니다.
4.  다음 세 가지 유형의 클라이언트 ID를 생성합니다:
    - **웹 애플리케이션**: 백엔드 API와 연동하기 위한 `webClientId`로 사용됩니다.
    - **iOS**: 앱의 `Bundle Identifier`를 입력하여 iOS용 클라이언트 ID를 생성합니다. 이 ID는 `iosClientId`로 사용됩니다.
    - **Android**: 앱의 `Package Name`과 `SHA-1 인증서 지문`을 입력하여 Android용 클라이언트 ID를 생성합니다. 이 ID는 `androidClientId`로 사용됩니다.
5.  생성된 각 클라이언트 ID를 복사하여 안전한 곳에 보관합니다.

> **참고:** `Package Name`은 `app.json` 파일의 `android.package` 필드에서 확인할 수 있습니다. `SHA-1` 지문은 `eas build`를 실행하거나 Android Studio에서 얻을 수 있습니다.

## 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고, GCP에서 발급받은 클라이언트 ID들을 추가합니다. `EXPO_PUBLIC_` 접두사를 사용해야 합니다.

```dotenv
EXPO_PUBLIC_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID
EXPO_PUBLIC_IOS_CLIENT_ID=YOUR_IOS_CLIENT_ID
EXPO_PUBLIC_ANDROID_CLIENT_ID=YOUR_ANDROID_CLIENT_ID
```

## 3. 코드 적용

`@react-native-google-signin/google-signin` 라이브러리를 사용하여 Google 로그인을 구현합니다.

- **파일 위치**: `components/screens/auth/LoginScreen.tsx`

```typescript
// components/screens/auth/LoginScreen.tsx

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_WEB_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_IOS_CLIENT_ID;
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID;

// ...

useEffect(() => {
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    offlineAccess: true,
  });
}, []);

const handleGoogleSignIn = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();

    if (userInfo.idToken) {
      // 백엔드 API에 ID 토큰을 전송하여 JWT 발급
      const response = await fetch('/api/auth/google/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: userInfo.idToken }),
      });

      if (response.ok) {
        const { access_token, user } = await response.json();
        // 로그인 성공 후 라우팅
      } else {
        // 로그인 오류 처리
      }
    } else {
      throw new Error('Google ID Token이 없습니다.');
    }
  } catch (error: any) {
    // Google 로그인 오류 처리
  }
};
```

## 4. 인증 흐름

1.  사용자가 "Google로 로그인" 버튼을 누르면 `handleGoogleSignIn` 함수가 호출됩니다.
2.  `GoogleSignin.signIn()`을 통해 Google 로그인 절차가 시작됩니다.
3.  로그인 성공 시 반환되는 `idToken`을 백엔드 API에 전달하여 JWT를 발급받습니다.
4.  백엔드 인증 성공 시, 앱의 메인 화면으로 리디렉션됩니다.

## 5. 사용자 프로필 관리

새로운 사용자가 Google 로그인을 통해 인증되면, 백엔드 데이터베이스에 사용자 정보가 생성됩니다. 이와 동시에 해당 사용자의 프로필 정보가 자동으로 생성됩니다.

- **사용자 프로필 정보**:
  - 사용자 ID
  - 이메일 주소
  - 이름
  - 프로필 이미지
  - 알림 설정
  - 생성일시
  - 수정일시
