import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FiSearch, FiMapPin, FiAlertTriangle, FiX, FiChevronDown } from 'react-icons/fi';
import { FaHospital } from 'react-icons/fa';
import { MdMedicalServices, MdLocalHospital } from 'react-icons/md';
import { userPortalApi } from '../../lib/api';
import type { SearchSuggestion } from '../../types';

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

export interface SearchFiltersState {
  q: string;
  district: string;
  emergency: boolean;
}

interface Props {
  filters: SearchFiltersState;
  onChange: (filters: SearchFiltersState) => void;
  /** Called with the current filters when user triggers a search. */
  onSearch: (filters: SearchFiltersState) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  loading?: boolean;
}

// Suggestion "kind" badges share one teal/tan tint system instead of a
// different hue per type, so the search dropdown doesn't compete visually
// with the rest of the app. Icons still differ so kinds stay scannable.
const suggestionStyle: Record<SearchSuggestion['type'], { icon: React.ReactNode; badge: string }> = {
  hospital:  { icon: <FaHospital />,          badge: 'bg-[#eef3f2] text-[#216d73]' },
  service:   { icon: <MdMedicalServices />,   badge: 'bg-[#eef3f2] text-[#538b8c]' },
  specialty: { icon: <MdLocalHospital />,     badge: 'bg-[#f2ece0] text-[#8a7350]' },
  district:  { icon: <FiMapPin />,            badge: 'bg-[#eef1f0] text-[#6b7d79]' },
};

function SuggestionIcon({ type }: { type: SearchSuggestion['type'] }) {
  return <span className="flex-shrink-0 text-[#aabfb9]">{suggestionStyle[type]?.icon ?? <FiSearch />}</span>;
}

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

export const SearchFilters: React.FC<Props> = ({
  filters,
  onChange,
  onSearch,
  onSuggestionSelect,
  loading,
}) => {
  /** Merge partial updates into current filters and notify parent. */
  const update = (partial: Partial<SearchFiltersState>) => {
    const next = { ...filters, ...partial };
    onChange(next);
    return next; // return so callers can forward immediately
  };

  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setSuggestions([]); setShowDropdown(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await userPortalApi.getSearchSuggestions(q);
        setSuggestions(res.data.suggestions);
        setShowDropdown(res.data.suggestions.length > 0);
        setActiveIdx(-1);
      } catch {
        setSuggestions([]);
        setShowDropdown(false);
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
    setSuggestions([]);
    setShowDropdown(false);
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    } else {
      onSearch(next);
    }
  };

  const handleSearchButton = () => {
    setShowDropdown(false);
    onSearch(filters); // filters is always the latest prop value
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) {
      if (e.key === 'Enter') { e.preventDefault(); handleSearchButton(); }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        handleSelect(suggestions[activeIdx]);
      } else {
        setShowDropdown(false);
        handleSearchButton();
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    /*
     * No outer card/border/padding here — the parent sidebar section already
     * provides its own padding. This component is just the controls.
     */
    <div className="flex flex-col gap-2">

      {/* ── Search input ─────────────────────────────────── */}
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
          <button
            onClick={() => {
              const next = update({ q: '' });
              setSuggestions([]);
              setShowDropdown(false);
              onSearch(next); // clear → re-run search with empty q
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aabfb9] hover:text-[#538b8c] z-10"
            aria-label="Clear search"
            tabIndex={-1}
          >
            <FiX />
          </button>
        )}

        {/* ── Suggestions dropdown ─────────────────────── */}
        {showDropdown && suggestions.length > 0 && (
          <ul
            role="listbox"
            className="absolute z-50 w-full top-full mt-1.5 bg-white border border-[#e5dcc8] rounded-xl shadow-lg overflow-hidden"
          >
            {suggestions.map((s, idx) => (
              <li
                key={`${s.type}-${s.label}`}
                role="option"
                aria-selected={idx === activeIdx}
                onMouseDown={e => { e.preventDefault(); handleSelect(s); }}
                onMouseEnter={() => setActiveIdx(idx)}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                  idx === activeIdx
                    ? 'bg-[#eef3f2] text-[#1c3d3f]'
                    : 'text-[#1c3d3f] hover:bg-[#faf6ee]'
                }`}
              >
                <SuggestionIcon type={s.type} />
                <span className="flex-1 min-w-0">
                  <span className="font-medium truncate block">{s.label}</span>
                  {s.subtitle && (
                    <span className="text-xs text-[#a3988a]">{s.subtitle}</span>
                  )}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${suggestionStyle[s.type]?.badge ?? 'bg-[#eef1f0] text-[#6b7d79]'}`}>
                  {typeLabel(s.type)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Row 2: district + emergency + search button ─── */}
      <div className="flex gap-2">
        {/* District picker */}
        <div className="relative flex-1 min-w-0">
          <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aabfb9] text-sm pointer-events-none z-10" />
          <select
            value={filters.district}
            onChange={e => {
              const next = update({ district: e.target.value });
              onSearch(next); // auto-search on district change
            }}
            className={`${fieldClass} pl-9 pr-8 py-2.5 appearance-none cursor-pointer`}
          >
            <option value="">All Districts</option>
            {NEPAL_DISTRICTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#aabfb9] text-sm pointer-events-none" />
        </div>

        {/* Emergency toggle */}
        <button
          type="button"
          onClick={() => {
            const next = update({ emergency: !filters.emergency });
            onSearch(next); // auto-search on toggle
          }}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
            filters.emergency
              ? 'bg-[#a15b4a] text-white border-[#a15b4a] hover:bg-[#8a4a3b]'
              : 'border-[#e5dcc8] bg-white text-[#6b7d79] hover:bg-[#f6e9e5] hover:border-[#e6c6bb] hover:text-[#a15b4a]'
          }`}
          title="Show only hospitals with emergency service"
        >
          <FiAlertTriangle className="text-base" />
          <span className="hidden sm:inline">Emergency</span>
        </button>

        {/* Search button */}
        <button
          onClick={handleSearchButton}
          disabled={loading}
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#216d73] text-white text-sm font-semibold hover:bg-[#184f54] transition-colors disabled:opacity-60 shadow-sm"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <FiSearch />
          )}
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>
    </div>
  );
};