import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiPlus, FiX, FiEdit2, FiCheck, FiChevronDown, FiSearch, FiHeart, FiChevronsUp } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { servicesApi } from '../../lib/api';
import type { Service } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const CATEGORIES = [
  { value: 'icu', label: 'ICU', emoji: '🫁' },
  { value: 'nicu', label: 'NICU', emoji: '👶' },
  { value: 'ct', label: 'CT Scan', emoji: '🩻' },
  { value: 'mri', label: 'MRI', emoji: '🧲' },
  { value: 'dialysis', label: 'Dialysis', emoji: '💧' },
  { value: 'cardiology', label: 'Cardiology', emoji: '❤️' },
  { value: 'maternity', label: 'Maternity / Obstetrics', emoji: '🤰' },
  { value: 'bloodbank', label: 'Blood Bank', emoji: '🩸' },
  { value: 'surgery', label: 'Emergency Surgery', emoji: '🔪' },
  { value: 'emergency', label: 'Emergency Department', emoji: '🚑' },
  { value: 'orthopedics', label: 'Orthopedics', emoji: '🦴' },
  { value: 'neurology', label: 'Neurology', emoji: '🧠' },
  { value: 'pediatrics', label: 'Pediatrics', emoji: '🧒' },
  { value: 'ophthalmology', label: 'Ophthalmology', emoji: '👁️' },
  { value: 'ent', label: 'ENT', emoji: '👂' },
  { value: 'other', label: 'Other', emoji: '✚' },
];

interface ServiceForm { name: string; category: string; description: string; }
const EMPTY: ServiceForm = { name: '', category: 'other', description: '' };

