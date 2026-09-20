/**
 * NotificationDropdown
 *
 * Reusable notification bell + dropdown panel shared by:
 *   - Navbar (admin / hospital-admin panels)
 *   - UserLayout top bar (user portal)
 *
 * Usage:
 *   <NotificationDropdown />
 *
 * Props:
 *   themeColor   – Tailwind bg-class for the active badge & read-marker accent.
 *                  Defaults to "bg-[#07545e]" (teal, matches admin panels).
 *   iconClassName – extra classes on the bell button.
 */

import React, { useEffect, useRef, useState } from 'react';
import { FiBell, FiCheckCircle, FiTrash2, FiInbox } from 'react-icons/fi';
import { useNotificationStore } from '../../store/notificationStore';
import type { AppNotificationItem } from '../../lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// Map notification_type to a colour class for the left accent stripe
const typeColor: Record<string, string> = {
  new_referral:              'bg-blue-500',
  referral_incoming:         'bg-blue-400',
  referral_status:           'bg-indigo-500',
  new_patient_request:       'bg-amber-500',
  patient_request_incoming:  'bg-amber-400',
  patient_request_status:    'bg-green-500',
  new_service_added:         'bg-purple-500',
  info:                      'bg-gray-400',
};

const typeIcon: Record<string, string> = {
  new_referral:              '🔀',
  referral_incoming:         '📥',
  referral_status:           '🔔',
  new_patient_request:       '🧑‍⚕️',
  patient_request_incoming:  '📋',
  patient_request_status:    '✅',
  new_service_added:         '🏥',
  info:                      'ℹ️',
};

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  /** Tailwind background colour for the unread badge (default teal). */
  badgeColor?: string;
  /** Extra Tailwind classes on the bell icon button. */
  iconClassName?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const NotificationDropdown: React.FC<Props> = ({
  badgeColor = 'bg-red-500',
  iconClassName = '',
}) => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markRead,
    markAllRead,
    clearAll,
  } = useNotificationStore();

  // ── Close on outside click ───────────────────────────────────────────────
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  // ── Fetch full list when panel opens ────────────────────────────────────
  const handleToggle = () => {
    if (!open) fetchNotifications();
    setOpen((o) => !o);
  };

  // ── Mark a single item as read when clicked ──────────────────────────────
  const handleItemClick = (n: AppNotificationItem) => {
    if (!n.is_read) markRead([n.id]);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative" ref={panelRef}>

      {/* ── Bell Button ─────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
        className={`relative flex items-center justify-center h-9 w-9 rounded-full text-[#64748b] transition hover:bg-[#edf5f3] hover:text-[#07545e] ${iconClassName}`}
      >
        <FiBell className="text-[18px]" />

        {/* Badge */}
        {unreadCount > 0 && (
          <span
            className={`absolute right-1 top-1 flex h-4 min-w-[14px] items-center justify-center rounded-full ${badgeColor} px-0.5 text-[9px] font-bold text-white leading-none pointer-events-none`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown Panel ──────────────────────────────────────────────── */}
      {open && (
        <div
          className="absolute right-0 top-11 z-50 w-[360px] max-w-[calc(100vw-1rem)] rounded-2xl border border-[#e8dfcf] bg-white shadow-2xl shadow-black/10 overflow-hidden"
          role="dialog"
          aria-label="Notification panel"
        >

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0ebe1] bg-[#faf8f4]">
            <div className="flex items-center gap-2">
              <FiBell className="text-[#07545e]" />
              <span className="text-sm font-semibold text-[#1c3d3f]">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Mark all read */}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead()}
                  className="flex items-center gap-1 text-[11px] text-[#07545e] hover:underline px-2 py-1 rounded-lg hover:bg-[#e8f3f0] transition-colors"
                  title="Mark all as read"
                >
                  <FiCheckCircle className="text-xs" /> All read
                </button>
              )}

              {/* Clear all */}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearAll()}
                  className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                  title="Clear all notifications"
                >
                  <FiTrash2 className="text-xs" /> Clear
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-[#a89a82] text-sm gap-2">
                <svg className="animate-spin h-4 w-4 text-[#07545e]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[#a89a82] gap-2">
                <FiInbox className="text-3xl text-[#d5cec4]" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <ul>
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`relative flex gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-[#f5f0e8] last:border-0 ${
                      n.is_read
                        ? 'bg-white hover:bg-[#faf8f4]'
                        : 'bg-[#f0faf8] hover:bg-[#e4f5f1]'
                    }`}
                  >
                    {/* Left accent stripe */}
                    <span
                      className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${
                        typeColor[n.notification_type] ?? 'bg-gray-300'
                      }`}
                    />

                    {/* Icon */}
                    <span className="flex-shrink-0 text-xl leading-none mt-0.5">
                      {typeIcon[n.notification_type] ?? '🔔'}
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${n.is_read ? 'text-[#555]' : 'text-[#1c3d3f]'}`}>
                        {n.title}
                      </p>
                      <p className={`text-[11px] mt-0.5 leading-relaxed line-clamp-2 ${n.is_read ? 'text-[#888]' : 'text-[#444]'}`}>
                        {n.message}
                      </p>
                      <p className="text-[10px] text-[#aaa] mt-1">
                        {timeAgo(n.created_at)}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {!n.is_read && (
                      <span className="flex-shrink-0 mt-1.5 h-2 w-2 rounded-full bg-[#07545e]" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 bg-[#faf8f4] border-t border-[#f0ebe1] text-center">
              <span className="text-[10px] text-[#b0a898]">
                Showing last {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
