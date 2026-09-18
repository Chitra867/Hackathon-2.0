import React, { useEffect, useState } from 'react';
import { FiEdit2, FiCheck, FiX, FiPhone, FiMail, FiGlobe, FiMapPin } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { hospitalsApi } from '../../lib/api';
import type { Hospital } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuthStore } from '../../store/authStore';

export const HospitalProfile: React.FC = () => {
  const { user } = useAuthStore();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ phone: '', email: '', website: '', emergency_contact: '', address: '', municipality: '' });

  useEffect(() => {
    if (!user?.hospital) return;
    hospitalsApi.get(user.hospital)
      .then((r) => {
        setHospital(r.data);
        const h = r.data;
        setForm({ phone: h.phone, email: h.email, website: h.website, emergency_contact: h.emergency_contact, address: h.address, municipality: h.municipality });
      })
      .catch(() => toast.error('Failed to load hospital'))
      .finally(() => setLoading(false));
  }, [user?.hospital]);

  const handleSave = async () => {
    if (!user?.hospital) return;
    setSaving(true);
    try {
      await hospitalsApi.update(user.hospital, form as any);
      toast.success('Hospital profile updated');
      setEditing(false);
      const r = await hospitalsApi.get(user.hospital);
      setHospital(r.data);
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading profile…" />;
  if (!hospital) return <div className="text-center py-12 text-gray-500">Hospital not found.</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title m-0">Hospital Profile</h1>
          <p className="text-sm text-gray-500 mt-1">{hospital.name}</p>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="btn-secondary">
            <FiEdit2 /> Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : <><FiCheck /> Save</>}
            </button>
            <button onClick={() => setEditing(false)} className="btn-secondary"><FiX /></button>
          </div>
        )}
      </div>

      {/* Basic Info */}
      <div className="card mb-4">
        <h2 className="section-title">Hospital Information</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Hospital Name</p>
            <p className="font-semibold text-gray-900">{hospital.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Type</p>
            <p className="font-semibold text-gray-900 capitalize">{hospital.type_display || hospital.type}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">District</p>
            <p className="text-gray-800">{hospital.district}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Verification</p>
            <span className={`badge ${hospital.verification_status === 'verified' ? 'bg-green-100 text-green-700' : hospital.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
              {hospital.verification_status}
            </span>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="card mb-4">
        <h2 className="section-title">Location</h2>
        {editing ? (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="form-group sm:col-span-2">
              <label className="label">Address</label>
              <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Municipality</label>
              <input className="input" value={form.municipality} onChange={(e) => setForm({ ...form, municipality: e.target.value })} />
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <FiMapPin className="text-primary-600 flex-shrink-0 mt-0.5" />
            <span>{hospital.address}, {hospital.municipality}, {hospital.district}</span>
          </div>
        )}
        {hospital.lat && hospital.lng && (
          <p className="text-xs text-gray-400 mt-2">📍 {hospital.lat}°N, {hospital.lng}°E</p>
        )}
      </div>

      {/* Contact */}
      <div className="card mb-4">
        <h2 className="section-title">Contact Information</h2>
        {editing ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { key: 'phone', label: 'Phone', type: 'tel' },
              { key: 'emergency_contact', label: 'Emergency Contact', type: 'tel' },
              { key: 'email', label: 'Email', type: 'email' },
              { key: 'website', label: 'Website', type: 'url' },
            ].map((f) => (
              <div key={f.key} className="form-group">
                <label className="label">{f.label}</label>
                <input type={f.type} className="input" value={form[f.key as keyof typeof form]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {hospital.emergency_contact && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                <FiPhone className="text-red-500" />
                <div>
                  <p className="text-xs text-red-600 font-medium">Emergency</p>
                  <a href={`tel:${hospital.emergency_contact}`} className="text-sm text-red-700 font-semibold hover:underline">{hospital.emergency_contact}</a>
                </div>
              </div>
            )}
            {hospital.phone && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <FiPhone className="text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <a href={`tel:${hospital.phone}`} className="text-sm text-gray-800 hover:underline">{hospital.phone}</a>
                </div>
              </div>
            )}
            {hospital.email && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <FiMail className="text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <a href={`mailto:${hospital.email}`} className="text-sm text-gray-800 hover:underline truncate">{hospital.email}</a>
                </div>
              </div>
            )}
            {hospital.website && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <FiGlobe className="text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Website</p>
                  <a href={hospital.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-700 hover:underline">Visit site</a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Services */}
      {hospital.services && hospital.services.length > 0 && (
        <div className="card">
          <h2 className="section-title">Services</h2>
          <div className="flex flex-wrap gap-2">
            {hospital.services.map((s) => (
              <span key={s.id} className={`badge ${s.is_available ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500'}`}>
                {s.service_name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
