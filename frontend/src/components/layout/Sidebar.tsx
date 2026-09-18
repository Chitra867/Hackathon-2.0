import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiHome,
  FiList,
  FiPlus,
  FiUsers,
  FiSettings,
  FiActivity,
  FiMapPin,
  FiFileText,
  FiBarChart2,
  FiChevronLeft,
  FiChevronRight,
  FiShield,
} from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore';

interface SidebarItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

function getSidebarItems(role: string): SidebarItem[] {
  switch (role) {
    case 'health_worker':
      return [
        { label: 'Dashboard', to: '/hw/dashboard', icon: <FiHome /> },
        { label: 'My Referrals', to: '/hw/referrals', icon: <FiList /> },
        { label: 'New Referral', to: '/hw/referrals/new', icon: <FiPlus /> },
        { label: 'Find Hospitals', to: '/search', icon: <FiMapPin /> },
      ];
    case 'hospital_staff':
      return [
        { label: 'Dashboard', to: '/staff/dashboard', icon: <FiHome /> },
        { label: 'Availability', to: '/staff/availability', icon: <FiActivity /> },
        { label: 'Referrals', to: '/staff/referrals', icon: <FiList /> },
      ];
    case 'hospital_admin':
      return [
        { label: 'Dashboard', to: '/hadmin/dashboard', icon: <FiHome /> },
        { label: 'Manage Staff', to: '/hadmin/staff', icon: <FiUsers /> },
      ];
    case 'system_admin':
      return [
        { label: 'Dashboard', to: '/admin/dashboard', icon: <FiBarChart2 /> },
        { label: 'Hospitals', to: '/admin/hospitals', icon: <FiMapPin /> },
        { label: 'Services', to: '/admin/services', icon: <FiSettings /> },
        { label: 'Users', to: '/admin/users', icon: <FiUsers /> },
        { label: 'Audit Logs', to: '/admin/audit', icon: <FiFileText /> },
        { label: 'Security', to: '/admin/audit', icon: <FiShield /> },
      ];
    default:
      return [];
  }
}

const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const items = getSidebarItems(user.role);
  if (items.length === 0) return null;

  return (
    <aside
      className={`hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 flex-shrink-0 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
      aria-label="Sidebar navigation"
    >
      {/* Collapse toggle */}
      <div className="flex justify-end px-3 py-3 border-b border-gray-100">
        <button
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <FiChevronRight className="w-4 h-4" />
          ) : (
            <FiChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* User info */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Signed in as
          </p>
          <p className="text-sm font-semibold text-gray-800 truncate">
            {user.first_name} {user.last_name || user.username}
          </p>
          <p className="text-xs text-gray-500 capitalize">
            {user.role.replace('_', ' ')}
          </p>
          {user.hospital_name && (
            <p className="text-xs text-primary-600 truncate mt-0.5">{user.hospital_name}</p>
          )}
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto" aria-label="Sidebar links">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to.endsWith('dashboard')}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                isActive
                  ? 'bg-primary-50 text-primary-900 border border-primary-100'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? item.label : undefined}
            aria-label={item.label}
          >
            <span
              className={`flex-shrink-0 w-5 h-5 ${
                collapsed ? '' : ''
              }`}
              aria-hidden="true"
            >
              {item.icon}
            </span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
