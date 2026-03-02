import { create } from 'zustand';
import { axiosInstance } from '@/lib/api/axios';
import { onUnauthorized } from '@/lib/authEvents';
import bridge from '@/lib/bridge';

const JWT_KEY = 'jwt_token';
const USER_KEY = 'jwt_user';

interface User {
  id: string;
  email: string;
  name?: string;
  nickname?: string | null;
  avatar?: string | null;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoggedIn: boolean;
  setAuth: (token: string, user?: User | null) => void;
  logout: () => void;
  hydrate: () => void;
}

const store = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoggedIn: false,

  setAuth: (token, user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(JWT_KEY, token);
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    set({
      token,
      user: user ?? null,
      isLoggedIn: !!token,
    });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(JWT_KEY);
      localStorage.removeItem(USER_KEY);
      delete axiosInstance.defaults.headers.common['Authorization'];
      if (bridge.isNativeApp()) bridge.send('AUTH_LOGOUT');
    }
    set({ token: null, user: null, isLoggedIn: false });
  },

  hydrate: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem(JWT_KEY);
    let user: User | null = null;
    try {
      const stored = localStorage.getItem(USER_KEY);
      if (stored) user = JSON.parse(stored) as User;
    } catch {
      localStorage.removeItem(USER_KEY);
    }
    set({
      token,
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
