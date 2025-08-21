# Google 로그인 사용법

이 문서는 앱에서 구글 로그인을 구현하고 사용하는 방법을 설명합니다.

## 🏗️ 아키텍처

### TanStack Query 기반 상태 관리
- Redux 대신 TanStack Query를 사용하여 API 상태 관리
- 서버 상태와 클라이언트 상태를 명확히 분리
- 자동 캐싱 및 동기화

### 구조
```
app/
├── utils/
│   ├── GoogleAuthService.ts    # 구글 로그인 서비스
│   ├── Constants.ts            # 상수 정의
│   ├── axios.ts               # HTTP 클라이언트
│   └── alert.ts               # 알림 유틸리티
├── lib/
│   ├── api/
│   │   └── authApi.ts         # 인증 API
│   └── types/
│       └── auth.ts            # 타입 정의
├── hooks/
│   └── useAuth.ts             # 인증 관련 훅들
└── store/
    └── authSlice.ts           # 로컬 인증 상태 관리
```

## 🚀 사용법

### 1. 기본 설정

먼저 필요한 의존성이 설치되어 있는지 확인하세요:

```bash
npm install @react-native-google-signin/google-signin @react-native-async-storage/async-storage @tanstack/react-query axios
```

### 2. 환경 변수 설정

`app.config.js` 또는 환경 변수에 구글 클라이언트 ID를 설정하세요:

```javascript
export default {
  expo: {
    // ... 기타 설정
    extra: {
      googleWebClientId: 'your-web-client-id.apps.googleusercontent.com',
      googleIosClientId: 'your-ios-client-id.apps.googleusercontent.com',
      googleAndroidClientId: 'your-android-client-id.apps.googleusercontent.com',
    },
  },
};
```

### 3. 컴포넌트에서 사용

#### 로그인 화면 예시

```tsx
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Alert } from 'react-native';
import { useLogin, useGoogleLogin } from '../hooks/useAuth';
import googleAuth from '../utils/GoogleAuthService';
import { showGoogleLoginError } from '../utils/alert';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password] = useState('');

  const loginMutation = useLogin();
  const googleLoginMutation = useGoogleLogin();

  // 이메일/비밀번호 로그인
  const handleEmailLogin = async () => {
    try {
      await loginMutation.mutateAsync({ email, password });
      // 로그인 성공 후 처리
    } catch (error) {
      Alert.alert('로그인 실패', '이메일 또는 비밀번호를 확인해주세요.');
    }
  };

  // 구글 로그인
  const handleGoogleLogin = async () => {
    try {
      const userInfo = await googleAuth.signIn();
      
      if (userInfo.type === 'success') {
        await googleLoginMutation.mutateAsync(userInfo);
        // 로그인 성공 후 처리
      }
    } catch (error) {
      showGoogleLoginError(error);
    }
  };

  return (
    <View>
      {/* 이메일/비밀번호 입력 폼 */}
      <TouchableOpacity onPress={handleEmailLogin} disabled={loginMutation.isPending}>
        <Text>{loginMutation.isPending ? '로그인 중...' : '로그인'}</Text>
      </TouchableOpacity>

      {/* 구글 로그인 버튼 */}
      <TouchableOpacity onPress={handleGoogleLogin} disabled={googleLoginMutation.isPending}>
        <Text>{googleLoginMutation.isPending ? 'Google 로그인 중...' : 'Google 계정으로 로그인'}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;
```

## 🔐 보안 기능

### PKCE 지원
- OAuth 2.0 PKCE 플로우로 CSRF 공격 방지
- 모바일 앱에서 안전한 인증

### 토큰 관리
- JWT 토큰 자동 갱신
- 만료된 토큰 자동 제거
- 안전한 토큰 저장 (AsyncStorage)

### 에러 처리
- 네트워크 오류 자동 감지
- 인증 실패 시 자동 로그아웃
- 사용자 친화적인 에러 메시지

## 📱 플랫폼별 설정

### Android
1. `google-services.json` 파일을 `android/app/` 디렉토리에 추가
2. `android/build.gradle`에 Google Services 플러그인 추가
3. `android/app/build.gradle`에 Google Sign-In 의존성 추가

### iOS
1. `GoogleService-Info.plist` 파일을 `ios/` 디렉토리에 추가
2. `ios/Podfile`에 Google Sign-In pod 추가
3. URL Scheme 설정

## 🚨 주의사항

1. **클라이언트 ID 보안**: 클라이언트 ID는 공개되어도 안전하지만, 클라이언트 시크릿은 절대 노출하지 마세요.

2. **토큰 저장**: 민감한 정보는 AsyncStorage 대신 Keychain(iOS) 또는 Keystore(Android)를 사용하세요.

3. **에러 처리**: 모든 API 호출에 적절한 에러 처리를 추가하세요.

4. **사용자 경험**: 로딩 상태와 에러 상태를 명확하게 표시하세요.
