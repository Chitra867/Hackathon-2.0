import React, { useEffect, useState } from 'react';
import { FiPlus, FiX, FiEdit2, FiToggleLeft, FiToggleRight, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { servicesApi } from '../../lib/api';
import type { Service } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const CATEGORIES = [
  { value: 'icu', label: 'ICU' }, { value: 'nicu', label: 'NICU' },
  { value: 'ct', label: 'CT Scan' }, { value: 'mri', label: 'MRI' },
  { value: 'dialysis', label: 'Dialysis' }, { value: 'cardiology', label: 'Cardiology' },
  { value: 'maternity', label: 'Maternity / Obstetrics' }, { value: 'bloodbank', label: 'Blood Bank' },
  { value: 'surgery', label: 'Emergency Surgery' }, { value: 'emergency', label: 'Emergency Department' },
  { value: 'orthopedics', label: 'Orthopedics' }, { value: 'neurology', label: 'Neurology' },
  { value: 'pediatrics', label: 'Pediatrics' }, { value: 'ophthalmology', label: 'Ophthalmology' },
  { value: 'ent', label: 'ENT' }, { value: 'other', label: 'Other' },
];

interface ServiceForm { name: string; category: string; description: string; }
const EMPTY: ServiceForm = { name: '', category: 'other', description: '' };

export const ServiceManagement: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ServiceForm>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    servicesApi.list({ page_size: '100' })
      .then((r) => setServices(r.data.results))
      .catch(() => toast.error('Failed to load services'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const set = (k: keyof ServiceForm, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const openCreate = () => { setEditId(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (s: Service) => { setEditId(s.id); setForm({ name: s.name, category: s.category, description: s.description }); setShowForm(true); };
  const cancel = () => { setShowForm(false); setEditId(null); setForm(EMPTY); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Service name is required'); return; }
    setSaving(true);
    try {
      if (editId) {
        await servicesApi.update(editId, form);
        toast.success('Service updated');
      } else {
        await servicesApi.create(form);
        toast.success('Service created');
      }
      cancel(); load();
    } catch (err: any) {
      toast.error(err.response?.data?.name?.[0] || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleToggle = async (s: Service) => {
    try {
      await servicesApi.update(s.id, { is_active: !s.is_active });
      toast.success(`Service ${s.is_active ? 'deactivated' : 'activated'}`);
      setServices((prev) => prev.map((sv) => sv.id === s.id ? { ...sv, is_active: !sv.is_active } : sv));
    } catch { toast.error('Update failed'); }
  };

  const catLabel = (val: string) => CATEGORIES.find((c) => c.value === val)?.label || val;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title m-0">Service Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage medical service categories available in the platform</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <FiPlus /> Add Service
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card mb-6 border border-primary-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title m-0">{editId ? 'Edit Service' : 'Add New Service'}</h2>
            <button onClick={cancel} className="p-1 text-gray-400 hover:text-gray-700"><FiX /></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Service Name *</label>
                <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. ICU Beds" required />
              </div>
              <div className="form-group">
                <label className="label">Category</label>
                <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="form-group sm:col-span-2">
                <label className="label">Description</label>
                <textarea className="input" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Brief description of this service…" />
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : <><FiCheck /> {editId ? 'Save Changes' : 'Create Service'}</>}
              </button>
              <button type="button" onClick={cancel} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Services Table */}
      {loading ? <LoadingSpinner text="Loading services…" /> : (
        <div className="card p-0">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Service Name</th>
                  <th>Category</th>
                  <th className="hidden md:table-cell">Description</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-500">No services found.</td></tr>
                ) : services.map((s) => (
                  <tr key={s.id} className={!s.is_active ? 'opacity-50' : ''}>
                    <td className="font-medium text-gray-900">{s.name}</td>
                    <td>
                      <span className="badge bg-blue-50 text-blue-700">{catLabel(s.category)}</span>
                    </td>
                    <td className="hidden md:table-cell text-sm text-gray-500 max-w-xs truncate">{s.description || '—'}</td>
                    <td>
                      <button onClick={() => handleToggle(s)} className="p-1 rounded">
                        {s.is_active
                          ? <FiToggleRight className="text-2xl text-green-600" />
                          : <FiToggleLeft className="text-2xl text-gray-400" />}
                      </button>
                    </td>
                    <td>
                      <button onClick={() => openEdit(s)} className="btn-secondary btn-sm text-xs">
                        <FiEdit2 /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-500">{services.length} services total</div>
        </div>
      )}
    </div>
  );
};
