import axios, { AxiosError } from 'axios';

import type {
  LoginResponse,
  User,
  Hospital,
  HospitalListItem,
  Service,
  Availability,
  Referral,
  AuditLog,
  PaginatedResponse,
  Doctor,
  PatientRequest,
  HospitalSearchResponse,
  UserHospitalDetail,
  UserDashboardData,
  SearchSuggestion,
} from '../types';


// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface RegisterResponse extends LoginResponse {
  message?: string;
}


// ─────────────────────────────────────────────────────────────────────────────
// Axios Instance
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,

  headers: {
    'Content-Type': 'application/json',
  },
});


// ─────────────────────────────────────────────────────────────────────────────
// Request Interceptor
// Attach JWT access token to authenticated requests
// ─────────────────────────────────────────────────────────────────────────────

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// ─────────────────────────────────────────────────────────────────────────────
// Response Interceptor
// Refresh access token automatically when it expires
// ─────────────────────────────────────────────────────────────────────────────

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (typeof error.config & {
          _retry?: boolean;
        })
      | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const response = await axios.post(
  `${API_BASE_URL}/auth/token/refresh/`,
            {
              refresh: refreshToken,
            }
          );

          const newAccessToken: string = response.data.access;
          const newRefreshToken: string | undefined = response.data.refresh;

          localStorage.setItem('access_token', newAccessToken);

          // SIMPLE_JWT rotates refresh tokens in this project. Keep the latest
          // refresh token or the next refresh attempt will use a blacklisted one.
          if (newRefreshToken) {
            localStorage.setItem('refresh_token', newRefreshToken);
          }

          if (originalRequest.headers) {
            originalRequest.headers.Authorization =
              `Bearer ${newAccessToken}`;
          }

          return api(originalRequest);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');

          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');

        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);


// ─────────────────────────────────────────────────────────────────────────────
// Auth Endpoints
// ─────────────────────────────────────────────────────────────────────────────

export const authApi = {

  // Login
  login: (
    username: string,
    password: string
  ) =>
    api.post<LoginResponse>(
      '/auth/login/',
      {
        username,
        password,
      }
    ),


  // Register public user
  register: (
    data: RegisterRequest
  ) =>
    api.post<RegisterResponse>(
      '/auth/register/',
      data
    ),


  // Logout
  logout: (
    refresh: string
  ) =>
    api.post(
      '/auth/logout/',
      {
        refresh,
      }
    ),


  // Get logged-in user's profile
  getProfile: () =>
    api.get<User>(
      '/auth/profile/'
    ),


  // Update logged-in user's profile
  updateProfile: (
    data: Partial<User>
  ) =>
    api.patch<User>(
      '/auth/profile/',
      data
    ),


  // Change password
  changePassword: (
    old_password: string,
    new_password: string,
    new_password2: string
  ) =>
    api.post(
      '/auth/change-password/',
      {
        old_password,
        new_password,
        new_password2,
      }
    ),


  // Forgot password
  forgotPassword: (
    email: string
  ) =>
    api.post(
      '/auth/forgot-password/',
      {
        email,
      }
    ),


  // Reset password
  resetPasswordConfirm: (
    uid: string,
    token: string,
    new_password: string,
    new_password2: string
  ) =>
    api.post(
      '/auth/reset-password-confirm/',
      {
        uid,
        token,
        new_password,
        new_password2,
      }
    ),


  // Refresh access token
  refreshToken: (
    refresh: string
  ) =>
    api.post<{ access: string; refresh?: string }>(
      '/auth/token/refresh/',
      {
        refresh,
      }
    ),
};


// ─────────────────────────────────────────────────────────────────────────────
// User Management
// System Admin only
// ─────────────────────────────────────────────────────────────────────────────

export const usersApi = {

  list: (
    params?: Record<string, string | number>
  ) =>
    api.get<PaginatedResponse<User>>(
      '/auth/users/',
      {
        params,
      }
    ),


  get: (
    id: number
  ) =>
    api.get<User>(
      `/auth/users/${id}/`
    ),


  create: (
    data: Partial<User> & {
      password: string;
    }
  ) =>
    api.post<User>(
      '/auth/users/',
      data
    ),


  update: (
    id: number,
    data: Partial<User>
  ) =>
    api.patch<User>(
      `/auth/users/${id}/`,
      data
    ),


  delete: (
    id: number
  ) =>
    api.delete(
      `/auth/users/${id}/`
    ),


  activate: (
    id: number
  ) =>
    api.post(
      `/auth/users/${id}/activate/`
    ),


  deactivate: (
    id: number
  ) =>
    api.post(
      `/auth/users/${id}/deactivate/`
    ),
};


// ─────────────────────────────────────────────────────────────────────────────
// Hospital Endpoints
// ─────────────────────────────────────────────────────────────────────────────

