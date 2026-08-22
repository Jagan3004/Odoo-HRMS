import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, LogOut, User as UserIcon, Shield, ChevronDown, Check } from 'lucide-react';
import { apiRequest } from '../api/client';
import { AppNotification } from '../types';
import { BrandLogo } from './BrandLogo';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ setActiveTab }) => {
  const { user, employee, logout } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await apiRequest<AppNotification[]>('/stats/notifications');
      setNotifications(res);
    } catch (err) { /* silent */ }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      await apiRequest(`/stats/notifications/${id}/read`, 'PUT');
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) { /* silent */ }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between no-print">
      {/* Brand */}
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
        <BrandLogo size="md" className="hidden sm:inline-flex" />
        <BrandLogo size="sm" className="sm:hidden" />
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-3">
        {/* Role Badge */}
        <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-medium text-gray-600">
          <Shield className={`w-3.5 h-3.5 ${user?.role === 'Admin' ? 'text-amber-500' : 'text-indigo-500'}`} />
          <span>{user?.role === 'Admin' ? 'HR Administrator' : 'Employee'}</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
              <div className="p-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <span className="font-semibold text-sm text-gray-800">Notifications</span>
                <span className="text-xs text-indigo-600 font-medium">{unreadCount} unread</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} onClick={() => markAsRead(n.id)}
                      className={`p-3.5 text-xs cursor-pointer transition-colors ${!n.read ? 'bg-indigo-50/60' : 'hover:bg-gray-50'}`}>
                      <div className="flex items-start justify-between">
                        <span className="font-semibold text-gray-800">{n.title}</span>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1 shrink-0" />}
                      </div>
                      <p className="mt-1 text-gray-500 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2.5 p-1.5 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all focus:outline-none">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
              {employee?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-gray-800">{employee?.name || user?.email}</p>
              <p className="text-[10px] text-gray-400">{employee?.employeeId}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
              <div className="p-3 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-bold text-gray-800">{employee?.name}</p>
                <p className="text-[11px] text-indigo-600 truncate">{employee?.designation}</p>
              </div>
              <div className="p-1">
                <button onClick={() => { setActiveTab('profile'); setShowProfileMenu(false); }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                  <UserIcon className="w-4 h-4 text-gray-400" /><span>My Profile</span>
                </button>
                <button onClick={() => { logout(); setShowProfileMenu(false); }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <LogOut className="w-4 h-4" /><span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
