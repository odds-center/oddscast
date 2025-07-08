# Google Sign-In 설정 가이드 (`@react-native-google-signin`)

본 문서는 `@react-native-google-signin/google-signin` 라이브러리를 사용하여 Google 로그인을 설정하는 과정을 안내합니다.

## 1. 라이브러리 설치

먼저, 필요한 라이브러리를 설치합니다.

```bash
npm install @react-native-google-signin/google-signin
```

## 2. Google Cloud Console 설정

Google 로그인을 위해서는 Google Cloud Platform(GCP)에서 다음 세 가지 유형의 OAuth 2.0 클라이언트 ID가 필요합니다.

1.  **Google Cloud Console**에 접속하여 프로젝트를 선택합니다.
2.  **API 및 서비스 > 사용자 인증 정보** 메뉴로 이동합니다.
3.  **사용자 인증 정보 만들기 > OAuth 클라이언트 ID**를 선택합니다.
4.  다음 세 가지 유형의 클라이언트 ID를 생성합니다:
    *   **웹 애플리케이션**: Supabase와 연동하기 위한 `webClientId`로 사용됩니다. **승인된 리디렉션 URI**에 Supabase 대시보드에서 확인한 `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback` 형태의 URL을 추가해야 합니다.
    *   **iOS**: 앱의 `Bundle Identifier`를 입력하여 iOS용 클라이언트 ID를 생성합니다. 이 ID는 `iosClientId`로 사용됩니다.
    *   **Android**: 앱의 `Package Name`과 `SHA-1 인증서 지문`을 입력하여 Android용 클라이언트 ID를 생성합니다. 이 ID는 `androidClientId`로 사용됩니다.
5.  생성된 각 클라이언트 ID를 복사하여 안전한 곳에 보관합니다.

> **참고:** `Package Name`은 `app.json` 파일의 `android.package` 필드에서 확인할 수 있습니다. `SHA-1` 지문은 `eas build`를 실행하거나 Android Studio에서 얻을 수 있습니다.

## 3. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고, GCP에서 발급받은 클라이언트 ID들을 추가합니다. `EXPO_PUBLIC_` 접두사를 사용해야 합니다.

```dotenv
EXPO_PUBLIC_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID
EXPO_PUBLIC_IOS_CLIENT_ID=YOUR_IOS_CLIENT_ID
EXPO_PUBLIC_ANDROID_CLIENT_ID=YOUR_ANDROID_CLIENT_ID
```

## 4. 코드 적용

`LoginScreen.tsx` 파일에서 `GoogleSignin.configure`를 사용하여 클라이언트 ID를 설정하고, `GoogleSignin.signIn()`을 통해 로그인 흐름을 시작합니다.

- **파일 위치**: `components/screens/auth/LoginScreen.tsx`

```typescript
// components/screens/auth/LoginScreen.tsx

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useAuth } from '@/context/AuthProvider';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_WEB_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_IOS_CLIENT_ID;
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID;

export default function LoginScreen() {
  const { signIn: authSignIn } = useAuth();

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
        await authSignIn(userInfo.idToken); // Supabase와 연동
      } else {
        throw new Error('Google ID Token이 없습니다.');
      }
    } catch (error: any) {
      // 에러 처리
    }
  };

  // ... (렌더링 부분)
}
```

## 5. 네이티브 프로젝트 설정 (Expo `app.json`)

`@react-native-google-signin/google-signin`는 네이티브 설정이 필요합니다. Expo 앱에서는 `app.json` (또는 `app.config.js`) 파일을 통해 이 설정을 추가할 수 있습니다.

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
      "package": "com.goldenrace.app"
      // ... 기존 android 설정
    },
    "ios": {
      "bundleIdentifier": "com.goldenrace.app"
      // ... 기존 ios 설정
    }
  }
}
```

> **주의**: `iosUrlScheme` 값은 GCP에서 생성한 iOS 클라이언트 ID의 **역방향 클라이언트 ID**와 일치해야 합니다. (예: `com.googleusercontent.apps.123456-abcdefg`의 역방향은 `apps.abcdefg-123456.googleusercontent.com`)

## 6. 사용법

설정이 완료되면 코드에서 `handleGoogleSignIn` 함수를 호출하여 로그인 흐름을 시작할 수 있습니다. 성공 시 `useAuth` 훅을 통해 사용자 세션 정보에 접근할 수 있습니다.