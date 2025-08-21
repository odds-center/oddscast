import {
  GetTokensResponse,
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';

// Google Sign-In 설정
GoogleSignin.configure({
  webClientId:
    Constants.expoConfig?.extra?.googleWebClientId ||
    'your-web-client-id.apps.googleusercontent.com',
  iosClientId:
    Constants.expoConfig?.extra?.googleIosClientId ||
    'your-ios-client-id.apps.googleusercontent.com',
  offlineAccess: true,
  forceCodeForRefreshToken: true,
});

export interface GoogleUserInfo {
  idToken: string;
  serverAuthCode: string;
  user: {
    id: string;
    name: string;
    email: string;
    photo: string;
    familyName: string;
    givenName: string;
  };
}

export interface GoogleSignInResult {
  type: 'success' | 'cancelled' | 'error';
  data?: GoogleUserInfo;
  error?: string;
  idToken?: string;
}

class GoogleAuthService {
  /**
   * 구글 로그인을 시작합니다.
   */
  async signIn(): Promise<GoogleSignInResult> {
    try {
      // 기존 로그인 상태 확인
      await GoogleSignin.hasPlayServices();

      // 기존 로그인 해제
      await GoogleSignin.signOut();

      // 구글 로그인 실행
      const userInfo = await GoogleSignin.signIn();

      // Google Sign-In의 실제 응답 구조에 맞춰 처리
      // 타입 단언을 사용하여 타입 문제 해결
      const typedUserInfo = userInfo as any;

      if (typedUserInfo && typedUserInfo.user) {
        const googleUserInfo: GoogleUserInfo = {
          idToken: typedUserInfo.idToken || '',
          serverAuthCode: typedUserInfo.serverAuthCode || '',
          user: {
            id: typedUserInfo.user.id,
            name: typedUserInfo.user.name || '',
            email: typedUserInfo.user.email,
            photo: typedUserInfo.user.photo || '',
            familyName: typedUserInfo.user.familyName || '',
            givenName: typedUserInfo.user.givenName || '',
          },
        };

        return {
          type: 'success',
          data: googleUserInfo,
          idToken: typedUserInfo.idToken || '',
        };
      } else {
        throw new Error('사용자 정보를 가져올 수 없습니다.');
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return {
          type: 'cancelled',
          error: '사용자가 로그인을 취소했습니다.',
        };
      } else if (error.code === statusCodes.IN_PROGRESS) {
        return {
          type: 'error',
          error: '로그인이 이미 진행 중입니다.',
        };
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return {
          type: 'error',
          error: 'Google Play Services를 사용할 수 없습니다.',
        };
      } else {
        console.error('Google Sign-In Error:', error);
        return {
          type: 'error',
          error: error.message || '알 수 없는 오류가 발생했습니다.',
        };
      }
    }
  }

  /**
   * 현재 로그인된 사용자 정보를 가져옵니다.
   */
  async getCurrentUser(): Promise<GoogleUserInfo | null> {
    try {
      // GoogleSignin.isSignedIn() 메서드가 없는 경우 직접 확인
      const user = await GoogleSignin.getCurrentUser();
      if (user && (user as any).idToken) {
        const typedUser = user as any;
        return {
          idToken: typedUser.idToken,
          serverAuthCode: typedUser.serverAuthCode || '',
          user: {
            id: typedUser.user.id,
            name: typedUser.user.name || '',
            email: typedUser.user.email,
            photo: typedUser.user.photo || '',
            familyName: typedUser.user.familyName || '',
            givenName: typedUser.user.givenName || '',
          },
        };
      }
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * 구글 로그아웃을 실행합니다.
   */
  async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Google sign out error:', error);
      throw error;
    }
  }

  /**
   * 구글 계정 연결을 해제합니다.
   */
  async revokeAccess(): Promise<void> {
    try {
      await GoogleSignin.revokeAccess();
    } catch (error) {
      console.error('Google revoke access error:', error);
      throw error;
    }
  }

  /**
   * 구글 로그인 상태를 확인합니다.
   */
  async isSignedIn(): Promise<boolean> {
    try {
      // isSignedIn 메서드가 없는 경우 getCurrentUser로 확인
      const user = await GoogleSignin.getCurrentUser();
      return !!user && !!(user as any).idToken;
    } catch (error) {
      console.error('Check sign in status error:', error);
      return false;
    }
  }

  /**
   * 액세스 토큰을 가져옵니다.
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const tokens = await GoogleSignin.getTokens();
      return tokens.accessToken;
    } catch (error) {
      console.error('Get access token error:', error);
      return null;
    }
  }

  /**
   * 리프레시 토큰을 가져옵니다.
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      const tokens = await GoogleSignin.getTokens();
      // refreshToken이 없는 경우 null 반환
      return (tokens as any).refreshToken || null;
    } catch (error) {
      console.error('Get refresh token error:', error);
      return null;
    }
  }

  /**
   * 토큰을 가져옵니다 (getTokens 메서드 추가).
   */
  async getTokens(): Promise<GetTokensResponse> {
    try {
      return await GoogleSignin.getTokens();
    } catch (error) {
      console.error('Get tokens error:', error);
      throw error;
    }
  }
}

const googleAuth = new GoogleAuthService();
export default googleAuth;
