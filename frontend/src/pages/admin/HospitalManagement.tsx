import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiSearch, FiEdit2, FiHome, FiMapPin } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { hospitalsApi } from '../../lib/api';
import type { HospitalListItem } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const VerificationBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    verified: 'bg-[#eef3f2] text-[#216d73]',
    pending: 'bg-[#f2ece0] text-[#8a7350]',
    rejected: 'bg-[#f6e9e5] text-[#a15b4a]',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${map[status] ?? 'bg-[#eef1f0] text-[#6b7d79]'}`}>
      {status}
    </span>
  );
};

// Custom switch instead of the default open-source toggle icon, so it reads
// as this product's control rather than a generic icon-library pick.
const StatusSwitch: React.FC<{ active: boolean; disabled: boolean; onClick: () => void }> = ({ active, disabled, onClick }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-pressed={active}
    aria-label={active ? 'Deactivate hospital' : 'Activate hospital'}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-150 disabled:opacity-50 ${
      active ? 'bg-[#216d73]' : 'bg-[#d8ded9]'
    }`}
  >
    <span
      className={`inline-block h-4.5 w-4.5 h-[18px] w-[18px] transform rounded-full bg-white shadow-sm transition-transform duration-150 ${
        active ? 'translate-x-[22px]' : 'translate-x-[3px]'
      }`}
    />
  </button>
);

export const HospitalManagement: React.FC = () => {
  const [hospitals, setHospitals] = useState<HospitalListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    hospitalsApi.list({ page_size: 100 })
      .then((r) => setHospitals(r.data.results))
      .catch(() => toast.error('Failed to load hospitals'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (hospital: HospitalListItem) => {
    setToggling(hospital.id);
    try {
      await hospitalsApi.update(hospital.id, { is_active: !hospital.is_active });
      toast.success(`Hospital ${hospital.is_active ? 'deactivated' : 'activated'}`);
      setHospitals((prev) => prev.map((h) => h.id === hospital.id ? { ...h, is_active: !h.is_active } : h));
    } catch {
      toast.error('Failed to update hospital');
    } finally {
      setToggling(null);
    }
  };

  const filtered = hospitals.filter((h) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return h.name.toLowerCase().includes(q) || h.district.toLowerCase().includes(q);
  });

  return (
    <div className="bg-[#faedd7] -m-4 md:-m-6 p-4 md:p-6 min-h-full">
      <div className="flex items-start sm:items-center justify-between gap-4 mb-6 flex-col sm:flex-row">
        <div>
          <h1 className="text-2xl font-semibold text-[#1c3d3f] m-0">Hospital Management</h1>
          <p className="text-sm text-[#6b7d79] mt-1">Manage all registered healthcare facilities</p>
        </div>
        <Link
          to="/admin/hospitals/new"
          className="inline-flex items-center gap-2 bg-[#216d73] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#184f54] transition-colors shadow-sm"
        >
          <FiPlus /> Add Hospital
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4 mb-4 flex-col sm:flex-row">
        <div className="relative w-full sm:max-w-sm">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#aabfb9]" />
          <input
            type="text"
            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-[#e5dcc8] bg-white text-sm text-[#1c3d3f] placeholder:text-[#a3988a] focus:outline-none focus:ring-2 focus:ring-[#538b8c]/40 focus:border-[#538b8c]"
            placeholder="Search by hospital name or district…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-xs text-[#8a8078] whitespace-nowrap">
          {filtered.length} of {hospitals.length} hospitals
        </span>
      </div>

      {loading ? <LoadingSpinner text="Loading hospitals…" /> : (
        <div className="bg-white border border-[#e5dcc8] rounded-xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-12 h-12 rounded-full bg-[#eef3f2] flex items-center justify-center mb-3">
                <FiHome className="text-xl text-[#538b8c]" />
              </div>
              <p className="text-sm font-medium text-[#1c3d3f]">No hospitals found</p>
              <p className="text-xs text-[#8a8078] mt-1">Try a different name or district.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e5dcc8] bg-[#faf6ee]">
                      <th className="text-left font-medium text-[#6b7d79] px-4 py-3">Hospital</th>
                      <th className="text-left font-medium text-[#6b7d79] px-4 py-3 hidden md:table-cell">Type</th>
                      <th className="text-left font-medium text-[#6b7d79] px-4 py-3">District</th>
                      <th className="text-left font-medium text-[#6b7d79] px-4 py-3">Verification</th>
                      <th className="text-left font-medium text-[#6b7d79] px-4 py-3">Active</th>
                      <th className="text-right font-medium text-[#6b7d79] px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f2ece0]">
                    {filtered.map((h) => (
                      <tr key={h.id} className="hover:bg-[#faedd7]/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-[#1c3d3f]">{h.name}</div>
                        </td>
                        <td className="px-4 py-3 text-[#6b7d79] capitalize hidden md:table-cell">{h.type_display || h.type}</td>
                        <td className="px-4 py-3 text-[#6b7d79]">{h.district}</td>
                        <td className="px-4 py-3"><VerificationBadge status={h.verification_status} /></td>
                        <td className="px-4 py-3">
                          <StatusSwitch active={h.is_active} disabled={toggling === h.id} onClick={() => handleToggle(h)} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/admin/hospitals/${h.id}/edit`}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#216d73] hover:text-[#184f54] border border-[#e5dcc8] hover:border-[#aabfb9] rounded-lg px-2.5 py-1.5 transition-colors"
                          >
                            <FiEdit2 className="text-[11px]" /> Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-[#f2ece0]">
                {filtered.map((h) => (
                  <div key={h.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-[#1c3d3f] truncate">{h.name}</div>
                        <div className="flex items-center gap-1 text-xs text-[#8a8078] mt-0.5">
                          <FiMapPin className="text-[11px]" /> {h.district} · {h.type_display || h.type}
                        </div>
                      </div>
                      <StatusSwitch active={h.is_active} disabled={toggling === h.id} onClick={() => handleToggle(h)} />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <VerificationBadge status={h.verification_status} />
                      <Link
                        to={`/admin/hospitals/${h.id}/edit`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#216d73] border border-[#e5dcc8] rounded-lg px-2.5 py-1.5"
                      >
                        <FiEdit2 className="text-[11px]" /> Edit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};