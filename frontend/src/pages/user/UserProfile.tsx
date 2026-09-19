import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiEdit2, FiSave, FiX, FiLogOut, FiList } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { authApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

export const UserProfile: React.FC = () => {
  const { user, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [saving, setSaving] = useState(false);

  // Password change
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', new_password2: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authApi.updateProfile({
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
      });
      updateUser(res.data);
      setEditing(false);
      toast.success('Profile updated.');
    } catch {
      toast.error('Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.new_password2) { toast.error('Passwords do not match.'); return; }
    if (pwForm.new_password.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    setPwSaving(true);
    try {
      await authApi.changePassword(pwForm.old_password, pwForm.new_password, pwForm.new_password2);
      toast.success('Password changed successfully.');
      setPwForm({ old_password: '', new_password: '', new_password2: '' });
      setShowPw(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, unknown> } };
      const msg = Object.values(e.response?.data ?? {}).flat()[0] as string ?? 'Could not change password.';
      toast.error(msg);
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out.');
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="h-full overflow-y-auto">
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4 pb-24 md:pb-6">
      <h1 className="text-xl font-bold text-[#172554]">My Profile</h1>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-[#ede0ce] shadow-sm p-5">
        {/* Avatar + name */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <FiUser className="text-primary-700 text-2xl" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#172554]">{user.full_name || user.username}</h2>
            <p className="text-sm text-[#8a7a63] capitalize">{user.role.replace('_', ' ')}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Member since {new Date(user.date_joined).toLocaleDateString('en-NP', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {!editing ? (
          <>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <FiUser className="text-gray-400 w-4" />
                <span className="text-gray-500 w-24">Username</span>
                <span className="text-[#172554] font-medium">{user.username}</span>
              </div>
              <div className="flex items-center gap-3">
                <FiMail className="text-gray-400 w-4" />
                <span className="text-gray-500 w-24">Email</span>
                <span className="text-[#172554]">{user.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <FiUser className="text-gray-400 w-4" />
                <span className="text-gray-500 w-24">Full Name</span>
                <span className="text-[#172554]">{user.first_name} {user.last_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <FiPhone className="text-gray-400 w-4" />
                <span className="text-gray-500 w-24">Phone</span>
                <span className="text-[#172554]">{user.phone || '—'}</span>
              </div>
            </div>

            <button
              onClick={() => setEditing(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl border border-primary-200 text-primary-700 text-sm font-medium hover:bg-primary-50 transition-colors"
            >
              <FiEdit2 /> Edit Profile
            </button>
          </>
        ) : (
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
                <input
                  value={form.first_name}
                  onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                  className="w-full border border-[#ede0ce] rounded-xl px-3 py-2.5 text-sm bg-[#faf6ee] focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
                <input
                  value={form.last_name}
                  onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                  className="w-full border border-[#ede0ce] rounded-xl px-3 py-2.5 text-sm bg-[#faf6ee] focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="98XXXXXXXX"
                className="w-full border border-[#ede0ce] rounded-xl px-3 py-2.5 text-sm bg-[#faf6ee] focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-700 text-white text-sm font-medium hover:bg-primary-800 transition-colors disabled:opacity-60">
                {saving && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                <FiSave /> Save
              </button>
              <button type="button" onClick={() => setEditing(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#ede0ce] text-[#8a7a63] text-sm font-medium hover:bg-[#faf1e0] transition-colors">
                <FiX /> Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-[#ede0ce] shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[#172554]">Change Password</h3>
          <button onClick={() => setShowPw(!showPw)}
            className="text-xs text-primary-700 hover:underline">
            {showPw ? 'Hide' : 'Show'}
          </button>
        </div>
        {showPw && (
          <form onSubmit={handleChangePassword} className="space-y-3">
            {(['old_password', 'new_password', 'new_password2'] as const).map((field, i) => (
              <div key={field}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {i === 0 ? 'Current Password' : i === 1 ? 'New Password' : 'Confirm New Password'}
                </label>
                <input type="password" value={pwForm[field]} onChange={e => setPwForm(f => ({ ...f, [field]: e.target.value }))}
                  className="w-full border border-[#ede0ce] rounded-xl px-3 py-2.5 text-sm bg-[#faf6ee] focus:outline-none focus:ring-2 focus:ring-primary-300" required />
              </div>
            ))}
            <button type="submit" disabled={pwSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-700 text-white text-sm font-medium hover:bg-primary-800 transition-colors disabled:opacity-60">
              {pwSaving && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Change Password
            </button>
          </form>
        )}
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-2xl border border-[#ede0ce] shadow-sm p-5 space-y-2">
        <h3 className="font-semibold text-[#172554] mb-1">Quick Links</h3>
        <Link to="/user/referrals"
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#faf6ee] border border-[#ede0ce] hover:border-primary-200 transition-colors text-sm text-[#4a3a24]">
          <FiList className="text-primary-700" /> My Referral Requests
        </Link>
        <Link to="/user/hospitals"
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#faf6ee] border border-[#ede0ce] hover:border-primary-200 transition-colors text-sm text-[#4a3a24]">
          <FiUser className="text-primary-700" /> Find Hospitals
        </Link>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100 hover:bg-red-100 transition-colors text-sm text-red-600">
          <FiLogOut /> Logout
        </button>
      </div>
    </div>
    </div>
  );
};
