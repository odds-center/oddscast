# 인증 (Authentication)

본 앱은 Supabase와 `@react-native-google-signin/google-signin` 라이브러리를 사용하여 Google 소셜 로그인을 통해 사용자를 인증합니다.

## 1. Google Cloud Console 설정

Google 로그인을 연동하기 위해서는 Google Cloud Platform(GCP)에서 OAuth 2.0 클라이언트 ID를 발급받아야 합니다.

1.  **Google Cloud Console**에 접속하여 새 프로젝트를 생성하거나 기존 프로젝트를 선택합니다.
2.  **API 및 서비스 > 사용자 인증 정보** 메뉴로 이동합니다.
3.  **사용자 인증 정보 만들기 > OAuth 클라이언트 ID**를 선택합니다.
4.  다음 세 가지 유형의 클라이언트 ID를 생성합니다:
    *   **웹 애플리케이션**: Supabase와 연동하기 위한 `webClientId`로 사용됩니다. **승인된 리디렉션 URI**에 Supabase 대시보드에서 확인한 `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback` 형태의 URL을 추가해야 합니다.
    *   **iOS**: 앱의 `Bundle Identifier`를 입력하여 iOS용 클라이언트 ID를 생성합니다. 이 ID는 `iosClientId`로 사용됩니다.
    *   **Android**: 앱의 `Package Name`과 `SHA-1 인증서 지문`을 입력하여 Android용 클라이언트 ID를 생성합니다. 이 ID는 `androidClientId`로 사용됩니다.
5.  생성된 각 클라이언트 ID를 복사하여 안전한 곳에 보관합니다.

> **참고:** `Package Name`은 `app.json` 파일의 `android.package` 필드에서 확인할 수 있습니다. `SHA-1` 지문은 `eas build`를 실행하거나 Android Studio에서 얻을 수 있습니다.

## 2. Supabase 설정

1.  Supabase 프로젝트 대시보드에서 **Authentication > Providers**로 이동합니다.
2.  **Google**을 활성화하고, GCP에서 생성한 **웹 애플리케이션** 유형의 OAuth 클라이언트 ID의 **Client ID**와 **Client Secret**을 입력합니다.
3.  **Redirect URIs**에 `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`이 올바르게 등록되어 있는지 확인합니다.

## 3. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고, GCP에서 발급받은 클라이언트 ID들을 추가합니다. `EXPO_PUBLIC_` 접두사를 사용해야 합니다.

```dotenv
EXPO_PUBLIC_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID
EXPO_PUBLIC_IOS_CLIENT_ID=YOUR_IOS_CLIENT_ID
EXPO_PUBLIC_ANDROID_CLIENT_ID=YOUR_ANDROID_CLIENT_ID
```

## 4. 코드 적용

`@react-native-google-signin/google-signin` 라이브러리를 사용하여 Google 로그인을 구현합니다.

- **파일 위치**: `components/screens/auth/LoginScreen.tsx`

```typescript
// components/screens/auth/LoginScreen.tsx

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { supabase } from '@/lib/supabase';

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
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: userInfo.idToken,
      });

      if (error) {
        // Supabase 로그인 오류 처리
      } else {
        // 로그인 성공 후 라우팅
      }
    } else {
      throw new Error('Google ID Token이 없습니다.');
    }
  } catch (error: any) {
    // Google 로그인 오류 처리
  }
};
```

## 5. 인증 흐름

1.  사용자가 "Google로 로그인" 버튼을 누르면 `handleGoogleSignIn` 함수가 호출됩니다.
2.  `GoogleSignin.signIn()`을 통해 Google 로그인 절차가 시작됩니다.
3.  로그인 성공 시 반환되는 `idToken`을 `supabase.auth.signInWithIdToken`에 전달하여 Supabase에 사용자를 인증합니다.
4.  Supabase 인증 성공 시, 앱의 메인 화면으로 리디렉션됩니다.

## 6. 사용자 프로필 관리

새로운 사용자가 Google 로그인을 통해 인증되면, Supabase의 `auth.users` 테이블에 사용자 정보가 생성됩니다. 이와 동시에 `profiles` 테이블에 해당 사용자의 프로필 정보가 자동으로 생성되도록 트리거를 설정합니다.

*   **`profiles` 테이블 스키마**:
    ```sql
    CREATE TABLE public.profiles (
      id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
      email text UNIQUE,
      username text,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone,
      notifications_enabled BOOLEAN DEFAULT TRUE
    );
    ```

*   **프로필 자동 생성 함수 및 트리거**:
    새로운 사용자가 가입할 때 `auth.users` 테이블의 `raw_user_meta_data`에서 사용자 이름을 포함한 정보를 가져와 `profiles` 테이블에 자동으로 삽입합니다.

    ```sql
    -- Creates a public.profiles table for public user data
    CREATE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $
    BEGIN
      INSERT INTO public.profiles (id, email, username)
      VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'name');
      RETURN NEW;
    END;
    $ LANGUAGE plpgsql SECURITY DEFINER;

    -- Triggers handle_new_user function on new user creation
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    ```

*   **프로필 자동 업데이트 함수 및 트리거**:
    `profiles` 테이블의 행이 업데이트될 때마다 `updated_at` 필드를 현재 시간으로 자동 갱신합니다.

    ```sql
    -- Function to update the updated_at timestamp
    CREATE OR REPLACE FUNCTION public.handle_profile_update()
    RETURNS TRIGGER AS $
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $ LANGUAGE plpgsql SECURITY DEFINER;

    -- Trigger to run the function on profile update
    CREATE TRIGGER on_profile_updated
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.handle_profile_update();
    ```

*   **기존 사용자 데이터 채우기**:
    만약 트리거를 설정하기 전에 이미 가입한 사용자가 있다면, 아래 쿼리를 실행하여 `auth.users` 테이블에서 `profiles` 테이블로 데이터를 마이그레이션할 수 있습니다.

    ```sql
    INSERT INTO public.profiles (id, email)
    SELECT id, email FROM auth.users
    ON CONFLICT (id) DO NOTHING;
    ```

*   **JWT 만료 기간 설정:**
    사용자 로그인 유지 기간을 설정하려면 Supabase 대시보드에서 JWT 만료 기간을 조정해야 합니다. `Authentication` -> `Settings` (또는 `Configuration` 등) 섹션에서 `JWT expiry` 필드를 찾아 원하는 기간(예: 30일 = 2,592,000초)으로 설정합니다.

사용자는 마이페이지에서 자신의 프로필 정보를 조회하고, 사용자 이름을 업데이트할 수 있습니다. 이메일은 Google 계정에서 가져오므로 직접 수정할 수 없습니다.
