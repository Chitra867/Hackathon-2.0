import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiChevronDown, FiSearch, FiChevronsUp } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { servicesApi } from '../../lib/api';
import type { Service } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const CATEGORIES = [
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
];

// Smooth height-animated collapsible
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
    <div style={{ height: height === undefined ? 'auto' : height, overflow: 'hidden', transition: 'height 200ms ease' }}>
      <div ref={ref}>{children}</div>
    </div>
  );
};

export const ServiceManagement: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  // ── load ────────────────────────────────────────────────────
  const load = () => {
    setLoading(true);
    servicesApi.list({ page_size: '200' })
      .then((r) => {
        const data = r.data as unknown;
        if (Array.isArray(data)) setServices(data as Service[]);
        else if (data && typeof data === 'object' && 'results' in (data as object))
          setServices((data as { results: Service[] }).results ?? []);
        else setServices([]);
      })
      .catch(() => toast.error('Failed to load services'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  // ── filtering ────────────────────────────────────────────────
  const filtered = useMemo(
    () => (!search ? services : services.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))),
    [services, search],
  );

  const byCategory = useMemo(() => {
    const map = new Map<string, Service[]>();
    filtered.forEach((s) => {
      const list = map.get(s.category) ?? [];
      list.push(s);
      map.set(s.category, list);
    });
    return map;
  }, [filtered]);

  useEffect(() => {
    if (search) setOpenCategories(new Set(byCategory.keys()));
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const categoriesToShow = CATEGORIES.filter((c) => byCategory.has(c.value));
  const activeCount = services.filter((s) => s.is_active).length;
  const allOpen = categoriesToShow.length > 0 && categoriesToShow.every((c) => openCategories.has(c.value));

  const toggleCategoryOpen = (value: string) =>
    setOpenCategories((prev) => { const n = new Set(prev); n.has(value) ? n.delete(value) : n.add(value); return n; });

  const expandAll  = () => setOpenCategories(new Set(categoriesToShow.map((c) => c.value)));
  const collapseAll = () => setOpenCategories(new Set());

  if (loading) return <LoadingSpinner text="Loading service catalog…" />;

  return (
    <div className="bg-[#faedd7] -m-4 md:-m-6 p-4 md:p-6 min-h-full">
      <div className="max-w-3xl mx-auto">

        {/* ── HEADER ──────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 mb-1 flex-col sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-[#1c3d3f] m-0">Service Catalog</h1>
            <p className="text-sm text-[#6b7d79] mt-1">
              All medical services available in the system. Hospital admins manage which services their hospital offers.
            </p>
          </div>
          {services.length > 0 && (
            <div className="flex-shrink-0 flex items-center gap-2 bg-white border border-[#e5dcc8] rounded-full pl-1 pr-4 py-1 shadow-sm">
              <span className="w-8 h-8 rounded-full bg-[#eef3f2] flex items-center justify-center text-[#216d73] text-sm font-semibold">
                {services.length}
              </span>
              <span className="text-xs text-[#6b7d79]">
                total · <span className="text-[#216d73] font-medium">{activeCount} active</span>
              </span>
            </div>
          )}
        </div>

        {/* ── EMPTY STATE ─────────────────────────────────── */}
        {services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-[#e5dcc8] rounded-2xl shadow-sm mt-6">
            <div className="w-14 h-14 rounded-full bg-[#eef3f2] flex items-center justify-center mb-3 text-2xl">✚</div>
            <p className="text-sm font-medium text-[#1c3d3f]">No services in the catalog yet</p>
            <p className="text-xs text-[#8a8078] mt-1">
              Hospital admins can add services from their Availability page.
            </p>
          </div>
        ) : (
          <>
            {/* ── SEARCH + EXPAND ───────────────────────── */}
            <div className="flex items-center gap-3 mt-5 mb-4">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#aabfb9]" />
                <input
                  type="text"
                  className="w-full pl-10 pr-3 py-3 rounded-2xl border border-[#e5dcc8] bg-white text-sm text-[#1c3d3f] placeholder:text-[#a3988a] focus:outline-none focus:ring-2 focus:ring-[#538b8c]/40 focus:border-[#538b8c] shadow-sm"
                  placeholder="Search services…"
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

            {/* ── NO SEARCH MATCH ───────────────────────── */}
            {categoriesToShow.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-[#e5dcc8] rounded-2xl shadow-sm">
                <div className="w-14 h-14 rounded-full bg-[#eef3f2] flex items-center justify-center mb-3 text-2xl">🔍</div>
                <p className="text-sm font-medium text-[#1c3d3f]">Nothing matches "{search}"</p>
              </div>
            ) : (
              <div className="space-y-3">
                {categoriesToShow.map((cat) => {
                  const items = byCategory.get(cat.value) ?? [];
                  const activeInCat = items.filter((s) => s.is_active).length;
                  const isOpen = openCategories.has(cat.value);
                  return (
                    <div key={cat.value} className="bg-white border border-[#e5dcc8] rounded-2xl shadow-sm overflow-hidden">

                      {/* category header */}
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
                                <span className="text-[#a3988a]"> · {items.length - activeInCat} inactive</span>
                              )}
                            </span>
                          </span>
                        </span>
                        <FiChevronDown className={`text-[#aabfb9] flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* service rows — read only */}
                      <Collapsible open={isOpen}>
                        <div className="border-t border-[#f2ece0] divide-y divide-[#f2ece0]">
                          {items.map((s) => (
                            <div
                              key={s.id}
                              className={`px-5 py-3.5 flex items-center gap-3 ${!s.is_active ? 'bg-[#faf6ee]/60' : ''}`}
                            >
                              {/* active dot */}
                              <span
                                className={`flex-shrink-0 w-2 h-2 rounded-full ${s.is_active ? 'bg-[#216d73]' : 'bg-[#d8ded9]'}`}
                                title={s.is_active ? 'Active' : 'Inactive'}
                              />
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm font-medium truncate ${s.is_active ? 'text-[#1c3d3f]' : 'text-[#a3988a]'}`}>
                                  {s.name}
                                </div>
                                {s.description && (
                                  <div className="text-xs text-[#8a8078] truncate mt-0.5">{s.description}</div>
                                )}
                              </div>
                              <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                s.is_active
                                  ? 'bg-[#eef3f2] text-[#216d73]'
                                  : 'bg-[#f2ece0] text-[#a3988a]'
                              }`}>
                                {s.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </Collapsible>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
