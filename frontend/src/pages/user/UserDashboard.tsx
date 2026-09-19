import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiSearch, FiAlertTriangle, FiMap, FiList,
  FiActivity, FiClock, FiChevronRight, FiX,
} from 'react-icons/fi';
import { FaHospital } from 'react-icons/fa';
import { MdMedicalServices, MdLocalHospital } from 'react-icons/md';
import { FiMapPin } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { userPortalApi } from '../../lib/api';
import type { UserDashboardData, SearchSuggestion } from '../../types';
import { PatientRequestStatusBadge } from '../../components/user/PatientRequestStatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const QUICK_ACTIONS = [
  {
    label: 'Find Hospitals',
    desc: 'Search by treatment or service',
    icon: <FiSearch className="text-2xl" />,
    to: '/user/hospitals',
    color: 'bg-primary-700 text-white',
  },
  {
    label: 'Emergency Search',
    desc: 'Find emergency services now',
    icon: <FiAlertTriangle className="text-2xl" />,
    to: '/user/emergency',
    color: 'bg-red-600 text-white',
  },
  {
    label: 'Hospital Map',
    desc: 'View map with directions',
    icon: <FiMap className="text-2xl" />,
    to: '/user/map',
    color: 'bg-green-600 text-white',
  },
  {
    label: 'My Referrals',
    desc: 'Check request status',
    icon: <FiList className="text-2xl" />,
    to: '/user/referrals',
    color: 'bg-amber-600 text-white',
  },
];

function SuggestionIcon({ type }: { type: SearchSuggestion['type'] }) {
  switch (type) {
    case 'hospital':  return <FaHospital className="text-primary-600 flex-shrink-0" />;
    case 'service':   return <MdMedicalServices className="text-green-600 flex-shrink-0" />;
    case 'specialty': return <MdLocalHospital className="text-amber-600 flex-shrink-0" />;
    case 'district':  return <FiMapPin className="text-blue-300 flex-shrink-0" />;
    default:          return <FiSearch className="text-gray-400 flex-shrink-0" />;
  }
}

export const UserDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [data, setData] = useState<UserDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Suggestions state
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    userPortalApi.getDashboard()
      .then(res => setData(res.data))
      .catch(() => toast.error('Could not load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

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

  const doSearch = (q: string) => {
    const trimmed = q.trim();
    if (trimmed) {
      navigate(`/user/hospitals?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleSelect = (s: SearchSuggestion) => {
    setSearch(s.label);
    setSuggestions([]);
    setShowDropdown(false);
    doSearch(s.label);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) {
      if (e.key === 'Enter') doSearch(search);
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
        doSearch(search);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const displayName = data?.user?.full_name || user?.first_name || user?.username || 'User';

  return (
    <div className="h-full overflow-y-auto">
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 pb-24 md:pb-6">
      {/* Welcome banner with search */}
      <div className="bg-gradient-to-br from-primary-700 to-primary-800 rounded-2xl p-6 text-white shadow">
        <h1 className="text-2xl font-bold">Welcome, {displayName}! 👋</h1>
        <p className="text-primary-200 mt-1 text-sm">Find the right healthcare facility for your needs.</p>

        {/* Search bar with suggestions */}
        <div className="mt-4 flex gap-2">
          <div className="relative flex-1" ref={containerRef}>
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); fetchSuggestions(e.target.value); }}
              onKeyDown={handleKey}
              onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
              placeholder="Search treatment, service, doctor specialty…"
              className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-white text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40"
              autoComplete="off"
              aria-autocomplete="list"
              aria-expanded={showDropdown}
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setSuggestions([]); setShowDropdown(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                aria-label="Clear"
              >
                <FiX className="text-sm" />
              </button>
            )}

            {/* Suggestions dropdown */}
            {showDropdown && suggestions.length > 0 && (
              <ul
                role="listbox"
                className="absolute z-50 w-full top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
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
                      {s.subtitle && <span className="text-xs text-gray-400">{s.subtitle}</span>}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                      s.type === 'hospital'  ? 'bg-primary-100 text-primary-700' :
                      s.type === 'service'   ? 'bg-green-100 text-green-700' :
                      s.type === 'specialty' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {s.type.charAt(0).toUpperCase() + s.type.slice(1)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            onClick={() => doSearch(search)}
            className="px-5 py-2.5 rounded-xl bg-white text-primary-700 font-semibold text-sm hover:bg-primary-50 transition-colors flex-shrink-0"
          >
            Search
          </button>
        </div>
      </div>

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-[#ede0ce] p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-primary-700">{data.stats.total_requests}</p>
            <p className="text-xs text-gray-500 mt-1">Total Requests</p>
          </div>
          <div className="bg-white rounded-xl border border-[#ede0ce] p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-amber-600">{data.stats.pending_requests}</p>
            <p className="text-xs text-gray-500 mt-1">Pending</p>
          </div>
          <div className="bg-white rounded-xl border border-[#ede0ce] p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-green-600">{data.stats.active_requests}</p>
            <p className="text-xs text-gray-500 mt-1">Active</p>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-[#8a7a63] uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map(action => (
            <Link
              key={action.to}
              to={action.to}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl shadow-sm transition-transform hover:scale-105 ${action.color}`}
            >
              {action.icon}
              <span className="font-semibold text-sm text-center leading-tight">{action.label}</span>
              <span className="text-xs opacity-75 text-center leading-tight">{action.desc}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent requests */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#8a7a63] uppercase tracking-wide">Recent Requests</h2>
          <Link to="/user/referrals" className="text-xs text-primary-700 font-medium flex items-center gap-1 hover:underline">
            View All <FiChevronRight />
          </Link>
        </div>

        {!data?.recent_requests?.length ? (
          <div className="bg-white rounded-xl border border-[#ede0ce] p-8 text-center shadow-sm">
            <FaHospital className="text-4xl text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No requests yet.</p>
            <Link to="/user/hospitals" className="mt-3 inline-block text-xs text-primary-700 font-medium hover:underline">
              Find a Hospital →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {data.recent_requests.map(req => (
              <Link
                key={req.id}
                to={`/user/referrals/${req.id}`}
                className="flex items-center gap-3 bg-white rounded-xl border border-[#ede0ce] p-3.5 hover:border-primary-200 hover:shadow-sm transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-[#172554] truncate">
                      {req['destination_hospital__name']}
                    </span>
                    <PatientRequestStatusBadge status={req.status} size="sm" />
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    <FiActivity className="flex-shrink-0" />
                    <span className="truncate">{req['service__name'] || 'General Assistance'}</span>
                    <FiClock className="flex-shrink-0 ml-2" />
                    <span>{new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <FiChevronRight className="text-gray-300 flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
};
