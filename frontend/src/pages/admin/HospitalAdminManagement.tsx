import React, { useEffect, useState, useCallback } from 'react';
import {
  FiPlus, FiX, FiEdit2, FiToggleLeft, FiToggleRight,
  FiSearch, FiRefreshCw, FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { usersApi, hospitalsApi } from '../../lib/api';
import type { User, HospitalListItem } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminForm {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  role: 'hospital_admin' | 'hospital_staff';
  hospital: string;
  phone: string;
}

const EMPTY_FORM: AdminForm = {
  username: '', email: '', first_name: '', last_name: '',
  password: '', role: 'hospital_admin', hospital: '', phone: '',
};

type ModalMode = 'create' | 'edit' | null;

// ─── Component ────────────────────────────────────────────────────────────────

export const HospitalAdminManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [hospitals, setHospitals] = useState<HospitalListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'hospital_admin' | 'hospital_staff'>('all');

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<AdminForm>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      usersApi.list({ page_size: 200 }),
      hospitalsApi.list({ page_size: 200 }),
    ])
      .then(([usersRes, hospitalsRes]) => {
        setUsers(
          usersRes.data.results.filter((u) =>
            ['hospital_admin', 'hospital_staff'].includes(u.role)
          )
        );
        setHospitals(hospitalsRes.data.results);
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const setField = (k: keyof AdminForm, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const hospitalName = (id: number | null) =>
    hospitals.find((h) => h.id === id)?.name || '—';

  const openCreate = () => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setShowPassword(false);
    setModalMode('create');
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      password: '',                              // blank = don't change
      role: user.role as AdminForm['role'],
      hospital: user.hospital ? String(user.hospital) : '',
      phone: user.phone,
    });
    setShowPassword(false);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingUser(null);
    setForm(EMPTY_FORM);
  };

  // ── Filtered list ───────────────────────────────────────────────────────────

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.first_name + ' ' + u.last_name).toLowerCase().includes(q);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // ── Create ──────────────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password || !form.hospital) {
      toast.error('Username, password and hospital are required');
      return;
    }
    setSaving(true);
    try {
      await usersApi.create({
        ...form,
        hospital: Number(form.hospital),
        is_verified: true,
        is_active: true,
      } as any);
      toast.success(`${form.role === 'hospital_admin' ? 'Admin' : 'Staff'} account created`);
      closeModal();
      loadData();
    } catch (err: any) {
      const data = err.response?.data;
      toast.error(
        data?.username?.[0] ||
        data?.email?.[0] ||
        data?.detail ||
        'Creation failed. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ────────────────────────────────────────────────────────────────────

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!form.hospital) {
      toast.error('Hospital assignment is required');
      return;
    }
    setSaving(true);
    const payload: Record<string, unknown> = {
      email: form.email,
      first_name: form.first_name,
      last_name: form.last_name,
      role: form.role,
      hospital: Number(form.hospital),
      phone: form.phone,
    };
    if (form.password) {
      payload.password = form.password;
    }
    try {
      await usersApi.update(editingUser.id, payload as any);
      toast.success('User updated successfully');
      closeModal();
      loadData();
    } catch (err: any) {
      const data = err.response?.data;
      toast.error(data?.detail || data?.email?.[0] || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle active ───────────────────────────────────────────────────────────

  const handleToggle = async (user: User) => {
    setToggling(user.id);
    try {
      await usersApi.update(user.id, { is_active: !user.is_active } as any);
      toast.success(`${user.username} ${user.is_active ? 'deactivated' : 'activated'}`);
      setUsers((prev) =>
        prev.map((u) => u.id === user.id ? { ...u, is_active: !u.is_active } : u)
      );
    } catch {
      toast.error('Failed to update user status');
    } finally {
      setToggling(null);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title m-0">Hospital Admin Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage hospital administrators and staff accounts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 text-gray-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
            title="Refresh"
          >
            <FiRefreshCw />
          </button>
          <button onClick={openCreate} className="btn-primary">
            <FiPlus /> Create Admin
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="input pl-9 w-full"
            placeholder="Search by name, username or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-full sm:w-44"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
        >
          <option value="all">All Roles</option>
          <option value="hospital_admin">Hospital Admin</option>
          <option value="hospital_staff">Hospital Staff</option>
        </select>
      </div>

      {/* ── Users table ── */}
      {loading ? (
        <LoadingSpinner text="Loading users…" />
      ) : (
        <div className="card p-0">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th className="hidden sm:table-cell">Name</th>
                  <th>Role</th>
                  <th className="hidden md:table-cell">Hospital</th>
                  <th className="hidden lg:table-cell">Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400">
                      {search || roleFilter !== 'all'
                        ? 'No users match your filters.'
                        : 'No hospital admins yet. Click "Create Admin" to add one.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{u.username}</div>
                            <div className="text-xs text-gray-500">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell text-gray-700">
                        {[u.first_name, u.last_name].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            u.role === 'hospital_admin'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-teal-100 text-teal-700'
                          }`}
                        >
                          {u.role === 'hospital_admin' ? 'Admin' : 'Staff'}
                        </span>
                      </td>
                      <td className="hidden md:table-cell text-gray-600 text-sm">
                        {hospitalName(u.hospital)}
                      </td>
                      <td className="hidden lg:table-cell text-gray-500 text-sm">
                        {u.phone || '—'}
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggle(u)}
                          disabled={toggling === u.id}
                          title={u.is_active ? 'Click to deactivate' : 'Click to activate'}
                          className="p-1 rounded transition-opacity disabled:opacity-50"
                        >
                          {u.is_active ? (
                            <FiToggleRight className="text-2xl text-green-500" />
                          ) : (
                            <FiToggleLeft className="text-2xl text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td>
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 text-gray-500 hover:text-primary-700 hover:bg-primary-50 rounded transition-colors"
                          title="Edit user"
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
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
            {filtered.length} of {users.length} users
          </div>
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-xl bg-white rounded-2xl shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {modalMode === 'create' ? 'Create Hospital Admin / Staff' : 'Edit User'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            {/* Modal body */}
            <form
              onSubmit={modalMode === 'create' ? handleCreate : handleEdit}
              className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto"
            >
              {/* Username — read-only when editing */}
              <div className="form-group mb-0">
                <label className="label">
                  Username {modalMode === 'create' && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="input pl-9 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="e.g. bir_hospital_admin"
                    value={form.username}
                    onChange={(e) => setField('username', e.target.value)}
                    required={modalMode === 'create'}
                    disabled={modalMode === 'edit'}
                    autoComplete="off"
                  />
                </div>
                {modalMode === 'edit' && (
                  <p className="text-xs text-gray-400 mt-0.5">Username cannot be changed.</p>
                )}
              </div>

              {/* Name row */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="form-group mb-0">
                  <label className="label">First Name</label>
                  <input
                    className="input"
                    placeholder="Sita"
                    value={form.first_name}
                    onChange={(e) => setField('first_name', e.target.value)}
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="label">Last Name</label>
                  <input
                    className="input"
                    placeholder="Rai"
                    value={form.last_name}
                    onChange={(e) => setField('last_name', e.target.value)}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="form-group mb-0">
                <label className="label">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    className="input pl-9"
                    placeholder="admin@hospital.np"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="form-group mb-0">
                <label className="label">Phone</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    className="input pl-9"
                    placeholder="98XXXXXXXX"
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                  />
                </div>
              </div>

              {/* Role & Hospital row */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="form-group mb-0">
                  <label className="label">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="input"
                    value={form.role}
                    onChange={(e) => setField('role', e.target.value)}
                    required
                  >
                    <option value="hospital_admin">Hospital Admin</option>
                    <option value="hospital_staff">Hospital Staff</option>
                  </select>
                </div>
                <div className="form-group mb-0">
                  <label className="label">
                    Hospital <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="input"
                    value={form.hospital}
                    onChange={(e) => setField('hospital', e.target.value)}
                    required
                  >
                    <option value="">— Select Hospital —</option>
                    {hospitals.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Password */}
              <div className="form-group mb-0">
                <label className="label">
                  Password{' '}
                  {modalMode === 'create' ? (
                    <span className="text-red-500">*</span>
                  ) : (
                    <span className="text-gray-400 font-normal text-xs">(leave blank to keep current)</span>
                  )}
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input pl-9 pr-10"
                    placeholder={modalMode === 'create' ? 'Min 8 characters' : 'New password (optional)'}
                    value={form.password}
                    onChange={(e) => setField('password', e.target.value)}
                    required={modalMode === 'create'}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button
                  type="submit"
                  className="btn-primary flex-1 justify-center"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {modalMode === 'create' ? 'Creating…' : 'Saving…'}
                    </>
                  ) : modalMode === 'create' ? (
                    'Create Account'
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary"
                  disabled={saving}
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
