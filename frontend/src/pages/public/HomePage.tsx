import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiAlertCircle, FiMapPin, FiActivity } from 'react-icons/fi';
import { GiHeartPlus } from 'react-icons/gi';
import { servicesApi, hospitalsApi } from '../../lib/api';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [stats, setStats] = useState({ hospitals: 0, services: 0 });

  useEffect(() => {
    servicesApi.list({ page_size: '1' }).then((res) => setStats((s) => ({ ...s, services: res.data.count }))).catch(() => {});
    hospitalsApi.list({ page_size: '1' }).then((res) => setStats((s) => ({ ...s, hospitals: res.data.count }))).catch(() => {});
  }, []);

  const handleSearch = (emergency = false) => {
    const params = new URLSearchParams();
    if (searchInput.trim()) params.set('service', searchInput.trim());
    if (emergency) params.set('emergency', 'true');
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-700 to-teal-600 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <GiHeartPlus className="text-6xl opacity-90" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            Find the Right Hospital, Right Now
          </h1>
          <p className="text-lg opacity-85 mb-10 max-w-xl mx-auto">
            Real-time hospital availability across Nepal. Search by service, location, or find emergency care instantly.
          </p>

          {/* Search bar */}
          <div className="bg-white rounded-2xl shadow-xl p-4 max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  placeholder="Search: ICU, MRI, Dialysis, Cardiology…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSearch(false)}
                  className="flex-1 sm:flex-none px-5 py-3 bg-primary-700 hover:bg-primary-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                >
                  <FiSearch /> Search
                </button>
                <button
                  onClick={() => handleSearch(true)}
                  className="flex-1 sm:flex-none px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                >
                  <FiAlertCircle /> Emergency
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100 py-8 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-primary-700">{stats.hospitals}+</div>
            <div className="text-sm text-gray-500 mt-1">Hospitals Listed</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-700">{stats.services}+</div>
            <div className="text-sm text-gray-500 mt-1">Medical Services</div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <div className="text-3xl font-bold text-primary-700">Live</div>
            <div className="text-sm text-gray-500 mt-1">Real-time Availability</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">How it works</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: <FiSearch className="text-primary-600 text-2xl" />, title: 'Search by Service', desc: 'Find hospitals that have ICU, MRI, CT Scan, Dialysis, or any other service available right now.' },
            { icon: <FiActivity className="text-green-600 text-2xl" />, title: 'Real-time Availability', desc: 'Hospital staff update bed counts and service availability so you always see the latest status.' },
            { icon: <FiMapPin className="text-red-600 text-2xl" />, title: 'Find Nearby', desc: 'Filter by district to find the closest hospital with the care your patient needs.' },
          ].map((f) => (
            <div key={f.title} className="card text-center">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link to="/search" className="btn-primary btn-lg">
            <FiSearch /> Search Hospitals Now
          </Link>
        </div>
      </section>
    </div>
  );
};
