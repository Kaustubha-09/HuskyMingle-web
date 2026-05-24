import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  verified: boolean;
  profile?: {
    name: string;
    avatar?: string;
    university?: string;
    major?: string;
    bio?: string;
    skills: string[];
    languages: string[];
    interests: string[];
    hasOnboarded?: boolean;
  };
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<{ userId: string; email: string }>;
  verifyEmail: (userId: string, code: string) => Promise<void>;
  resendVerification: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  name: string;
  university?: string;
  major?: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/login', { email, password });
          const { user, accessToken, refreshToken } = res.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('userId', user.id);
          set({ user, accessToken, refreshToken, isLoading: false });
        } catch (err: any) {
          set({ isLoading: false });
          // Pass through the full error data so the login page can redirect
          throw err;
        }
      },

      // Register no longer returns tokens — just userId for OTP step
      register: async (data) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/register', data);
          set({ isLoading: false });
          return { userId: res.data.userId, email: res.data.email };
        } catch (err: any) {
          set({ isLoading: false });
          throw new Error(err.response?.data?.message || 'Registration failed');
        }
      },

      verifyEmail: async (userId, code) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/verify-email', { userId, code });
          const { user, accessToken, refreshToken } = res.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('userId', user.id);
          set({ user, accessToken, refreshToken, isLoading: false });
        } catch (err: any) {
          set({ isLoading: false });
          throw new Error(err.response?.data?.message || 'Verification failed');
        }
      },

      resendVerification: async (userId) => {
        await api.post('/auth/resend-verification', { userId });
      },

      logout: async () => {
        try { await api.post('/auth/logout'); } catch {}
        localStorage.clear();
        set({ user: null, accessToken: null, refreshToken: null });
      },

      updateUser: (userData) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...userData } });
      },
    }),
    { name: 'huskymingle-auth', partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken }) },
  ),
);
