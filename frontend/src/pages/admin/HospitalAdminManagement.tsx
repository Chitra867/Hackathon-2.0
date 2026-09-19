import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  FiPlus,
  FiX,
  FiEdit2,
  FiToggleLeft,
  FiToggleRight,
  FiSearch,
  FiRefreshCw,
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
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

    // Prevent infinite loops if the backend
    // repeatedly returns the same page.

    const pageSignature = JSON.stringify(pageItems);

    if (
      pageItems.length > 0 &&
      seenPages.has(pageSignature)
    ) {
      throw new Error(
        'The API returned a repeated page. Check backend pagination.',
      );
    }

    if (pageItems.length > 0) {
      seenPages.add(pageSignature);
    }

    allItems.push(...pageItems);

    if (pageItems.length === 0 && nextPage) {
      throw new Error(
        'The API returned an empty page while indicating more results.',
      );
    }

    hasNextPage = nextPage;

    page += 1;
  }

  return allItems;
};

// ==================================================
// MAIN COMPONENT
// ==================================================

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
    <div>

      {/* ==========================================
          PAGE HEADER
      ========================================== */}

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>
          <h1 className="page-title m-0">
            Hospital Admin Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create and manage hospital administrators
            and staff accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">

          {/* REFRESH */}

          <button
            type="button"
            onClick={() => void loadData()}
            disabled={
              loading ||
              saving ||
              toggling !== null
            }
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-primary-50 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            title="Refresh"
            aria-label="Refresh user list"
          >
            <FiRefreshCw
              className={
                loading ? 'animate-spin' : ''
              }
            />
          </button>

          {/* CREATE ADMIN */}

          <button
            type="button"
            onClick={openCreate}
            disabled={
              loading ||
              saving ||
              toggling !== null ||
              hospitals.length === 0
            }
            className="btn-primary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiPlus />

            Create Admin
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

          <FiSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />

          <input
            type="search"
            className="input w-full pl-9"
            placeholder="Search by name, username, email or hospital..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            aria-label="Search hospital administrators"
          />

        </div>

        {/* ROLE FILTER */}

        <select
          className="input w-full sm:w-44"
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

        /* ========================================
            USERS TABLE
        ======================================== */

        <div className="card p-0">

          <div className="table-container">

            <table className="table">

              <thead>
                <tr>
                  <th>User</th>

                  <th className="hidden sm:table-cell">
                    Name
                  </th>

                  <th>Role</th>

                  <th className="hidden md:table-cell">
                    Hospital
                  </th>

                  <th className="hidden lg:table-cell">
                    Phone
                  </th>

                  <th>Status</th>

                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredUsers.length === 0 ? (

                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-gray-400"
                    >
                      {search.trim() ||
                      roleFilter !== 'all'
                        ? 'No users match your filters.'
                        : 'No hospital administrators or staff accounts found.'}
                    </td>
                  </tr>

                ) : (

                  filteredUsers.map((user) => (

                    <tr key={user.id}>

                      {/* USER */}

                      <td>
                        <div className="flex items-center gap-2">

                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                            {safeText(
                              user.username,
                            )
                              .charAt(0)
                              .toUpperCase() || '?'}
                          </div>

                          <div>
                            <div className="font-medium text-gray-900">
                              {user.username ||
                                'Unknown user'}
                            </div>

                            <div className="text-xs text-gray-500">
                              {user.email || '—'}
                            </div>
                          </div>

                        </div>
                      </td>

                      {/* FULL NAME */}

                      <td className="hidden text-gray-700 sm:table-cell">
                        {[
                          user.first_name,
                          user.last_name,
                        ]
                          .filter(Boolean)
                          .join(' ') || '—'}
                      </td>

                      {/* ROLE */}

                      <td>
                        <span
                          className={`badge ${
                            user.role === 'hospital_admin'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-teal-100 text-teal-700'
                          }`}
                        >
                          {user.role === 'hospital_admin'
                            ? 'Admin'
                            : 'Staff'}
                        </span>
                      </td>

                      {/* HOSPITAL */}

                      <td className="hidden text-sm text-gray-600 md:table-cell">
                        {hospitalName(
                          user.hospital,
                        )}
                      </td>

                      {/* PHONE */}

                      <td className="hidden text-sm text-gray-500 lg:table-cell">
                        {user.phone || '—'}
                      </td>

                      {/* ACCOUNT STATUS */}

                      <td>
                        <button
                          type="button"
                          onClick={() =>
                            void handleToggle(user)
                          }
                          disabled={
                            toggling !== null ||
                            saving ||
                            loading
                          }
                          title={
                            user.is_active
                              ? 'Click to deactivate'
                              : 'Click to activate'
                          }
                          aria-label={`${
                            user.is_active
                              ? 'Deactivate'
                              : 'Activate'
                          } ${user.username}`}
                          className="rounded p-1 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {toggling === user.id ? (
                            <FiRefreshCw className="animate-spin text-xl text-gray-400" />
                          ) : user.is_active ? (
                            <FiToggleRight className="text-2xl text-green-500" />
                          ) : (
                            <FiToggleLeft className="text-2xl text-gray-400" />
                          )}
                        </button>
                      </td>

                      {/* EDIT */}

                      <td>
                        <button
                          type="button"
                          onClick={() =>
                            openEdit(user)
                          }
                          disabled={
                            saving ||
                            toggling !== null
                          }
                          className="rounded p-1.5 text-gray-500 transition-colors hover:bg-primary-50 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Edit user"
                          aria-label={`Edit ${user.username}`}
                        >
                          <FiEdit2 />
                        </button>
                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

          {/* TABLE FOOTER */}

          <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
            {filteredUsers.length} of {users.length}{' '}
            users
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
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* MODAL PANEL */}

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="hospital-admin-modal-title"
            className="relative z-10 w-full max-w-xl rounded-2xl bg-white shadow-2xl"
          >

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">

              <h2
                id="hospital-admin-modal-title"
                className="text-lg font-semibold text-gray-900"
              >
                {modalMode === 'create'
                  ? 'Create Hospital Admin / Staff'
                  : 'Edit User'}
              </h2>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close modal"
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

              {/* USERNAME */}

              <div className="form-group mb-0">

                <label
                  htmlFor="admin-username"
                  className="label"
                >
                  Username

                  {modalMode === 'create' && (
                    <span className="text-red-500">
                      {' '}*
                    </span>
                  )}
                </label>

                <div className="relative">

                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                  <input
                    id="admin-username"
                    ref={usernameInputRef}
                    className="input pl-9 disabled:bg-gray-50 disabled:text-gray-500"
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

                </div>

                {modalMode === 'edit' && (
                  <p className="mt-1 text-xs text-gray-400">
                    Username cannot be changed.
                  </p>
                )}

              </div>

              {/* FIRST NAME AND LAST NAME */}

              <div className="grid gap-4 sm:grid-cols-2">

                <div className="form-group mb-0">

                  <label
                    htmlFor="admin-first-name"
                    className="label"
                  >
                    First Name
                  </label>

                  <input
                    id="admin-first-name"
                    className="input"
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

                <div className="form-group mb-0">

                  <label
                    htmlFor="admin-last-name"
                    className="label"
                  >
                    Last Name
                  </label>

                  <input
                    id="admin-last-name"
                    className="input"
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

              {/* EMAIL */}

              <div className="form-group mb-0">

                <label
                  htmlFor="admin-email"
                  className="label"
                >
                  Email Address
                </label>

                <div className="relative">

                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                  <input
                    id="admin-email"
                    type="email"
                    className="input pl-9"
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

                </div>

              </div>

              {/* PHONE */}

              <div className="form-group mb-0">

                <label
                  htmlFor="admin-phone"
                  className="label"
                >
                  Phone
                </label>

                <div className="relative">

                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                  <input
                    id="admin-phone"
                    type="tel"
                    className="input pl-9"
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

                </div>

              </div>

              {/* ROLE AND HOSPITAL */}

              <div className="grid gap-4 sm:grid-cols-2">

                {/* ROLE */}

                <div className="form-group mb-0">

                  <label
                    htmlFor="admin-role"
                    className="label"
                  >
                    Role
                    <span className="text-red-500">
                      {' '}*
                    </span>
                  </label>

                  <select
                    id="admin-role"
                    className="input"
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

                {/* HOSPITAL */}

                <div className="form-group mb-0">

                  <label
                    htmlFor="admin-hospital"
                    className="label"
                  >
                    Hospital
                    <span className="text-red-500">
                      {' '}*
                    </span>
                  </label>

                  <select
                    id="admin-hospital"
                    className="input"
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

              {/* PASSWORD */}

              <div className="form-group mb-0">

                <label
                  htmlFor="admin-password"
                  className="label"
                >
                  Password

                  {modalMode === 'create' ? (
                    <span className="text-red-500">
                      {' '}*
                    </span>
                  ) : (
                    <span className="text-xs font-normal text-gray-400">
                      {' '}(leave blank to keep current)
                    </span>
                  )}

                </label>

                <div className="relative">

                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                  <input
                    id="admin-password"
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    className="input pl-9 pr-10"
                    placeholder={
                      modalMode === 'create'
                        ? 'Minimum 8 characters'
                        : 'New password (optional)'
                    }
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
                    onClick={() =>
                      setShowPassword(
                        (previous) => !previous,
                      )
                    }
                    disabled={saving}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <FiEyeOff />
                    ) : (
                      <FiEye />
                    )}
                  </button>

                </div>

              </div>

              {/* FORM ACTIONS */}

              <div className="flex gap-3 border-t border-gray-100 pt-3">

                {/* SUBMIT */}

                <button
                  type="submit"
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

export default HospitalAdminManagement;