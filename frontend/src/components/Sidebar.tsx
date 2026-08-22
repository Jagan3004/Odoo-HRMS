import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Clock, CalendarDays, CreditCard, BarChart3, UserCheck } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
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

  const navItems = allNavItems.filter((item) => item.roles.includes(user?.role || 'Employee'));

  return (
    <aside className="w-60 p-3 flex flex-col justify-between hidden md:flex shrink-0 no-print"
      style={{ background: '#fdf8f5', borderRight: '1px solid #dcc5ea', minHeight: 'calc(100vh - 59px)' }}>
      <div className="space-y-0.5">
        <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider mb-1"
          style={{ color: '#9568ae', letterSpacing: '0.1em' }}>
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all"
              style={isActive ? {
                background: 'linear-gradient(90deg, #fde0c5 0%, #fdf3ec 100%)',
                border: '1px solid rgba(244,162,97,0.5)',
                color: '#c96842',
                boxShadow: '0 2px 8px -2px rgba(244,162,97,0.3)',
              } : {
                background: 'transparent',
                border: '1px solid transparent',
                color: '#7a5588',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#f5eef8'; e.currentTarget.style.color = '#4a2558'; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#7a5588'; } }}>
              <Icon className="w-4 h-4 shrink-0" style={{ color: isActive ? '#e8855a' : '#b894cc' }} />
              <span>{item.label}</span>
              {isActive && <span className="ml-auto w-1 h-4 rounded-full" style={{ background: 'linear-gradient(180deg,#F4A261,#e8855a)' }} />}
            </button>
          );
        })}
      </div>

      <div className="p-3 rounded-xl text-xs" style={{ background: '#fff', border: '1px solid #dcc5ea', boxShadow: '0 2px 8px rgba(74,37,88,0.07)' }}>
        <div className="flex items-center space-x-2 mb-1">
          <span className="w-2 h-2 rounded-full shrink-0"
            style={{ background: user?.role === 'Admin' ? '#F4A261' : '#6ee7b7', boxShadow: `0 0 6px ${user?.role === 'Admin' ? '#F4A261' : '#6ee7b7'}` }} />
          <span className="font-semibold" style={{ color: '#4a2558' }}>{user?.role} Session</span>
        </div>
        <p className="text-[11px] leading-relaxed" style={{ color: '#9568ae' }}>
          {user?.role === 'Admin' ? 'Full HR administrative privileges.' : 'Standard employee access level.'}
        </p>
      </div>
    </aside>
  );
};
