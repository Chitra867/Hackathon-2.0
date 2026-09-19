import React, { useEffect, useRef, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiUser, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { doctorsApi } from '../../lib/api';
import type { Doctor, DoctorDutyStatus } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuthStore } from '../../store/authStore';

const DUTY_OPTIONS = [
  { value: 'on_duty',  label: 'On Duty'   },
  { value: 'off_duty', label: 'Off Duty'  },
  { value: 'on_leave', label: 'On Leave'  },
  { value: 'unknown',  label: 'Unknown'   },
];

const DUTY_BADGE: Record<string, string> = {
  on_duty:  'bg-green-100 text-green-700',
  off_duty: 'bg-gray-100 text-gray-600',
  on_leave: 'bg-amber-100 text-amber-700',
  unknown:  'bg-gray-100 text-gray-400',
};

const emptyForm = {
  name: '',
  specialty: '',
  qualification: '',
  phone: '',
  duty_status: 'on_duty', // default sent on create; not shown in the add form
  consultation_days: '',
  consultation_time: '',
  is_active: true,
};

export const DoctorManagement: React.FC = () => {
  const { user } = useAuthStore();
  const hospitalId = user?.hospital as number | null;

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const deletingRef = useRef(false);
  const savingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Fetch doctors
  useEffect(() => {
    if (!hospitalId) return;
    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await doctorsApi.list({ hospital: hospitalId, page_size: 100 });
        if (cancelled) return;
        const data = res.data;
        setDoctors(
          Array.isArray(data)
            ? (data as Doctor[])
            : (data as { results: Doctor[] }).results ?? [],
        );
      } catch {
        if (!cancelled) {
          setError('Unable to load doctors. Please try again.');
          toast.error('Failed to load doctors');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetch();
    return () => { cancelled = true; };
  }, [hospitalId, refreshKey]);

  const refresh = () => setRefreshKey(k => k + 1);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  };

  const openEdit = (doc: Doctor) => {
    setEditing(doc);
    setForm({
      name: doc.name,
      specialty: doc.specialty,
      qualification: doc.qualification,
      phone: doc.phone,
      duty_status: doc.duty_status,
      consultation_days: doc.consultation_days,
      consultation_time: doc.consultation_time,
      is_active: doc.is_active,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    if (savingRef.current) return;
    setShowForm(false);
    setEditing(null);
    setForm({ ...emptyForm });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.specialty.trim()) {
      toast.error('Doctor name and specialty are required.');
      return;
    }
    if (!hospitalId) {
      toast.error('No hospital associated with your account.');
      return;
    }
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);

    try {
      const payload = { ...form, duty_status: form.duty_status as DoctorDutyStatus, hospital: hospitalId };
      if (editing) {
        const res = await doctorsApi.update(editing.id, payload);
        if (mountedRef.current) {
          setDoctors(prev => prev.map(d => d.id === editing.id ? res.data : d));
          toast.success(`Dr. ${res.data.name} updated.`);
          closeForm();
        }
      } else {
        const res = await doctorsApi.create(payload);
        if (mountedRef.current) {
          setDoctors(prev => [res.data, ...prev]);
          toast.success(`Dr. ${res.data.name} added.`);
          closeForm();
        }
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, unknown> } };
      const msg =
        (Object.values(e.response?.data ?? {}).flat()[0] as string) ??
        'Could not save doctor.';
      if (mountedRef.current) toast.error(msg);
    } finally {
      savingRef.current = false;
      if (mountedRef.current) setSaving(false);
    }
  };

  const handleDelete = async (doc: Doctor) => {
    if (!window.confirm(`Remove Dr. ${doc.name} from the list?`)) return;
    if (deletingRef.current) return;
    deletingRef.current = true;
    setDeletingId(doc.id);
    try {
      await doctorsApi.delete(doc.id);
      if (mountedRef.current) {
        setDoctors(prev => prev.filter(d => d.id !== doc.id));
        toast.success(`Dr. ${doc.name} removed.`);
      }
    } catch {
      if (mountedRef.current) toast.error('Could not remove doctor.');
    } finally {
      deletingRef.current = false;
      if (mountedRef.current) setDeletingId(null);
    }
  };

  // Quick duty-status toggle inline
  const handleDutyToggle = async (doc: Doctor, newStatus: string) => {
    try {
      const res = await doctorsApi.update(doc.id, { duty_status: newStatus } as Partial<Doctor>);
      setDoctors(prev => prev.map(d => d.id === doc.id ? res.data : d));
      toast.success(`Dr. ${doc.name} marked as ${res.data.duty_status_display}.`);
    } catch {
      toast.error('Could not update duty status.');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Doctor Profiles</h1>
          <p className="text-sm text-gray-500">
            Manage doctors at{' '}
            <span className="font-medium">{user?.hospital_name || 'your hospital'}</span>.
            Duty status and schedules are visible to patients searching for healthcare.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="btn-secondary btn-sm flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            onClick={openAdd}
            disabled={!hospitalId}
            className="btn-primary btn-sm flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiPlus /> Add Doctor
          </button>
        </div>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="card mb-4">
          <h2 className="mb-3 text-base font-semibold text-gray-800">
            {editing ? `Edit Dr. ${editing.name}` : 'Add New Doctor'}
          </h2>
          <form onSubmit={e => void handleSave(e)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Name */}
              <div>
                <label className="label">Full Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Dr. Ramesh Shrestha"
                  className="input"
                  disabled={saving}
                />
              </div>
              {/* Specialty */}
              <div>
                <label className="label">Specialty *</label>
                <input
                  required
                  value={form.specialty}
                  onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
                  placeholder="Cardiologist, Surgeon, General Physician…"
                  className="input"
                  disabled={saving}
                />
              </div>
              {/* Qualification */}
              <div>
                <label className="label">Qualification</label>
                <input
                  value={form.qualification}
                  onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))}
                  placeholder="MBBS, MD, MS…"
                  className="input"
                  disabled={saving}
                />
              </div>
              {/* Phone */}
              <div>
                <label className="label">Contact Phone</label>
                <input
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="98XXXXXXXX"
                  className="input"
                  disabled={saving}
                />
              </div>
              {/* Duty Status — only shown when editing an existing doctor */}
              {editing && (
                <div>
                  <label className="label">Current Duty Status</label>
                  <select
                    value={form.duty_status}
                    onChange={e => setForm(f => ({ ...f, duty_status: e.target.value }))}
                    className="input"
                    disabled={saving}
                  >
                    {DUTY_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              )}
              {/* Consultation Days */}
              <div>
                <label className="label">Consultation Days</label>
                <input
                  value={form.consultation_days}
                  onChange={e => setForm(f => ({ ...f, consultation_days: e.target.value }))}
                  placeholder="Sun–Thu, or Mon, Wed, Fri"
                  className="input"
                  disabled={saving}
                />
              </div>
              {/* Consultation Time */}
              <div>
                <label className="label">Consultation Time</label>
                <input
                  value={form.consultation_time}
                  onChange={e => setForm(f => ({ ...f, consultation_time: e.target.value }))}
                  placeholder="9:00 AM – 1:00 PM"
                  className="input"
                  disabled={saving}
                />
              </div>
              {/* Active */}
              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="doc-active"
                  checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded text-primary-700"
                  disabled={saving}
                />
                <label htmlFor="doc-active" className="text-sm text-gray-600">
                  Active — visible to patients
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary btn-sm flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <FiCheck />
                )}
                {editing ? 'Update Doctor' : 'Add Doctor'}
              </button>
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="btn-secondary btn-sm flex items-center gap-2 disabled:opacity-50"
              >
                <FiX /> Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading && <LoadingSpinner text="Loading doctors…" />}

      {/* Error */}
      {!loading && error && (
        <div className="card py-10 text-center">
          <p className="mb-4 text-sm text-red-600">{error}</p>
          <button type="button" onClick={refresh} className="btn-primary btn-sm">
            Try Again
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && doctors.length === 0 && (
        <div className="card py-10 text-center text-gray-500">
          <div className="mb-3 text-4xl">👨‍⚕️</div>
          <p className="font-medium">No doctors added yet</p>
          <p className="mt-1 text-sm text-gray-400">
            Add your hospital's doctors so patients can find specialists.
          </p>
          <button type="button" onClick={openAdd} className="btn-primary btn-sm mt-4">
            <FiPlus className="inline mr-1" /> Add First Doctor
          </button>
        </div>
      )}

      {/* Doctor list */}
      {!loading && !error && doctors.length > 0 && (
        <div className="card p-0">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialty</th>
                  <th className="hidden sm:table-cell">Schedule</th>
                  <th>Duty Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map(doc => {
                  const isDeleting = deletingId === doc.id;
                  return (
                    <tr key={doc.id}>
                      {/* Name + qualification */}
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100">
                            <FiUser className="text-primary-700" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-800">
                              Dr. {doc.name}
                            </div>
                            {doc.qualification && (
                              <div className="text-xs text-gray-500">{doc.qualification}</div>
                            )}
                            {!doc.is_active && (
                              <span className="text-xs text-gray-400">(inactive)</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Specialty */}
                      <td className="text-sm text-gray-700">{doc.specialty}</td>

                      {/* Schedule */}
                      <td className="hidden text-xs text-gray-500 sm:table-cell">
                        {doc.consultation_days || doc.consultation_time ? (
                          <>
                            {doc.consultation_days && <div>{doc.consultation_days}</div>}
                            {doc.consultation_time && <div>{doc.consultation_time}</div>}
                          </>
                        ) : '—'}
                      </td>

                      {/* Duty status — quick toggle */}
                      <td>
                        <select
                          value={doc.duty_status}
                          onChange={e => void handleDutyToggle(doc, e.target.value)}
                          className={`rounded-md border px-2 py-1 text-xs font-medium ${DUTY_BADGE[doc.duty_status] ?? 'bg-gray-100 text-gray-500'}`}
                          aria-label={`Duty status for Dr. ${doc.name}`}
                        >
                          {DUTY_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(doc)}
                            className="btn-secondary btn-sm text-xs"
                            title="Edit"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(doc)}
                            disabled={isDeleting}
                            className="btn-sm rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Remove"
                          >
                            {isDeleting ? (
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-300 border-t-red-600 block" />
                            ) : (
                              <FiTrash2 />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-500">
              {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} at {user?.hospital_name}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
