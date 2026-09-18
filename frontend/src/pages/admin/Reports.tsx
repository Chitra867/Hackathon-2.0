import React, { useEffect, useState } from 'react';
import { FiActivity, FiCheckCircle, FiXCircle, FiClock, FiAlertCircle } from 'react-icons/fi';
import { auditApi, referralsApi } from '../../lib/api';
import type { Referral, AuditLog } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';

export const Reports: React.FC = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      referralsApi.list({ page_size: 100 }),
      auditApi.list({ page_size: 20 }),
    ]).then(([rRes, aRes]) => {
      setReferrals(rRes.data.results);
      setAuditLogs(aRes.data.results);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = {
    total: referrals.length,
    pending: referrals.filter((r) => r.status === 'pending').length,
    accepted: referrals.filter((r) => r.status === 'accepted' || r.status === 'patient_sent' || r.status === 'patient_arrived').length,
    rejected: referrals.filter((r) => r.status === 'rejected').length,
    cancelled: referrals.filter((r) => r.status === 'cancelled').length,
    emergency: referrals.filter((r) => r.urgency === 'emergency').length,
  };

  // Group referrals by destination hospital
  const byHospital: Record<string, { name: string; total: number; pending: number; accepted: number }> = {};
  referrals.forEach((r) => {
    const name = r.destination_facility_name || 'Unknown';
    if (!byHospital[name]) byHospital[name] = { name, total: 0, pending: 0, accepted: 0 };
    byHospital[name].total++;
    if (r.status === 'pending') byHospital[name].pending++;
    if (['accepted', 'patient_sent', 'patient_arrived'].includes(r.status)) byHospital[name].accepted++;
  });
  const hospitalStats = Object.values(byHospital).sort((a, b) => b.total - a.total);

  const availabilityLogs = auditLogs.filter((l) => l.action === 'availability_update');

  if (loading) return <LoadingSpinner text="Loading reports…" />;

  return (
    <div>
      <h1 className="page-title">Reports & Activity</h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {[
          { label: 'Total Referrals', value: stats.total, icon: <FiActivity />, bg: 'bg-blue-100', color: 'text-blue-600' },
          { label: 'Pending', value: stats.pending, icon: <FiClock />, bg: 'bg-yellow-100', color: 'text-yellow-600' },
          { label: 'Accepted', value: stats.accepted, icon: <FiCheckCircle />, bg: 'bg-green-100', color: 'text-green-600' },
          { label: 'Rejected', value: stats.rejected, icon: <FiXCircle />, bg: 'bg-red-100', color: 'text-red-600' },
          { label: 'Cancelled', value: stats.cancelled, icon: <FiXCircle />, bg: 'bg-gray-100', color: 'text-gray-500' },
          { label: 'Emergency', value: stats.emergency, icon: <FiAlertCircle />, bg: 'bg-rose-100', color: 'text-rose-600' },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <span className={s.color}>{s.icon}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Hospital Referral Stats */}
        <div className="card">
          <h2 className="section-title">Referrals by Hospital</h2>
          {hospitalStats.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No referral data yet.</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Hospital</th>
                    <th>Total</th>
                    <th>Pending</th>
                    <th>Accepted</th>
                  </tr>
                </thead>
                <tbody>
                  {hospitalStats.map((h) => (
                    <tr key={h.name}>
                      <td className="font-medium text-gray-900 text-sm">{h.name}</td>
                      <td className="font-bold text-gray-800">{h.total}</td>
                      <td>
                        <span className="badge bg-yellow-100 text-yellow-700">{h.pending}</span>
                      </td>
                      <td>
                        <span className="badge bg-green-100 text-green-700">{h.accepted}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Availability Update History */}
        <div className="card">
          <h2 className="section-title">Availability Update History</h2>
          {availabilityLogs.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No availability updates logged yet.</p>
          ) : (
            <div className="space-y-3">
              {availabilityLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-sm border-b border-gray-50 pb-3 last:border-0">
                  <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <FiActivity className="text-teal-600 text-xs" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 text-xs leading-relaxed">{log.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent All Activity */}
      <div className="card mt-6">
        <h2 className="section-title">Full Activity Log</h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th className="hidden sm:table-cell">Description</th>
                <th className="hidden md:table-cell">IP</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-6 text-gray-500">No activity logged yet.</td></tr>
              ) : auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="text-xs text-gray-500 whitespace-nowrap">{format(new Date(log.created_at), 'MMM d, HH:mm')}</td>
                  <td><span className="badge bg-gray-100 text-gray-700 text-xs">{log.action_display}</span></td>
                  <td className="hidden sm:table-cell text-sm text-gray-700 max-w-xs truncate">{log.description}</td>
                  <td className="hidden md:table-cell text-xs text-gray-400">{log.ip_address || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
