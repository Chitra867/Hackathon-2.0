import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiHome, FiUsers, FiFileText, FiSettings, FiCheckCircle, FiAlertCircle,
  FiLogIn, FiLogOut, FiActivity,
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

  // Warm palette built on #ede0ce — brown / olive / ochre / plum, all one family.
  const statCards = [
    { label: 'Total Hospitals', value: stats.totalHospitals, icon: <FiHome />, bg: 'bg-[#f1e4cf]', ring: 'ring-[#e2cda3]', color: 'text-[#8b5a2b]', link: '/admin/hospitals' },
    { label: 'Active Hospitals', value: stats.activeHospitals, icon: <FiCheckCircle />, bg: 'bg-[#e4ead3]', ring: 'ring-[#c9d6a8]', color: 'text-[#5c7a3a]', link: '/admin/hospitals' },
    { label: 'Pending Verification', value: stats.pendingHospitals, icon: <FiAlertCircle />, bg: 'bg-[#f6e3c4]', ring: 'ring-[#ecc98a]', color: 'text-[#b9761e]', link: '/admin/hospitals' },
    { label: 'Total Users', value: stats.totalUsers, icon: <FiUsers />, bg: 'bg-[#ebdcec]', ring: 'ring-[#d5b9d8]', color: 'text-[#7a4f85]', link: '/admin/hospital-admins' },
  ];

  const quickLinks = [
    { to: '/admin/hospitals/new', icon: <FiHome />, label: 'Add Hospital', desc: 'Register a new facility' },
    { to: '/admin/hospital-admins', icon: <FiUsers />, label: 'Manage Admins', desc: 'Assign hospital administrators' },
    { to: '/admin/services', icon: <FiSettings />, label: 'Services', desc: 'Manage medical service types' },
    { to: '/admin/reports', icon: <FiFileText />, label: 'Reports', desc: 'View referral statistics' },
  ];

  // Give each activity a distinct icon + tint based on what actually happened,
  // instead of one flat gray dot for every row.
  const activityStyle = (log: AuditLog) => {
    const action = (log.action_display || '').toLowerCase();
    if (action.includes('login')) {
      return { icon: <FiLogIn />, bg: 'bg-[#e4ead3]', color: 'text-[#5c7a3a]' };
    }
    if (action.includes('logout')) {
      return { icon: <FiLogOut />, bg: 'bg-[#f1e4cf]', color: 'text-[#a9702f]' };
    }
    return { icon: <FiActivity />, bg: 'bg-[#ebdcec]', color: 'text-[#7a4f85]' };
  };

  if (loading) return <LoadingSpinner text="Loading dashboard…" />;

  return (
    <div className="bg-[#faf6ee] -m-4 md:-m-6 p-4 md:p-6 min-h-full">
      <h1 className="page-title text-[#3d2f1c]">Super Admin Dashboard</h1>
      <p className="text-sm text-[#8a7a63] mb-6">System-wide overview of UpacharKhoj Nepal</p>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <Link
            key={s.label}
            to={s.link}
            className="stat-card bg-white border border-[#ede0ce] hover:shadow-lg hover:-translate-y-0.5 hover:border-[#d9c39e] transition-all duration-200"
          >
            <div className={`stat-icon ${s.bg} ring-1 ${s.ring}`}>
              <span className={`text-xl ${s.color}`}>{s.icon}</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#3d2f1c]">{s.value}</div>
              <div className="text-xs text-[#8a7a63]">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card bg-white border border-[#ede0ce]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title m-0 text-[#3d2f1c]">Recent System Activity</h2>
            <Link to="/admin/reports" className="text-sm font-medium text-[#8b5a2b] hover:text-[#6b4520] hover:underline">
              View all
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-[#8a7a63] py-8 text-center">No activity recorded yet.</p>
          ) : (
            <ul className="divide-y divide-[#f2e9d9]">
              {recentActivity.map((log) => {
                const style = activityStyle(log);
                return (
                  <li key={log.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <div className={`w-9 h-9 rounded-full ${style.bg} flex items-center justify-center flex-shrink-0 ${style.color}`}>
                      <span className="text-sm">{style.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#3d2f1c] truncate">{log.description}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-[#a89a82]">
                          {format(new Date(log.created_at), 'MMM d, HH:mm')}
                        </span>
                        <span className="text-[#d9c9ac]">·</span>
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
        <div className="card bg-white border border-[#ede0ce]">
          <h2 className="section-title text-[#3d2f1c]">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="flex items-center gap-3 p-3 rounded-lg border border-[#ede0ce] hover:bg-[#faf1e0] hover:border-[#d9c39e] transition-colors"
              >
                <div className="w-9 h-9 bg-[#f1e4cf] text-[#8b5a2b] rounded-lg flex items-center justify-center flex-shrink-0">
                  {l.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#3d2f1c]">{l.label}</div>
                  <div className="text-xs text-[#8a7a63]">{l.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};