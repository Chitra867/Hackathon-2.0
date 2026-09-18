import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { hospitalsApi } from '../../lib/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface HospitalForm {
  name: string;
  type: string;
  address: string;
  district: string;
  municipality: string;
  phone: string;
  email: string;
  website: string;
  emergency_contact: string;
  verification_status: string;
  is_active: boolean;
}

const EMPTY: HospitalForm = {
  name: '', type: 'district', address: '', district: '', municipality: '',
  phone: '', email: '', website: '', emergency_contact: '',
  verification_status: 'pending', is_active: true,
};

const NEPAL_DISTRICTS = [
  'Kathmandu','Lalitpur','Bhaktapur','Chitwan','Kaski','Morang','Rupandehi',
  'Sunsari','Makwanpur','Banke','Jhapa','Bara','Parsa','Nawalparasi','Dang',
  'Kailali','Saptari','Siraha','Mahottari','Sarlahi','Rautahat','Kapilvastu',
  'Palpa','Syangja','Lamjung','Tanahu','Gorkha','Manang','Mustang','Myagdi',
];

export const AddEditHospital: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [form, setForm] = useState<HospitalForm>(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    hospitalsApi.get(Number(id))
      .then((r) => {
        const h = r.data;
        setForm({
          name: h.name, type: h.type, address: h.address,
          district: h.district, municipality: h.municipality,
          phone: h.phone, email: h.email, website: h.website,
          emergency_contact: h.emergency_contact,
          verification_status: h.verification_status, is_active: h.is_active,
        });
      })
      .catch(() => toast.error('Failed to load hospital'))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (key: keyof HospitalForm, val: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim() || !form.district) {
      toast.error('Name, address and district are required');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await hospitalsApi.update(Number(id), form);
        toast.success('Hospital updated');
      } else {
        await hospitalsApi.create(form);
        toast.success('Hospital created');
      }
      navigate('/admin/hospitals');
    } catch (err: any) {
      const msg = err.response?.data?.name?.[0] || err.response?.data?.detail || 'Save failed';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading hospital…" />;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/hospitals" className="p-2 text-gray-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg">
          <FiArrowLeft />
        </Link>
        <div>
          <h1 className="page-title m-0">{isEdit ? 'Edit Hospital' : 'Add New Hospital'}</h1>
          <p className="text-sm text-gray-500">Fill in all required fields</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card">
          <h2 className="section-title">Basic Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="form-group sm:col-span-2">
              <label className="label">Hospital Name <span className="text-red-500">*</span></label>
              <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Tribhuvan University Teaching Hospital" required />
            </div>
            <div className="form-group">
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={(e) => set('type', e.target.value)}>
                <option value="district">District Hospital</option>
                <option value="private">Private Hospital</option>
                <option value="teaching">Teaching Hospital</option>
                <option value="community">Community Hospital</option>
                <option value="clinic">Clinic / Health Post</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Verification Status</label>
              <select className="input" value={form.verification_status} onChange={(e) => set('verification_status', e.target.value)}>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="card">
          <h2 className="section-title">Location</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="form-group sm:col-span-2">
              <label className="label">Full Address <span className="text-red-500">*</span></label>
              <input className="input" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Street address" required />
            </div>
            <div className="form-group">
              <label className="label">District <span className="text-red-500">*</span></label>
              <select className="input" value={form.district} onChange={(e) => set('district', e.target.value)} required>
                <option value="">— Select District —</option>
                {NEPAL_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Municipality</label>
              <input className="input" value={form.municipality} onChange={(e) => set('municipality', e.target.value)} placeholder="Municipality / VDC" />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="card">
          <h2 className="section-title">Contact Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="01-4XXXXXX" />
            </div>
            <div className="form-group">
              <label className="label">Emergency Contact</label>
              <input className="input" value={form.emergency_contact} onChange={(e) => set('emergency_contact', e.target.value)} placeholder="Emergency line" />
            </div>
            <div className="form-group">
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="info@hospital.np" />
            </div>
            <div className="form-group">
              <label className="label">Website</label>
              <input type="url" className="input" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://hospital.np" />
            </div>
          </div>
        </div>

        {/* Active toggle */}
        <div className="card flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-800">Active Status</div>
            <div className="text-sm text-gray-500">Inactive hospitals won't appear in public search</div>
          </div>
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
              <div className={`w-12 h-6 rounded-full transition-colors ${form.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-6' : ''}`} />
            </div>
            <span className="ml-3 text-sm font-medium text-gray-700">{form.is_active ? 'Active' : 'Inactive'}</span>
          </label>
        </div>

        <div className="flex gap-3 justify-end">
          <Link to="/admin/hospitals" className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</> : <><FiSave /> {isEdit ? 'Save Changes' : 'Create Hospital'}</>}
          </button>
        </div>
      </form>
    </div>
  );
};
