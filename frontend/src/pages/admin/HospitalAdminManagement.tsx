import React, { useEffect, useState, useCallback } from 'react';
import {
  FiPlus, FiX, FiEdit2, FiSearch, FiRefreshCw,
  FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff, FiUsers,
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
          <button
            onClick={loadData}
            className="p-2.5 text-[#538b8c] hover:text-[#216d73] bg-white border border-[#e5dcc8] hover:border-[#aabfb9] rounded-lg transition-colors"
            title="Refresh"
          >
            <FiRefreshCw />
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-[#216d73] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#184f54] transition-colors shadow-sm"
          >
            <FiPlus /> Create Admin
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#aabfb9]" />
          <input
            type="text"
            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-[#e5dcc8] bg-white text-sm text-[#1c3d3f] placeholder:text-[#a3988a] focus:outline-none focus:ring-2 focus:ring-[#538b8c]/40 focus:border-[#538b8c]"
            placeholder="Search by name, username or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="w-full sm:w-44 rounded-lg border border-[#e5dcc8] bg-white px-3.5 py-2.5 text-sm text-[#1c3d3f] focus:outline-none focus:ring-2 focus:ring-[#538b8c]/40 focus:border-[#538b8c]"
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

      {/* ── Create / Edit Modal ── */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
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
                onClick={closeModal}
                className="p-2 text-[#8a8078] hover:text-[#1c3d3f] hover:bg-[#faf6ee] rounded-lg transition-colors"
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
              <div>
                <Label text="Username" required={modalMode === 'create'} />
                <IconField icon={<FiUser />}>
                  <input
                    className={inputClass}
                    placeholder="e.g. bir_hospital_admin"
                    value={form.username}
                    onChange={(e) => setField('username', e.target.value)}
                    required={modalMode === 'create'}
                    disabled={modalMode === 'edit'}
                    autoComplete="off"
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
                    onChange={(e) => setField('first_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label text="Last Name" />
                  <input
                    className="w-full rounded-lg border border-[#e5dcc8] bg-white px-3.5 py-2.5 text-sm text-[#1c3d3f] placeholder:text-[#a3988a] focus:outline-none focus:ring-2 focus:ring-[#538b8c]/40 focus:border-[#538b8c]"
                    placeholder="Rai"
                    value={form.last_name}
                    onChange={(e) => setField('last_name', e.target.value)}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <Label text="Email Address" />
                <IconField icon={<FiMail />}>
                  <input
                    type="email"
                    className={inputClass}
                    placeholder="admin@hospital.np"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    autoComplete="off"
                  />
                </IconField>
              </div>

              {/* Phone */}
              <div>
                <Label text="Phone" />
                <IconField icon={<FiPhone />}>
                  <input
                    type="tel"
                    className={inputClass}
                    placeholder="98XXXXXXXX"
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
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
                    onChange={(e) => setField('role', e.target.value)}
                    required
                  >
                    <option value="hospital_admin">Hospital Admin</option>
                    <option value="hospital_staff">Hospital Staff</option>
                  </select>
                </div>
                <div>
                  <Label text="Hospital" required />
                  <select
                    className="w-full rounded-lg border border-[#e5dcc8] bg-white px-3.5 py-2.5 text-sm text-[#1c3d3f] focus:outline-none focus:ring-2 focus:ring-[#538b8c]/40 focus:border-[#538b8c]"
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
                    onChange={(e) => setField('password', e.target.value)}
                    required={modalMode === 'create'}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aabfb9] hover:text-[#538b8c]"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3 border-t border-[#f2ece0]">
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-[#216d73] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#184f54] disabled:opacity-60 transition-colors"
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
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-[#1c3d3f] border border-[#e5dcc8] hover:bg-[#faf6ee] transition-colors"
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