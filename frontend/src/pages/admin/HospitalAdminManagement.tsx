import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  FiPlus, FiX, FiEdit2, FiSearch, FiRefreshCw,
  FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff, FiUsers,
} from 'react-icons/fi';

import toast from 'react-hot-toast';

import { usersApi, hospitalsApi } from '../../lib/api';

import type {
  User,
  HospitalListItem,
} from '../../types';

import { LoadingSpinner } from '../../components/common/LoadingSpinner';

// ==================================================
// TYPES
// ==================================================

type HospitalRole =
  | 'hospital_admin'
  | 'hospital_staff';

type RoleFilter =
  | 'all'
  | HospitalRole;

type ModalMode =
  | 'create'
  | 'edit'
  | null;

interface AdminForm {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  role: HospitalRole;
  hospital: string;
  phone: string;
}

// ==================================================
// CONSTANTS
// ==================================================

const PAGE_SIZE = 100;

const MIN_PASSWORD_LENGTH = 8;

const EMPTY_FORM: AdminForm = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  role: 'hospital_admin',
  hospital: '',
  phone: '',
};

// ==================================================
// HELPER FUNCTIONS
// ==================================================

const safeText = (value: unknown): string => {
  if (
    typeof value === 'string' ||
    typeof value === 'number'
  ) {
    return String(value);
  }

  return '';
};

const isHospitalRole = (
  value: unknown,
): value is HospitalRole => {
  return (
    value === 'hospital_admin' ||
    value === 'hospital_staff'
  );
};

const isValidHospitalId = (
  value: string,
): boolean => {
  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0;
};

// ==================================================
// API ERROR HANDLING
// ==================================================

const getApiErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (
    !error ||
    typeof error !== 'object' ||
    !('response' in error)
  ) {
    return fallback;
  }

  const response = error.response as {
    data?: unknown;
  };

  const data = response?.data;

  if (typeof data === 'string') {
    return data.slice(0, 300) || fallback;
  }

  if (
    !data ||
    typeof data !== 'object'
  ) {
    return fallback;
  }

  const errors = data as Record<string, unknown>;

  const fields = [
    'username',
    'email',
    'password',
    'hospital',
    'role',
    'phone',
    'first_name',
    'last_name',
    'is_active',
    'detail',
    'non_field_errors',
  ];

  for (const field of fields) {
    const value = errors[field];

    if (typeof value === 'string' && value) {
      return value;
    }

    if (Array.isArray(value) && value.length > 0) {
      return safeText(value[0]) || fallback;
    }
  }

  return fallback;
};

// ==================================================
// PAGINATED API LOADER
// ==================================================

const fetchAllPages = async <T,>(
  fetchPage: (
    page: number,
  ) => Promise<{ data: unknown }>,
): Promise<T[]> => {
  const allItems: T[] = [];

  const seenPages = new Set<string>();

  let page = 1;

  let hasNextPage = true;

  while (hasNextPage) {
    const response = await fetchPage(page);

    const data = response.data;

    let pageItems: T[] = [];

    let nextPage = false;

    let count: number | null = null;

    // API returns an array directly.

    if (Array.isArray(data)) {
      pageItems = data as T[];

      nextPage = false;
    }

    // Standard Django REST Framework pagination.

    else if (
      data !== null &&
      typeof data === 'object' &&
      'results' in data
    ) {
      const paginatedData = data as {
        results?: unknown;
        count?: unknown;
        next?: unknown;
      };

      if (!Array.isArray(paginatedData.results)) {
        throw new Error(
          'Invalid API response: results must be an array.',
        );
      }

      pageItems = paginatedData.results as T[];

      if (
        typeof paginatedData.count === 'number' &&
        Number.isSafeInteger(paginatedData.count)
      ) {
        count = paginatedData.count;
      }

      if (typeof paginatedData.next === 'string') {
        nextPage = paginatedData.next.length > 0;
      } else if (paginatedData.next === null) {
        nextPage = false;
      } else if (count !== null) {
        nextPage =
          allItems.length + pageItems.length < count;
      }
    }

    else {
      throw new Error(
        'Unexpected API response format.',
      );
    }

// ─── Shared field chrome ────────────────────────────────────────────────────

const inputClass =
  'w-full rounded-lg border border-[#e5dcc8] bg-white pl-9 pr-3 py-2.5 text-sm text-[#1c3d3f] placeholder:text-[#a3988a] focus:outline-none focus:ring-2 focus:ring-[#538b8c]/40 focus:border-[#538b8c] transition-colors disabled:bg-[#faf6ee] disabled:text-[#a3988a]';

const IconField: React.FC<{ icon: React.ReactNode; children: React.ReactElement }> = ({ icon, children }) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aabfb9]">{icon}</span>
    {children}
  </div>
);

