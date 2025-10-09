import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_CONSTANTS } from '@/constants';

// 토큰 저장 키
const JWT_TOKEN_KEY = AUTH_CONSTANTS.TOKEN.STORAGE_KEY;
const USER_DATA_KEY = AUTH_CONSTANTS.TOKEN.USER_DATA_KEY;

export interface TokenData {
  accessToken: string;
  user: any;
}

class TokenManager {
  private static instance: TokenManager;
  private currentToken: string | null = null;
  private currentUser: any = null;

  private constructor() {}

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  // 토큰 설정
  public async setToken(tokenData: TokenData): Promise<void> {
    try {
      // 메모리에 먼저 저장
      this.currentToken = tokenData.accessToken;
      this.currentUser = tokenData.user;

      // AsyncStorage에 저장
      await Promise.all([
        AsyncStorage.setItem(JWT_TOKEN_KEY, tokenData.accessToken),
        AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(tokenData.user)),
      ]);
    } catch (error) {
      console.error('Failed to save token:', error);
      throw error;
    }
  }

  // 토큰 가져오기
  public async getToken(): Promise<string | null> {
    try {
      if (this.currentToken) {
        return this.currentToken;
      }

      const storedToken = await AsyncStorage.getItem(JWT_TOKEN_KEY);
      if (storedToken) {
        // 토큰 유효성 간단 체크 (JWT 형식 확인)
        if (storedToken.split('.').length === 3) {
          this.currentToken = storedToken;
        } else {
          this.currentToken = null;
          return null;
        }
      }

      return this.currentToken;
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  }

  // 사용자 정보 가져오기
  public async getUser(): Promise<any | null> {
    try {
      if (this.currentUser) {
        return this.currentUser;
      }

      const storedUser = await AsyncStorage.getItem(USER_DATA_KEY);
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
      }
      return this.currentUser;
    } catch (error) {
      console.error('Failed to get user:', error);
      return null;
    }
  }

  // 토큰 유효성 확인
  public async isTokenValid(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  // 토큰 제거
  public async removeToken(): Promise<void> {
    try {
      this.currentToken = null;
      this.currentUser = null;

      await Promise.all([
        AsyncStorage.removeItem(JWT_TOKEN_KEY),
        AsyncStorage.removeItem(USER_DATA_KEY),
      ]);
    } catch (error) {
      console.error('Failed to remove token:', error);
      throw error;
    }
  }

  // 토큰 새로고침 (필요시)
  public async refreshToken(): Promise<boolean> {
    try {
      // 여기에 토큰 새로고침 로직 구현
      // 현재는 단순히 저장된 토큰을 다시 로드
      const token = await AsyncStorage.getItem(JWT_TOKEN_KEY);
      if (token) {
        this.currentToken = token;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
  }

  // 저장된 인증 데이터 복원
  public async restoreAuth(): Promise<TokenData | null> {
    try {
      const [token, userData] = await Promise.all([
        AsyncStorage.getItem(JWT_TOKEN_KEY),
        AsyncStorage.getItem(USER_DATA_KEY),
      ]);

      if (token && userData) {
        this.currentToken = token;
        this.currentUser = JSON.parse(userData);

        console.log('Auth restored successfully');
        return {
          accessToken: token,
          user: this.currentUser,
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to restore auth:', error);
      return null;
    }
  }

  // 토큰 상태 로그
  public logTokenStatus(): void {
    // 디버깅용 메서드 (프로덕션에서는 사용하지 않음)
  }
}

export const tokenManager = TokenManager.getInstance();
export default tokenManager;
