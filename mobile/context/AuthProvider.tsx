import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';
import { User } from '../lib/types/user';
import googleAuth from '../utils/GoogleAuthService';
import { useAuthState } from '../store/authSlice';
import { tokenManager } from '../lib/utils/tokenManager';

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
        console.log('Initializing auth from storage...');

        // TokenManager에서 인증 정보 복원
        const restoredAuth = await tokenManager.restoreAuth();
        if (restoredAuth && restoredAuth.accessToken && restoredAuth.user) {
          console.log('Found stored auth data, restoring...');
          setToken({
            accessToken: restoredAuth.accessToken,
            user: restoredAuth.user,
          });
          console.log('Auth restored successfully:', restoredAuth.user.email);
        } else {
          console.log('No stored auth data found');
        }
      } catch (error) {
        console.error('Failed to restore auth data:', error);
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
          console.log('Saving auth data to token manager...');
          await tokenManager.setToken({
            accessToken: authState.accessToken,
            user: authState.user,
          });
          console.log('Auth data saved successfully');

          // 토큰 상태 로그
          tokenManager.logTokenStatus();
        }
      } catch (error) {
        console.error('Failed to save auth data:', error);
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
      const loginResponse = await fetch(
        `${googleAuth.config.api.server.baseURL}/api/auth/google/signin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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

      console.log('JWT Token received:', accessToken.substring(0, 30) + '...');

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

      // JWT 토큰과 사용자 정보 저장
      console.log('Saving JWT token and user data...');

      // 1. 로컬 상태 업데이트
      setToken({
        accessToken,
        user: serverUser,
      });

      // 2. TokenManager에 직접 저장 (중요!)
      console.log('Saving to TokenManager...');
      await tokenManager.setToken({
        accessToken,
        user: serverUser,
      });

      console.log('Google sign-in successful:', serverUser.email);
      console.log('JWT Token saved successfully');
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
