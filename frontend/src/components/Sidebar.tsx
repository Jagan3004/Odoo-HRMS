import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Clock, CalendarDays, CreditCard, BarChart3, UserCheck, Sparkles } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdminPortal?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isAdminPortal = false }) => {
  const { user } = useAuth();

  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Employee'] },
    { id: 'employees', label: 'Employees', icon: Users, roles: ['Admin'] },
    { id: 'attendance', label: 'Attendance', icon: Clock, roles: ['Admin', 'Employee'] },
    { id: 'leaves', label: 'Leave & Time-Off', icon: CalendarDays, roles: ['Admin', 'Employee'] },
    { id: 'payroll', label: 'Payroll & Payslips', icon: CreditCard, roles: ['Admin', 'Employee'] },
    { id: 'analytics', label: 'HR Analytics', icon: BarChart3, roles: ['Admin'] },
    { id: 'profile', label: 'My Profile', icon: UserCheck, roles: ['Admin', 'Employee'] },
  ];

  const navItems = isAdminPortal
    ? [
        { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'employees', label: 'Employees', icon: Users },
        { id: 'admin-attendance', label: 'Attendance', icon: Clock },
        { id: 'leave-requests', label: 'Leave Requests', icon: CalendarDays },
        { id: 'payroll', label: 'Payroll', icon: CreditCard },
        { id: 'reports', label: 'Reports', icon: BarChart3 },
        { id: 'settings', label: 'Settings', icon: UserCheck },
      ]
    : allNavItems.filter((item) => item.roles.includes(user?.role || 'Employee'));

  return (
    <>
    <aside className="hidden w-64 shrink-0 border-r border-slate-200/80 bg-white/70 px-3 py-5 md:flex md:min-h-[calc(100vh-66px)] md:flex-col md:justify-between no-print">
      <div className="space-y-5">
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3">
          <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm"><Sparkles className="h-3.5 w-3.5" /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-700">{isAdminPortal ? 'Control room' : 'Workday OS'}</p><p className="mt-0.5 text-[10px] text-indigo-500">{isAdminPortal ? 'Organization wide' : 'Personal workspace'}</p></div></div>
        </div>
        <div className="space-y-1">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`group relative w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}>
              {isActive && <span className="absolute -left-3 h-5 w-1 rounded-r-full bg-indigo-600" />}
              <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-500 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${isAdminPortal ? 'bg-amber-400' : 'bg-emerald-400'}`} />
          <span className="font-bold text-slate-700">{isAdminPortal ? 'Admin / HR' : 'Employee'} session</span>
        </div>
        <p className="text-[11px] leading-relaxed">{isAdminPortal ? 'Workforce controls are enabled.' : 'Your workday tools are ready.'}</p>
      </div>
    </aside>
    <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white/95 p-1.5 backdrop-blur md:hidden no-print" aria-label="Mobile navigation">
      {navItems.slice(0, 5).map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[9px] font-bold ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-400'}`} aria-label={item.label}><Icon className="h-4 w-4" /><span className="max-w-full truncate">{item.label}</span></button>;
      })}
    </nav>
    </>
  );
};
