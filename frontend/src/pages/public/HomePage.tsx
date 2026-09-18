import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiMapPin, FiArrowRight, FiClock, FiCheckCircle } from 'react-icons/fi';
import { GiHeartPlus } from 'react-icons/gi';
import { servicesApi, hospitalsApi } from '../../lib/api';
import type { Service } from '../../types';

const COMMON_SERVICES = [
  'ICU', 'NICU', 'CT Scan', 'MRI', 'Dialysis',
  'Cardiology', 'Maternity', 'Blood Bank', 'Emergency Surgery', 'Orthopedics',
];

const NEPAL_DISTRICTS = [
  'Kathmandu', 'Lalitpur', 'Bhaktapur', 'Chitwan', 'Pokhara',
  'Biratnagar', 'Butwal', 'Dharan', 'Hetauda', 'Nepalgunj',
];

export const HomePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [district, setDistrict] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [stats, setStats] = useState({ hospitals: 0, services: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    servicesApi.list({ page_size: '100' }).then((res) => setServices(res.data.results)).catch(() => {});
    hospitalsApi.list({ page_size: '1' }).then((res) => setStats(s => ({ ...s, hospitals: res.data.count }))).catch(() => {});
    servicesApi.list({ page_size: '1' }).then((res) => setStats(s => ({ ...s, services: res.data.count }))).catch(() => {});
  }, []);

  useEffect(() => {
    if (searchTerm.length > 0) {
      const allNames = [
        ...COMMON_SERVICES,
        ...services.map((s) => s.name),
      ];
      const filtered = [...new Set(allNames)].filter((s) =>
        s.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 8));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [searchTerm, services]);

  const handleSearch = (term?: string) => {
    const q = term || searchTerm;
    if (q.trim()) {
      const params = new URLSearchParams({ service: q });
      if (district) params.set('district', district);
      navigate(`/search?${params.toString()}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-800 via-primary-700 to-teal-600 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <GiHeartPlus className="text-4xl text-teal-300" />
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">UpacharKhoj Nepal</h1>
            </div>
            <p className="text-lg sm:text-xl text-primary-100 mt-3 max-w-2xl mx-auto">
              Find the right hospital <strong>before you travel.</strong>
              Search by service, check live availability, confirm referrals.
            </p>
          </div>

          {/* Search Box */}
          <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 max-w-2xl mx-auto">
            <div className="relative mb-3">
              <label htmlFor="service-search" className="label text-gray-700">
                What service or treatment do you need?
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <input
                  id="service-search"
                  type="text"
                  className="input pl-10 text-gray-900 text-base py-3"
                  placeholder="ICU, MRI, Dialysis, Cardiology…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => searchTerm && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  autoComplete="off"
                />
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  {suggestions.map((s) => (
                    <li key={s}>
                      <button
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                        onMouseDown={() => { setSearchTerm(s); handleSearch(s); }}
                      >
                        <FiSearch className="inline mr-2 text-gray-400" />
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="district-select" className="label text-gray-700">
                District (optional)
              </label>
              <div className="relative">
                <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  id="district-select"
                  className="input pl-10 text-gray-700"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                >
                  <option value="">All districts</option>
                  {NEPAL_DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => handleSearch()}
              className="w-full btn-primary btn-lg justify-center"
              disabled={!searchTerm.trim()}
            >
              <FiSearch />
              Search Hospitals
            </button>

            {/* Quick service buttons */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Common searches:</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_SERVICES.slice(0, 6).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSearchTerm(s); handleSearch(s); }}
                    className="text-xs px-3 py-1 bg-primary-50 text-primary-700 rounded-full hover:bg-primary-100 transition-colors border border-primary-200"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      {(stats.hospitals > 0 || stats.services > 0) && (
        <section className="bg-primary-900 text-white py-8">
          <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-teal-300">{stats.hospitals}+</div>
              <div className="text-sm text-primary-200 mt-1">Hospitals</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-teal-300">{stats.services}+</div>
              <div className="text-sm text-primary-200 mt-1">Services</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-teal-300">Live</div>
              <div className="text-sm text-primary-200 mt-1">Availability</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-teal-300">Free</div>
              <div className="text-sm text-primary-200 mt-1">To Use</div>
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-12">
            How UpacharKhoj Works
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                icon: <FiSearch className="text-3xl text-primary-600" />,
                step: '1',
                title: 'Search by Service',
                desc: 'Enter what you need — ICU, MRI, Dialysis, Surgery. Not just the hospital name.',
              },
              {
                icon: <FiCheckCircle className="text-3xl text-green-500" />,
                step: '2',
                title: 'Check Live Availability',
                desc: 'See hospital-reported availability with freshness timestamps. Know before you go.',
              },
              {
                icon: <FiArrowRight className="text-3xl text-teal-600" />,
                step: '3',
                title: 'Confirm & Transfer',
                desc: 'Health workers send a referral. Receiving hospital accepts before the patient travels.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center p-6">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-primary-400 mb-1">STEP {item.step}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Freshness guide */}
      <section className="py-12 bg-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl font-bold text-center text-gray-900 mb-8">
            Understanding Data Freshness
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { color: 'bg-green-100 border-green-300', dot: 'bg-green-500', label: 'Current', time: '< 30 min', desc: 'Freshly updated' },
              { color: 'bg-blue-100 border-blue-300', dot: 'bg-blue-500', label: 'Recent', time: '30 min – 2 hr', desc: 'Likely reliable' },
              { color: 'bg-yellow-100 border-yellow-300', dot: 'bg-yellow-500', label: 'Old', time: '2 – 6 hr', desc: 'Verify first' },
              { color: 'bg-red-100 border-red-300', dot: 'bg-red-500', label: 'Stale', time: '> 6 hr', desc: 'Confirm directly' },
            ].map((f) => (
              <div key={f.label} className={`border rounded-xl p-4 text-center ${f.color}`}>
                <span className={`inline-block w-3 h-3 rounded-full ${f.dot} mb-2`} />
                <div className="font-semibold text-gray-800 text-sm">{f.label}</div>
                <div className="text-xs text-gray-600 mt-1">{f.time}</div>
                <div className="text-xs text-gray-500 mt-1">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA for health workers */}
      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-r from-primary-50 to-teal-50 border border-primary-100 rounded-2xl p-8">
            <FiClock className="text-4xl text-primary-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-3">Are you a Health Worker?</h2>
            <p className="text-gray-600 mb-6">
              Log in to send referral requests, track responses, and coordinate patient transfers before travel.
            </p>
            <a href="/login" className="btn-primary btn-lg">
              Sign In to Refer Patients
              <FiArrowRight />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
