import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiSearch, FiEdit2, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { hospitalsApi } from '../../lib/api';
import type { HospitalListItem } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title m-0">Hospital Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all registered healthcare facilities</p>
        </div>
        <Link to="/admin/hospitals/new" className="btn-primary">
          <FiPlus /> Add Hospital
        </Link>
      </div>

      <div className="card mb-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search by hospital name or district…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? <LoadingSpinner text="Loading hospitals…" /> : (
        <div className="card p-0">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Hospital</th>
                  <th className="hidden sm:table-cell">Type</th>
                  <th className="hidden md:table-cell">District</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-500">No hospitals found.</td></tr>
                ) : filtered.map((h) => (
                  <tr key={h.id}>
                    <td>
                      <div className="font-medium text-gray-900">{h.name}</div>
                      <div className="text-xs text-gray-500 sm:hidden">{h.type_display} · {h.district}</div>
                    </td>
                    <td className="hidden sm:table-cell text-gray-600 capitalize">{h.type_display || h.type}</td>
                    <td className="hidden md:table-cell text-gray-600">{h.district}</td>
                    <td>
                      <button
                        onClick={() => handleToggle(h)}
                        disabled={toggling === h.id}
                        className="p-1 rounded transition-colors"
                        title={h.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {h.is_active
                          ? <FiToggleRight className="text-2xl text-green-600" />
                          : <FiToggleLeft className="text-2xl text-gray-400" />}
                      </button>
                    </td>
                    <td>
                      <Link
                        to={`/admin/hospitals/${h.id}/edit`}
                        className="btn-secondary btn-sm text-xs"
                      >
                        <FiEdit2 /> Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-500">
            Showing {filtered.length} of {hospitals.length} hospitals
          </div>
        </div>
      )}
    </div>
  );
};
