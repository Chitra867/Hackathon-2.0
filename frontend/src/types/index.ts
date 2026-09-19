// ────────────────────────────────────────────────────────
// UpacharKhoj Nepal — TypeScript Type Definitions
// ────────────────────────────────────────────────────────

export type UserRole =
  | 'patient'
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
  hospital_name?: string;
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
  updated_by_name?: string;
  source: 'manual' | 'api' | 'auto';
  source_display?: string;
  freshness_label: FreshnessLabel;
  freshness_minutes?: number;
  age_minutes?: number;
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
