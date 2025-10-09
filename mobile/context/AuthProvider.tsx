import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import googleAuth from '@/utils/GoogleAuthService';
import { tokenManager } from '@/lib/utils/tokenManager';
import { API_CONSTANTS } from '@/constants/auth';
import { User } from '@/lib/types/api';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isLoading: boolean;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  signIn: () => Promise<{ isNewUser: boolean }>;
  signOut: () => Promise<void>;
  setToken: (tokenData: { accessToken: string; user: User }) => Promise<void>;
  resetAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    accessToken: null,
    user: null,
    isLoading: true,
  });

  const [localLoading, setLocalLoading] = useState(false);

  // Google Auth 인스턴스는 이미 import됨

  // 인증 상태 저장
  const saveAuthData = async () => {
    try {
      if (authState.accessToken && authState.user) {
        await tokenManager.setToken({
          accessToken: authState.accessToken,
          user: authState.user,
        });
      }
    } catch (error) {
      console.error('Failed to save auth data:', error);
    }
  };

  // 인증 상태 로드
  const loadAuthData = async () => {
    try {
      const storedAuth = await tokenManager.restoreAuth();

      if (storedAuth) {
        setAuthState({
          accessToken: storedAuth.accessToken,
          user: storedAuth.user,
          isLoading: false,
        });
      } else {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('❌ Failed to load auth data:', error);
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // 토큰 설정
  const setToken = async (tokenData: { accessToken: string; user: User }) => {
    setAuthState({
      accessToken: tokenData.accessToken,
      user: tokenData.user,
      isLoading: false,
    });
  };

  // 초기 로드
  useEffect(() => {
    loadAuthData();
  }, []);

  // 인증 상태 변경 시 저장
  useEffect(() => {
    if (!authState.isLoading) {
      saveAuthData();
    }
  }, [authState.accessToken, authState.user]);

  // Google Sign-In 처리
  const signIn = async (): Promise<{ isNewUser: boolean }> => {
    try {
      setLocalLoading(true);
      console.log('Starting Google Sign-In...');

      // 1. Google Sign-In 실행
      const userInfo = await googleAuth.signIn();
      console.log('Google Sign-In result:', userInfo);

      if (userInfo.type !== 'success' || !userInfo.idToken) {
        throw new Error(userInfo.error || 'Google Sign-In failed');
      }

      // 2. 백엔드에 ID 토큰 전송하여 검증
      console.log('Verifying Google ID token...');
      const verificationResult = await googleAuth.authenticateWithServer(userInfo.idToken);
      console.log('ID Token verification successful:', verificationResult);

      // 3. 백엔드에 로그인 요청하여 JWT 발급
      console.log('Requesting Google login...');

      const loginResponse = await fetch(
        `${googleAuth.config.api.server.baseURL}/api${API_CONSTANTS.ENDPOINTS.AUTH.GOOGLE_SIGNIN}`,
        {
          method: 'POST',
          headers: {
            [API_CONSTANTS.HEADERS.CONTENT_TYPE]: 'application/json',
          },
          body: JSON.stringify({
            socialId: verificationResult.socialId,
            socialEmail: verificationResult.socialEmail,
            socialName: verificationResult.socialName,
          }),
        }
      );

      if (!loginResponse.ok) {
        const errorText = await loginResponse.text();
        console.error('Google login failed:', errorText);
        throw new Error(`Google 로그인 실패: ${loginResponse.status} - ${errorText}`);
      }

      const loginResult = await loginResponse.json();
      console.log('Google login successful:', loginResult);

      // JWT 토큰 확인
      const accessToken = loginResult.jwt || loginResult.accessToken || loginResult.token;
      if (!accessToken) {
        console.error('Login response missing JWT:', loginResult);
        throw new Error('서버에서 JWT 토큰을 받지 못했습니다.');
      }

      // 신규 사용자 여부 확인
      const isNewUser = loginResult.isFirst === true;
      console.log('Is new user:', isNewUser);

      // 서버 응답에서 사용자 정보 추출
      const serverUser: User = {
        id: loginResult.userId || loginResult.user?.id || userInfo.data!.user.id,
        email: loginResult.user?.email || userInfo.data!.user.email,
        name: loginResult.user?.name || userInfo.data!.user.name,
        avatar: userInfo.data!.user.photo,
        authProvider: 'google',
        providerId: userInfo.data!.user.id,
        isActive: true,
        isVerified: true,
        role: loginResult.user?.role || 'user',
        totalBets: 0,
        wonBets: 0,
        lostBets: 0,
        winRate: 0,
        totalWinnings: 0,
        totalLosses: 0,
        roi: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log('JWT Token received:', accessToken.substring(0, 30) + '...');

      // JWT 토큰과 사용자 정보 저장
      console.log('🔐 Saving JWT token and user data...');
      console.log('🔐 User:', serverUser.email);
      console.log('🔐 Token preview:', accessToken.substring(0, 30) + '...');

      // 1. TokenManager에 먼저 저장
      console.log('🔐 Saving to TokenManager first...');
      await tokenManager.setToken({
        accessToken,
        user: serverUser,
      });

      // 2. 로컬 상태 업데이트
      console.log('🔐 Updating local auth state...');
      setToken({
        accessToken,
        user: serverUser,
      });

      console.log('✅ Google sign-in successful:', serverUser.email);
      console.log('✅ JWT Token saved successfully');

      // 3. 상태 업데이트 확인을 위한 로그
      console.log('🔍 Auth state after login:', {
        user: serverUser.email,
        isAuthenticated: true,
        hasToken: !!accessToken,
        isNewUser,
      });

      // 4. TokenManager 상태 확인
      tokenManager.logTokenStatus();

      // 5. 신규 사용자 여부 반환
      return { isNewUser };
    } catch (error: any) {
      console.error('Google login error:', error);

      // 서버 인증 실패 시 사용자에게 명확한 메시지 표시
      if (
        error.message.includes('서버 인증이 필요합니다') ||
        error.message.includes('서버에서 JWT 토큰을 받지 못했습니다')
      ) {
        throw new Error('서버 연결에 실패했습니다. 네트워크를 확인하고 다시 시도해주세요.');
      }

      throw error;
    } finally {
      setLocalLoading(false);
    }
  };

  // 로그아웃 처리
  const signOut = async () => {
    try {
      console.log('🔐 Signing out...');

      // TokenManager에서 토큰 제거
      await tokenManager.removeToken();

      // 로컬 상태 초기화
      setAuthState({
        accessToken: null,
        user: null,
        isLoading: false,
      });

      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      Alert.alert('로그아웃 오류', '로그아웃 중 오류가 발생했습니다.');
    }
  };

  // 토큰 초기화 (강제 로그아웃)
  const resetAuth = async () => {
    try {
      console.log('🔄 Resetting authentication...');

      // Google Sign-Out
      await googleAuth.signOut();

      // TokenManager에서 토큰 제거
      await tokenManager.removeToken();

      // 로컬 상태 초기화
      setAuthState({
        accessToken: null,
        user: null,
        isLoading: false,
      });

      console.log('✅ Auth reset successful');
    } catch (error) {
      console.error('❌ Auth reset error:', error);
      Alert.alert('토큰 초기화 오류', '토큰 초기화 중 오류가 발생했습니다.');
    }
  };

  const value: AuthContextType = {
    user: authState.user,
    accessToken: authState.accessToken,
    isLoading: authState.isLoading || localLoading,
    signIn,
    signOut,
    setToken,
    resetAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
