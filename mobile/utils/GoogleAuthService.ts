import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID } from './Constants';
import { getCurrentConfig } from '../config/environment';

// Google Sign-In 설정
GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
});

export interface GoogleUserInfo {
  idToken: string;
  serverAuthCode?: string;
  user: {
    id: string;
    name: string;
    email: string;
    photo?: string;
    familyName?: string;
    givenName?: string;
  };
}

export interface GoogleSignInResult {
  type: 'success' | 'cancelled' | 'error';
  data?: GoogleUserInfo;
  error?: string;
  idToken?: string;
  serverAuthCode?: string; // 추가
}

class GoogleAuthService {
  public config = getCurrentConfig();

  /**
   * 구글 로그인을 시작합니다.
   */
  async signIn(): Promise<GoogleSignInResult> {
    try {
      console.log('Starting Google Sign-In...');

      // Play Services 확인
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // 기존 로그인 상태 확인 및 정리
      try {
        const currentUser = await GoogleSignin.getCurrentUser();
        if (currentUser) {
          console.log('User already signed in, signing out first...');
          await GoogleSignin.signOut();
        }
      } catch (error) {
        // 로그인되어 있지 않은 경우 무시
      }

      // 새로운 로그인 시도
      console.log('Attempting Google Sign-In...');
      const userInfo = await GoogleSignin.signIn();

      console.log('Google Sign-In raw response:', JSON.stringify(userInfo, null, 2));

      // 사용자 정보 검증
      if (!userInfo) {
        throw new Error('Google Sign-In returned null');
      }

      // 타입 캐스팅으로 처리
      const userInfoAny = userInfo as any;

      // data 객체에서 실제 데이터 추출
      const actualData = userInfoAny.data || userInfoAny;

      // idToken 확인
      const idToken = actualData.idToken;
      if (!idToken) {
        console.error('No idToken in response:', userInfo);
        throw new Error('ID Token을 받지 못했습니다.');
      }

      // 사용자 정보 확인
      const user = actualData.user;
      if (!user || !user.email) {
        console.error('No user data in response:', userInfo);
        throw new Error('사용자 정보가 없습니다.');
      }

      const googleUserInfo: GoogleUserInfo = {
        idToken,
        serverAuthCode: actualData.serverAuthCode || undefined,
        user: {
          id: user.id,
          name: user.name || user.email || 'Unknown',
          email: user.email,
          photo: user.photo || undefined,
          familyName: user.familyName || undefined,
          givenName: user.givenName || undefined,
        },
      };

      console.log('Processed Google user info:', googleUserInfo);

      return {
        type: 'success',
        data: googleUserInfo,
        idToken,
        serverAuthCode: actualData.serverAuthCode, // 추가
      };
    } catch (error: any) {
      console.error('Google Sign-In Error Details:', error);

      if (error.code === 'SIGN_IN_CANCELLED') {
        return {
          type: 'cancelled',
          error: '사용자가 로그인을 취소했습니다.',
        };
      } else if (error.code === 'IN_PROGRESS') {
        return {
          type: 'error',
          error: '이미 로그인이 진행 중입니다. 잠시 후 다시 시도해주세요.',
        };
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        return {
          type: 'error',
          error: 'Google Play 서비스가 필요합니다.',
        };
      } else {
        return {
          type: 'error',
          error: error.message || '구글 로그인 중 오류가 발생했습니다.',
        };
      }
    }
  }

  /**
   * 현재 로그인된 사용자 정보를 가져옵니다.
   */
  async getCurrentUser(): Promise<GoogleUserInfo | null> {
    try {
      const userInfo = await GoogleSignin.getCurrentUser();
      if (!userInfo) return null;

      return {
        idToken: (userInfo as any).idToken || '',
        serverAuthCode: (userInfo as any).serverAuthCode,
        user: {
          id: userInfo.user.id,
          name: userInfo.user.name || userInfo.user.email || 'Unknown',
          email: userInfo.user.email,
          photo: userInfo.user.photo || undefined,
          familyName: userInfo.user.familyName || undefined,
          givenName: userInfo.user.givenName || undefined,
        },
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * 구글 로그아웃을 실행합니다.
   */
  async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
      console.log('Google Sign-Out successful');
    } catch (error) {
      console.error('Google Sign-Out error:', error);
      throw error;
    }
  }

  /**
   * 현재 로그인 상태를 확인합니다.
   */
  async isSignedIn(): Promise<boolean> {
    try {
      const user = await GoogleSignin.getCurrentUser();
      return !!user;
    } catch (error) {
      console.error('Error checking sign-in status:', error);
      return false;
    }
  }

  /**
   * 서버에 ID 토큰을 전송하여 JWT를 발급받습니다.
   */
  async authenticateWithServer(idToken: string): Promise<any> {
    try {
      console.log('Authenticating with server...');
      console.log(
        'Server URL:',
        `${this.config.api.server.baseURL}/api/auth/google/verify-id-token`
      );
      console.log('ID Token length:', idToken.length);

      const response = await fetch(
        `${this.config.api.server.baseURL}/api/auth/google/verify-id-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        }
      );

      console.log('Server response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server authentication failed:', errorText);
        throw new Error(`서버 인증 실패: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Server authentication successful:', result);
      return result;
    } catch (error) {
      console.error('Server authentication error:', error);
      throw error;
    }
  }
}

const googleAuth = new GoogleAuthService();
export default googleAuth;