// Collapsible section with a real height transition instead of an abrupt
// show/hide, using a measured content height so it stays smooth regardless
// of how many services or whether the inline form is open.
const Collapsible: React.FC<{ open: boolean; children: React.ReactNode }> = ({ open, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(open ? undefined : 0);

  useEffect(() => {
    if (!ref.current) return;
    if (open) {
      const h = ref.current.scrollHeight;
      setHeight(h);
      const t = setTimeout(() => setHeight(undefined), 200);
      return () => clearTimeout(t);
    }
    setHeight(ref.current.scrollHeight);
    requestAnimationFrame(() => setHeight(0));
  }, [open]);

  return (
    <div
      style={{ height: height === undefined ? 'auto' : height, overflow: 'hidden', transition: 'height 200ms ease' }}
    >
      <div ref={ref}>{children}</div>
    </div>
  );
};

export const ServiceManagement: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  const [formOpenFor, setFormOpenFor] = useState<string | null>(null); // category value, or null when closed
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

  const toggleCategoryOpen = (value: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });
  };

  const openAddIn = (category: string) => {
    setEditId(null);
    setForm({ ...EMPTY, category });
    setFormOpenFor(category);
    setOpenCategories((prev) => new Set(prev).add(category));
  };

  const openEdit = (s: Service) => {
    setEditId(s.id);
    setForm({ name: s.name, category: s.category, description: s.description });
    setFormOpenFor(s.category);
    setOpenCategories((prev) => new Set(prev).add(s.category));
  };

  const closeForm = () => { setFormOpenFor(null); setEditId(null); setForm(EMPTY); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Give the service a name first'); return; }
    setSaving(true);
    try {
      if (editId) {
        await servicesApi.update(editId, form);
        toast.success('Saved');
      } else {
        await servicesApi.create(form);
        toast.success('Added to the catalog');
      }
      closeForm(); load();
    } catch (err: any) {
      toast.error(err.response?.data?.name?.[0] || 'Something went wrong, try again');
    } finally { setSaving(false); }
  };

  const handleToggleActive = async (s: Service) => {
    try {
      await servicesApi.update(s.id, { is_active: !s.is_active });
      toast.success(s.is_active ? `${s.name} is now hidden from hospitals` : `${s.name} is live again`);
      setServices((prev) => prev.map((sv) => sv.id === s.id ? { ...sv, is_active: !sv.is_active } : sv));
    } catch { toast.error('Couldn\u2019t update that, try again'); }
  };

  const filtered = useMemo(
    () => (!search ? services : services.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))),
    [services, search]
  );

  const byCategory = useMemo(() => {
    const map = new Map<string, Service[]>();
    filtered.forEach((s) => {
      const list = map.get(s.category) || [];
      list.push(s);
      map.set(s.category, list);
    });
    return map;
  }, [filtered]);

  // While searching, auto-expand every category that has a match so results
  // aren't hidden behind a collapsed section.
  useEffect(() => {
    if (search) setOpenCategories(new Set(byCategory.keys()));
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const categoriesToShow = CATEGORIES.filter((c) => byCategory.has(c.value));
  const activeCount = services.filter((s) => s.is_active).length;
  const allOpen = categoriesToShow.length > 0 && categoriesToShow.every((c) => openCategories.has(c.value));

  const expandAll = () => setOpenCategories(new Set(categoriesToShow.map((c) => c.value)));
  const collapseAll = () => setOpenCategories(new Set());

  if (loading) return <LoadingSpinner text="Loading your service catalog…" />;

  return (
    <div className="bg-[#faedd7] -m-4 md:-m-6 p-4 md:p-6 min-h-full">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-1 flex-col sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-[#1c3d3f] m-0">What can your hospitals offer?</h1>
            <p className="text-sm text-[#6b7d79] mt-1">
              These are the services patients can search and filter by, grouped the way people actually look for them.
            </p>
          </div>
          {services.length > 0 && (
            <div className="flex-shrink-0 flex items-center gap-2 bg-white border border-[#e5dcc8] rounded-full pl-1 pr-4 py-1 shadow-sm">
              <span className="w-8 h-8 rounded-full bg-[#eef3f2] flex items-center justify-center text-[#216d73] text-sm font-semibold">
                {services.length}
              </span>
              <span className="text-xs text-[#6b7d79]">
                total · <span className="text-[#216d73] font-medium">{activeCount} live</span>
              </span>
            </div>
          )}
        </div>

        {services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-[#e5dcc8] rounded-2xl shadow-sm mt-6">
            <div className="w-14 h-14 rounded-full bg-[#eef3f2] flex items-center justify-center mb-3 text-2xl">✚</div>
            <p className="text-sm font-medium text-[#1c3d3f]">No services in the catalog yet</p>
            <p className="text-xs text-[#8a8078] mt-1 mb-4">Add the first one so hospitals can start listing what they offer.</p>
            <button
              onClick={() => openAddIn('other')}
              className="inline-flex items-center gap-2 bg-[#216d73] text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[#184f54] transition-colors"
            >
              <FiPlus /> Add your first service
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mt-5 mb-4">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#aabfb9]" />
                <input
                  type="text"
                  className="w-full pl-10 pr-3 py-3 rounded-2xl border border-[#e5dcc8] bg-white text-sm text-[#1c3d3f] placeholder:text-[#a3988a] focus:outline-none focus:ring-2 focus:ring-[#538b8c]/40 focus:border-[#538b8c] shadow-sm"
                  placeholder="Find a service…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button
                onClick={allOpen ? collapseAll : expandAll}
                className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-[#538b8c] hover:text-[#216d73] bg-white border border-[#e5dcc8] hover:border-[#aabfb9] rounded-xl px-3 py-3 transition-colors"
              >
                <FiChevronsUp className={`text-sm transition-transform ${allOpen ? '' : 'rotate-180'}`} />
                <span className="hidden sm:inline">{allOpen ? 'Collapse all' : 'Expand all'}</span>
              </button>
            </div>

            {categoriesToShow.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-[#e5dcc8] rounded-2xl shadow-sm">
                <div className="w-14 h-14 rounded-full bg-[#eef3f2] flex items-center justify-center mb-3 text-2xl">🔍</div>
                <p className="text-sm font-medium text-[#1c3d3f]">Nothing matches "{search}"</p>
                <p className="text-xs text-[#8a8078] mt-1">Check the spelling, or add it as a new service below.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {categoriesToShow.map((cat) => {
                  const items = byCategory.get(cat.value) || [];
                  const activeInCat = items.filter((s) => s.is_active).length;
                  const isOpen = openCategories.has(cat.value);
                  return (
                    <div key={cat.value} className="bg-white border border-[#e5dcc8] rounded-2xl shadow-sm overflow-hidden">
                      <button
                        onClick={() => toggleCategoryOpen(cat.value)}
                        aria-expanded={isOpen}
                        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-[#faf6ee]/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#538b8c]/50"
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          <span className="w-9 h-9 rounded-xl bg-[#eef3f2] flex items-center justify-center text-lg flex-shrink-0">{cat.emoji}</span>
                          <span className="text-left min-w-0">
                            <span className="block font-semibold text-[#1c3d3f] truncate">{cat.label}</span>
                            <span className="block text-xs text-[#8a8078]">
                              {items.length} service{items.length === 1 ? '' : 's'}
                              {activeInCat < items.length && (
                                <span className="text-[#a3988a]"> · {items.length - activeInCat} hidden</span>
                              )}
                            </span>
                          </span>
                        </span>
                        <FiChevronDown className={`text-[#aabfb9] flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <Collapsible open={isOpen}>
                        <div className="border-t border-[#f2ece0] divide-y divide-[#f2ece0]">
                          {items.map((s) => (
                            <div key={s.id} className={`px-5 py-3.5 flex items-center gap-3 transition-colors ${!s.is_active ? 'bg-[#faf6ee]/60' : ''}`}>
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm font-medium truncate ${s.is_active ? 'text-[#1c3d3f]' : 'text-[#a3988a]'}`}>
                                  {s.name}
                                </div>
                                {s.description && (
                                  <div className="text-xs text-[#8a8078] truncate mt-0.5">{s.description}</div>
                                )}
                              </div>
                              <button
                                onClick={() => handleToggleActive(s)}
                                aria-pressed={s.is_active}
                                aria-label={s.is_active ? 'Hide from hospitals' : 'Show to hospitals'}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-150 ${
                                  s.is_active ? 'bg-[#216d73]' : 'bg-[#d8ded9]'
                                }`}
                              >
                                <span
                                  className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm transition-transform duration-150 ${
                                    s.is_active ? 'translate-x-[22px]' : 'translate-x-[3px]'
                                  }`}
                                />
                              </button>
                              <button
                                onClick={() => openEdit(s)}
                                className="p-2 text-[#aabfb9] hover:text-[#216d73] hover:bg-[#eef3f2] rounded-lg transition-colors flex-shrink-0"
                                title="Edit"
                              >
                                <FiEdit2 className="text-sm" />
                              </button>
                            </div>
                          ))}

                          {/* Inline add/edit form, scoped to this category */}
                          {formOpenFor === cat.value ? (
                            <form onSubmit={handleSubmit} className="px-5 py-4 bg-[#faf6ee] space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-[#6b7d79] mb-1">Service name</label>
                                <input
                                  className="w-full rounded-xl border border-[#e5dcc8] bg-white px-3.5 py-2.5 text-sm text-[#1c3d3f] placeholder:text-[#a3988a] focus:outline-none focus:ring-2 focus:ring-[#538b8c]/40 focus:border-[#538b8c]"
                                  placeholder="e.g. ICU Beds"
                                  value={form.name}
                                  onChange={(e) => set('name', e.target.value)}
                                  autoFocus
                                  required
                                />
                              </div>
                              <div className="grid sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-[#6b7d79] mb-1">Category</label>
                                  <select
                                    className="w-full rounded-xl border border-[#e5dcc8] bg-white px-3.5 py-2.5 text-sm text-[#1c3d3f] focus:outline-none focus:ring-2 focus:ring-[#538b8c]/40 focus:border-[#538b8c]"
                                    value={form.category}
                                    onChange={(e) => set('category', e.target.value)}
                                  >
                                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-[#6b7d79] mb-1">Description (optional)</label>
                                  <input
                                    className="w-full rounded-xl border border-[#e5dcc8] bg-white px-3.5 py-2.5 text-sm text-[#1c3d3f] placeholder:text-[#a3988a] focus:outline-none focus:ring-2 focus:ring-[#538b8c]/40 focus:border-[#538b8c]"
                                    placeholder="A line hospitals will see"
                                    value={form.description}
                                    onChange={(e) => set('description', e.target.value)}
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2 pt-1">
                                <button
                                  type="submit"
                                  disabled={saving}
                                  className="inline-flex items-center gap-1.5 bg-[#216d73] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#184f54] disabled:opacity-60 transition-colors"
                                >
                                  {saving
                                    ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                                    : <><FiCheck /> {editId ? 'Save' : 'Add service'}</>}
                                </button>
                                <button
                                  type="button"
                                  onClick={closeForm}
                                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6b7d79] px-4 py-2 rounded-xl hover:bg-white transition-colors"
                                >
                                  <FiX /> Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <button
                              onClick={() => openAddIn(cat.value)}
                              className="w-full flex items-center gap-2 px-5 py-3 text-sm font-medium text-[#538b8c] hover:text-[#216d73] hover:bg-[#faf6ee] transition-colors"
                            >
                              <FiPlus className="text-xs" /> Add a service to {cat.label}
                            </button>
                          )}
                        </div>
                      </Collapsible>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Fallback: add something in a brand-new category */}
            {!search && (
              <button
                onClick={() => openAddIn('other')}
                className="w-full mt-4 flex items-center justify-center gap-2 border border-dashed border-[#c9bfa4] text-[#8a7350] text-sm font-medium py-3.5 rounded-2xl hover:border-[#aabfb9] hover:text-[#216d73] hover:bg-white transition-colors"
              >
                <FiHeart className="text-xs" /> Don't see the right category? Add a new service anyway
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};