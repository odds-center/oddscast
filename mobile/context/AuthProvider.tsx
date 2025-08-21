import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';
import { User } from '../lib/types/auth';
import googleAuth from '../utils/GoogleAuthService';
import { useAuthState } from '../store/authSlice';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  isAuthenticated: false,
});

export const AuthProvider = ({ children }: PropsWithChildren<{}>) => {
  const { authState, setToken, clearToken, setLoading } = useAuthState();
  const [loading, setLocalLoading] = useState(true);

  // 앱 시작 시 인증 상태 확인
  useEffect(() => {
    checkAuthState();
  }, []);

  // 인증 상태 확인
  const checkAuthState = async () => {
    try {
      setLocalLoading(true);
      // AsyncStorage에서 토큰 확인
      const token = await googleAuth.getAccessToken();
      if (token && authState.isAuthenticated) {
        // 이미 인증된 상태
        console.log('User already authenticated');
      }
    } catch (error) {
      console.error('Failed to check auth state:', error);
      clearToken();
    } finally {
      setLocalLoading(false);
    }
  };

  // Google Sign-In 처리
  const signIn = async () => {
    try {
      setLocalLoading(true);
      console.log('Starting Google Sign-In...');

      // 1. Google Sign-In 실행
      const userInfo = await googleAuth.signIn();
      console.log('Google Sign-In successful:', userInfo.data?.user.email);

      if (userInfo.type !== 'success' || !userInfo.idToken) {
        throw new Error('Google Sign-In failed');
      }

      // 2. 백엔드에 ID 토큰 전송하여 JWT 발급
      console.log('Sending ID token to backend...');
      // 여기서 실제 백엔드 API 호출을 해야 합니다
      // 임시로 Google 사용자 정보를 사용
      const tempUser: User = {
        id: userInfo.data!.user.id,
        email: userInfo.data!.user.email,
        name: userInfo.data!.user.name,
        avatar: userInfo.data!.user.photo,
        firstName: userInfo.data!.user.givenName,
        lastName: userInfo.data!.user.familyName,
        provider: 'google',
        googleId: userInfo.data!.user.id,
        isActive: true,
        emailVerified: true,
        locale: 'ko',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setToken({
        accessToken: userInfo.idToken,
        user: tempUser,
      });

      console.log('Sign-in successful:', tempUser.email);
    } catch (error) {
      console.error('Google sign-in failed:', error);
      throw error;
    } finally {
      setLocalLoading(false);
    }
  };

  // Sign-Out
  const signOut = async () => {
    try {
      setLocalLoading(true);
      await googleAuth.signOut();
      clearToken();
      console.log('Sign-out successful');
    } catch (error) {
      console.error('Sign-out failed:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  const value: AuthContextType = {
    user: authState.user,
    loading: loading || authState.isLoading,
    signIn,
    signOut,
    isAuthenticated: authState.isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
