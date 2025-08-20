import React, { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { AuthResponse, authService, User } from '../lib/auth';
import googleAuth from '../utils/GoogleAuthService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  session: any | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  isAuthenticated: false,
  session: null,
});

export const AuthProvider = ({ children }: PropsWithChildren<{}>) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 앱 시작 시 인증 상태 확인
  useEffect(() => {
    checkAuthState();
  }, []);

  // 인증 상태 확인
  const checkAuthState = async () => {
    try {
      if (authService.isAuthenticated()) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Failed to check auth state:', error);
      authService.clearToken();
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In 처리
  const signIn = async () => {
    try {
      setLoading(true);
      console.log('Starting Google Sign-In...');

      // 1. Google Sign-In 실행
      const userInfo = await googleAuth.signIn();
      console.log('Google Sign-In successful:', (userInfo as any).email);

      // 2. ID 토큰 가져오기
      const tokens = await googleAuth.getTokens();
      if (!tokens?.idToken) {
        throw new Error('Failed to get ID token from Google');
      }

      // 3. 백엔드에 ID 토큰 전송하여 JWT 발급
      console.log('Sending ID token to backend...');
      const authResponse: AuthResponse = await authService.signInWithGoogle(tokens.idToken);
      setUser(authResponse.user as User);

      console.log('Sign-in successful:', authResponse.user.email);
    } catch (error) {
      console.error('Google sign-in failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign-Out
  const signOut = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      await googleAuth.signOut();
      setUser(null);
      console.log('Sign-out successful');
    } catch (error) {
      console.error('Sign-out failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
    session: null,
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
