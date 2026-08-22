import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, LogOut, User as UserIcon, Shield, ChevronDown, Briefcase } from 'lucide-react';
import { apiRequest } from '../api/client';
import { AppNotification } from '../types';

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
    } catch { /* silent */ }
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
    } catch { /* silent */ }
  };

  return (
    <header className="sticky top-0 z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between no-print"
      style={{ background: '#ffffff', borderBottom: '1px solid #dcc5ea', minHeight: '58px', boxShadow: '0 1px 8px rgba(74,37,88,0.08)' }}>

      {/* Brand */}
      <div className="flex items-center space-x-3 cursor-pointer py-3" onClick={() => setActiveTab('dashboard')}>
        <div className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center glow-apricot shrink-0">
          <Briefcase className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="font-bold text-base tracking-tight" style={{ color: '#2f1840', fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '18px' }}>
            Dayflow
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold ml-2 align-middle"
            style={{ background: 'rgba(244,162,97,0.15)', color: '#e8855a', border: '1px solid rgba(244,162,97,0.4)' }}>HRMS</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-2">
        {/* Role badge */}
        <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: '#f5eef8', border: '1px solid #dcc5ea', color: '#6d4490' }}>
          <Shield className="w-3.5 h-3.5" style={{ color: user?.role === 'Admin' ? '#F4A261' : '#9568ae' }} />
          <span>{user?.role === 'Admin' ? 'HR Admin' : 'Employee'}</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg transition-all focus:outline-none"
            style={{ background: showNotifications ? '#fde0c5' : 'transparent', border: '1px solid', borderColor: showNotifications ? '#F4A261' : 'transparent', color: '#7a5588' }}
            onMouseEnter={e => { if (!showNotifications) { e.currentTarget.style.background = '#f5eef8'; e.currentTarget.style.color = '#3d1a47'; } }}
            onMouseLeave={e => { if (!showNotifications) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#7a5588'; } }}>
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center"
                style={{ background: '#F4A261', color: '#1a0a1e' }}>
                {unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl overflow-hidden z-50"
              style={{ background: '#ffffff', border: '1px solid #dcc5ea', boxShadow: '0 20px 48px -8px rgba(74,37,88,0.15), 0 4px 12px rgba(74,37,88,0.08)' }}>
              <div className="p-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid #ecddf5', background: '#fdf8f5' }}>
                <span className="font-semibold text-sm" style={{ color: '#2f1840', fontFamily: 'Cormorant Garamond, serif', fontSize: '16px' }}>Notifications</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: '#fde0c5', color: '#c96842', border: '1px solid #faaa6b' }}>{unreadCount} unread</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y" style={{ borderColor: '#ecddf5' }}>
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs" style={{ color: '#9568ae' }}>No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} onClick={() => markAsRead(n.id)}
                      className="p-3.5 text-xs cursor-pointer transition-colors"
                      style={{ background: !n.read ? '#fdf3ec' : '#fff', borderLeft: !n.read ? '2px solid #F4A261' : '2px solid transparent' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fdf8f5')}
                      onMouseLeave={e => (e.currentTarget.style.background = !n.read ? '#fdf3ec' : '#fff')}>
                      <div className="flex items-start justify-between">
                        <span className="font-semibold" style={{ color: '#2f1840' }}>{n.title}</span>
                        {!n.read && <span className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: '#F4A261' }} />}
                      </div>
                      <p className="mt-1 leading-relaxed" style={{ color: '#9568ae' }}>{n.message}</p>
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
            className="flex items-center space-x-2.5 p-1.5 rounded-lg transition-all focus:outline-none"
            style={{ border: '1px solid', borderColor: showProfileMenu ? '#F4A261' : 'transparent', background: showProfileMenu ? '#fde0c5' : 'transparent' }}
            onMouseEnter={e => { if (!showProfileMenu) { e.currentTarget.style.borderColor = '#dcc5ea'; e.currentTarget.style.background = '#f5eef8'; } }}
            onMouseLeave={e => { if (!showProfileMenu) { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; } }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs brand-gradient"
              style={{ color: '#fff' }}>
              {employee?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold" style={{ color: '#2f1840' }}>{employee?.name || user?.email}</p>
              <p className="text-[10px]" style={{ color: '#9568ae' }}>{employee?.employeeId}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5" style={{ color: '#b894cc' }} />
          </button>
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl overflow-hidden z-50"
              style={{ background: '#ffffff', border: '1px solid #dcc5ea', boxShadow: '0 20px 48px -8px rgba(74,37,88,0.15)' }}>
              <div className="p-3" style={{ borderBottom: '1px solid #ecddf5', background: '#fdf8f5' }}>
                <p className="text-xs font-semibold" style={{ color: '#2f1840' }}>{employee?.name}</p>
                <p className="text-[11px]" style={{ color: '#F4A261' }}>{employee?.designation}</p>
              </div>
              <div className="p-1">
                <button onClick={() => { setActiveTab('profile'); setShowProfileMenu(false); }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors"
                  style={{ color: '#4a2558' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fde0c5'; e.currentTarget.style.color = '#c96842'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4a2558'; }}>
                  <UserIcon className="w-4 h-4" /><span>My Profile</span>
                </button>
                <button onClick={() => { logout(); setShowProfileMenu(false); }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors"
                  style={{ color: '#e8855a' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fde0c5'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
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
