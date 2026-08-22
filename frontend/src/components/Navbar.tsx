import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, LogOut, User as UserIcon, ShieldCheck, ChevronDown, BriefcaseBusiness, Search, Command, X } from 'lucide-react';
import { apiRequest } from '../api/client';
import { AppNotification } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdminPortal?: boolean;
}

const pageNames: Record<string, string> = {
  dashboard: 'Overview',
  'admin-dashboard': 'Overview',
  attendance: 'My Attendance',
  'admin-attendance': 'Attendance',
  leaves: 'Time Off',
  'leave-requests': 'Leave Requests',
  payroll: 'Payroll',
  employees: 'Employees',
  reports: 'Reports',
  settings: 'Settings',
  profile: 'My Profile',
};

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, isAdminPortal = false }) => {
  const { user, employee, logout } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState('');

  const fetchNotifications = async () => {
    try { setNotifications(await apiRequest<AppNotification[]>('/stats/notifications')); } catch { /* API may be offline during local preview. */ }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setShowSearch(true);
      }
      if (event.key === 'Escape') setShowSearch(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const searchResults = [
    { id: 'employees', label: 'Employees', keywords: 'employees people staff directory' },
    { id: isAdminPortal ? 'admin-attendance' : 'attendance', label: 'Attendance', keywords: 'attendance check in hours timesheet' },
    { id: isAdminPortal ? 'leave-requests' : 'leaves', label: 'Leave Requests', keywords: 'leave time off vacation' },
    { id: 'payroll', label: 'Payroll & Payslips', keywords: 'payroll salary compensation payslip' },
  ].filter((item) => item.keywords.includes(search.toLowerCase()) || item.label.toLowerCase().includes(search.toLowerCase()));

  const goHome = () => setActiveTab(isAdminPortal ? 'admin-dashboard' : 'dashboard');

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8 no-print">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-5">
            <button onClick={goHome} className="flex shrink-0 items-center gap-2.5 text-left" aria-label="Go to Dayflow overview">
              <span className="brand-gradient flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm"><BriefcaseBusiness className="h-4 w-4" /></span>
              <span className="hidden sm:block"><span className="text-sm font-extrabold tracking-[0.16em] text-slate-950">DAYFLOW</span><span className="ml-1.5 rounded bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700">HRMS</span></span>
            </button>
            <span className="hidden h-6 w-px bg-slate-200 md:block" />
            <div className="hidden min-w-0 md:block"><p className="truncate text-sm font-semibold text-slate-900">{pageNames[activeTab] || 'Workspace'}</p><p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">{isAdminPortal ? 'Admin / HR workspace' : 'Employee workspace'}</p></div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowSearch(true)} className="hidden w-56 items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs text-slate-400 transition hover:border-indigo-200 hover:bg-white lg:flex" aria-label="Open global search">
              <span className="flex items-center gap-2"><Search className="h-3.5 w-3.5" /> Search workspace...</span><span className="flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-slate-400"><Command className="h-2.5 w-2.5" /> K</span>
            </button>
            <button onClick={() => setShowSearch(true)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Open global search"><Search className="h-4 w-4" /></button>
            <div className="relative">
              <button onClick={() => setShowNotifications((value) => !value)} className="relative rounded-lg border border-transparent p-2 text-slate-500 transition hover:border-slate-200 hover:bg-slate-50" aria-label="Open notifications"><Bell className="h-[18px] w-[18px]" />{unreadCount > 0 && <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-indigo-600 px-1 text-[8px] font-bold text-white">{unreadCount}</span>}</button>
              {showNotifications && <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><p className="text-xs font-bold text-slate-900">Notification center</p><p className="text-[10px] text-slate-400">Updates from your workspace</p></div><span className="text-[10px] font-semibold text-indigo-600">{unreadCount} unread</span></div><div className="max-h-72 divide-y divide-slate-100 overflow-y-auto">{notifications.length === 0 ? <p className="p-6 text-center text-xs text-slate-400">No notifications yet</p> : notifications.map((notification) => <button key={notification.id} onClick={async () => { try { await apiRequest(`/stats/notifications/${notification.id}/read`, 'PUT'); setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, read: true } : item)); } catch { /* keep local state usable */ } }} className={`block w-full p-3 text-left text-xs ${notification.read ? 'bg-white' : 'bg-indigo-50/60'}`}><span className="flex items-start justify-between gap-2 font-semibold text-slate-800">{notification.title}{!notification.read && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />}</span><span className="mt-1 block leading-relaxed text-slate-500">{notification.message}</span></button>)}</div></div>}
            </div>
            <div className="relative">
              <button onClick={() => setShowProfileMenu((value) => !value)} className="flex items-center gap-2 rounded-xl border border-transparent p-1.5 text-left transition hover:border-slate-200 hover:bg-slate-50" aria-label="Open profile menu"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700">{employee?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2) || 'DF'}</span><span className="hidden sm:block"><span className="block max-w-28 truncate text-xs font-bold text-slate-800">{employee?.name || user?.email}</span><span className="block text-[10px] text-slate-400">{employee?.employeeId}</span></span><ChevronDown className="h-3.5 w-3.5 text-slate-400" /></button>
              {showProfileMenu && <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"><div className="border-b border-slate-100 bg-slate-50 px-3 py-3"><p className="text-xs font-bold text-slate-900">{employee?.name}</p><p className="mt-0.5 text-[10px] text-indigo-600">{employee?.designation}</p></div><div className="p-1"><button onClick={() => { setActiveTab('profile'); setShowProfileMenu(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"><UserIcon className="h-3.5 w-3.5 text-slate-400" /> My Profile</button><button onClick={() => { logout(); setShowProfileMenu(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-rose-600 hover:bg-rose-50"><LogOut className="h-3.5 w-3.5" /> Sign out</button></div></div>}
            </div>
          </div>
        </div>
      </header>

      {showSearch && <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/25 p-4 pt-[12vh] backdrop-blur-sm" onMouseDown={() => setShowSearch(false)}><div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3"><Search className="h-5 w-5 text-indigo-500" /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employees, attendance, requests..." className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" /><button onClick={() => setShowSearch(false)} aria-label="Close search"><X className="h-4 w-4 text-slate-400" /></button></div><div className="p-2">{searchResults.length === 0 ? <p className="p-6 text-center text-xs text-slate-400">No workspace results found</p> : searchResults.map((result) => <button key={result.id} onClick={() => { setActiveTab(result.id); setShowSearch(false); setSearch(''); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-indigo-50"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600"><ShieldCheck className="h-4 w-4" /></span><span><span className="block text-xs font-semibold text-slate-800">{result.label}</span><span className="block text-[10px] text-slate-400">Open workspace</span></span></button>)}</div></div></div>}
    </>
  );
};
