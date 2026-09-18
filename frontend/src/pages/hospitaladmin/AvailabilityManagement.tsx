import React, { useEffect, useState } from 'react';
import { FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { availabilityApi } from '../../lib/api';
import type { Availability } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';

const AVAILABILITY_TYPES = [
  { type: 'bed', label: 'General Beds', icon: '🛏' },
  { type: 'icu', label: 'ICU Beds', icon: '🏥' },
  { type: 'nicu', label: 'NICU', icon: '👶' },
  { type: 'emergency', label: 'Emergency', icon: '🚨' },
  { type: 'test', label: 'MRI / CT / Dialysis', icon: '🔬' },
  { type: 'blood', label: 'Blood Bank', icon: '🩸' },
  { type: 'equipment', label: 'Equipment', icon: '⚙️' },
  { type: 'specialist', label: 'Specialist', icon: '👨‍⚕️' },
];

const STATUS_OPTIONS = ['available', 'limited', 'full', 'unavailable', 'unknown'];

interface EditState {
  status: string;
  available_count: string;
  total_count: string;
  notes: string;
}

export const AvailabilityManagement: React.FC = () => {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null); // type key
  const [editForm, setEditForm] = useState<EditState>({ status: 'unknown', available_count: '', total_count: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!user?.hospital) return;
    availabilityApi.list({ hospital: user.hospital, page_size: 50 })
      .then((r) => setRecords(r.data.results))
      .catch(() => toast.error('Failed to load availability'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [user?.hospital]);

  const getRecord = (type: string) => records.find((r) => r.availability_type === type && !r.service);

  const startEdit = (type: string) => {
    const rec = getRecord(type);
    setEditForm({
      status: rec?.status || 'unknown',
      available_count: rec?.available_count?.toString() || '',
      total_count: rec?.total_count?.toString() || '',
      notes: rec?.notes || '',
    });
    setEditingId(type);
  };

  const handleSave = async (type: string) => {
    if (!user?.hospital) return;
    setSaving(true);
    const rec = getRecord(type);
    const payload: Record<string, unknown> = {
      hospital: user.hospital,
      availability_type: type,
      status: editForm.status,
      notes: editForm.notes,
      available_count: editForm.available_count ? Number(editForm.available_count) : null,
      total_count: editForm.total_count ? Number(editForm.total_count) : null,
      is_active: true,
    };
    try {
      if (rec) {
        await availabilityApi.update(rec.id, payload as any);
      } else {
        await availabilityApi.create(payload as any);
      }
      toast.success('Availability updated');
      setEditingId(null);
      load();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading availability…" />;

  return (
    <div>
      <h1 className="page-title">Availability Management</h1>
      <p className="text-sm text-gray-500 mb-6">Update real-time availability for {user?.hospital_name || 'your hospital'}</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {AVAILABILITY_TYPES.map(({ type, label, icon }) => {
          const rec = getRecord(type);
          const isEditing = editingId === type;

          return (
            <div key={type} className={`card border-2 transition-all ${isEditing ? 'border-primary-300' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <div className="font-semibold text-gray-800">{label}</div>
                    {rec && (
                      <div className="text-xs text-gray-400">
                        Updated {format(new Date(rec.updated_at), 'MMM d, HH:mm')}
                      </div>
                    )}
                  </div>
                </div>
                {!isEditing && (
                  <button onClick={() => startEdit(type)} className="btn-secondary btn-sm text-xs">
                    <FiEdit2 /> Edit
                  </button>
                )}
              </div>

              {!isEditing ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={rec?.status || 'unknown'} />
                    {rec?.available_count != null && (
                      <span className="text-sm text-gray-600">{rec.available_count}{rec.total_count != null ? `/${rec.total_count}` : ''} available</span>
                    )}
                  </div>
                  {rec?.notes && <p className="text-xs text-gray-500">{rec.notes}</p>}
                  {!rec && <p className="text-xs text-gray-400 italic">Not yet reported — click Edit to set status</p>}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="form-group mb-0">
                    <label className="label text-xs">Status</label>
                    <select className="input text-sm" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="form-group mb-0">
                      <label className="label text-xs">Available Count</label>
                      <input type="number" className="input text-sm" placeholder="e.g. 5" value={editForm.available_count} onChange={(e) => setEditForm({ ...editForm, available_count: e.target.value })} min={0} />
                    </div>
                    <div className="form-group mb-0">
                      <label className="label text-xs">Total Count</label>
                      <input type="number" className="input text-sm" placeholder="e.g. 10" value={editForm.total_count} onChange={(e) => setEditForm({ ...editForm, total_count: e.target.value })} min={0} />
                    </div>
                  </div>
                  <div className="form-group mb-0">
                    <label className="label text-xs">Notes</label>
                    <input className="input text-sm" placeholder="Optional notes…" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => handleSave(type)} className="btn-primary btn-sm text-xs flex-1" disabled={saving}>
                      {saving ? 'Saving…' : <><FiCheck /> Save</>}
                    </button>
                    <button onClick={() => setEditingId(null)} className="btn-secondary btn-sm text-xs">
                      <FiX /> Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
