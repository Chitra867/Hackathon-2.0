import { create } from 'zustand';
import type { User, UserRole } from '../types';
import { authApi } from '../lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => void;
  updateUser: (user: User) => void;
  clearError: () => void;

  // Role helpers
  isAuthenticated: () => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  isSystemAdmin: () => boolean;
  isHospitalAdmin: () => boolean;
  isHospitalStaff: () => boolean;
  isHealthWorker: () => boolean;
  canManageAvailability: () => boolean;
  getDashboardPath: () => string;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login(username, password);
      const { access, refresh, user } = res.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, accessToken: access, refreshToken: refresh, isLoading: false });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string; non_field_errors?: string[] } } };
      const message =
        error.response?.data?.detail ||
        error.response?.data?.non_field_errors?.[0] ||
        'Login failed. Please check your credentials.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  logout: async () => {
    const { refreshToken } = get();
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // silent fail
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      set({ user: null, accessToken: null, refreshToken: null });
    }
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({ user, accessToken: token, refreshToken: refresh });
      } catch {
        localStorage.clear();
      }
    }
  },

  updateUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  clearError: () => set({ error: null }),

  isAuthenticated: () => !!get().accessToken && !!get().user,

  hasRole: (role) => {
    const { user } = get();
    if (!user) return false;
    if (Array.isArray(role)) return role.includes(user.role);
    return user.role === role;
  },

  isSystemAdmin: () => get().user?.role === 'system_admin',

  isHospitalAdmin: () =>
    ['hospital_admin', 'system_admin'].includes(get().user?.role ?? ''),

  isHospitalStaff: () =>
    ['hospital_staff', 'hospital_admin', 'system_admin'].includes(get().user?.role ?? ''),

  canManageAvailability: () =>
    ['hospital_staff', 'hospital_admin', 'system_admin'].includes(get().user?.role ?? ''),

  isHealthWorker: () => get().user?.role === 'health_worker',

  getDashboardPath: () => {
    const role = get().user?.role;
    switch (role) {
      case 'system_admin':   return '/admin/dashboard';
      case 'hospital_admin': return '/hadmin/dashboard';
      case 'hospital_staff': return '/hadmin/dashboard';
      case 'health_worker':  return '/hw/dashboard';
      default: return '/search';
    }
  },
}));
