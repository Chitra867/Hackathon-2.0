import React, { useEffect, useState } from 'react';
import { FiPlus, FiX, FiEdit2, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { usersApi, hospitalsApi } from '../../lib/api';
import type { User, HospitalListItem } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface CreateForm {
  username: string; email: string; first_name: string; last_name: string;
  password: string; role: string; hospital: string; phone: string;
}
const EMPTY_FORM: CreateForm = { username: '', email: '', first_name: '', last_name: '', password: '', role: 'hospital_admin', hospital: '', phone: '' };

export const HospitalAdminManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [hospitals, setHospitals] = useState<HospitalListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      usersApi.list({ page_size: 100 }),
      hospitalsApi.list({ page_size: 100 }),
    ]).then(([usersRes, hospitalsRes]) => {
      setUsers(usersRes.data.results.filter((u) => ['hospital_admin', 'hospital_staff'].includes(u.role)));
      setHospitals(hospitalsRes.data.results);
    }).catch(() => toast.error('Failed to load data')).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const set = (k: keyof CreateForm, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password || !form.hospital) {
      toast.error('Username, password and hospital are required'); return;
    }
    setSaving(true);
    try {
      await usersApi.create({ ...form, hospital: Number(form.hospital), is_verified: true } as any);
      toast.success('User created successfully');
      setForm(EMPTY_FORM); setShowForm(false); loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.username?.[0] || err.response?.data?.detail || 'Creation failed');
    } finally { setSaving(false); }
  };

  const handleToggle = async (user: User) => {
    setToggling(user.id);
    try {
      await usersApi.update(user.id, { is_active: !user.is_active } as any);
      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'}`);
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
    } catch { toast.error('Failed to update user'); }
    finally { setToggling(null); }
  };

  const hospitalName = (id: number | null) => hospitals.find((h) => h.id === id)?.name || '—';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title m-0">Hospital Admin Management</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage hospital administrators and staff</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? <><FiX /> Cancel</> : <><FiPlus /> Create Admin</>}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="card mb-6 border-primary-200 border">
          <h2 className="section-title">Create Hospital Admin / Staff</h2>
          <form onSubmit={handleCreate}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Username *</label>
                <input className="input" value={form.username} onChange={(e) => set('username', e.target.value)} placeholder="hospital1_admin" required />
              </div>
              <div className="form-group">
                <label className="label">Password *</label>
                <input type="password" className="input" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Min 8 characters" required />
              </div>
              <div className="form-group">
                <label className="label">First Name</label>
                <input className="input" value={form.first_name} onChange={(e) => set('first_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Last Name</label>
                <input className="input" value={form.last_name} onChange={(e) => set('last_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Email</label>
                <input type="email" className="input" value={form.email} onChange={(e) => set('email', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Phone</label>
                <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Role *</label>
                <select className="input" value={form.role} onChange={(e) => set('role', e.target.value)}>
                  <option value="hospital_admin">Hospital Admin</option>
                  <option value="hospital_staff">Hospital Staff</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Assign Hospital *</label>
                <select className="input" value={form.hospital} onChange={(e) => set('hospital', e.target.value)} required>
                  <option value="">— Select Hospital —</option>
                  {hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Creating…' : 'Create User'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      {loading ? <LoadingSpinner text="Loading users…" /> : (
        <div className="card p-0">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th className="hidden sm:table-cell">Name</th>
                  <th>Role</th>
                  <th className="hidden md:table-cell">Hospital</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-500">No hospital admins found. Create one above.</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="font-medium text-gray-900">{u.username}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </td>
                    <td className="hidden sm:table-cell text-gray-700">{u.first_name} {u.last_name}</td>
                    <td>
                      <span className={`badge ${u.role === 'hospital_admin' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>
                        {u.role === 'hospital_admin' ? 'Admin' : 'Staff'}
                      </span>
                    </td>
                    <td className="hidden md:table-cell text-gray-600 text-sm">{hospitalName(u.hospital)}</td>
                    <td>
                      <button onClick={() => handleToggle(u)} disabled={toggling === u.id} className="p-1 rounded">
                        {u.is_active
                          ? <FiToggleRight className="text-2xl text-green-600" />
                          : <FiToggleLeft className="text-2xl text-gray-400" />}
                      </button>
                    </td>
                    <td>
                      <span className="text-xs text-gray-400 italic">—</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-500">{users.length} users</div>
        </div>
      )}
    </div>
  );
};
