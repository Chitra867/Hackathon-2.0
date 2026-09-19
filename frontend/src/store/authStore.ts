import { create } from 'zustand';
import type { User, UserRole } from '../types';
import { authApi, type RegisterRequest } from '../lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => void;
  updateUser: (user: User) => void;
  clearError: () => void;

  // Role helpers
  isAuthenticated: () => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  isUser: () => boolean;
  isSystemAdmin: () => boolean;
  isHospitalAdmin: () => boolean;
  isHospitalStaff: () => boolean;
  isHealthWorker: () => boolean;
  canManageAvailability: () => boolean;
  getDashboardPath: () => string;
}

const clearStoredAuth = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,

  login: async (usernameOrEmail: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const res = await authApi.login(usernameOrEmail.trim(), password);
      const { access, refresh, user } = res.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        accessToken: access,
        refreshToken: refresh,
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      const error = err as {
        response?: {
          data?: {
            detail?: string;
            non_field_errors?: string[];
          };
        };
      };

      const message =
        error.response?.data?.detail ||
        error.response?.data?.non_field_errors?.[0] ||
        'Login failed. Please check your username/email and password.';

      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  register: async (data: RegisterRequest) => {
    set({ isLoading: true, error: null });

    try {
      const res = await authApi.register({
        ...data,
        username: data.username.trim(),
        email: data.email.trim().toLowerCase(),
        first_name: data.first_name?.trim(),
        last_name: data.last_name?.trim(),
        phone: data.phone?.trim(),
      });

      const { access, refresh, user } = res.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        accessToken: access,
        refreshToken: refresh,
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      const error = err as {
        response?: {
          data?: {
            detail?: string;
            username?: string[];
            email?: string[];
            password?: string[];
            password2?: string[];
            phone?: string[];
            non_field_errors?: string[];
          };
        };
      };

      const data = error.response?.data;
      const message =
        data?.username?.[0] ||
        data?.email?.[0] ||
        data?.password?.[0] ||
        data?.password2?.[0] ||
        data?.phone?.[0] ||
        data?.detail ||
        data?.non_field_errors?.[0] ||
        'Registration failed. Please try again.';

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
      // Clear local state even if the server token was already expired/invalid.
    } finally {
      clearStoredAuth();
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        error: null,
      });
    }
  },

  loadFromStorage: () => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const userString = localStorage.getItem('user');

    if (!accessToken || !userString) {
      return;
    }

    try {
      const user = JSON.parse(userString) as User;
      set({ user, accessToken, refreshToken });
    } catch {
      clearStoredAuth();
      set({ user: null, accessToken: null, refreshToken: null });
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
    return Array.isArray(role) ? role.includes(user.role) : user.role === role;
  },

  isUser: () => get().user?.role === 'user',

  isSystemAdmin: () => get().user?.role === 'system_admin',

  isHospitalAdmin: () =>
    ['hospital_admin', 'system_admin'].includes(get().user?.role ?? ''),

  isHospitalStaff: () =>
    ['hospital_staff', 'hospital_admin', 'system_admin'].includes(
      get().user?.role ?? ''
    ),

  isHealthWorker: () => get().user?.role === 'health_worker',

  canManageAvailability: () =>
    ['hospital_staff', 'hospital_admin', 'system_admin'].includes(
      get().user?.role ?? ''
    ),

  getDashboardPath: () => {
    const role = get().user?.role;

    switch (role) {
      case 'system_admin':
        return '/admin/dashboard';
      case 'hospital_admin':
        return '/hadmin/dashboard';
      case 'user':
        return '/user/dashboard';
      // health_worker and hospital_staff no longer have dedicated portals —
      // redirect them to the user portal so they can still browse hospitals.
      case 'health_worker':
      case 'hospital_staff':
      default:
        return '/user/dashboard';
    }
  },
}));
