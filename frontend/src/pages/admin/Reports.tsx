import React, { useEffect, useState } from 'react';
import { FiActivity, FiCheckCircle, FiXCircle, FiClock, FiAlertCircle, FiSlash } from 'react-icons/fi';
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
  const maxHospitalTotal = Math.max(1, ...hospitalStats.map((h) => h.total));

  const availabilityLogs = auditLogs.filter((l) => l.action === 'availability_update');

  // One teal-family palette instead of a different color per stat — status is
  // carried by the icon and label, not by six unrelated hues.
  const statCards = [
    { label: 'Total Referrals', value: stats.total, icon: <FiActivity />, bg: 'bg-[#216d73]', color: 'text-white', emphasis: true },
    { label: 'Pending', value: stats.pending, icon: <FiClock />, bg: 'bg-[#f2ece0]', color: 'text-[#8a7350]' },
    { label: 'Accepted', value: stats.accepted, icon: <FiCheckCircle />, bg: 'bg-[#eef3f2]', color: 'text-[#216d73]' },
    { label: 'Rejected', value: stats.rejected, icon: <FiXCircle />, bg: 'bg-[#f6e9e5]', color: 'text-[#a15b4a]' },
    { label: 'Cancelled', value: stats.cancelled, icon: <FiSlash />, bg: 'bg-[#eef1f0]', color: 'text-[#8a978f]' },
    { label: 'Emergency', value: stats.emergency, icon: <FiAlertCircle />, bg: 'bg-[#f6e9e5]', color: 'text-[#a15b4a]' },
  ];

  if (loading) return <LoadingSpinner text="Loading reports…" />;

  return (
    <div className="bg-[#faedd7] -m-4 md:-m-6 p-4 md:p-6 min-h-full">
      <h1 className="text-2xl font-semibold text-[#1c3d3f] mb-6">Reports & Activity</h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {statCards.map((s) => (
          <div
            key={s.label}
            className={`rounded-xl p-4 text-center border ${
              s.emphasis ? 'bg-[#216d73] border-[#216d73] shadow-sm shadow-[#216d73]/20' : 'bg-white border-[#e5dcc8]'
            }`}
          >
            <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center mx-auto mb-2`}>
              <span className={s.color}>{s.icon}</span>
            </div>
            <div className={`text-2xl font-bold ${s.emphasis ? 'text-white' : 'text-[#1c3d3f]'}`}>{s.value}</div>
            <div className={`text-xs ${s.emphasis ? 'text-[#cfe3e1]' : 'text-[#8a8078]'}`}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Hospital Referral Stats */}
        <div className="bg-white border border-[#e5dcc8] rounded-xl p-5">
          <h2 className="text-base font-semibold text-[#1c3d3f] mb-4">Referrals by Hospital</h2>
          {hospitalStats.length === 0 ? (
            <p className="text-sm text-[#8a8078] text-center py-6">No referral data yet.</p>
          ) : (
            <div className="space-y-3">
              {hospitalStats.map((h) => (
                <div key={h.name}>
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-sm font-medium text-[#1c3d3f] truncate">{h.name}</span>
                    <span className="text-xs text-[#8a8078] flex-shrink-0">
                      <span className="font-semibold text-[#1c3d3f]">{h.total}</span> total
                    </span>
                  </div>
                  {/* Stacked bar: accepted / pending / other, out of this hospital's share of the busiest one */}
                  <div className="h-2 rounded-full bg-[#f2ece0] overflow-hidden flex">
                    <div
                      className="h-full bg-[#216d73]"
                      style={{ width: `${(h.accepted / maxHospitalTotal) * 100}%` }}
                      title={`${h.accepted} accepted`}
                    />
                    <div
                      className="h-full bg-[#d9a86c]"
                      style={{ width: `${(h.pending / maxHospitalTotal) * 100}%` }}
                      title={`${h.pending} pending`}
                    />
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[#8a8078]">
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#216d73]" />{h.accepted} accepted</span>
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#d9a86c]" />{h.pending} pending</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Availability Update History */}
        <div className="bg-white border border-[#e5dcc8] rounded-xl p-5">
          <h2 className="text-base font-semibold text-[#1c3d3f] mb-4">Availability Update History</h2>
          {availabilityLogs.length === 0 ? (
            <p className="text-sm text-[#8a8078] text-center py-6">No availability updates logged yet.</p>
          ) : (
            <div className="space-y-0 divide-y divide-[#f2ece0]">
              {availabilityLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="w-8 h-8 rounded-full bg-[#eef3f2] flex items-center justify-center flex-shrink-0">
                    <FiActivity className="text-[#216d73] text-xs" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#1c3d3f] text-sm leading-relaxed">{log.description}</p>
                    <p className="text-xs text-[#a3988a] mt-0.5">
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
      <div className="bg-white border border-[#e5dcc8] rounded-xl p-5 mt-6">
        <h2 className="text-base font-semibold text-[#1c3d3f] mb-4">Full Activity Log</h2>
        {auditLogs.length === 0 ? (
          <p className="text-sm text-[#8a8078] text-center py-6">No activity logged yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e5dcc8] bg-[#faf6ee]">
                  <th className="text-left font-medium text-[#6b7d79] px-5 py-2.5">Time</th>
                  <th className="text-left font-medium text-[#6b7d79] px-5 py-2.5">Action</th>
                  <th className="text-left font-medium text-[#6b7d79] px-5 py-2.5 hidden sm:table-cell">Description</th>
                  <th className="text-left font-medium text-[#6b7d79] px-5 py-2.5 hidden md:table-cell">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2ece0]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#faedd7]/40 transition-colors">
                    <td className="px-5 py-2.5 text-xs text-[#8a8078] whitespace-nowrap">
                      {format(new Date(log.created_at), 'MMM d, HH:mm')}
                    </td>
                    <td className="px-5 py-2.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#eef3f2] text-[#538b8c]">
                        {log.action_display}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-[#1c3d3f] max-w-xs truncate hidden sm:table-cell">{log.description}</td>
                    <td className="px-5 py-2.5 text-xs text-[#a3988a] hidden md:table-cell">{log.ip_address || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};