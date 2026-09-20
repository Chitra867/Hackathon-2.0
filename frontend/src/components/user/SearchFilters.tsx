import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  FiSearch, FiMapPin, FiAlertTriangle, FiX, FiChevronDown, FiCheck,
} from 'react-icons/fi';
import { MdMedicalServices } from 'react-icons/md';
import { FaHospital } from 'react-icons/fa';
import { MdLocalHospital } from 'react-icons/md';
import { userPortalApi, servicesApi } from '../../lib/api';
import type { SearchSuggestion, Service } from '../../types';

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const NEPAL_DISTRICTS = [
  'Kathmandu','Lalitpur','Bhaktapur','Chitwan','Pokhara','Kaski','Rupandehi',
  'Morang','Jhapa','Sunsari','Bara','Parsa','Makwanpur','Kavrepalanchok',
  'Sindhuli','Dhading','Nuwakot','Rasuwa','Sindhupalchok','Dolakha',
  'Ramechhap','Okhaldhunga','Khotang','Solukhumbu','Taplejung','Sankhuwasabha',
  'Terhathum','Dhankuta','Bhojpur','Panchthar','Ilam','Udayapur',
  'Saptari','Siraha','Dhanusa','Mahottari','Sarlahi','Rautahat','Nawalparasi',
  'Gulmi','Palpa','Syangja','Parbat','Baglung','Myagdi','Mustang',
  'Manang','Lamjung','Tanahun','Gorkha','Dhaulagiri','Rolpa','Rukum',
  'Salyan','Dolpa','Jumla','Humla','Mugu','Bajura','Bajhang','Darchula',
  'Baitadi','Dadeldhura','Doti','Achham','Kailali','Kanchanpur','Dang',
  'Banke','Bardiya','Surkhet','Dailekh','Jajarkot','Pyuthan','Arghakhanchi',
];

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface SearchFiltersState {
  q: string;
  district: string;
  emergency: boolean;
  serviceIds: number[];   // selected service IDs for multi-filter
}

interface Props {
  filters: SearchFiltersState;
  onChange: (filters: SearchFiltersState) => void;
  onSearch: (filters: SearchFiltersState) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  loading?: boolean;
}

// ─────────────────────────────────────────────────────────────
// SUGGESTION STYLES
// ─────────────────────────────────────────────────────────────

const suggestionStyle: Record<SearchSuggestion['type'], { icon: React.ReactNode; badge: string }> = {
  hospital:  { icon: <FaHospital />,        badge: 'bg-[#eef3f2] text-[#216d73]' },
  service:   { icon: <MdMedicalServices />, badge: 'bg-[#eef3f2] text-[#538b8c]' },
  specialty: { icon: <MdLocalHospital />,   badge: 'bg-[#f2ece0] text-[#8a7350]' },
  district:  { icon: <FiMapPin />,          badge: 'bg-[#eef1f0] text-[#6b7d79]' },
};

function typeLabel(type: SearchSuggestion['type']) {
  switch (type) {
    case 'hospital':  return 'Hospital';
    case 'service':   return 'Service';
    case 'specialty': return 'Specialty';
    case 'district':  return 'District';
    default:          return '';
  }
}

