import React, { useEffect, useRef, useState } from 'react';
import {
  FiEdit2, FiCheck, FiX, FiPlus, FiRefreshCw,
  FiSearch, FiLink, FiChevronDown, FiChevronUp, FiTrash2,
} from 'react-icons/fi';
import { isAxiosError } from 'axios';
import toast from 'react-hot-toast';

import api, { availabilityApi, hospitalServicesApi, servicesApi } from '../../lib/api';
import type {
  Availability, AvailabilityStatus, HospitalService, PaginatedResponse, Service, User,
} from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuthStore } from '../../store/authStore';

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const RESOURCE_TYPES = [
  { type: 'bed',       label: 'General Beds',   icon: '🛏' },
  { type: 'icu',       label: 'ICU Beds',        icon: '🏥' },
  { type: 'nicu',      label: 'NICU',            icon: '👶' },
  { type: 'emergency', label: 'Emergency',        icon: '🚨' },
  { type: 'test',      label: 'Tests / Dialysis', icon: '🔬' },
  { type: 'blood',     label: 'Blood Bank',       icon: '🩸' },
  { type: 'equipment', label: 'Equipment',        icon: '⚙️' },
  { type: 'specialist',label: 'Specialists',      icon: '👨‍⚕️' },
];

const STATUSES: AvailabilityStatus[] = ['available', 'limited', 'full', 'unavailable', 'unknown'];

const SERVICE_CATEGORIES: Record<string, string[]> = {
  icu:       ['icu'],
  nicu:      ['nicu'],
  emergency: ['emergency'],
  test:      ['ct', 'mri', 'dialysis', 'other'],
  blood:     ['bloodbank'],
};

const CATALOG_CATEGORIES = [
  { value: 'icu',          label: 'ICU',                    emoji: '🫁' },
  { value: 'nicu',         label: 'NICU',                   emoji: '👶' },
  { value: 'ct',           label: 'CT Scan',                emoji: '🩻' },
  { value: 'mri',          label: 'MRI',                    emoji: '🧲' },
  { value: 'dialysis',     label: 'Dialysis',               emoji: '💧' },
  { value: 'cardiology',   label: 'Cardiology',             emoji: '❤️' },
  { value: 'maternity',    label: 'Maternity / Obstetrics', emoji: '🤰' },
  { value: 'bloodbank',    label: 'Blood Bank',             emoji: '🩸' },
  { value: 'surgery',      label: 'Emergency Surgery',      emoji: '🔪' },
  { value: 'emergency',    label: 'Emergency Department',   emoji: '🚑' },
  { value: 'orthopedics',  label: 'Orthopedics',            emoji: '🦴' },
  { value: 'neurology',    label: 'Neurology',              emoji: '🧠' },
  { value: 'pediatrics',   label: 'Pediatrics',             emoji: '🧒' },
  { value: 'ophthalmology',label: 'Ophthalmology',          emoji: '👁️' },
  { value: 'ent',          label: 'ENT',                    emoji: '👂' },
  { value: 'other',        label: 'Other',                  emoji: '✚' },
] as const;

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  CATALOG_CATEGORIES.map((c) => [c.value, c.label])
);

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

type RecordDetail = Availability & { service_detail?: { name?: string } | null };
type AccountDetail = User & { hospital_detail?: { name?: string } | null };

interface EditForm {
  recordId: number | null; type: string; serviceId: string;
  status: AvailabilityStatus; available: string; total: string; notes: string;
}

interface AddServiceForm { name: string; category: string; description: string; }
const EMPTY_SVC: AddServiceForm = { name: '', category: 'other', description: '' };

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

async function fetchPages<T extends { id: number }>(
  path: string, params: Record<string, string | number>, current: () => boolean,
): Promise<T[]> {
  const records = new Map<number, T>();
  let page = 1;
  while (current()) {
    const { data } = await api.get<PaginatedResponse<T>>(path, { params: { ...params, page } });
    if (!current()) return [];
    if (!Array.isArray(data.results)) throw new Error('Unexpected API response.');
    const prev = records.size;
    data.results.forEach((r) => records.set(r.id, r));
    if (!data.next) break;
    if (records.size === prev) throw new Error('Pagination did not advance.');
    page += 1;
  }
  return [...records.values()];
}