const Label: React.FC<{ text: string; required?: boolean; hint?: string }> = ({ text, required, hint }) => (
  <label className="block text-sm font-medium text-[#1c3d3f] mb-1.5">
    {text} {required && <span className="text-[#a15b4a]">*</span>}
    {hint && <span className="text-[#a3988a] font-normal text-xs ml-1">{hint}</span>}
  </label>
);

const StatusSwitch: React.FC<{ active: boolean; disabled: boolean; onClick: () => void }> = ({ active, disabled, onClick }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-pressed={active}
    aria-label={active ? 'Deactivate user' : 'Activate user'}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-150 disabled:opacity-50 ${
      active ? 'bg-[#216d73]' : 'bg-[#d8ded9]'
    }`}
  >
    <span
      className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm transition-transform duration-150 ${
        active ? 'translate-x-[22px]' : 'translate-x-[3px]'
      }`}
    />
  </button>
);

const RoleBadge: React.FC<{ role: string }> = ({ role }) => (
  <span
    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
      role === 'hospital_admin' ? 'bg-[#eef3f2] text-[#216d73]' : 'bg-[#f2ece0] text-[#8a7350]'
    }`}
  >
    {role === 'hospital_admin' ? 'Admin' : 'Staff'}
  </span>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const HospitalAdminManagement: React.FC = () => {

  // ==================================================
  // STATE
  // ==================================================

  const [users, setUsers] = useState<User[]>([]);

  const [hospitals, setHospitals] = useState<
    HospitalListItem[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<
    string | null
  >(null);

  const [saving, setSaving] = useState(false);

  const [toggling, setToggling] = useState<
    number | null
  >(null);

  const [search, setSearch] = useState('');

  const [roleFilter, setRoleFilter] =
    useState<RoleFilter>('all');

  const [modalMode, setModalMode] =
    useState<ModalMode>(null);

  const [editingUser, setEditingUser] =
    useState<User | null>(null);

  const [form, setForm] =
    useState<AdminForm>({
      ...EMPTY_FORM,
    });

  const [showPassword, setShowPassword] =
    useState(false);

  // ==================================================
  // REFS
  // ==================================================

  const mountedRef = useRef(false);

  const requestIdRef = useRef(0);

  const savingRef = useRef(false);

  const togglingRef = useRef<number | null>(null);

  const usernameInputRef = useRef<HTMLInputElement>(
    null,
  );

  // ==================================================
  // LOAD USERS AND HOSPITALS
  // ==================================================

  const loadData = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setLoading(true);

    setError(null);

    try {
      const [allUsers, allHospitals] = await Promise.all([
        fetchAllPages<User>(
          (page) =>
            usersApi.list({
              page,
              page_size: PAGE_SIZE,
            }),
        ),

        fetchAllPages<HospitalListItem>(
          (page) =>
            hospitalsApi.list({
              page,
              page_size: PAGE_SIZE,
            }),
        ),
      ]);

      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      const hospitalUsers = allUsers.filter(
        (user) => isHospitalRole(user.role),
      );

      const uniqueUsers = Array.from(
        new Map(
          hospitalUsers.map((user) => [
            user.id,
            user,
          ]),
        ).values(),
      );

      const uniqueHospitals = Array.from(
        new Map(
          allHospitals.map((hospital) => [
            hospital.id,
            hospital,
          ]),
        ).values(),
      );

      setUsers(uniqueUsers);

      setHospitals(uniqueHospitals);
    } catch (err) {
      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      console.error(
        'Failed to load hospital administrators:',
        err,
      );

      setUsers([]);

      setHospitals([]);

      setError(
        'Unable to load hospital administrators and hospitals.',
      );

      toast.error(
        'Failed to load hospital administrator data.',
      );
    } finally {
      if (
        mountedRef.current &&
        requestId === requestIdRef.current
      ) {
        setLoading(false);
      }
    }
  }, []);

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    mountedRef.current = true;

    void loadData();

    return () => {
      mountedRef.current = false;

      requestIdRef.current += 1;
    };
  }, [loadData]);

  // ==================================================
  // UPDATE FORM FIELD
  // ==================================================

  const setField = (
    key: keyof AdminForm,
    value: string,
  ) => {
    if (savingRef.current) {
      return;
    }

    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  // ==================================================
  // HOSPITAL NAME
  // ==================================================

  const hospitalName = (
    id: number | null | undefined,
  ): string => {
    if (id === null || id === undefined) {
      return 'Not assigned';
    }

    return (
      hospitals.find(
        (hospital) =>
          Number(hospital.id) === Number(id),
      )?.name || 'Unknown hospital'
    );
  };

  // ==================================================
  // OPEN CREATE MODAL
  // ==================================================

  const openCreate = () => {
    if (savingRef.current || togglingRef.current !== null) {
      return;
    }

    setEditingUser(null);

    setForm({
      ...EMPTY_FORM,
    });

    setShowPassword(false);

    setModalMode('create');
  };

  // ==================================================
  // OPEN EDIT MODAL
  // ==================================================

  const openEdit = (user: User) => {
    if (savingRef.current || togglingRef.current !== null) {
      return;
    }

    setEditingUser(user);

    setForm({
      username: safeText(user.username),

      email: safeText(user.email),

      first_name: safeText(user.first_name),

      last_name: safeText(user.last_name),

      password: '',

      role: isHospitalRole(user.role)
        ? user.role
        : 'hospital_admin',

      hospital:
        user.hospital !== null &&
        user.hospital !== undefined
          ? String(user.hospital)
          : '',

      phone: safeText(user.phone),
    });

    setShowPassword(false);

    setModalMode('edit');
  };

  // ==================================================
  // CLOSE MODAL
  // ==================================================

  const closeModal = () => {
    if (savingRef.current) {
      return;
    }

    setModalMode(null);

    setEditingUser(null);

    setForm({
      ...EMPTY_FORM,
    });

    setShowPassword(false);
  };

  // ==================================================
  // MODAL KEYBOARD HANDLING
  // ==================================================

  useEffect(() => {
    if (!modalMode) {
      return;
    }

    usernameInputRef.current?.focus();

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key === 'Escape' &&
        !savingRef.current
      ) {
        closeModal();
      }
    };

    window.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      );
    };
  }, [modalMode]);

  // ==================================================
  // VALIDATE FORM
  // ==================================================

  const validateForm = (): boolean => {
    const username = form.username.trim();

    const email = form.email.trim();

    const password = form.password;

    if (!username) {
      toast.error('Username is required.');

      return false;
    }

    if (!isHospitalRole(form.role)) {
      toast.error('Please select a valid user role.');

      return false;
    }

    if (!isValidHospitalId(form.hospital)) {
      toast.error('Please select a valid hospital.');

      return false;
    }

    const hospitalExists = hospitals.some(
      (hospital) =>
        Number(hospital.id) === Number(form.hospital),
    );

    if (!hospitalExists) {
      toast.error('Selected hospital does not exist.');

      return false;
    }

    if (
      modalMode === 'create' &&
      !password
    ) {
      toast.error('Password is required.');

      return false;
    }

    if (
      password &&
      password.length < MIN_PASSWORD_LENGTH
    ) {
      toast.error(
        'Password must contain at least 8 characters.',
      );

      return false;
    }

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      toast.error('Please enter a valid email address.');

      return false;
    }

    return true;
  };

  // ==================================================
  // CREATE ACCOUNT
  // ==================================================

  const handleCreate = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (savingRef.current) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    savingRef.current = true;

    setSaving(true);

    const payload = {
      username: form.username.trim(),

      email: form.email.trim(),

      first_name: form.first_name.trim(),

      last_name: form.last_name.trim(),

      password: form.password,

      role: form.role,

      hospital: Number(form.hospital),

      phone: form.phone.trim(),

      is_verified: true,

      is_active: true,
    };

    try {
      await usersApi.create(
        payload as Parameters<
          typeof usersApi.create
        >[0],
      );

      if (!mountedRef.current) {
        return;
      }

      toast.success(
        form.role === 'hospital_admin'
          ? 'Hospital administrator created successfully.'
          : 'Hospital staff account created successfully.',
      );

      setModalMode(null);

      setEditingUser(null);

      setForm({
        ...EMPTY_FORM,
      });

      setShowPassword(false);

      void loadData();
    } catch (err) {
      console.error(
        'Failed to create account:',
        err,
      );

      if (mountedRef.current) {
        toast.error(
          getApiErrorMessage(
            err,
            'Failed to create account. Please try again.',
          ),
        );
      }
    } finally {
      savingRef.current = false;

      if (mountedRef.current) {
        setSaving(false);
      }
    }
  };

  // ==================================================
  // EDIT ACCOUNT
  // ==================================================

  const handleEdit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      !editingUser ||
      savingRef.current
    ) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    savingRef.current = true;

    setSaving(true);

    const payload = {
      email: form.email.trim(),

      first_name: form.first_name.trim(),

      last_name: form.last_name.trim(),

      role: form.role,

      hospital: Number(form.hospital),

      phone: form.phone.trim(),

      ...(form.password
        ? {
            password: form.password,
          }
        : {}),
    };

    try {
      await usersApi.update(
        editingUser.id,
        payload as Parameters<
          typeof usersApi.update
        >[1],
      );

      if (!mountedRef.current) {
        return;
      }

      toast.success(
        'User updated successfully.',
      );

      setModalMode(null);

      setEditingUser(null);

      setForm({
        ...EMPTY_FORM,
      });

      setShowPassword(false);

      void loadData();
    } catch (err) {
      console.error(
        'Failed to update user:',
        err,
      );

      if (mountedRef.current) {
        toast.error(
          getApiErrorMessage(
            err,
            'Failed to update user. Please try again.',
          ),
        );
      }
    } finally {
      savingRef.current = false;

      if (mountedRef.current) {
        setSaving(false);
      }
    }
  };

  // ==================================================
  // ACTIVATE / DEACTIVATE ACCOUNT
  // ==================================================

  const handleToggle = async (user: User) => {
    if (
      togglingRef.current !== null ||
      savingRef.current
    ) {
      return;
    }

    const nextStatus = !user.is_active;

    if (!nextStatus) {
      const confirmed = window.confirm(
        `Are you sure you want to deactivate "${user.username}"?`,
      );

      if (!confirmed) {
        return;
      }
    }

    togglingRef.current = user.id;

    setToggling(user.id);

    try {
      await usersApi.update(
        user.id,
        {
          is_active: nextStatus,
        } as Parameters<
          typeof usersApi.update
        >[1],
      );

      if (!mountedRef.current) {
        return;
      }

      setUsers((previous) =>
        previous.map((currentUser) =>
          currentUser.id === user.id
            ? {
                ...currentUser,
                is_active: nextStatus,
              }
            : currentUser,
        ),
      );

      toast.success(
        `${user.username} ${
          nextStatus
            ? 'activated'
            : 'deactivated'
        } successfully.`,
      );
    } catch (err) {
      console.error(
        'Failed to update account status:',
        err,
      );

      if (mountedRef.current) {
        toast.error(
          getApiErrorMessage(
            err,
            'Failed to update account status.',
          ),
        );
      }
    } finally {
      togglingRef.current = null;

      if (mountedRef.current) {
        setToggling(null);
      }
    }
  };

  // ==================================================
  // SEARCH AND FILTER USERS
  // ==================================================

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const username = safeText(
        user.username,
      ).toLowerCase();

      const email = safeText(
        user.email,
      ).toLowerCase();

      const fullName = [
        safeText(user.first_name),
        safeText(user.last_name),
      ]
        .join(' ')
        .toLowerCase();

      const assignedHospital = hospitalName(
        user.hospital,
      ).toLowerCase();

      const matchesSearch =
        !query ||
        username.includes(query) ||
        email.includes(query) ||
        fullName.includes(query) ||
        assignedHospital.includes(query);

      const matchesRole =
        roleFilter === 'all' ||
        user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [
    users,
    hospitals,
    search,
    roleFilter,
  ]);

  // ==================================================
  // LOADING STATE
  // ==================================================

  return (
    <div className="bg-[#faedd7] -m-4 md:-m-6 p-4 md:p-6 min-h-full">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1c3d3f] m-0">Hospital Admin Management</h1>
          <p className="text-sm text-[#6b7d79] mt-1">
            Create and manage hospital administrators and staff accounts
          </p>
        </div>

        <div className="flex items-center gap-2">

          {/* REFRESH */}

          <button
            onClick={loadData}
            className="p-2.5 text-[#538b8c] hover:text-[#216d73] bg-white border border-[#e5dcc8] hover:border-[#aabfb9] rounded-lg transition-colors"
            title="Refresh"
            aria-label="Refresh user list"
          >
            <FiRefreshCw
              className={
                loading ? 'animate-spin' : ''
              }
            />
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-[#216d73] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#184f54] transition-colors shadow-sm"
          >
            <FiPlus /> Create Admin
          </button>

        </div>
      </div>

      {/* ==========================================
          API ERROR STATE
      ========================================== */}

      {error && !loading && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4"
        >
          <div className="flex items-center gap-2 text-red-700">
            <FiAlertCircle />

            <p className="text-sm">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadData()}
            className="btn-secondary btn-sm mt-3"
          >
            Try Again
          </button>
        </div>
      )}

      {/* ==========================================
          FILTERS
      ========================================== */}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">

        {/* SEARCH */}

        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#aabfb9]" />
          <input
            type="text"
            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-[#e5dcc8] bg-white text-sm text-[#1c3d3f] placeholder:text-[#a3988a] focus:outline-none focus:ring-2 focus:ring-[#538b8c]/40 focus:border-[#538b8c]"
            placeholder="Search by name, username or email…"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            aria-label="Search hospital administrators"
          />

        </div>

        {/* ROLE FILTER */}

        <select
          className="w-full sm:w-44 rounded-lg border border-[#e5dcc8] bg-white px-3.5 py-2.5 text-sm text-[#1c3d3f] focus:outline-none focus:ring-2 focus:ring-[#538b8c]/40 focus:border-[#538b8c]"
          value={roleFilter}
          onChange={(event) => {
            const value = event.target.value;

            if (
              value === 'all' ||
              isHospitalRole(value)
            ) {
              setRoleFilter(value);
            }
          }}
          aria-label="Filter users by role"
        >
          <option value="all">
            All Roles
          </option>

          <option value="hospital_admin">
            Hospital Admin
          </option>

          <option value="hospital_staff">
            Hospital Staff
          </option>
        </select>

      </div>

      {/* ==========================================
          LOADING STATE
      ========================================== */}

      {loading ? (
        <LoadingSpinner
          text="Loading hospital administrators..."
        />
      ) : error ? (
        <div className="card py-10 text-center text-gray-500">
          Unable to display users.
        </div>
      ) : (
        <div className="bg-white border border-[#e5dcc8] rounded-xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-[#eef3f2] flex items-center justify-center mb-3">
                <FiUsers className="text-xl text-[#538b8c]" />
              </div>
              <p className="text-sm font-medium text-[#1c3d3f]">
                {search || roleFilter !== 'all' ? 'No users match your filters' : 'No hospital admins yet'}
              </p>
              <p className="text-xs text-[#8a8078] mt-1">
                {search || roleFilter !== 'all' ? 'Try a different search or filter.' : 'Click "Create Admin" to add one.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e5dcc8] bg-[#faf6ee]">
                    <th className="text-left font-medium text-[#6b7d79] px-4 py-3">User</th>
                    <th className="text-left font-medium text-[#6b7d79] px-4 py-3 hidden sm:table-cell">Name</th>
                    <th className="text-left font-medium text-[#6b7d79] px-4 py-3">Role</th>
                    <th className="text-left font-medium text-[#6b7d79] px-4 py-3 hidden md:table-cell">Hospital</th>
                    <th className="text-left font-medium text-[#6b7d79] px-4 py-3 hidden lg:table-cell">Phone</th>
                    <th className="text-left font-medium text-[#6b7d79] px-4 py-3">Status</th>
                    <th className="text-right font-medium text-[#6b7d79] px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2ece0]">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-[#faedd7]/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#216d73] text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-[#1c3d3f] truncate">{u.username}</div>
                            <div className="text-xs text-[#8a8078] truncate">{u.email}</div>
                          </div>

                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#6b7d79] hidden sm:table-cell">
                        {[u.first_name, u.last_name].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                      <td className="px-4 py-3 text-[#6b7d79] hidden md:table-cell">{hospitalName(u.hospital)}</td>
                      <td className="px-4 py-3 text-[#6b7d79] hidden lg:table-cell">{u.phone || '—'}</td>
                      <td className="px-4 py-3">
                        <StatusSwitch active={u.is_active} disabled={toggling === u.id} onClick={() => handleToggle(u)} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-2 text-[#538b8c] hover:text-[#216d73] hover:bg-[#eef3f2] rounded-lg transition-colors"
                          title="Edit user"
                          aria-label={`Edit ${user.username}`}
                        >
                          <FiEdit2 />
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-4 py-2.5 border-t border-[#f2ece0] text-xs text-[#8a8078]">
            {filtered.length} of {users.length} users
          </div>

        </div>

      )}

      {/* ==========================================
          CREATE / EDIT MODAL
      ========================================== */}

      {modalMode && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="presentation"
        >

          {/* BACKDROP */}

          <div
            className="absolute inset-0 bg-[#1c3d3f]/50 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-xl bg-white rounded-2xl shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f2ece0]">
              <h2 className="text-lg font-semibold text-[#1c3d3f]">
                {modalMode === 'create' ? 'Create Hospital Admin / Staff' : 'Edit User'}
              </h2>

              <button
                type="button"
                onClick={closeModal}
                className="p-2 text-[#8a8078] hover:text-[#1c3d3f] hover:bg-[#faf6ee] rounded-lg transition-colors"
                aria-label="Close"
              >
                <FiX />
              </button>

            </div>

            {/* MODAL FORM */}

            <form
              onSubmit={
                modalMode === 'create'
                  ? handleCreate
                  : handleEdit
              }
              className="max-h-[75vh] space-y-4 overflow-y-auto px-6 py-5"
            >
              {/* Username — read-only when editing */}
              <div>
                <Label text="Username" required={modalMode === 'create'} />
                <IconField icon={<FiUser />}>
                  <input
                    className={inputClass}
                    placeholder="e.g. bir_hospital_admin"
                    value={form.username}
                    onChange={(event) =>
                      setField(
                        'username',
                        event.target.value,
                      )
                    }
                    required={
                      modalMode === 'create'
                    }
                    disabled={
                      modalMode === 'edit' ||
                      saving
                    }
                    autoComplete="username"
                  />
                </IconField>
                {modalMode === 'edit' && (
                  <p className="text-xs text-[#a3988a] mt-1">Username cannot be changed.</p>
                )}

              </div>

              {/* Name row */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label text="First Name" />
                  <input
                    className="w-full rounded-lg border border-[#e5dcc8] bg-white px-3.5 py-2.5 text-sm text-[#1c3d3f] placeholder:text-[#a3988a] focus:outline-none focus:ring-2 focus:ring-[#538b8c]/40 focus:border-[#538b8c]"
                    placeholder="Sita"
                    value={form.first_name}
                    onChange={(event) =>
                      setField(
                        'first_name',
                        event.target.value,
                      )
                    }
                    disabled={saving}
                    autoComplete="given-name"
                  />

                </div>
                <div>
                  <Label text="Last Name" />
                  <input
                    className="w-full rounded-lg border border-[#e5dcc8] bg-white px-3.5 py-2.5 text-sm text-[#1c3d3f] placeholder:text-[#a3988a] focus:outline-none focus:ring-2 focus:ring-[#538b8c]/40 focus:border-[#538b8c]"
                    placeholder="Rai"
                    value={form.last_name}
                    onChange={(event) =>
                      setField(
                        'last_name',
                        event.target.value,
                      )
                    }
                    disabled={saving}
                    autoComplete="family-name"
                  />

                </div>

              </div>

              {/* Email */}
              <div>
                <Label text="Email Address" />
                <IconField icon={<FiMail />}>
                  <input
                    id="admin-email"
                    type="email"
                    className={inputClass}
                    placeholder="admin@hospital.np"
                    value={form.email}
                    onChange={(event) =>
                      setField(
                        'email',
                        event.target.value,
                      )
                    }
                    disabled={saving}
                    autoComplete="email"
                  />
                </IconField>
              </div>

              {/* Phone */}
              <div>
                <Label text="Phone" />
                <IconField icon={<FiPhone />}>
                  <input
                    id="admin-phone"
                    type="tel"
                    className={inputClass}
                    placeholder="98XXXXXXXX"
                    value={form.phone}
                    onChange={(event) =>
                      setField(
                        'phone',
                        event.target.value,
                      )
                    }
                    disabled={saving}
                    autoComplete="tel"
                  />
                </IconField>
              </div>

              {/* Role & Hospital row */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label text="Role" required />
                  <select
                    className="w-full rounded-lg border border-[#e5dcc8] bg-white px-3.5 py-2.5 text-sm text-[#1c3d3f] focus:outline-none focus:ring-2 focus:ring-[#538b8c]/40 focus:border-[#538b8c]"
                    value={form.role}
                    onChange={(event) => {
                      const role =
                        event.target.value;

                      if (isHospitalRole(role)) {
                        setField(
                          'role',
                          role,
                        );
                      }
                    }}
                    disabled={saving}
                    required
                  >
                    <option value="hospital_admin">
                      Hospital Admin
                    </option>

                    <option value="hospital_staff">
                      Hospital Staff
                    </option>
                  </select>

                </div>
                <div>
                  <Label text="Hospital" required />
                  <select
                    className="w-full rounded-lg border border-[#e5dcc8] bg-white px-3.5 py-2.5 text-sm text-[#1c3d3f] focus:outline-none focus:ring-2 focus:ring-[#538b8c]/40 focus:border-[#538b8c]"
                    value={form.hospital}
                    onChange={(event) =>
                      setField(
                        'hospital',
                        event.target.value,
                      )
                    }
                    required
                    disabled={saving}
                  >
                    <option value="">
                      — Select Hospital —
                    </option>

                    {form.hospital &&
                      !hospitals.some(
                        (hospital) =>
                          String(hospital.id) ===
                          form.hospital,
                      ) && (
                        <option value={form.hospital}>
                          Previously assigned hospital
                        </option>
                      )}

                    {hospitals.map((hospital) => (

                      <option
                        key={hospital.id}
                        value={hospital.id}
                      >
                        {hospital.name}
                      </option>

                    ))}

                  </select>

                </div>

              </div>

              {/* Password */}
              <div>
                <Label
                  text="Password"
                  required={modalMode === 'create'}
                  hint={modalMode === 'edit' ? '(leave blank to keep current)' : undefined}
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aabfb9]"><FiLock /></span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full rounded-lg border border-[#e5dcc8] bg-white pl-9 pr-10 py-2.5 text-sm text-[#1c3d3f] placeholder:text-[#a3988a] focus:outline-none focus:ring-2 focus:ring-[#538b8c]/40 focus:border-[#538b8c]"
                    placeholder={modalMode === 'create' ? 'Min 8 characters' : 'New password (optional)'}
                    value={form.password}
                    onChange={(event) =>
                      setField(
                        'password',
                        event.target.value,
                      )
                    }
                    minLength={
                      modalMode === 'create' ||
                      form.password
                        ? MIN_PASSWORD_LENGTH
                        : undefined
                    }
                    required={
                      modalMode === 'create'
                    }
                    disabled={saving}
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aabfb9] hover:text-[#538b8c]"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <FiEyeOff />
                    ) : (
                      <FiEye />
                    )}
                  </button>

                </div>

              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3 border-t border-[#f2ece0]">
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-[#216d73] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#184f54] disabled:opacity-60 transition-colors"
                  disabled={saving}
                  className="btn-primary flex flex-1 items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                      {modalMode === 'create'
                        ? 'Creating...'
                        : 'Saving...'}
                    </>
                  ) : modalMode === 'create' ? (
                    'Create Account'
                  ) : (
                    'Save Changes'
                  )}
                </button>

                {/* CANCEL */}

                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-[#1c3d3f] border border-[#e5dcc8] hover:bg-[#faf6ee] transition-colors"
                  disabled={saving}
                  className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
};
