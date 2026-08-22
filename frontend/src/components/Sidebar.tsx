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
    <aside className="w-60 bg-white border-r border-gray-200 p-3 flex flex-col justify-between hidden md:flex shrink-0 min-h-[calc(100vh-57px)] no-print">
      <div className="space-y-0.5">
        <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Main Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 border border-transparent'
              }`}>
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-500">
        <div className="flex items-center space-x-2 mb-1">
          <span className={`w-2 h-2 rounded-full ${user?.role === 'Admin' ? 'bg-amber-400' : 'bg-green-400'}`} />
          <span className="font-semibold text-gray-700">{user?.role} Session</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          {user?.role === 'Admin' ? 'Full HR administrative privileges.' : 'Standard employee access level.'}
        </p>
      </div>
    </aside>
  );
};
