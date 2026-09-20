// ────────────────────────────────────────────────────────
// UpacharKhoj Nepal — TypeScript Type Definitions
// ────────────────────────────────────────────────────────

export type UserRole =
  | 'user'
  | 'health_worker'
  | 'hospital_staff'
  | 'hospital_admin'
  | 'system_admin';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  role_display: string;
  hospital: number | null;
  hospital_name: string | null;
  hospital_detail?: {
    id: number;
    name: string;
    district: string;
    is_active: boolean;
  } | null;
  phone: string;
  is_verified: boolean;
  is_active: boolean;
  date_joined: string;
}

export interface Hospital {
  id: number;
  name: string;
  type: string;
  type_display: string;
  address: string;
  district: string;
  municipality: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  email: string;
  website: string;
  emergency_contact: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  is_active: boolean;
  created_at: string;
  services: HospitalService[];
  availability: Availability[];
  distance_km?: number | null;
}

export interface HospitalListItem {
  id: number;
  name: string;
  type: string;
  type_display: string;
  address: string;
  district: string;
  municipality: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  emergency_contact: string;
  verification_status: string;
  is_active: boolean;
  services: HospitalService[];
  availability: Availability[];
  distance_km?: number | null;
}

export interface Service {
  id: number;
  name: string;
  category: string;
  category_display: string;
  description: string;
  is_active: boolean;
}

export interface HospitalService {
  id: number;
  hospital: number;
  service: number;
  service_name: string;
  service_category: string;
  is_available: boolean;
  notes: string;
}

export type AvailabilityStatus = 'available' | 'limited' | 'unavailable' | 'full' | 'unknown';
export type FreshnessLabel = 'current' | 'recent' | 'old' | 'stale';

export interface Availability {
  id: number;
  hospital: number;
  hospital_name: string;
  service: number | null;
  service_name: string | null;
  availability_type: string;
  availability_type_display: string;
  status: AvailabilityStatus;
  status_display: string;
  available_count: number | null;
  total_count: number | null;
  notes: string;
  updated_at: string;
  updated_by: number | null;
  updated_by_name: string;
  source: 'manual' | 'api' | 'auto';
  source_display: string;
  freshness_label: FreshnessLabel;
  freshness_minutes: number;
  is_active: boolean;
}

export type ReferralStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'call_required'
  | 'patient_sent'
  | 'patient_arrived'
  | 'cancelled';

export type ReferralUrgency = 'emergency' | 'urgent' | 'routine';

export interface Referral {
  id: number;
  referral_code: string;
  referring_facility: number;
  referring_facility_name: string;
  destination_facility: number;
  destination_facility_name: string;
  created_by: number;
  created_by_name: string;
  service: number;
  service_name: string;
  urgency: ReferralUrgency;
  urgency_display: string;
  patient_age: number | null;
  patient_gender: 'm' | 'f' | 'other' | '';
  patient_gender_display: string;
  patient_condition_summary: string;
  reason: string;
  status: ReferralStatus;
  status_display: string;
  created_at: string;
  updated_at: string;
  responded_at: string | null;
  responded_by: number | null;
  responded_by_name: string | null;
  response_note: string;
  events: ReferralEvent[];
}

