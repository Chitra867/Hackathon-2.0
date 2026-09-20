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
  verification_status: 'pending' | 'verified' | 'rejected';
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

// Shared field chrome so every input/select in the form looks identical
// without repeating the same className string a dozen times.
const inputClass =
  'w-full rounded-lg border border-[#e5dcc8] bg-white px-3.5 py-2.5 text-sm text-[#1c3d3f] placeholder:text-[#a3988a] focus:outline-none focus:ring-2 focus:ring-[#538b8c]/40 focus:border-[#538b8c] transition-colors';

const Field: React.FC<{ label: string; required?: boolean; span2?: boolean; children: React.ReactNode }> = ({
  label, required, span2, children,
}) => (
  <div className={span2 ? 'sm:col-span-2' : ''}>
    <label className="block text-sm font-medium text-[#1c3d3f] mb-1.5">
      {label} {required && <span className="text-[#a15b4a]">*</span>}
    </label>
    {children}
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white border border-[#e5dcc8] rounded-xl p-5">
    <h2 className="text-base font-semibold text-[#1c3d3f] mb-4">{title}</h2>
    <div className="grid sm:grid-cols-2 gap-4">{children}</div>
  </div>
);

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
    setForm((prev) => ({ ...prev, [key]: val } as HospitalForm));

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
    <div className="bg-[#faedd7] -m-4 md:-m-6 p-4 md:p-6 min-h-full">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/admin/hospitals"
            className="p-2 text-[#538b8c] hover:text-[#216d73] hover:bg-white rounded-lg border border-transparent hover:border-[#e5dcc8] transition-colors"
          >
            <FiArrowLeft />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-[#1c3d3f] m-0">{isEdit ? 'Edit Hospital' : 'Add New Hospital'}</h1>
            <p className="text-sm text-[#6b7d79]">Fill in all required fields</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Section title="Basic Information">
            <Field label="Hospital Name" required span2>
              <input className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Tribhuvan University Teaching Hospital" required />
            </Field>
            <Field label="Type">
              <select className={inputClass} value={form.type} onChange={(e) => set('type', e.target.value)}>
                <option value="district">District Hospital</option>
                <option value="private">Private Hospital</option>
                <option value="teaching">Teaching Hospital</option>
                <option value="community">Community Hospital</option>
                <option value="clinic">Clinic / Health Post</option>
              </select>
            </Field>
            <Field label="Verification Status">
              <select className={inputClass} value={form.verification_status} onChange={(e) => set('verification_status', e.target.value)}>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </Field>
          </Section>

          <Section title="Location">
            <Field label="Full Address" required span2>
              <input className={inputClass} value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Street address" required />
            </Field>
            <Field label="District" required>
              <select className={inputClass} value={form.district} onChange={(e) => set('district', e.target.value)} required>
                <option value="">— Select District —</option>
                {NEPAL_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Municipality">
              <input className={inputClass} value={form.municipality} onChange={(e) => set('municipality', e.target.value)} placeholder="Municipality / VDC" />
            </Field>
          </Section>

          <Section title="Contact Information">
            <Field label="Phone">
              <input className={inputClass} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="01-4XXXXXX" />
            </Field>
            <Field label="Emergency Contact">
              <input className={inputClass} value={form.emergency_contact} onChange={(e) => set('emergency_contact', e.target.value)} placeholder="Emergency line" />
            </Field>
            <Field label="Email">
              <input type="email" className={inputClass} value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="info@hospital.np" />
            </Field>
            <Field label="Website">
              <input type="url" className={inputClass} value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://hospital.np" />
            </Field>
          </Section>

          {/* Active toggle */}
          <div className="bg-white border border-[#e5dcc8] rounded-xl p-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[#1c3d3f]">Active Status</div>
              <div className="text-sm text-[#6b7d79]">Inactive hospitals won't appear in public search</div>
            </div>
            <label className="flex items-center cursor-pointer flex-shrink-0">
              <input type="checkbox" className="sr-only" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
              <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-150 ${form.is_active ? 'bg-[#216d73]' : 'bg-[#d8ded9]'}`}>
                <span className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm transition-transform duration-150 ${form.is_active ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
              </span>
              <span className="ml-3 text-sm font-medium text-[#1c3d3f] w-14">{form.is_active ? 'Active' : 'Inactive'}</span>
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-1">
            <Link
              to="/admin/hospitals"
              className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-medium text-[#1c3d3f] border border-[#e5dcc8] hover:bg-white transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-[#216d73] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#184f54] disabled:opacity-60 transition-colors shadow-sm"
            >
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                : <><FiSave /> {isEdit ? 'Save Changes' : 'Create Hospital'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};