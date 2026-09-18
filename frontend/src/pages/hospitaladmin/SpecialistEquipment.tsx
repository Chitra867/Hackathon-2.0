import React, { useEffect, useState } from 'react';
import { FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { availabilityApi } from '../../lib/api';
import type { Availability } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuthStore } from '../../store/authStore';

const SPECIALISTS = [
  { key: 'specialist_doctor', label: 'Doctor on Duty', icon: '👨‍⚕️' },
  { key: 'specialist_cardiologist', label: 'Cardiologist', icon: '❤️' },
  { key: 'specialist_neurologist', label: 'Neurologist', icon: '🧠' },
  { key: 'specialist_orthopedic', label: 'Orthopedic Surgeon', icon: '🦴' },
  { key: 'specialist_pediatrician', label: 'Pediatrician', icon: '👶' },
  { key: 'specialist_obgyn', label: 'Ob/Gyn', icon: '🤱' },
];

const EQUIPMENT = [
  { key: 'equipment_mri', label: 'MRI Machine', icon: '🔬' },
  { key: 'equipment_ct', label: 'CT Scanner', icon: '📡' },
  { key: 'equipment_xray', label: 'X-Ray', icon: '⚡' },
  { key: 'equipment_ventilator', label: 'Ventilator', icon: '💨' },
  { key: 'equipment_dialysis', label: 'Dialysis Machine', icon: '🩺' },
  { key: 'equipment_ecg', label: 'ECG Machine', icon: '📈' },
];

const STATUS_OPTIONS = ['available', 'limited', 'unavailable', 'unknown'];

export const SpecialistEquipment: React.FC = () => {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('unknown');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!user?.hospital) return;
    availabilityApi.list({ hospital: user.hospital, page_size: 100 })
      .then((r) => setRecords(r.data.results))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [user?.hospital]);

  // We use notes field to store the sub-key (e.g. specialist_cardiologist)
  const getRecord = (key: string) => records.find((r) => r.notes?.startsWith(`__key:${key}`));

  const startEdit = (key: string) => {
    const rec = getRecord(key);
    setEditStatus(rec?.status || 'unknown');
    setEditNotes(rec?.notes?.replace(`__key:${key}|`, '') || '');
    setEditingKey(key);
  };

  const handleSave = async (key: string, type: 'specialist' | 'equipment') => {
    if (!user?.hospital) return;
    setSaving(true);
    const rec = getRecord(key);
    const payload: Record<string, unknown> = {
      hospital: user.hospital,
      availability_type: type,
      status: editStatus,
      notes: `__key:${key}|${editNotes}`,
      is_active: true,
    };
    try {
      if (rec) {
        await availabilityApi.update(rec.id, payload as any);
      } else {
        await availabilityApi.create(payload as any);
      }
      toast.success('Updated successfully');
      setEditingKey(null);
      load();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const displayNotes = (key: string) => {
    const rec = getRecord(key);
    if (!rec?.notes) return '';
    return rec.notes.replace(`__key:${key}|`, '');
  };

  const renderItem = (item: { key: string; label: string; icon: string }, type: 'specialist' | 'equipment') => {
    const rec = getRecord(item.key);
    const isEditing = editingKey === item.key;
    return (
      <div key={item.key} className={`card border-2 transition-all ${isEditing ? 'border-primary-300' : 'border-gray-100'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium text-gray-800 text-sm">{item.label}</span>
          </div>
          {!isEditing && (
            <button onClick={() => startEdit(item.key)} className="btn-secondary btn-sm text-xs">
              <FiEdit2 />
            </button>
          )}
        </div>

        {!isEditing ? (
          <div>
            <StatusBadge status={rec?.status || 'unknown'} />
            {displayNotes(item.key) && <p className="text-xs text-gray-500 mt-1">{displayNotes(item.key)}</p>}
            {!rec && <p className="text-xs text-gray-400 italic mt-1">Not reported</p>}
          </div>
        ) : (
          <div className="space-y-2 mt-2">
            <select className="input text-sm" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <input className="input text-sm" placeholder="Notes (optional)" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={() => handleSave(item.key, type)} className="btn-primary btn-sm text-xs flex-1" disabled={saving}>
                {saving ? '…' : <><FiCheck /> Save</>}
              </button>
              <button onClick={() => setEditingKey(null)} className="btn-secondary btn-sm text-xs">
                <FiX />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <LoadingSpinner text="Loading…" />;

  return (
    <div>
      <h1 className="page-title">Specialists & Equipment</h1>
      <p className="text-sm text-gray-500 mb-6">Manage doctor availability and equipment status for {user?.hospital_name}</p>

      <div className="mb-8">
        <h2 className="section-title">Specialists / Doctors</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SPECIALISTS.map((s) => renderItem(s, 'specialist'))}
        </div>
      </div>

      <div>
        <h2 className="section-title">Equipment Status</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EQUIPMENT.map((e) => renderItem(e, 'equipment'))}
        </div>
      </div>
    </div>
  );
};