const fieldClass =
  'w-full rounded-xl border border-[#e5dcc8] bg-white text-sm text-[#1c3d3f] placeholder:text-[#a3988a] focus:outline-none focus:ring-2 focus:ring-[#538b8c]/40 focus:border-[#538b8c] transition-shadow';

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export const SearchFilters: React.FC<Props> = ({
  filters,
  onChange,
  onSearch,
  onSuggestionSelect,
  loading,
}) => {
  const update = (partial: Partial<SearchFiltersState>) => {
    const next = { ...filters, ...partial };
    onChange(next);
    return next;
  };

  // ── suggestion state ─────────────────────────────────────────
  const [suggestions, setSuggestions]   = useState<SearchSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIdx, setActiveIdx]       = useState(-1);
  const suggestDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef    = useRef<HTMLDivElement>(null);

  // ── service multi-select state ───────────────────────────────
  const [allServices, setAllServices]       = useState<Service[]>([]);
  const [serviceSearch, setServiceSearch]   = useState('');
  const [showServiceMenu, setShowServiceMenu] = useState(false);
  const serviceMenuRef = useRef<HTMLDivElement>(null);

  // load catalog services once
  useEffect(() => {
    servicesApi.list({ page_size: '200' })
      .then((r) => {
        const data = r.data as unknown;
        if (Array.isArray(data)) setAllServices(data as Service[]);
        else if (data && typeof data === 'object' && 'results' in (data as object))
          setAllServices(((data as { results: Service[] }).results ?? []).filter((s) => s.is_active));
      })
      .catch(() => {});
  }, []);

  // close service menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (serviceMenuRef.current && !serviceMenuRef.current.contains(e.target as Node))
        setShowServiceMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleService = (id: number) => {
    const ids = filters.serviceIds.includes(id)
      ? filters.serviceIds.filter((s) => s !== id)
      : [...filters.serviceIds, id];
    const next = update({ serviceIds: ids });
    onChange(next);
  };

  const clearServices = () => {
    const next = update({ serviceIds: [] });
    onSearch(next);
  };

  const filteredServices = allServices.filter((s) =>
    !serviceSearch || s.name.toLowerCase().includes(serviceSearch.toLowerCase()),
  );

  // ── suggestion fetch ─────────────────────────────────────────
  const fetchSuggestions = useCallback((q: string) => {
    if (suggestDebounce.current) clearTimeout(suggestDebounce.current);
    if (q.length < 2) { setSuggestions([]); setShowDropdown(false); return; }
    suggestDebounce.current = setTimeout(async () => {
      try {
        const res = await userPortalApi.getSearchSuggestions(q);
        setSuggestions(res.data.suggestions);
        setShowDropdown(res.data.suggestions.length > 0);
        setActiveIdx(-1);
      } catch {
        setSuggestions([]); setShowDropdown(false);
      }
    }, 250);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    update({ q: val });
    fetchSuggestions(val);
  };

  const handleSelect = (suggestion: SearchSuggestion) => {
    const next = update({ q: suggestion.label });
    setSuggestions([]); setShowDropdown(false);
    if (onSuggestionSelect) onSuggestionSelect(suggestion);
    else onSearch(next);
  };

  const handleSearchButton = () => {
    setShowDropdown(false);
    onSearch(filters);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) {
      if (e.key === 'Enter') { e.preventDefault(); handleSearchButton(); }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && suggestions[activeIdx]) handleSelect(suggestions[activeIdx]);
      else { setShowDropdown(false); handleSearchButton(); }
    } else if (e.key === 'Escape') { setShowDropdown(false); }
  };

  // close search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedCount = filters.serviceIds.length;

  return (
    <div className="flex flex-col gap-2">

      {/* ── Row 1: Search input ──────────────────────────── */}
      <div className="relative" ref={containerRef}>
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#aabfb9] text-base z-10 pointer-events-none" />
        <input
          type="text"
          value={filters.q}
          onChange={handleInputChange}
          onKeyDown={handleKey}
          onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
          placeholder="Search hospitals…"
          className={`${fieldClass} pl-10 pr-9 py-2.5`}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-label="Search hospitals"
        />
        {filters.q && (
          <button onClick={() => { const n = update({ q: '' }); setSuggestions([]); setShowDropdown(false); onSearch(n); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aabfb9] hover:text-[#538b8c] z-10"
            aria-label="Clear search" tabIndex={-1}>
            <FiX />
          </button>
        )}
        {showDropdown && suggestions.length > 0 && (
          <ul role="listbox" className="absolute z-50 w-full top-full mt-1.5 bg-white border border-[#e5dcc8] rounded-xl shadow-lg overflow-hidden">
            {suggestions.map((s, idx) => (
              <li key={`${s.type}-${s.label}`} role="option" aria-selected={idx === activeIdx}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
                onMouseEnter={() => setActiveIdx(idx)}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm transition-colors ${idx === activeIdx ? 'bg-[#eef3f2] text-[#1c3d3f]' : 'text-[#1c3d3f] hover:bg-[#faf6ee]'}`}>
                <span className="flex-shrink-0 text-[#aabfb9]">{suggestionStyle[s.type]?.icon}</span>
                <span className="flex-1 min-w-0">
                  <span className="font-medium truncate block">{s.label}</span>
                  {s.subtitle && <span className="text-xs text-[#a3988a]">{s.subtitle}</span>}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${suggestionStyle[s.type]?.badge ?? 'bg-[#eef1f0] text-[#6b7d79]'}`}>
                  {typeLabel(s.type)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Row 2: District + Emergency + Search ────────── */}
      <div className="flex gap-2">
        {/* District */}
        <div className="relative flex-1 min-w-0">
          <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aabfb9] text-sm pointer-events-none z-10" />
          <select value={filters.district}
            onChange={(e) => { const n = update({ district: e.target.value }); onSearch(n); }}
            className={`${fieldClass} pl-9 pr-8 py-2.5 appearance-none cursor-pointer`}>
            <option value="">All Districts</option>
            {NEPAL_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#aabfb9] text-sm pointer-events-none" />
        </div>

        {/* Emergency toggle */}
        <button type="button"
          onClick={() => { const n = update({ emergency: !filters.emergency }); onSearch(n); }}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
            filters.emergency
              ? 'bg-[#a15b4a] text-white border-[#a15b4a] hover:bg-[#8a4a3b]'
              : 'border-[#e5dcc8] bg-white text-[#6b7d79] hover:bg-[#f6e9e5] hover:border-[#e6c6bb] hover:text-[#a15b4a]'
          }`} title="Show only hospitals with emergency service">
          <FiAlertTriangle className="text-base" />
          <span className="hidden sm:inline">Emergency</span>
        </button>

        {/* Search button */}
        <button onClick={handleSearchButton} disabled={loading}
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#216d73] text-white text-sm font-semibold hover:bg-[#184f54] transition-colors disabled:opacity-60 shadow-sm">
          {loading
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <FiSearch />}
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>

      {/* ── Row 3: Services multi-select ────────────────── */}
      {allServices.length > 0 && (
        <div className="relative" ref={serviceMenuRef}>
          {/* trigger button */}
          <button
            type="button"
            onClick={() => setShowServiceMenu((v) => !v)}
            className={`w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm transition-colors ${
              selectedCount > 0
                ? 'border-[#216d73] bg-[#e7f3f0] text-[#1c3d3f]'
                : 'border-[#e5dcc8] bg-white text-[#6b7d79] hover:bg-[#faf6ee]'
            }`}
          >
            <MdMedicalServices className={`flex-shrink-0 text-base ${selectedCount > 0 ? 'text-[#216d73]' : 'text-[#aabfb9]'}`} />
            <span className="flex-1 text-left truncate">
              {selectedCount === 0
                ? 'Filter by services…'
                : selectedCount === 1
                  ? allServices.find((s) => s.id === filters.serviceIds[0])?.name ?? '1 service'
                  : `${selectedCount} services selected`}
            </span>
            {selectedCount > 0 && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); clearServices(); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); clearServices(); } }}
                className="flex-shrink-0 rounded-full bg-[#216d73] text-white w-5 h-5 flex items-center justify-center text-xs hover:bg-[#184f54]"
                aria-label="Clear service filters"
              >
                <FiX />
              </span>
            )}
            <FiChevronDown className={`flex-shrink-0 text-[#aabfb9] transition-transform ${showServiceMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* dropdown */}
          {showServiceMenu && (
            <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white border border-[#e5dcc8] rounded-xl shadow-lg overflow-hidden">
              {/* search inside dropdown */}
              <div className="p-2 border-b border-[#f0ebe0]">
                <div className="relative">
                  <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#aabfb9] text-xs pointer-events-none" />
                  <input
                    type="text"
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    placeholder="Search services…"
                    className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-[#e5dcc8] text-xs text-[#1c3d3f] placeholder:text-[#a3988a] focus:outline-none focus:ring-1 focus:ring-[#538b8c]/40"
                    autoFocus
                  />
                </div>
              </div>

              {/* service list */}
              <ul className="max-h-56 overflow-y-auto divide-y divide-[#f5f0e8]">
                {filteredServices.length === 0 ? (
                  <li className="px-4 py-3 text-xs text-gray-400 text-center">No services match</li>
                ) : (
                  filteredServices.map((service) => {
                    const checked = filters.serviceIds.includes(service.id);
                    return (
                      <li key={service.id}>
                        <button
                          type="button"
                          onClick={() => toggleService(service.id)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                            checked ? 'bg-[#eef3f2]' : 'hover:bg-[#faf6ee]'
                          }`}
                        >
                          {/* checkbox */}
                          <span className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            checked ? 'bg-[#216d73] border-[#216d73]' : 'border-[#c9bfa4] bg-white'
                          }`}>
                            {checked && <FiCheck className="text-white text-[10px]" />}
                          </span>
                          <span className="flex-1 truncate text-[#1c3d3f]">{service.name}</span>
                          {service.category && (
                            <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-[#f2ece0] text-[#8a7350] capitalize">
                              {service.category}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>

              {/* apply button */}
              <div className="p-2 border-t border-[#f0ebe0]">
                <button
                  type="button"
                  onClick={() => { setShowServiceMenu(false); onSearch(filters); }}
                  className="w-full py-2 rounded-xl bg-[#216d73] text-white text-sm font-semibold hover:bg-[#184f54] transition-colors"
                >
                  {selectedCount === 0 ? 'Show All Hospitals' : `Find Hospitals with ${selectedCount} Service${selectedCount > 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Selected service tags ────────────────────────── */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filters.serviceIds.map((id) => {
            const svc = allServices.find((s) => s.id === id);
            if (!svc) return null;
            return (
              <span key={id} className="inline-flex items-center gap-1 bg-[#e7f3f0] border border-[#bde0d8] text-[#0e6068] text-xs font-medium px-2.5 py-1 rounded-full">
                {svc.name}
                <button
                  type="button"
                  onClick={() => { const n = update({ serviceIds: filters.serviceIds.filter((s) => s !== id) }); onSearch(n); }}
                  className="ml-0.5 hover:text-[#0a4d54]"
                  aria-label={`Remove ${svc.name}`}
                >
                  <FiX className="text-[10px]" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
