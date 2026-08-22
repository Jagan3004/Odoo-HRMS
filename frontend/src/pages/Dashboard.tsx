import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { AdminStats, EmployeeStats } from '../types';
import { Users, Clock, CalendarDays, DollarSign, TrendingUp, AlertCircle, CheckCircle2, Play, Square, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#4f46e5', '#7c3aed', '#ec4899', '#3b82f6', '#10b981'];

interface DashboardProps { setActiveTab: (tab: string) => void; }

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const { user, employee, refreshProfile } = useAuth();
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [clockActionLoading, setClockActionLoading] = useState(false);
  const [clockMessage, setClockMessage] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const res = await apiRequest('/stats/dashboard');
      setAdminStats(res.adminStats);
      setEmployeeStats(res.employeeStats);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const handleCheckIn = async () => {
    setClockActionLoading(true); setClockMessage(null);
    try { await apiRequest('/attendance/check-in', 'POST'); setClockMessage('Checked in successfully!'); await fetchDashboardData(); await refreshProfile(); } catch (err: any) { setClockMessage(err.message); }
    finally { setClockActionLoading(false); }
  };

  const handleCheckOut = async () => {
    setClockActionLoading(true); setClockMessage(null);
    try { await apiRequest('/attendance/check-out', 'POST'); setClockMessage('Checked out successfully!'); await fetchDashboardData(); await refreshProfile(); } catch (err: any) { setClockMessage(err.message); }
    finally { setClockActionLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-200 border-t-indigo-600" /></div>;

  const todayAtt = employeeStats?.todayAttendance;
  const isCheckedIn = !!todayAtt?.checkIn && !todayAtt?.checkOut;
  const isCheckedOut = !!todayAtt?.checkOut;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="panel-elevated rounded-xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2 border border-indigo-100">
            <span>{user?.role === 'Admin' ? 'HR Management Hub' : 'Employee Portal'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Welcome back, <span className="text-indigo-600">{employee?.name}</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1 max-w-xl">
            {user?.role === 'Admin'
              ? 'View workforce metrics, pending leave approvals, attendance trends, and payroll summary.'
              : 'Track your workday, monitor leave balances, and view payslips.'}
          </p>
        </div>

        {/* Clock Widget */}
        <div className="panel p-4 rounded-xl min-w-[260px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-500" /> Today's Status
            </span>
            <span className="text-[10px] text-gray-400 font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center justify-between my-2">
            <div>
              <p className="text-[11px] text-gray-400">Check-in</p>
              <p className="text-sm font-semibold text-gray-800 font-mono">{todayAtt?.checkIn || '-- : --'}</p>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isCheckedOut ? 'bg-gray-100 text-gray-500' : isCheckedIn ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              {isCheckedOut ? 'Completed' : isCheckedIn ? 'Working' : 'Not Clocked In'}
            </span>
          </div>
          <div className="mt-3">
            {!isCheckedIn && !isCheckedOut ? (
              <button onClick={handleCheckIn} disabled={clockActionLoading}
                className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs rounded-lg flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50 shadow-sm">
                <Play className="w-3.5 h-3.5 fill-current" /><span>Clock In</span>
              </button>
            ) : isCheckedIn ? (
              <button onClick={handleCheckOut} disabled={clockActionLoading}
                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50 shadow-sm">
                <Square className="w-3.5 h-3.5 fill-current" /><span>Clock Out</span>
              </button>
            ) : (
              <div className="text-center py-1.5 text-xs text-gray-500 font-medium bg-gray-50 rounded-lg border border-gray-200">
                Completed ({todayAtt?.totalHours || 0} hrs)
              </div>
            )}
          </div>
          {clockMessage && <p className="text-[10px] text-center mt-2 text-indigo-600 font-medium">{clockMessage}</p>}
        </div>
      </div>

      {/* Admin KPI Cards */}
      {user?.role === 'Admin' && adminStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Employees', value: adminStats.totalEmployees, sub: 'Active workforce', icon: Users, color: 'indigo', trend: <TrendingUp className="w-3 h-3 mr-0.5" /> },
            { label: 'Present Today', value: adminStats.presentToday, sub: `${Math.round((adminStats.presentToday / adminStats.totalEmployees) * 100)}% rate`, icon: Clock, color: 'green' },
            { label: 'Pending Approvals', value: adminStats.pendingLeaveRequests, sub: 'Requires review', icon: CalendarDays, color: 'amber' },
            { label: 'Monthly Payroll', value: `₹${adminStats.totalMonthlyPayroll.toLocaleString()}`, sub: 'Net liability', icon: DollarSign, color: 'purple' },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="stat-card p-5 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                  <span className={`text-[10px] font-medium text-${card.color}-600 mt-1 flex items-center`}>
                    {card.trend}{card.sub}
                  </span>
                </div>
                <div className={`p-3 bg-${card.color}-50 rounded-lg border border-${card.color}-100`}>
                  <Icon className={`w-5 h-5 text-${card.color}-600`} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Employee Personal Cards */}
      {user?.role === 'Employee' && employeeStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card p-5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Paid Leave</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{employeeStats.leaveBalance.paidLeave} <span className="text-xs font-normal text-gray-400">days</span></p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-100"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>
          </div>
          <div className="stat-card p-5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Sick Leave</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{employeeStats.leaveBalance.sickLeave} <span className="text-xs font-normal text-gray-400">days</span></p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100"><CalendarDays className="w-5 h-5 text-indigo-600" /></div>
          </div>
          <div className="stat-card p-5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Pending Requests</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{employeeStats.pendingLeavesCount}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100"><AlertCircle className="w-5 h-5 text-amber-600" /></div>
          </div>
        </div>
      )}

      {/* Charts */}
      {user?.role === 'Admin' && adminStats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 panel-elevated p-6 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-base text-gray-900">Weekly Attendance</h3>
                <p className="text-xs text-gray-400">Staff presence over the past 7 days</p>
              </div>
              <button onClick={() => setActiveTab('attendance')} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center space-x-1">
                <span>View All</span><ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={adminStats.attendanceTrend}>
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar dataKey="Present" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Leave" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Absent" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="panel-elevated p-6 rounded-xl flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-base text-gray-900">Department Breakdown</h3>
              <p className="text-xs text-gray-400 mb-4">Headcount by department</p>
              <div className="h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={adminStats.departmentBreakdown} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={38} paddingAngle={4}>
                      {adminStats.departmentBreakdown.map((_entry, index) => (<Cell key={index} fill={COLORS[index % COLORS.length]} />))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="space-y-2 pt-3 border-t border-gray-100">
              {adminStats.departmentBreakdown.map((dept, idx) => (
                <div key={dept.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-gray-600 font-medium">{dept.name}</span>
                  </div>
                  <span className="text-gray-400 font-semibold">{dept.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="panel-elevated p-6 rounded-xl">
        <h3 className="font-semibold text-base text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { id: 'employees', label: 'Employees', desc: 'Manage staff records', icon: Users, color: 'indigo' },
            { id: 'attendance', label: 'Attendance', desc: 'Clock-in & timesheets', icon: Clock, color: 'green' },
            { id: 'leaves', label: 'Leave Requests', desc: 'Submit & review leaves', icon: CalendarDays, color: 'pink' },
            { id: 'payroll', label: 'Payroll', desc: 'Salary & payslips', icon: DollarSign, color: 'purple' },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button key={action.id} onClick={() => setActiveTab(action.id)}
                className="p-4 rounded-lg bg-gray-50 hover:bg-white border border-gray-200 hover:border-indigo-200 text-left transition-all group hover:shadow-sm">
                <Icon className={`w-5 h-5 text-${action.color}-500 mb-2 group-hover:scale-110 transition-transform`} />
                <p className="text-sm font-semibold text-gray-800">{action.label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{action.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
