import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useState } from 'react';
import { AuthState } from '../lib/types/auth';
import { User } from '../lib/types/user';
import { JWT_TOKEN_NAME } from '../utils/Constants';

// 간단한 상태 관리 훅
export const useAuthState = () => {
  const [authState, setAuthState] = useState<AuthState>({
    accessToken: null,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    refreshToken: null,
    error: null,
  });

  const setToken = useCallback((tokenData: { accessToken: string; user: User }) => {
    setAuthState((prev) => ({
      ...prev,
      accessToken: tokenData.accessToken,
      user: tokenData.user,
      isAuthenticated: true,
    }));
  }, []);

  const clearToken = useCallback(() => {
    setAuthState((prev) => ({
      ...prev,
      accessToken: null,
      user: null,
      isAuthenticated: false,
    }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setAuthState((prev) => ({
      ...prev,
      isLoading: loading,
    }));
  }, []);

  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem(JWT_TOKEN_NAME);

      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Date.now() / 1000;

          if (payload.exp > currentTime) {
            // JWT에서 기본 사용자 정보 추출
            const user: User = {
              id: payload.sub || payload.id,
              email: payload.email,
              name: payload.name,
              avatar: payload.avatar,
              authProvider: 'google',
              providerId: payload.googleId || payload.sub,
              isActive: payload.isActive !== false,
              isVerified: payload.emailVerified || false,
              lastLogin: payload.lastLoginAt ? new Date(payload.lastLoginAt) : undefined,
              refreshToken: payload.refreshToken,
              role: 'user',
              totalBets: 0,
              wonBets: 0,
              lostBets: 0,
              winRate: 0,
              totalWinnings: 0,
              totalLosses: 0,
              roi: 0,
              createdAt: payload.createdAt ? new Date(payload.createdAt) : new Date(),
              updatedAt: payload.updatedAt ? new Date(payload.updatedAt) : new Date(),
            };

            setToken({
              accessToken: token,
              user,
            });
          } else {
            await AsyncStorage.removeItem(JWT_TOKEN_NAME);
          }
        } catch (error) {
          await AsyncStorage.removeItem(JWT_TOKEN_NAME);
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setLoading(false);
    }
  }, [setToken, setLoading]);

  return {
    authState,
    setToken,
    clearToken,
    setLoading,
    initializeAuth,
  };
};

export default useAuthState;
