import { create } from 'zustand';
import { axiosInstance } from '@/lib/api/axios';
import { onUnauthorized } from '@/lib/authEvents';
import bridge from '@/lib/bridge';

const JWT_KEY = 'jwt_token';
const REFRESH_KEY = 'jwt_refresh_token';
const USER_KEY = 'jwt_user';

interface User {
  id: string;
  email: string;
  nickname?: string;
  avatar?: string | null;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isLoggedIn: boolean;
  setAuth: (token: string, user?: User | null, refreshToken?: string | null) => void;
  /** Update only the tokens (used by silent refresh) */
  setTokens: (token: string, refreshToken?: string | null) => void;
  logout: () => void;
  hydrate: () => void;
}

const store = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,
  user: null,
  isLoggedIn: false,

  setAuth: (token, user, refreshToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(JWT_KEY, token);
      if (refreshToken) {
        localStorage.setItem(REFRESH_KEY, refreshToken);
      }
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      if (bridge.isNativeApp()) {
        bridge.sendAuth(token, refreshToken ?? undefined);
      }
    }
    set({
      token,
      refreshToken: refreshToken ?? null,
      user: user ?? null,
      isLoggedIn: !!token,
    });
  },

  setTokens: (token, refreshToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(JWT_KEY, token);
      if (refreshToken) {
        localStorage.setItem(REFRESH_KEY, refreshToken);
      }
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      if (bridge.isNativeApp()) {
        bridge.sendTokenRefreshed(token, refreshToken ?? undefined);
      }
    }
    set((s) => ({
      ...s,
      token,
      refreshToken: refreshToken ?? s.refreshToken,
    }));
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(JWT_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);
      delete axiosInstance.defaults.headers.common['Authorization'];
      if (bridge.isNativeApp()) bridge.sendLogout();
    }
    set({ token: null, refreshToken: null, user: null, isLoggedIn: false });
  },

  hydrate: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem(JWT_KEY);
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    let user: User | null = null;
    try {
      const stored = localStorage.getItem(USER_KEY);
      if (stored) user = JSON.parse(stored) as User;
    } catch {
      localStorage.removeItem(USER_KEY);
    }
    set({
      token,
      refreshToken,
      user,
      isLoggedIn: !!token,
    });
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  },
}));

// Subscribe to logout on 401 (once on app load)
if (typeof window !== 'undefined') {
  onUnauthorized(() => store.getState().logout());
}

export const useAuthStore = store;
