import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FiSearch, FiMapPin, FiAlertTriangle, FiX } from 'react-icons/fi';
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
  onSearch: () => void;
  loading?: boolean;
}

function SuggestionIcon({ type }: { type: SearchSuggestion['type'] }) {
  switch (type) {
    case 'hospital':   return <FaHospital className="text-primary-600 flex-shrink-0" />;
    case 'service':    return <MdMedicalServices className="text-green-600 flex-shrink-0" />;
    case 'specialty':  return <MdLocalHospital className="text-amber-600 flex-shrink-0" />;
    case 'district':   return <FiMapPin className="text-blue-500 flex-shrink-0" />;
    default:           return <FiSearch className="text-gray-400 flex-shrink-0" />;
  }
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

export const SearchFilters: React.FC<Props> = ({ filters, onChange, onSearch, loading }) => {
  const set = (partial: Partial<SearchFiltersState>) =>
    onChange({ ...filters, ...partial });

  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
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
    set({ q: val });
    fetchSuggestions(val);
  };

  const handleSelect = (suggestion: SearchSuggestion) => {
    set({ q: suggestion.label });
    setSuggestions([]);
    setShowDropdown(false);
    // Trigger search after state update
    setTimeout(() => onSearch(), 0);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) {
      if (e.key === 'Enter') onSearch();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        handleSelect(suggestions[activeIdx]);
      } else {
        setShowDropdown(false);
        onSearch();
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  // Close on outside click
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
    <div className="bg-white rounded-2xl border border-[#ede0ce] shadow-sm p-4 flex flex-col gap-3">
      {/* Search input with suggestions dropdown */}
      <div className="relative" ref={containerRef}>
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg z-10" />
        <input
          type="text"
          value={filters.q}
          onChange={handleInputChange}
          onKeyDown={handleKey}
          onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
          placeholder="Search treatment, service, doctor specialty, hospital name…"
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#ede0ce] bg-[#faf6ee] text-sm text-[#172554] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-300"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
        />
        {filters.q && (
          <button
            onClick={() => { set({ q: '' }); setSuggestions([]); setShowDropdown(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
            aria-label="Clear search"
          >
            <FiX />
          </button>
        )}

        {/* Suggestions dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <ul
            role="listbox"
            className="absolute z-50 w-full top-full mt-1 bg-white border border-[#ede0ce] rounded-xl shadow-lg overflow-hidden"
          >
            {suggestions.map((s, idx) => (
              <li
                key={`${s.type}-${s.label}`}
                role="option"
                aria-selected={idx === activeIdx}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
                onMouseEnter={() => setActiveIdx(idx)}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                  idx === activeIdx ? 'bg-primary-50 text-primary-800' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <SuggestionIcon type={s.type} />
                <span className="flex-1 min-w-0">
                  <span className="font-medium truncate block">{s.label}</span>
                  {s.subtitle && (
                    <span className="text-xs text-gray-400">{s.subtitle}</span>
                  )}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                  s.type === 'hospital'  ? 'bg-primary-100 text-primary-700' :
                  s.type === 'service'   ? 'bg-green-100 text-green-700' :
                  s.type === 'specialty' ? 'bg-amber-100 text-amber-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {typeLabel(s.type)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        {/* District */}
        <div className="relative flex-1">
          <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={filters.district}
            onChange={e => set({ district: e.target.value })}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#ede0ce] bg-[#faf6ee] text-sm text-[#172554] focus:outline-none focus:ring-2 focus:ring-primary-300 appearance-none"
          >
            <option value="">All Districts</option>
            {NEPAL_DISTRICTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Emergency toggle */}
        <button
          type="button"
          onClick={() => set({ emergency: !filters.emergency })}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
            filters.emergency
              ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
              : 'border-[#ede0ce] bg-[#faf6ee] text-[#8a7a63] hover:bg-red-50 hover:border-red-200 hover:text-red-600'
          }`}
        >
          <FiAlertTriangle />
          Emergency
        </button>

        {/* Search button */}
        <button
          onClick={onSearch}
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-primary-700 text-white text-sm font-semibold hover:bg-primary-800 transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <FiSearch />
          )}
          Search
        </button>
      </div>
    </div>
  );
};
