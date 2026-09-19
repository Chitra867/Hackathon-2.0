
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

  // Load hospitals when the component mounts
  useEffect(() => {
    load();
  }, []);

  // Activate or deactivate a hospital
  const handleToggle = async (hospital: HospitalListItem) => {
    setToggling(hospital.id);

    try {
      await hospitalsApi.update(hospital.id, {
        is_active: !hospital.is_active,
      });

      toast.success(
        `Hospital ${
          hospital.is_active ? 'deactivated' : 'activated'
        } successfully`
      );

      setHospitals((prev) =>
        prev.map((h) =>
          h.id === hospital.id
            ? {
                ...h,
                is_active: !h.is_active,
              }
            : h
        )
      );
    } catch {
      toast.error('Failed to update hospital');
    } finally {
      setToggling(null);
    }
  };

  // Filter hospitals by name or district
  const filtered = hospitals.filter((hospital) => {
    if (!search.trim()) {
      return true;
    }

    const query = search.toLowerCase().trim();

    return (
      hospital.name.toLowerCase().includes(query) ||
      hospital.district.toLowerCase().includes(query)
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

      {/* Search and hospital count */}
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

      {/* Loading state or hospital table */}
      {loading ? (
        <LoadingSpinner text="Loading hospitals..." />
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

              {/* Table body */}
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

                  filtered.map((hospital) => (

                    <tr key={hospital.id}>

                      {/* Hospital name */}
                      <td>

                        <div className="font-medium text-gray-900">
                          {hospital.name}
                        </div>

                        <div className="text-xs text-gray-500 sm:hidden">
                          {hospital.type_display || hospital.type}
                          {' · '}
                          {hospital.district}
                        </div>

                      </td>

                      {/* Hospital type */}
                      <td className="hidden sm:table-cell text-gray-600 capitalize">
                        {hospital.type_display || hospital.type}
                      </td>

                      {/* District */}
                      <td className="hidden md:table-cell text-gray-600">
                        {hospital.district}
                      </td>

                      {/* Active/inactive toggle */}
                      <td>

                        <button
                          type="button"
                          onClick={() => handleToggle(hospital)}
                          disabled={toggling === hospital.id}
                          className="p-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={
                            hospital.is_active
                              ? 'Deactivate'
                              : 'Activate'
                          }
                          aria-label={
                            hospital.is_active
                              ? `Deactivate ${hospital.name}`
                              : `Activate ${hospital.name}`
                          }
                        >

                          {hospital.is_active ? (

                            <FiToggleRight className="text-2xl text-green-600" />

                          ) : (

                            <FiToggleLeft className="text-2xl text-gray-400" />

                          )}

                        </button>

                      </td>

                      {/* Edit hospital */}
                      <td>

                        <Link
                          to={`/admin/hospitals/${hospital.id}/edit`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#216d73] border border-[#e5dcc8] rounded-lg px-2.5 py-1.5 hover:bg-[#e8f0ec] transition-colors"
                        >

                          <FiEdit2 className="text-[11px]" />

                          Edit

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