export const hospitalsApi = {

  list: (
    params?: Record<string, string | number | boolean>
  ) =>
    api.get<PaginatedResponse<HospitalListItem>>(
      '/hospitals/',
      {
        params,
      }
    ),


  get: (
    id: number
  ) =>
    api.get<Hospital>(
      `/hospitals/${id}/`
    ),


  create: (
    data: Partial<Hospital>
  ) =>
    api.post<Hospital>(
      '/hospitals/',
      data
    ),


  update: (
    id: number,
    data: Partial<Hospital>
  ) =>
    api.patch<Hospital>(
      `/hospitals/${id}/`,
      data
    ),


  delete: (
    id: number
  ) =>
    api.delete(
      `/hospitals/${id}/`
    ),


  verify: (
    id: number
  ) =>
    api.post(
      `/hospitals/${id}/verify/`
    ),


  reject: (
    id: number
  ) =>
    api.post(
      `/hospitals/${id}/reject/`
    ),


  toggleActive: (
    id: number
  ) =>
    api.post<{ id: number; name: string; is_active: boolean; message: string }>(
      `/hospitals/${id}/toggle-active/`
    ),
};


// ─────────────────────────────────────────────────────────────────────────────
// Service Endpoints
// ─────────────────────────────────────────────────────────────────────────────

export const servicesApi = {

  list: (
    params?: Record<string, string>
  ) =>
    api.get<PaginatedResponse<Service>>(
      '/services/',
      {
        params,
      }
    ),


  get: (
    id: number
  ) =>
    api.get<Service>(
      `/services/${id}/`
    ),


  create: (
    data: Partial<Service>
  ) =>
    api.post<Service>(
      '/services/',
      data
    ),


  update: (
    id: number,
    data: Partial<Service>
  ) =>
    api.patch<Service>(
      `/services/${id}/`,
      data
    ),


  delete: (
    id: number
  ) =>
    api.delete(
      `/services/${id}/`
    ),
};


// ─────────────────────────────────────────────────────────────────────────────
// Hospital Services
// ─────────────────────────────────────────────────────────────────────────────

export const hospitalServicesApi = {

  list: (
    hospitalId: number
  ) =>
    api.get(
      `/hospital-services/?hospital=${hospitalId}`
    ),


  create: (
    data: {
      hospital: number;
      service: number;
      is_available?: boolean;
      notes?: string;
    }
  ) =>
    api.post(
      '/hospital-services/',
      data
    ),


  update: (
    id: number,
    data: {
      is_available?: boolean;
      notes?: string;
    }
  ) =>
    api.patch(
      `/hospital-services/${id}/`,
      data
    ),


  delete: (
    id: number
  ) =>
    api.delete(
      `/hospital-services/${id}/`
    ),
};


// ─────────────────────────────────────────────────────────────────────────────
// Availability Endpoints
// ─────────────────────────────────────────────────────────────────────────────

export const availabilityApi = {

  list: (
    params?: Record<string, string | number>
  ) =>
    api.get<PaginatedResponse<Availability>>(
      '/availability/',
      {
        params,
      }
    ),


  get: (
    id: number
  ) =>
    api.get<Availability>(
      `/availability/${id}/`
    ),


  create: (
    data: Partial<Availability>
  ) =>
    api.post<Availability>(
      '/availability/',
      data
    ),


  update: (
    id: number,
    data: Partial<Availability>
  ) =>
    api.patch<Availability>(
      `/availability/${id}/`,
      data
    ),


  bulkUpdate: (
    hospitalId: number,
    updates: Partial<Availability>[]
  ) =>
    api.post(
      `/hospitals/${hospitalId}/availability/bulk_update/`,
      {
        updates,
      }
    ),
};


// ─────────────────────────────────────────────────────────────────────────────
// Referral Endpoints
// ─────────────────────────────────────────────────────────────────────────────

export const referralsApi = {

  list: (
    params?: Record<string, string | number>
  ) =>
    api.get<PaginatedResponse<Referral>>(
      '/referrals/',
      {
        params,
      }
    ),


  get: (
    id: number
  ) =>
    api.get<Referral>(
      `/referrals/${id}/`
    ),


  create: (
    data: {
      destination_facility: number;
      service: number;
      urgency: string;
      patient_age?: number;
      patient_gender?: string;
      patient_condition_summary: string;
      reason: string;
    }
  ) =>
    api.post<Referral>(
      '/referrals/',
      data
    ),


  respond: (
    id: number,
    data: {
      status: string;
      note?: string;
    }
  ) =>
    api.patch<Referral>(
      `/referrals/${id}/respond/`,
      data
    ),


  updateStatus: (
    id: number,
    data: {
      status: string;
    }
  ) =>
    api.patch<Referral>(
      `/referrals/${id}/update-status/`,
      data
    ),
};


