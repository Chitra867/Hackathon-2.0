import axios, { AxiosError } from 'axios';
import type {
  LoginResponse, User, Hospital, HospitalListItem, Service, Availability,
  Referral, AuditLog, PaginatedResponse
} from '../types';

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status === 401 && !original?._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const res = await axios.post('/api/auth/token/refresh/', { refresh });
          const newAccess: string = res.data.access;
          localStorage.setItem('access_token', newAccess);
          if (original.headers) {
            original.headers['Authorization'] = `Bearer ${newAccess}`;
          }
          return api(original);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth Endpoints ───────────────────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    api.post<LoginResponse>('/auth/login/', { username, password }),

  logout: (refresh: string) =>
    api.post('/auth/logout/', { refresh }),

  register: (data: Partial<User> & { password: string }) =>
    api.post<User>('/auth/register/', data),

  getProfile: () =>
    api.get<User>('/auth/profile/'),

  updateProfile: (data: Partial<User>) =>
    api.patch<User>('/auth/profile/', data),

  changePassword: (old_password: string, new_password: string) =>
    api.post('/auth/change-password/', { old_password, new_password }),

  refreshToken: (refresh: string) =>
    api.post<{ access: string }>('/auth/token/refresh/', { refresh }),
};

// ─── User Management (System Admin) ──────────────────────────────────────────
export const usersApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<User>>('/auth/users/', { params }),

  get: (id: number) =>
    api.get<User>(`/auth/users/${id}/`),

  create: (data: Partial<User> & { password: string }) =>
    api.post<User>('/auth/users/', data),

  update: (id: number, data: Partial<User>) =>
    api.patch<User>(`/auth/users/${id}/`, data),

  delete: (id: number) =>
    api.delete(`/auth/users/${id}/`),

  activate: (id: number) =>
    api.post(`/auth/users/${id}/activate/`),

  deactivate: (id: number) =>
    api.post(`/auth/users/${id}/deactivate/`),
};

// ─── Hospital Endpoints ───────────────────────────────────────────────────────
export const hospitalsApi = {
  list: (params?: Record<string, string | number | boolean>) =>
    api.get<PaginatedResponse<HospitalListItem>>('/hospitals/', { params }),

  get: (id: number) =>
    api.get<Hospital>(`/hospitals/${id}/`),

  create: (data: Partial<Hospital>) =>
    api.post<Hospital>('/hospitals/', data),

  update: (id: number, data: Partial<Hospital>) =>
    api.patch<Hospital>(`/hospitals/${id}/`, data),

  delete: (id: number) =>
    api.delete(`/hospitals/${id}/`),

  verify: (id: number) =>
    api.post(`/hospitals/${id}/verify/`),

  reject: (id: number) =>
    api.post(`/hospitals/${id}/reject/`),
};

// ─── Service Endpoints ────────────────────────────────────────────────────────
export const servicesApi = {
  list: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<Service>>('/services/', { params }),

  get: (id: number) =>
    api.get<Service>(`/services/${id}/`),

  create: (data: Partial<Service>) =>
    api.post<Service>('/services/', data),

  update: (id: number, data: Partial<Service>) =>
    api.patch<Service>(`/services/${id}/`, data),

  delete: (id: number) =>
    api.delete(`/services/${id}/`),
};

// ─── Hospital Services ────────────────────────────────────────────────────────
export const hospitalServicesApi = {
  list: (hospitalId: number) =>
    api.get(`/hospital-services/?hospital=${hospitalId}`),

  create: (data: { hospital: number; service: number; is_available?: boolean; notes?: string }) =>
    api.post('/hospital-services/', data),

  update: (id: number, data: { is_available?: boolean; notes?: string }) =>
    api.patch(`/hospital-services/${id}/`, data),

  delete: (id: number) =>
    api.delete(`/hospital-services/${id}/`),
};

// ─── Availability Endpoints ───────────────────────────────────────────────────
export const availabilityApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<Availability>>('/availability/', { params }),

  get: (id: number) =>
    api.get<Availability>(`/availability/${id}/`),

  create: (data: Partial<Availability>) =>
    api.post<Availability>('/availability/', data),

  update: (id: number, data: Partial<Availability>) =>
    api.patch<Availability>(`/availability/${id}/`, data),

  bulkUpdate: (hospitalId: number, updates: Partial<Availability>[]) =>
    api.post(`/hospitals/${hospitalId}/availability/bulk_update/`, { updates }),
};

// ─── Referral Endpoints ───────────────────────────────────────────────────────
export const referralsApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<Referral>>('/referrals/', { params }),

  get: (id: number) =>
    api.get<Referral>(`/referrals/${id}/`),

  create: (data: {
    destination_facility: number;
    service: number;
    urgency: string;
    patient_age?: number;
    patient_gender?: string;
    patient_condition_summary: string;
    reason: string;
  }) =>
    api.post<Referral>('/referrals/', data),

  respond: (id: number, data: { status: string; note?: string }) =>
    api.patch<Referral>(`/referrals/${id}/respond/`, data),

  updateStatus: (id: number, data: { status: string }) =>
    api.patch<Referral>(`/referrals/${id}/update_status/`, data),
};

// ─── Audit Log Endpoints ──────────────────────────────────────────────────────
export const auditApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<AuditLog>>('/audit/', { params }),
};

export default api;
