
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiToggleRight,
  FiToggleLeft,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

import { hospitalsApi } from '../../lib/api';
import type { HospitalListItem } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const HospitalManagement: React.FC = () => {
  const [hospitals, setHospitals] = useState<HospitalListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState<number | null>(null);

  // Fetch hospitals from the API
  const load = () => {
    setLoading(true);

    hospitalsApi
      .list({ page_size: 100 })
      .then((response) => {
        setHospitals(response.data.results);
      })
      .catch(() => {
        toast.error('Failed to load hospitals');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  // Activate or deactivate a hospital
  const handleToggle = async (hospital: HospitalListItem) => {
    setToggling(hospital.id);

    try {
      const response = await hospitalsApi.toggleActive(hospital.id);

      const newActiveState = response.data.is_active;

      toast.success(
        newActiveState
          ? `✓ ${hospital.name} is now active`
          : `${hospital.name} has been deactivated`
      );

      setHospitals((prev) =>
        prev.map((h) =>
          h.id === hospital.id
            ? { ...h, is_active: newActiveState }
            : h
        )
      );
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { detail?: string; error?: string } } };
      const detail =
        axiosErr?.response?.data?.detail ||
        axiosErr?.response?.data?.error;

      if (axiosErr?.response?.status === 403) {
        toast.error('Permission denied. System admin access required.');
      } else if (detail) {
        toast.error(`Failed: ${detail}`);
      } else {
        toast.error('Failed to update hospital status. Please try again.');
      }
    } finally {
      setToggling(null);
    }
  };

  const filtered = hospitals.filter((h) => {
    if (!search) return true;
    const q = search.toLowerCase();

    return (
      h.name.toLowerCase().includes(q) ||
      h.district.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-[#faedd7] -m-4 md:-m-6 p-4 md:p-6 min-h-full">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-4 mb-6 flex-col sm:flex-row">

        <div>
          <h1 className="text-2xl font-semibold text-[#1c3d3f] m-0">
            Hospital Management
          </h1>
          <p className="text-sm text-[#6b7d79] mt-1">
            Manage all registered healthcare facilities
          </p>
        </div>

        <Link
          to="/admin/hospitals/new"
          className="inline-flex items-center gap-2 bg-[#216d73] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#184f54] transition-colors shadow-sm"
        >
          <FiPlus />
          Add Hospital
        </Link>

      </div>

      {/* Search + count */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-col sm:flex-row">

        <div className="relative w-full sm:max-w-sm">

          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#aabfb9]" />

          <input
            type="text"
            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-[#e5dcc8] bg-white text-sm text-[#1c3d3f] placeholder:text-[#a3988a] focus:outline-none focus:ring-2 focus:ring-[#538b8c]/40 focus:border-[#538b8c]"
            placeholder="Search by hospital name or district..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

        </div>

        <span className="text-xs text-[#8a8078] whitespace-nowrap">
          {filtered.length} of {hospitals.length} hospitals
        </span>

      </div>

      {loading ? (
        <LoadingSpinner text="Loading hospitals…" />
      ) : (
        <div className="card p-0">

          <div className="table-container">

            <table className="table">

              {/* Table header */}
              <thead>
                <tr>
                  <th>Hospital</th>

                  <th className="hidden sm:table-cell">
                    Type
                  </th>

                  <th className="hidden md:table-cell">
                    District
                  </th>

                  <th>Active</th>

                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-8 text-gray-500"
                    >
                      No hospitals found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((h) => (
                    <tr key={h.id}>
                      <td>
                        <div className="font-medium text-gray-900">
                          {h.name}
                        </div>
                        <div className="text-xs text-gray-500 sm:hidden">
                          {h.type_display} · {h.district}
                        </div>
                      </td>

                      <td className="hidden sm:table-cell text-gray-600 capitalize">
                        {h.type_display || h.type}
                      </td>

                      <td className="hidden md:table-cell text-gray-600">
                        {h.district}
                      </td>

                      <td>
                        <button
                          onClick={() => handleToggle(h)}
                          disabled={toggling === h.id}
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-opacity ${
                            toggling === h.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'
                          } ${
                            h.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                          title={h.is_active ? 'Click to deactivate' : 'Click to activate'}
                        >
                          {toggling === h.id ? (
                            <>
                              <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                              </svg>
                              Saving…
                            </>
                          ) : h.is_active ? (
                            <>
                              <FiToggleRight className="text-base" />
                              Active
                            </>
                          ) : (
                            <>
                              <FiToggleLeft className="text-base" />
                              Inactive
                            </>
                          )}
                        </button>
                      </td>

                      <td>
                        <Link
                          to={`/admin/hospitals/${h.id}/edit`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#216d73] border border-[#e5dcc8] rounded-lg px-2.5 py-1.5"
                        >
                          <FiEdit2 className="text-[11px]" /> Edit
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
