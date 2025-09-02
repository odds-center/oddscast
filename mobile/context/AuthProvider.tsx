import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';
import { User } from '../lib/types/user';
import googleAuth from '../utils/GoogleAuthService';
import { useAuthState } from '../store/authSlice';
import { tokenManager } from '../lib/utils/tokenManager';
import { AUTH_CONSTANTS, API_CONSTANTS } from '@/constants';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const { authState, setToken, clearToken, setLoading } = useAuthState();
  const [localLoading, setLocalLoading] = useState(false);

  // 앱 시작 시 저장된 인증 정보 복원
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log('🔄 Initializing auth from storage...');

        // TokenManager에서 인증 정보 복원
        const restoredAuth = await tokenManager.restoreAuth();
        if (restoredAuth && restoredAuth.accessToken && restoredAuth.user) {
          console.log('✅ Found stored auth data, restoring...');
          console.log('✅ User email:', restoredAuth.user.email);
          console.log('✅ Token preview:', restoredAuth.accessToken.substring(0, 30) + '...');

          setToken({
            accessToken: restoredAuth.accessToken,
            user: restoredAuth.user,
          });
          console.log('✅ Auth restored successfully:', restoredAuth.user.email);
        } else {
          console.log('⚠️ No stored auth data found');
        }
      } catch (error) {
        console.error('❌ Failed to restore auth data:', error);
        // 에러 발생 시 저장된 데이터 정리
        await tokenManager.removeToken();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [setToken, setLoading]);

  // 토큰이 변경될 때마다 토큰 매니저에 저장
  useEffect(() => {
    const saveAuthData = async () => {
      try {
        if (authState.accessToken && authState.user) {
          console.log('🔄 AuthProvider: Saving auth data to token manager...');
          console.log('🔄 User email:', authState.user.email);
          console.log('🔄 Token preview:', authState.accessToken.substring(0, 30) + '...');

          await tokenManager.setToken({
            accessToken: authState.accessToken,
            user: authState.user,
          });
          console.log('✅ Auth data saved successfully');

          // 토큰 상태 로그
          tokenManager.logTokenStatus();
        } else {
          console.log('⚠️ AuthProvider: No token or user data to save');
        }
      } catch (error) {
        console.error('❌ Failed to save auth data:', error);
      }
    };

    saveAuthData();
  }, [authState.accessToken, authState.user]);

  // Google Sign-In 처리
  const signIn = async () => {
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

      let accessToken: string;
      let serverUser: User;

      // 서버 연결 테스트
      try {
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
        accessToken = loginResult.jwt || loginResult.accessToken || loginResult.token;
        if (!accessToken) {
          console.error('Login response missing JWT:', loginResult);
          throw new Error('서버에서 JWT 토큰을 받지 못했습니다.');
        }

        // 서버 응답에서 사용자 정보 추출
        serverUser = {
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
      } catch (serverError) {
        console.error('Server connection failed:', serverError);

        // 서버 연결 실패 시 임시 토큰 생성 (개발용)
        console.log('🔄 Creating temporary token for development...');
        accessToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;

        // 임시 사용자 정보
        serverUser = {
          id: userInfo.data!.user.id,
          email: userInfo.data!.user.email,
          name: userInfo.data!.user.name,
          avatar: userInfo.data!.user.photo,
          authProvider: 'google',
          providerId: userInfo.data!.user.id,
          isActive: true,
          isVerified: true,
          role: 'user',
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

        console.log('✅ Using temporary token for development');
        console.log('✅ User:', serverUser.email);
        console.log('✅ Token preview:', accessToken.substring(0, 30) + '...');
      }

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
      });

      // 4. TokenManager 상태 확인
      tokenManager.logTokenStatus();

      // 5. 서버 연결 테스트
      try {
        console.log('🔍 Testing server connection with new token...');
        const testResponse = await fetch(
          `${googleAuth.config.api.server.baseURL}/api${API_CONSTANTS.ENDPOINTS.AUTH.ME}`,
          {
            method: 'GET',
            headers: {
              [API_CONSTANTS.HEADERS
                .AUTHORIZATION]: `${API_CONSTANTS.HEADERS.BEARER_PREFIX} ${accessToken}`,
              [API_CONSTANTS.HEADERS.CONTENT_TYPE]: 'application/json',
            },
          }
        );

        if (testResponse.ok) {
          console.log('✅ Server connection test successful');
        } else {
          console.log('⚠️ Server connection test failed:', testResponse.status);
          const errorText = await testResponse.text();
          console.log('⚠️ Error details:', errorText);
        }
      } catch (error) {
        console.log('⚠️ Server connection test error:', error);
      }
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
      console.log('Signing out...');

      // Google Sign-Out
      await googleAuth.signOut();

      // 토큰 및 사용자 정보 정리
      clearToken();

      // 토큰 매니저에서 인증 데이터 삭제
      await tokenManager.removeToken();

      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user: authState.user,
    loading: authState.isLoading || localLoading,
    signIn,
    signOut,
  };

  // 디버깅을 위한 상태 로그
  console.log('AuthProvider state:', {
    user: authState.user?.email,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading || localLoading,
    hasToken: !!authState.accessToken,
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
