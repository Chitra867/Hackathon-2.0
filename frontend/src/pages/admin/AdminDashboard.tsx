import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiUsers, FiActivity, FiFileText, FiSettings, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
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

  const statCards = [
    { label: 'Total Hospitals', value: stats.totalHospitals, icon: <FiHome />, bg: 'bg-blue-100', color: 'text-blue-600', link: '/admin/hospitals' },
    { label: 'Active Hospitals', value: stats.activeHospitals, icon: <FiCheckCircle />, bg: 'bg-green-100', color: 'text-green-600', link: '/admin/hospitals' },
    { label: 'Pending Verification', value: stats.pendingHospitals, icon: <FiAlertCircle />, bg: 'bg-yellow-100', color: 'text-yellow-600', link: '/admin/hospitals' },
    { label: 'Total Users', value: stats.totalUsers, icon: <FiUsers />, bg: 'bg-purple-100', color: 'text-purple-600', link: '/admin/hospital-admins' },
  ];

  const quickLinks = [
    { to: '/admin/hospitals/new', icon: <FiHome />, label: 'Add Hospital', desc: 'Register a new facility' },
    { to: '/admin/hospital-admins', icon: <FiUsers />, label: 'Manage Admins', desc: 'Assign hospital administrators' },
    { to: '/admin/services', icon: <FiSettings />, label: 'Services', desc: 'Manage medical service types' },
    { to: '/admin/reports', icon: <FiFileText />, label: 'Reports', desc: 'View referral statistics' },
  ];

  if (loading) return <LoadingSpinner text="Loading dashboard…" />;

  return (
    <div>
      <h1 className="page-title">Super Admin Dashboard</h1>
      <p className="text-sm text-gray-500 mb-6">System-wide overview of UpacharKhoj Nepal</p>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <Link key={s.label} to={s.link} className="stat-card hover:shadow-md transition-shadow">
            <div className={`stat-icon ${s.bg}`}>
              <span className={`text-xl ${s.color}`}>{s.icon}</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title m-0">Recent System Activity</h2>
            <Link to="/admin/reports" className="text-sm text-primary-700 hover:underline">View all</Link>
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No activity recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-500">
                    <FiActivity className="text-xs" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 truncate">{log.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(new Date(log.created_at), 'MMM d, HH:mm')} · {log.action_display}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="section-title">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-primary-50 hover:border-primary-200 transition-colors"
              >
                <div className="w-9 h-9 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  {l.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">{l.label}</div>
                  <div className="text-xs text-gray-500">{l.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