export interface ReferralEvent {
  id: number;
  actor: number | null;
  actor_name: string;
  old_status: string;
  new_status: string;
  note: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  actor: number | null;
  actor_name: string;
  action: string;
  action_display: string;
  entity_type: string;
  entity_id: string;
  description: string;
  ip_address: string;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface ApiError {
  detail?: string;
  message?: string;
  [key: string]: unknown;
}

// ────────────────────────────────────────────────────────
// Doctor
// ────────────────────────────────────────────────────────

export type DoctorDutyStatus = 'on_duty' | 'off_duty' | 'on_leave' | 'unknown';

export interface Doctor {
  id: number;
  hospital: number;
  hospital_name: string;
  name: string;
  specialty: string;
  qualification: string;
  phone: string;
  duty_status: DoctorDutyStatus;
  duty_status_display: string;
  consultation_days: string;
  consultation_time: string;
  is_active: boolean;
  updated_at: string;
}

// ────────────────────────────────────────────────────────
// Patient Request
// ────────────────────────────────────────────────────────

export type PatientRequestStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'call_required'
  | 'cancelled';

export interface PatientRequestEvent {
  id: number;
  actor: number | null;
  actor_name: string;
  old_status: string;
  new_status: string;
  note: string;
  created_at: string;
}

export interface PatientRequest {
  id: number;
  request_code: string;
  patient: number;
  patient_name: string;
  destination_hospital: number;
  destination_hospital_name: string;
  destination_hospital_district: string;
  destination_hospital_is_active?: boolean;
  service: number | null;
  service_name: string | null;
  service_name_freetext: string;
  contact_phone: string;
  patient_age: number | null;
  condition_summary: string;
  notes: string;
  status: PatientRequestStatus;
  status_display: string;
  response_note: string;
  responded_by: number | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  events: PatientRequestEvent[];
}

// ────────────────────────────────────────────────────────
// User Portal — Hospital Search Result
// ────────────────────────────────────────────────────────

export interface HospitalSearchResult {
  id: number;
  name: string;
  type: string;
  type_display: string;
  address: string;
  district: string;
  municipality: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  emergency_contact: string;
  distance_km: number | null;
  services: {
    id: number;
    name: string;
    category: string;
    is_available: boolean;
  }[];
  beds: {
    status: string;
    available: number | null;
    total: number | null;
    updated_at: string | null;
  };
  icu: {
    status: string;
    available: number | null;
    total: number | null;
    updated_at: string | null;
  };
  emergency_dept: {
    status: string;
    updated_at: string | null;
  };
  on_duty_doctors: { name: string; specialty: string; duty_status: string }[];
  on_duty_doctors_count: number;
}

export interface HospitalSearchResponse {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: HospitalSearchResult[];
}

// ────────────────────────────────────────────────────────
// User Portal — Search Suggestions
// ────────────────────────────────────────────────────────

export interface SearchSuggestion {
  label: string;
  type: 'hospital' | 'service' | 'specialty' | 'district';
  id?: number;
  subtitle?: string;
}

// ────────────────────────────────────────────────────────
// User Portal — Hospital Detail
// ────────────────────────────────────────────────────────

export interface UserHospitalDetail {
  id: number;
  name: string;
  type: string;
  type_display: string;
  address: string;
  district: string;
  municipality: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  email: string;
  website: string;
  emergency_contact: string;
  verification_status: string;
  services: {
    id: number;
    name: string;
    category: string;
    category_display: string;
    is_available: boolean;
    notes: string;
  }[];
  availability: {
    id: number;
    type: string;
    type_display: string;
    status: string;
    status_display: string;
    available_count: number | null;
    total_count: number | null;
    notes: string;
    updated_at: string;
    freshness_label: string;
    age_minutes: number;
  }[];
  doctors: {
    id: number;
    name: string;
    specialty: string;
    qualification: string;
    phone: string;
    duty_status: string;
    duty_status_display: string;
    consultation_days: string;
    consultation_time: string;
    updated_at: string;
  }[];
  my_requests: {
    id: number;
    request_code: string;
    status: string;
    condition_summary: string;
    created_at: string;
    updated_at: string;
  }[];
}

// ────────────────────────────────────────────────────────
// User Dashboard
// ────────────────────────────────────────────────────────

export interface UserDashboardData {
  user: {
    id: number;
    username: string;
    full_name: string;
    email: string;
  };
  stats: {
    total_requests: number;
    pending_requests: number;
    active_requests: number;
  };
  recent_requests: {
    id: number;
    request_code: string;
    status: string;
    destination_hospital__name: string;
    service__name: string | null;
    created_at: string;
    updated_at: string;
  }[];
}

