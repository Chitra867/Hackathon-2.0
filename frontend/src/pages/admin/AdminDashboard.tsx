import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiHome, FiUsers, FiFileText, FiSettings, FiCheckCircle, FiAlertCircle,
  FiLogIn, FiLogOut, FiActivity, FiArrowRight,
} from 'react-icons/fi';
import { hospitalsApi, usersApi, auditApi } from '../../lib/api';
import type { AuditLog } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({ totalHospitals: 0, activeHospitals: 0, totalUsers: 0, pendingHospitals: 0 });
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      hospitalsApi.list({ page_size: 100 }),
      usersApi.list({ page_size: 1 }),
      auditApi.list({ page_size: 8 }),
    ]).then(([hospitalsRes, usersRes, auditRes]) => {
      const hospitals = hospitalsRes.data.results;
      setStats({
        totalHospitals: hospitalsRes.data.count,
        activeHospitals: hospitals.filter((h) => h.is_active).length,
        totalUsers: usersRes.data.count,
        pendingHospitals: hospitals.filter((h) => h.verification_status === 'pending').length,
      });
      setRecentActivity(auditRes.data.results);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // One teal family, not four unrelated hues — active/good state gets the
  // deepest teal so it reads as the "headline" number on the row.
  const statCards = [
    { label: 'Total Hospitals', value: stats.totalHospitals, icon: <FiHome />, bg: 'bg-[#eef3f2]', color: 'text-[#538b8c]', link: '/admin/hospitals' },
    { label: 'Active Hospitals', value: stats.activeHospitals, icon: <FiCheckCircle />, bg: 'bg-[#216d73]', color: 'text-white', link: '/admin/hospitals', emphasis: true },
    { label: 'Pending Verification', value: stats.pendingHospitals, icon: <FiAlertCircle />, bg: 'bg-[#f2ece0]', color: 'text-[#8a8078]', link: '/admin/hospitals' },
    { label: 'Total Users', value: stats.totalUsers, icon: <FiUsers />, bg: 'bg-[#eef3f2]', color: 'text-[#538b8c]', link: '/admin/hospital-admins' },
  ];

  const quickLinks = [
    { to: '/admin/hospitals/new', icon: <FiHome />, label: 'Add Hospital', desc: 'Register a new facility' },
    { to: '/admin/hospital-admins', icon: <FiUsers />, label: 'Manage Admins', desc: 'Assign hospital administrators' },
    { to: '/admin/services', icon: <FiSettings />, label: 'Services', desc: 'Manage medical service types' },
    { to: '/admin/reports', icon: <FiFileText />, label: 'Reports', desc: 'View referral statistics' },
  ];

  const activityStyle = (log: AuditLog) => {
    const action = (log.action_display || '').toLowerCase();
    if (action.includes('login')) {
      return { icon: <FiLogIn />, bg: 'bg-[#eef3f2]', color: 'text-[#216d73]' };
    }
    if (action.includes('logout')) {
      return { icon: <FiLogOut />, bg: 'bg-[#f2ece0]', color: 'text-[#8a8078]' };
    }
    return { icon: <FiActivity />, bg: 'bg-[#e4ebe9]', color: 'text-[#538b8c]' };
  };

  if (loading) return <LoadingSpinner text="Loading dashboard…" />;

  return (
    <div className="bg-[#faedd7] -m-4 md:-m-6 p-4 md:p-6 min-h-full">
      <h1 className="text-2xl font-semibold text-[#1c3d3f]">Super Admin Dashboard</h1>
      <p className="text-sm text-[#6b7d79] mb-6">System-wide overview of UpacharKhoj Nepal</p>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <Link
            key={s.label}
            to={s.link}
            className={`group flex items-center gap-4 rounded-xl border p-4 transition-all duration-150 hover:-translate-y-0.5 ${
              s.emphasis
                ? 'bg-[#216d73] border-[#216d73] shadow-md shadow-[#216d73]/20 hover:shadow-lg hover:shadow-[#216d73]/25'
                : 'bg-white border-[#e5dcc8] hover:border-[#aabfb9] hover:shadow-md'
            }`}
          >
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${s.bg}`}>
              <span className={`text-lg ${s.color}`}>{s.icon}</span>
            </div>
            <div>
              <div className={`text-2xl font-bold ${s.emphasis ? 'text-white' : 'text-[#1c3d3f]'}`}>{s.value}</div>
              <div className={`text-xs ${s.emphasis ? 'text-[#cfe3e1]' : 'text-[#8a8078]'}`}>{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white border border-[#e5dcc8] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#1c3d3f] m-0">Recent System Activity</h2>
            <Link
              to="/admin/reports"
              className="inline-flex items-center gap-1 text-sm font-medium text-[#216d73] hover:text-[#184f54]"
            >
              View all <FiArrowRight className="text-xs" />
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-[#8a8078] py-8 text-center">No activity recorded yet.</p>
          ) : (
            <ul className="divide-y divide-[#f2ece0]">
              {recentActivity.map((log) => {
                const style = activityStyle(log);
                return (
                  <li key={log.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <div className={`w-9 h-9 rounded-full ${style.bg} flex items-center justify-center flex-shrink-0 ${style.color}`}>
                      <span className="text-sm">{style.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#1c3d3f] truncate">{log.description}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-[#a3988a]">
                          {format(new Date(log.created_at), 'MMM d, HH:mm')}
                        </span>
                        <span className="text-[#d8cdb8]">·</span>
                        <span className={`text-xs font-medium ${style.color}`}>{log.action_display}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-[#e5dcc8] rounded-xl p-5">
          <h2 className="text-base font-semibold text-[#1c3d3f] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="flex items-center gap-3 p-3 rounded-lg border border-[#e5dcc8] hover:bg-[#faedd7]/60 hover:border-[#aabfb9] transition-colors"
              >
                <div className="w-9 h-9 bg-[#eef3f2] text-[#216d73] rounded-lg flex items-center justify-center flex-shrink-0">
                  {l.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1c3d3f]">{l.label}</div>
                  <div className="text-xs text-[#8a8078]">{l.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};