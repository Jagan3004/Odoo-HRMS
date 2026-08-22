import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { AdminStats } from '../types';
import { BarChart3, Users, Clock, CalendarDays, DollarSign } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';

const COLORS = ['#4f46e5', '#7c3aed', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

export const Analytics: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => { try { const r = await apiRequest('/stats/dashboard'); setStats(r.adminStats || r.employeeStats); } catch (err) { console.error(err); } finally { setLoading(false); } })();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-200 border-t-indigo-600" /></div>;

  if (!stats || user?.role !== 'Admin') {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><BarChart3 className="w-6 h-6 text-indigo-600" /> Analytics</h1><p className="text-sm text-gray-500 mt-1">Workforce analytics are available for HR administrators.</p></div>
        <div className="panel-elevated rounded-xl p-12 text-center"><BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-400 text-sm">Upgrade to an Admin role to access full analytics.</p></div>
      </div>
    );
  }

  const payrollByDept = stats.departmentBreakdown.map((d) => ({ name: d.name, amount: d.count * 8200 }));
  const monthlyTrend = [{ month: 'Jan', cost: 38000 }, { month: 'Feb', cost: 39200 }, { month: 'Mar', cost: 40500 }, { month: 'Apr', cost: 41000 }, { month: 'May', cost: 42500 }, { month: 'Jun', cost: stats.totalMonthlyPayroll }];

  const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><BarChart3 className="w-6 h-6 text-indigo-600" /> HR Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Data-driven insights for workforce planning and optimization.</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Headcount', value: stats.totalEmployees, icon: Users, color: 'indigo' },
          { label: 'Attendance Rate', value: `${Math.round((stats.presentToday / stats.totalEmployees) * 100)}%`, icon: Clock, color: 'green' },
          { label: 'Leave Queue', value: stats.pendingLeaveRequests, icon: CalendarDays, color: 'amber' },
          { label: 'Monthly Cost', value: `$${(stats.totalMonthlyPayroll / 1000).toFixed(1)}K`, icon: DollarSign, color: 'purple' },
        ].map((kpi) => { const Icon = kpi.icon; return (
          <div key={kpi.label} className="stat-card p-5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">{kpi.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
            </div>
            <div className={`p-3 bg-${kpi.color}-50 rounded-lg border border-${kpi.color}-100`}><Icon className={`w-5 h-5 text-${kpi.color}-600`} /></div>
          </div>
        ); })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="panel-elevated rounded-xl p-6">
          <h3 className="font-semibold text-sm text-gray-900 mb-1">Weekly Attendance</h3>
          <p className="text-xs text-gray-400 mb-4">Staff presence breakdown over 7 days</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.attendanceTrend}>
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} /><Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Present" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Leave" fill="#ec4899" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Absent" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel-elevated rounded-xl p-6">
          <h3 className="font-semibold text-sm text-gray-900 mb-1">Payroll Trend</h3>
          <p className="text-xs text-gray-400 mb-4">Monthly payroll expenditure (6-month window)</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Cost']} />
                <Line type="monotone" dataKey="cost" stroke="#4f46e5" strokeWidth={2.5} dot={{ fill: '#4f46e5', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="panel-elevated rounded-xl p-6">
          <h3 className="font-semibold text-sm text-gray-900 mb-1">Department Distribution</h3>
          <p className="text-xs text-gray-400 mb-4">Headcount by organizational unit</p>
          <div className="flex items-center gap-6">
            <div className="h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.departmentBreakdown} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={42} paddingAngle={4}>
                    {stats.departmentBreakdown.map((_e, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2.5">
              {stats.departmentBreakdown.map((dept, idx) => (
                <div key={dept.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-xs text-gray-600 font-medium">{dept.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-gray-800">{dept.count}</span>
                    <span className="text-[10px] text-gray-400">({Math.round((dept.count / stats.totalEmployees) * 100)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="panel-elevated rounded-xl p-6">
          <h3 className="font-semibold text-sm text-gray-900 mb-1">Payroll by Department</h3>
          <p className="text-xs text-gray-400 mb-4">Estimated monthly expenditure per department</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payrollByDept} layout="vertical">
                <XAxis type="number" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Payroll']} />
                <Bar dataKey="amount" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