// ─────────────────────────────────────────────────────────────────────────────
// Audit Log Endpoints
// ─────────────────────────────────────────────────────────────────────────────

export const auditApi = {

  list: (
    params?: Record<string, string | number>
  ) =>
    api.get<PaginatedResponse<AuditLog>>(
      '/audit/',
      {
        params,
      }
    ),
};


// ─────────────────────────────────────────────────────────────────────────────
// Doctor Endpoints
// ─────────────────────────────────────────────────────────────────────────────

export const doctorsApi = {

  list: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<Doctor>>('/doctors/', { params }),

  get: (id: number) =>
    api.get<Doctor>(`/doctors/${id}/`),

  create: (data: Partial<Doctor>) =>
    api.post<Doctor>('/doctors/', data),

  update: (id: number, data: Partial<Doctor>) =>
    api.patch<Doctor>(`/doctors/${id}/`, data),

  delete: (id: number) =>
    api.delete(`/doctors/${id}/`),
};


// ─────────────────────────────────────────────────────────────────────────────
// Patient Request Endpoints
// ─────────────────────────────────────────────────────────────────────────────

export const patientRequestsApi = {

  list: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<PatientRequest>>('/patient-requests/', { params }),

  get: (id: number) =>
    api.get<PatientRequest>(`/patient-requests/${id}/`),

  create: (data: {
    destination_hospital: number;
    service?: number | null;
    service_name_freetext?: string;
    contact_phone?: string;
    patient_age?: number;
    condition_summary: string;
    notes?: string;
  }) =>
    api.post<PatientRequest>('/patient-requests/', data),

  respond: (id: number, data: { status: string; note?: string }) =>
    api.patch<PatientRequest>(`/patient-requests/${id}/respond/`, data),

  cancel: (id: number) =>
    api.post<PatientRequest>(`/patient-requests/${id}/cancel/`),
};


// ─────────────────────────────────────────────────────────────────────────────
// Patient Search (Hospital Admin)
// ─────────────────────────────────────────────────────────────────────────────

export interface PatientSearchResult {
  id: number;
  full_name: string;
  username: string;
  phone: string;
  email: string;
}

export const patientsApi = {
  /** Fetch all registered patients (no q) or filter by name/phone/username (q ≥ 2 chars) */
  list: (q?: string) =>
    api.get<PatientSearchResult[]>('/auth/patients/search/', {
      params: q ? { q } : undefined,
    }),
  /** @deprecated use list() */
  search: (q: string) =>
    api.get<PatientSearchResult[]>('/auth/patients/search/', { params: { q } }),
};


// ─────────────────────────────────────────────────────────────────────────────
// User Portal Endpoints
// ─────────────────────────────────────────────────────────────────────────────

export const userPortalApi = {

  getDashboard: () =>
    api.get<UserDashboardData>('/user/dashboard/'),

  searchHospitals: (params: {
    q?: string;
    service?: number;
    services?: number[];
    district?: string;
    emergency?: boolean;
    lat?: number;
    lng?: number;
    page?: number;
    page_size?: number;
  }) => {
    // Serialize multiple service IDs as repeated ?service= params
    const { services, ...rest } = params;
    const searchParams = new URLSearchParams();
    Object.entries(rest).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') searchParams.append(k, String(v));
    });
    (services ?? []).forEach((id) => searchParams.append('service', String(id)));
    return api.get<HospitalSearchResponse>(`/user/hospital-search/?${searchParams.toString()}`);
  },

  getHospitalDetail: (id: number) =>
    api.get<UserHospitalDetail>(`/user/hospitals/${id}/`),

  getSearchSuggestions: (q: string) =>
    api.get<{ suggestions: SearchSuggestion[] }>('/user/search-suggestions/', { params: { q } }),
};


export default api;


// ─────────────────────────────────────────────────────────────────────────────
// Notifications Endpoints
// ─────────────────────────────────────────────────────────────────────────────

export interface AppNotificationItem {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  link_url: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export const notificationsApi = {
  /** Fetch newest 50 notifications for the current user. */
  list: () =>
    api.get<AppNotificationItem[]>('/notifications/'),

  /** Lightweight badge count — just { count: N }. */
  unreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count/'),

  /** Mark specific IDs (or all) as read. */
  markRead: (ids?: number[]) =>
    api.post<{ updated: number }>('/notifications/mark-read/', {
      ids: ids ?? [],
      mark_all: !ids,
    }),

  /** Mark every notification as read. */
  markAllRead: () =>
    api.post<{ updated: number }>('/notifications/mark-read/', {
      mark_all: true,
    }),

  /** Delete all notifications for the current user. */
  clearAll: () =>
    api.delete<{ deleted: number }>('/notifications/clear/'),
};