function readCount(value: string, label: string): number | null {
  const text = value.trim();
  if (!text) return null;
  if (!/^\d+$/.test(text)) throw new Error(`${label} must be a whole number of zero or more.`);
  const count = Number(text);
  if (!Number.isSafeInteger(count)) throw new Error(`${label} is too large.`);
  return count;
}

function getError(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback;
  if (!error.response) return 'Cannot reach the server. Check your connection.';
  if (error.response.status === 401) return 'Your session expired. Please sign in again.';
  if (error.response.status === 403) return 'You do not have permission to perform this action.';
  if (error.response.status === 404) return 'This record is no longer available.';
  if (error.response.status === 400 || error.response.status === 409) {
    const d: unknown = error.response.data;
    if (d && typeof d === 'object') {
      for (const [key, value] of Object.entries(d)) {
        const msg = typeof value === 'string' ? value
          : Array.isArray(value) && typeof value[0] === 'string' ? value[0] : '';
        if (msg) return `${key.replace(/_/g, ' ')}: ${msg}`;
      }
    }
  }
  return fallback;
}

function displayDate(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? 'Not reported' : d.toLocaleString();
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export const AvailabilityManagement: React.FC = () => {
  const { user } = useAuthStore();
  const account = user as AccountDetail | null;
  const hospitalId = user?.hospital ?? null;

  const canEdit = Boolean(
    user && ['hospital_admin', 'hospital_staff', 'system_admin'].includes(user.role),
  );

  // ── availability state ───────────────────────────────────────
  const [records, setRecords]           = useState<RecordDetail[]>([]);
  const [services, setServices]         = useState<Service[]>([]);       // linked+available
  const [allCatalog, setAllCatalog]     = useState<Service[]>([]);       // full catalog
  const [linkedIds, setLinkedIds]       = useState<Set<number>>(new Set());
  const [hsLinks, setHsLinks]           = useState<HospitalService[]>([]); // hospital-service rows

  const [loading, setLoading]           = useState(true);
  const [loadError, setLoadError]       = useState('');
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [reloadKey, setReloadKey]       = useState(0);

  // ── availability editor ──────────────────────────────────────
  const [editor, setEditor]     = useState<EditForm | null>(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving]     = useState(false);

  // ── manage-services panel ────────────────────────────────────
  const [showPanel, setShowPanel]       = useState(false);
  const [panelSearch, setPanelSearch]   = useState('');
  const [linking, setLinking]           = useState<number | null>(null);
  const [unlinking, setUnlinking]       = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Service | null>(null); // service to delete from catalog

  // ── add-service form (inside the panel) ─────────────────────
  const [showAddForm, setShowAddForm]   = useState(false);
  const [addForm, setAddForm]           = useState<AddServiceForm>(EMPTY_SVC);
  const [addSaving, setAddSaving]       = useState(false);

  const version   = useRef(0);
  const saveBusy  = useRef(false);

  // ── load ─────────────────────────────────────────────────────
  useEffect(() => {
    const token = ++version.current;
    const current = () => version.current === token;

    saveBusy.current = false;
    setSaving(false);
    setRecords([]); setServices([]); setAllCatalog([]);
    setLinkedIds(new Set()); setHsLinks([]);
    setEditor(null); setFormError('');
    setLoadError(''); setNeedsRefresh(false);

    if (hospitalId === null) { setLoading(false); return () => { version.current += 1; }; }

    setLoading(true);

    const load = async () => {
      try {
        const [allRecords, links, catalog] = await Promise.all([
          fetchPages<RecordDetail>('/availability/', { hospital: hospitalId, ordering: '-updated_at' }, current),
          fetchPages<HospitalService>('/hospital-services/', { hospital: hospitalId }, current),
          fetchPages<Service>('/services/', { is_active: 'true' }, current),
        ]);
        if (!current()) return;

        const availableIds = new Set(links.filter((l) => l.hospital === hospitalId && l.is_available).map((l) => l.service));
        const allLinkedIds  = new Set(links.filter((l) => l.hospital === hospitalId).map((l) => l.service));

        setRecords(allRecords.filter((r) => r.hospital === hospitalId));
        setServices(catalog.filter((s) => s.is_active && availableIds.has(s.id)).sort((a, b) => a.name.localeCompare(b.name)));
        setAllCatalog(catalog.sort((a, b) => a.name.localeCompare(b.name)));
        setLinkedIds(allLinkedIds);
        setHsLinks(links.filter((l) => l.hospital === hospitalId));
      } catch (err) {
        if (current()) { setLoadError(getError(err, 'Could not load availability and services.')); setNeedsRefresh(true); }
      } finally {
        if (current()) setLoading(false);
      }
    };

    void load();
    return () => { version.current += 1; };
  }, [hospitalId, reloadKey]);

  // ── link / unlink a catalog service ─────────────────────────
  const handleLink = async (service: Service) => {
    if (!hospitalId || linking || unlinking) return;
    setLinking(service.id);
    try {
      await hospitalServicesApi.create({ hospital: hospitalId, service: service.id, is_available: true });
      setLinkedIds((p) => new Set([...p, service.id]));
      setServices((p) => [...p, service].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success(`"${service.name}" linked to your hospital`);
    } catch (err) { toast.error(getError(err, `Failed to link "${service.name}"`)); }
    finally { setLinking(null); }
  };

  const handleUnlink = async (service: Service) => {
    if (!hospitalId || linking || unlinking) return;
    const link = hsLinks.find((l) => l.service === service.id);
    if (!link) return;
    setUnlinking(service.id);
    try {
      await hospitalServicesApi.delete(link.id);
      setLinkedIds((p) => { const n = new Set(p); n.delete(service.id); return n; });
      setServices((p) => p.filter((s) => s.id !== service.id));
      setHsLinks((p) => p.filter((l) => l.id !== link.id));
      toast.success(`"${service.name}" removed from your hospital`);
    } catch (err) { toast.error(getError(err, `Failed to remove "${service.name}"`)); }
    finally { setUnlinking(null); }
  };

  // ── add new service to catalog ───────────────────────────────
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) { toast.error('Enter a service name'); return; }
    setAddSaving(true);
    try {
      const res = await servicesApi.create({ name: addForm.name.trim(), category: addForm.category, description: addForm.description.trim() });
      const newService = res.data as Service;
      toast.success(`"${newService.name}" added to catalog`);
      // immediately link it to this hospital
      await hospitalServicesApi.create({ hospital: hospitalId!, service: newService.id, is_available: true });
      setAllCatalog((p) => [...p, newService].sort((a, b) => a.name.localeCompare(b.name)));
      setLinkedIds((p) => new Set([...p, newService.id]));
      setServices((p) => [...p, newService].sort((a, b) => a.name.localeCompare(b.name)));
      setAddForm(EMPTY_SVC);
      setShowAddForm(false);
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { name?: string[] } } };
      toast.error(axErr?.response?.data?.name?.[0] ?? getError(err, 'Failed to add service'));
    } finally { setAddSaving(false); }
  };

  // ── delete a service from catalog ────────────────────────────
  const handleDeleteService = async (service: Service) => {
    try {
      await servicesApi.delete(service.id);
      setAllCatalog((p) => p.filter((s) => s.id !== service.id));
      setServices((p) => p.filter((s) => s.id !== service.id));
      setLinkedIds((p) => { const n = new Set(p); n.delete(service.id); return n; });
      setHsLinks((p) => p.filter((l) => l.service !== service.id));
      toast.success(`"${service.name}" deleted from catalog`);
      setConfirmDelete(null);
    } catch (err) { toast.error(getError(err, `Failed to delete "${service.name}"`)); }
  };

  // ── availability editor helpers ──────────────────────────────
  const optionsFor = (type: string) => {
    if (type === 'bed') return [];
    const cats = SERVICE_CATEGORIES[type];
    return cats ? services.filter((s) => cats.includes(s.category)) : services;
  };

  const startEdit = (record: RecordDetail) => {
    if (!canEdit || saveBusy.current || needsRefresh || editor) return;
    setFormError('');
    setEditor({
      recordId: record.id, type: record.availability_type,
      serviceId: record.service == null ? '' : String(record.service),
      status: record.status, available: record.available_count?.toString() ?? '',
      total: record.total_count?.toString() ?? '', notes: record.notes ?? '',
    });
  };

  const startCreate = (type: string) => {
    if (!canEdit || saveBusy.current || needsRefresh || editor) return;
    const opts = optionsFor(type);
    setFormError('');
    setEditor({
      recordId: null, type,
      serviceId: SERVICE_CATEGORIES[type] && opts.length === 1 ? String(opts[0].id) : '',
      status: 'unknown', available: '', total: '', notes: '',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor || hospitalId === null || !canEdit || saveBusy.current || needsRefresh) return;

    const draft = { ...editor };
    const serviceId = draft.serviceId ? Number(draft.serviceId) : null;
    let available: number | null, total: number | null;

    try {
      available = readCount(draft.available, 'Available count');
      total = readCount(draft.total, 'Total count');
      if (available !== null && total !== null && available > total)
        throw new Error('Available count cannot exceed total count.');
      if (draft.status === 'full' && available !== 0)
        throw new Error('Use zero available count when the status is Full.');
      if (['available', 'limited'].includes(draft.status) && available === 0)
        throw new Error('For zero available resources, choose Full, Unavailable, or Unknown.');
      if (draft.recordId === null) {
        if (SERVICE_CATEGORIES[draft.type] && serviceId === null)
          throw new Error('Select a service assigned to this hospital.');
        if (serviceId !== null && !optionsFor(draft.type).some((s) => s.id === serviceId))
          throw new Error('Select a valid enabled hospital service.');
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Check the entered values.');
      return;
    }

    const token = version.current;
    const current = () => version.current === token;
    saveBusy.current = true; setSaving(true); setFormError('');
    let saved = false;
    try {
      const changes: Partial<Availability> = { status: draft.status, available_count: available, total_count: total, notes: draft.notes.trim() };
      if (draft.recordId !== null) {
        await availabilityApi.update(draft.recordId, changes);
      } else {
        const latest = await fetchPages<RecordDetail>('/availability/', { hospital: hospitalId }, current);
        if (!current()) return;
        setRecords(latest.filter((r) => r.hospital === hospitalId));
        const existing = latest.find((r) =>
          r.hospital === hospitalId && r.availability_type === draft.type && (r.service ?? null) === serviceId,
        );
        if (existing) {
          setFormError(existing.is_active
            ? 'This resource already has a record. Cancel and edit that record instead.'
            : 'An inactive record already exists. Ask your administrator to review it.');
          return;
        }
        await availabilityApi.create({ ...changes, hospital: hospitalId, availability_type: draft.type, service: serviceId, is_active: true });
      }
      saved = true;
      if (!current()) return;
      setEditor(null);
      toast.success('Availability saved');
      const latest = await fetchPages<RecordDetail>('/availability/', { hospital: hospitalId, ordering: '-updated_at' }, current);
      if (current()) setRecords(latest.filter((r) => r.hospital === hospitalId));
    } catch (err) {
      if (!current()) return;
      setNeedsRefresh(true);
      if (saved) setLoadError('Your update was saved, but the list could not be refreshed. Select Refresh before editing again.');
      else setFormError(`${getError(err, 'Could not confirm that the update was saved.')} Select Refresh to check the latest data before trying again.`);
    } finally {
      if (current()) { saveBusy.current = false; setSaving(false); }
    }
  };

  const renderEditor = () => {
    const draft = editor;
    if (!draft) return null;
    const requiresService = Boolean(SERVICE_CATEGORIES[draft.type]);
    const options = optionsFor(draft.type);
    return (
      <form onSubmit={handleSave} className="space-y-3">
        <fieldset disabled={saving || needsRefresh} className="space-y-3 disabled:opacity-60">
          {draft.recordId === null && draft.type !== 'bed' && (
            <div>
              <label htmlFor="av-service" className="label">Service {requiresService ? '(required)' : '(optional)'}</label>
              <select id="av-service" className="input" value={draft.serviceId} required={requiresService}
                onChange={(e) => setEditor({ ...draft, serviceId: e.target.value })}>
                <option value="">{requiresService ? 'Select a hospital service' : 'Hospital-wide resource (no service)'}</option>
                {options.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {requiresService && options.length === 0 && (
                <p className="mt-1 text-xs text-amber-800">
                  No matching services linked. Use the <strong>Manage Services</strong> panel above to add one first.
                </p>
              )}
            </div>
          )}
          <div>
            <label htmlFor="av-status" className="label">Status</label>
            <select id="av-status" className="input" value={draft.status}
              onChange={(e) => { const s = e.target.value as AvailabilityStatus; setEditor({ ...draft, status: s, available: s === 'full' ? '0' : draft.available }); }}>
              {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="av-count" className="label">Available Count</label>
              <input id="av-count" type="number" min="0" step="1" className="input" value={draft.available}
                placeholder="Unknown" onChange={(e) => setEditor({ ...draft, available: e.target.value })} />
            </div>
            <div>
              <label htmlFor="av-total" className="label">Total Count</label>
              <input id="av-total" type="number" min="0" step="1" className="input" value={draft.total}
                placeholder="Unknown" onChange={(e) => setEditor({ ...draft, total: e.target.value })} />
            </div>
          </div>
          <p className="text-xs text-gray-500">Leave counts blank when unknown. Full requires zero available.</p>
          <div>
            <label htmlFor="av-notes" className="label">Notes</label>
            <textarea id="av-notes" className="input" rows={3} value={draft.notes}
              onChange={(e) => setEditor({ ...draft, notes: e.target.value })} />
          </div>
        </fieldset>
        {formError && <p role="alert" className="text-sm text-red-700">{formError}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={saving || needsRefresh} className="btn-primary disabled:opacity-50">
            <FiCheck /> {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" disabled={saving} className="btn-secondary disabled:opacity-50"
            onClick={() => { if (!saveBusy.current) { setEditor(null); setFormError(''); } }}>
            <FiX /> Cancel
          </button>
        </div>
      </form>
    );
  };

  // ── guards ───────────────────────────────────────────────────
  if (!user || hospitalId === null) {
    return (
      <div className="card" role="status">
        <h1 className="page-title">No hospital assigned</h1>
        <p>Sign in with a hospital account, or ask your system administrator to assign your hospital.</p>
      </div>
    );
  }

  if (loading) return <LoadingSpinner text="Loading availability…" />;

  const activeRecords = records.filter((r) => r.is_active);
  const unknownTypes = [...new Set(activeRecords.map((r) => r.availability_type))]
    .filter((t) => !RESOURCE_TYPES.some((rt) => rt.type === t))
    .map((t) => ({ type: t, label: t.replace(/_/g, ' '), icon: '📋' }));
  const sections = [...RESOURCE_TYPES, ...unknownTypes];

  const filteredCatalog = allCatalog.filter((s) =>
    !panelSearch ||
    s.name.toLowerCase().includes(panelSearch.toLowerCase()) ||
    (CATEGORY_LABEL[s.category] || s.category).toLowerCase().includes(panelSearch.toLowerCase()),
  );

  return (
    <div>
      {/* ── PAGE HEADER ─────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Availability Management</h1>
          <p className="text-sm text-gray-500">
            Update availability for{' '}
            {account?.hospital_detail?.name || user.hospital_name || `Hospital #${hospitalId}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              type="button"
              onClick={() => { setShowAddForm(true); setShowPanel(true); }}
              className="flex items-center gap-2 bg-[#0e6068] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#0a4d54] transition-colors shadow-sm"
            >
              <FiPlus className="text-base" /> Add Service
            </button>
          )}
          <button type="button" disabled={saving || (editor !== null && !needsRefresh)}
            onClick={() => { if (!saveBusy.current) setReloadKey((k) => k + 1); }}
            className="btn-secondary disabled:opacity-50">
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

      {loadError && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {loadError}
        </div>
      )}
      {needsRefresh && (
        <p role="status" className="mb-4 text-sm text-amber-800">
          Editing is paused. Select Refresh to load the latest data. Any open draft will be cleared.
        </p>
      )}
      {!canEdit && (
        <p className="mb-4 text-sm text-gray-600">Your account can view this page but cannot edit availability.</p>
      )}

      {/* ── DELETE CONFIRM MODAL ────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-gray-800 mb-2">Delete "{confirmDelete.name}"?</h3>
            <p className="text-sm text-gray-500 mb-5">
              This removes the service from the catalog entirely. All hospitals that had it linked will lose it.
              This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDeleteService(confirmDelete)}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MANAGE SERVICES PANEL ───────────────────────────── */}
      {canEdit && (
        <div className="mb-6 rounded-xl border border-[#dfd4bf] bg-white shadow-sm overflow-hidden">
          {/* toggle header */}
          <button type="button" onClick={() => setShowPanel((v) => !v)}
            className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-[#faf6ee] transition-colors focus:outline-none">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e7f3f0] text-[#0e6068] text-lg">
                <FiLink />
              </span>
              <div className="text-left">
                <p className="font-semibold text-gray-800 text-sm">Manage Services</p>
                <p className="text-xs text-gray-500">
                  {linkedIds.size} linked · {allCatalog.length} in catalog
                </p>
              </div>
            </div>
            {showPanel ? <FiChevronUp className="text-gray-400" /> : <FiChevronDown className="text-gray-400" />}
          </button>

          {showPanel && (
            <div className="border-t border-[#f0ebe0] px-5 py-4 space-y-4">

              {/* ── ADD NEW SERVICE FORM ──────────────────── */}
              {showAddForm && (
                <form onSubmit={handleAddService} className="rounded-xl border border-[#e5dcc8] bg-[#faf6ee] p-4 space-y-3">
                  <p className="text-sm font-semibold text-gray-700">Add New Service</p>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Service name <span className="text-red-500">*</span></label>
                    <input
                      className="w-full rounded-xl border border-[#e5dcc8] bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0e6068]/30 focus:border-[#0e6068]"
                      placeholder="e.g. CT Scan with Contrast"
                      value={addForm.name}
                      onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                      autoFocus required
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                      <select
                        className="w-full rounded-xl border border-[#e5dcc8] bg-white px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0e6068]/30 focus:border-[#0e6068]"
                        value={addForm.category}
                        onChange={(e) => setAddForm((p) => ({ ...p, category: e.target.value }))}
                      >
                        {CATALOG_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
                      <input
                        className="w-full rounded-xl border border-[#e5dcc8] bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0e6068]/30 focus:border-[#0e6068]"
                        placeholder="Short description"
                        value={addForm.description}
                        onChange={(e) => setAddForm((p) => ({ ...p, description: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="submit" disabled={addSaving}
                      className="inline-flex items-center gap-1.5 bg-[#0e6068] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#0a4d54] disabled:opacity-60 transition-colors">
                      {addSaving
                        ? <><span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                        : <><FiCheck /> Add Service</>}
                    </button>
                    <button type="button" onClick={() => { setShowAddForm(false); setAddForm(EMPTY_SVC); }}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 px-4 py-2 rounded-xl hover:bg-white transition-colors">
                      <FiX /> Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* ── SEARCH EXISTING CATALOG ───────────────── */}
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input type="text" value={panelSearch} onChange={(e) => setPanelSearch(e.target.value)}
                  placeholder="Search catalog services…"
                  className="w-full rounded-xl border border-gray-200 bg-[#fafaf8] pl-9 pr-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0e6068]/30 focus:border-[#0e6068]" />
              </div>

              {/* ── CATALOG LIST ─────────────────────────── */}
              {filteredCatalog.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-400">
                  {panelSearch ? `No services match "${panelSearch}"` : 'Catalog is empty.'}
                </p>
              ) : (
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 rounded-xl border border-gray-100">
                  {filteredCatalog.map((service) => {
                    const isLinked = linkedIds.has(service.id);
                    const isBusy = linking === service.id || unlinking === service.id;
                    return (
                      <div key={service.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{service.name}</p>
                          <p className="text-xs text-gray-400">{CATEGORY_LABEL[service.category] || service.category}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* link / unlink */}
                          {isLinked ? (
                            <button type="button" disabled={isBusy || !!(linking || unlinking)} onClick={() => handleUnlink(service)}
                              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50">
                              {isBusy ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-300 border-t-red-700" /> : <FiX className="text-xs" />}
                              Remove
                            </button>
                          ) : (
                            <button type="button" disabled={isBusy || !!(linking || unlinking)} onClick={() => handleLink(service)}
                              className="flex items-center gap-1.5 rounded-lg border border-[#bde0d8] bg-[#e7f3f0] px-3 py-1.5 text-xs font-medium text-[#0e6068] hover:bg-[#d4ecea] transition-colors disabled:opacity-50">
                              {isBusy ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#0e6068]/30 border-t-[#0e6068]" /> : <FiPlus className="text-xs" />}
                              Add
                            </button>
                          )}
                          {/* delete from catalog */}
                          <button type="button" onClick={() => setConfirmDelete(service)} title="Delete from catalog"
                            className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                            <FiTrash2 className="text-sm" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── AVAILABILITY SECTIONS ────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map(({ type, label, icon }) => {
          const group = activeRecords.filter((r) => r.availability_type === type);
          const creating = editor?.recordId === null && editor.type === type;
          return (
            <section key={type} className="card">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-semibold text-gray-800">
                  <span aria-hidden="true" className="text-2xl">{icon}</span>
                  {label}
                </h2>
                {canEdit && RESOURCE_TYPES.some((rt) => rt.type === type) && (
                  <button type="button" disabled={saving || needsRefresh || editor !== null}
                    onClick={() => startCreate(type)} className="btn-secondary btn-sm disabled:opacity-50">
                    <FiPlus /> Add
                  </button>
                )}
              </div>

              {group.length === 0 && !creating && (
                <p className="text-sm text-gray-500">
                  {needsRefresh ? 'Records could not be confirmed.' : 'No active records for this resource.'}
                </p>
              )}

              <div className="space-y-4">
                {group.map((record) => {
                  const editing = editor?.recordId === record.id;
                  const serviceName =
                    record.service_detail?.name ||
                    record.service_name ||
                    services.find((s) => s.id === record.service)?.name ||
                    (record.service == null ? 'Hospital-wide resource' : `Service #${record.service}`);
                  return (
                    <div key={record.id} className={`rounded-lg border p-3 ${editing ? 'border-primary-300' : 'border-gray-200'}`}>
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800">{serviceName}</h3>
                          <p className="text-xs text-gray-500">Updated {displayDate(record.updated_at)}</p>
                        </div>
                        {canEdit && !editing && (
                          <button type="button" onClick={() => startEdit(record)}
                            disabled={saving || needsRefresh || editor !== null}
                            className="btn-secondary btn-sm disabled:opacity-50">
                            <FiEdit2 /> Edit
                          </button>
                        )}
                      </div>
                      {editing ? renderEditor() : (
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge status={record.status} />
                            <span className="text-sm text-gray-600">
                              {record.available_count == null
                                ? 'Available count not reported'
                                : `${record.available_count}${record.total_count == null ? '' : ` / ${record.total_count}`} available`}
                            </span>
                          </div>
                          {record.notes && <p className="whitespace-pre-wrap break-words text-xs text-gray-600">{record.notes}</p>}
                          {record.service != null && !services.some((s) => s.id === record.service) && (
                            <p className="text-xs text-amber-800">This service is no longer linked to your hospital.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {creating && (
                  <div className="rounded-lg border border-primary-300 p-3">
                    <h3 className="mb-3 font-semibold">Add {label}</h3>
                    {renderEditor()}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
