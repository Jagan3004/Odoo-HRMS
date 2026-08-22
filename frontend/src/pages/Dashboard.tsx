import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { AdminStats, EmployeeStats } from '../types';
import { useToast } from '../context/ToastContext';
import { AlertCircle, ArrowUpRight, CalendarDays, CheckCircle2, Clock3, FileText, Play, ShieldCheck, Sparkles, Square, Users, Wallet, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency, formatDate, formatHours, formatTime } from '../utils/format';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingState } from '../components/ui/LoadingState';
import { StatCard } from '../components/ui/StatCard';

interface DashboardProps { setActiveTab: (tab: string) => void; }
const chartColors = ['#4f46e5', '#7c3aed', '#8b5cf6', '#3b82f6', '#10b981'];

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const { user, employee, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [clockLoading, setClockLoading] = useState(false);
  const isAdmin = user?.role === 'Admin' || user?.role === 'HR';

  const loadDashboard = async () => {
    try {
      const response = await apiRequest('/stats/dashboard');
      setAdminStats(response.adminStats);
      setEmployeeStats(response.employeeStats);
    } catch {
      showToast('Unable to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  const today = employeeStats?.todayAttendance;
  const working = Boolean(today?.checkIn && !today?.checkOut);
  const completed = Boolean(today?.checkOut);
  const workedHours = today?.totalHours || 0;
  const progress = Math.min(100, Math.round((workedHours / 8.5) * 100));

  const clock = async (action: 'in' | 'out') => {
    setClockLoading(true);
    try {
      await apiRequest(`/attendance/check-${action}`, 'POST');
      showToast(action === 'in' ? 'Checked in successfully' : 'Checked out successfully', 'success');
      await loadDashboard();
      await refreshProfile();
    } catch (error: any) {
      showToast(error.message || 'Attendance action failed', 'error');
    } finally { setClockLoading(false); }
  };

  const attendanceRate = useMemo(() => {
    if (!adminStats?.totalEmployees) return 0;
    return Math.round((adminStats.presentToday / adminStats.totalEmployees) * 100);
  }, [adminStats]);

  if (loading) return <LoadingState label="Preparing your Dayflow..." />;

  if (isAdmin && adminStats) {
    return (
      <div className="page-enter space-y-6">
        <section className="relative overflow-hidden rounded-2xl bg-[#211a4b] p-6 text-white shadow-xl shadow-indigo-950/10 sm:p-8">
          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-200"><ShieldCheck className="h-4 w-4" /> HR command center</div><h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Good morning, HR team.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-indigo-100/75">Here is what is happening across your workforce today. Keep the team moving with a single view of attendance, time off, and payroll.</p></div><div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-left backdrop-blur"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-200">Today</p><p className="mt-1 text-sm font-semibold">{formatDate(new Date().toISOString())}</p></div></div><div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border border-white/10" /><div className="absolute -bottom-40 right-20 h-80 w-80 rounded-full border border-white/5" />
        </section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"><StatCard label="Total Employees" value={adminStats.totalEmployees} subLabel="Active workforce" icon={Users} accent="indigo" /><StatCard label="Present Today" value={adminStats.presentToday} subLabel={`${attendanceRate}% attendance rate`} icon={Activity} accent="emerald" /><StatCard label="On Leave" value={adminStats.activeLeavesToday} subLabel="Approved today" icon={CalendarDays} accent="amber" /><StatCard label="Pending Approvals" value={adminStats.pendingLeaveRequests} subLabel="Requires HR action" icon={AlertCircle} accent="rose" /></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"><StatCard label="Attendance Rate" value={`${attendanceRate}%`} icon={TrendingIcon} accent="blue" /><StatCard label="Payroll This Month" value={formatCurrency(adminStats.totalMonthlyPayroll)} icon={Wallet} accent="violet" /><StatCard label="New Joiners" value={3} subLabel="Last 30 days" icon={Users} accent="indigo" /><StatCard label="Open Requests" value={adminStats.pendingLeaveRequests} icon={FileText} accent="amber" /></div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3"><div className="panel-elevated rounded-2xl p-5 lg:col-span-2"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-500">Workforce signal</p><h2 className="mt-1 text-base font-bold text-slate-900">Weekly attendance</h2><p className="mt-1 text-xs text-slate-500">Presence, leave, and absence over the last seven days.</p></div><button onClick={() => setActiveTab('admin-attendance')} className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600">Open report <ArrowUpRight className="h-3.5 w-3.5" /></button></div><div className="mt-5 h-60"><ResponsiveContainer width="100%" height="100%"><BarChart data={adminStats.attendanceTrend}><XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={11} /><YAxis axisLine={false} tickLine={false} fontSize={11} /><Tooltip /><Bar dataKey="Present" fill="#4f46e5" radius={[5, 5, 0, 0]} /><Bar dataKey="Leave" fill="#8b5cf6" radius={[5, 5, 0, 0]} /><Bar dataKey="Absent" fill="#fda4af" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></div><div className="panel-elevated rounded-2xl p-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-500">People mix</p><h2 className="mt-1 text-base font-bold text-slate-900">Department distribution</h2><div className="mt-4 h-44"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={adminStats.departmentBreakdown} dataKey="count" nameKey="name" innerRadius={38} outerRadius={62} paddingAngle={4}>{adminStats.departmentBreakdown.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><div className="space-y-2">{adminStats.departmentBreakdown.map((department, index) => <div key={department.name} className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 text-slate-600"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />{department.name}</span><span className="font-bold text-slate-800">{department.count}</span></div>)}</div></div></div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2"><div className="panel-elevated rounded-2xl p-5"><div className="flex items-center justify-between"><h2 className="text-base font-bold text-slate-900">Recent activity</h2><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Live feed</span></div><div className="mt-4 space-y-2">{['New employee joined Engineering', 'Leave request submitted by Alex Morgan', 'Sick leave approved for John Doe', 'Payroll updated for this month'].map((item, index) => <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Sparkles className="h-3.5 w-3.5" /></span><span className="text-xs text-slate-600">{item}</span><span className="ml-auto text-[10px] text-slate-400">{index === 0 ? 'Now' : `${index}h ago`}</span></div>)}</div></div><div className="panel-elevated rounded-2xl border-l-4 border-l-amber-400 p-5"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-600">Action required</p><h2 className="mt-1 text-base font-bold text-slate-900">Pending approvals</h2></div><span className="text-3xl font-extrabold text-amber-600">{adminStats.pendingLeaveRequests}</span></div><p className="mt-3 text-sm text-slate-500">Leave request(s) are waiting for HR review.</p><button onClick={() => setActiveTab('leave-requests')} className="mt-4 rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700">Review requests</button></div></div>
      </div>
    );
  }

  const leaveBalance = employeeStats?.leaveBalance.paidLeave || 0;
  return (
    <div className="page-enter space-y-6">
      <section className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600">{formatDate(new Date().toISOString())}</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Good morning, {employee?.name?.split(' ')[0] || 'Alex'}.</h1><p className="mt-2 text-sm text-slate-500">Here is your workday at a glance.</p></div><div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/70 px-3 py-2 text-xs font-semibold text-indigo-700"><Sparkles className="h-4 w-4" /> Workday OS</div></section>
      <section className="relative overflow-hidden rounded-2xl bg-[#211a4b] p-6 text-white shadow-xl shadow-indigo-950/10 sm:p-8"><div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center"><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-200"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Today · Workday Pulse</div><h2 className="mt-3 text-2xl font-extrabold tracking-tight">{completed ? 'Your workday is complete.' : working ? 'You are in the flow.' : 'Ready when you are.'}</h2><p className="mt-2 max-w-md text-sm leading-6 text-indigo-100/75">{completed ? 'Nice work. Your attendance has been recorded for today.' : working ? 'Keep going. Your hours are being tracked in real time.' : 'Start your day with a quick check-in and keep everything aligned.'}</p><div className="mt-6 flex flex-wrap items-end gap-8"><div><p className="text-[10px] uppercase tracking-[0.14em] text-indigo-200">Check-in</p><p className="mt-1 text-xl font-bold">{formatTime(today?.checkIn)}</p></div><div><p className="text-[10px] uppercase tracking-[0.14em] text-indigo-200">Check-out</p><p className="mt-1 text-xl font-bold">{formatTime(today?.checkOut)}</p></div><div><p className="text-[10px] uppercase tracking-[0.14em] text-indigo-200">Worked</p><p className="mt-1 text-xl font-bold">{formatHours(today?.checkIn, today?.checkOut, today?.totalHours)}</p></div></div><div className="mt-6">{!working && !completed && <button disabled={clockLoading} onClick={() => clock('in')} className="rounded-lg bg-white px-4 py-2.5 text-xs font-extrabold text-indigo-900 shadow-sm transition hover:bg-indigo-50 disabled:opacity-50"><span className="inline-flex items-center gap-2"><Play className="h-3.5 w-3.5 fill-current" /> Check in</span></button>}{working && <button disabled={clockLoading} onClick={() => clock('out')} className="rounded-lg bg-rose-500 px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-rose-400 disabled:opacity-50"><span className="inline-flex items-center gap-2"><Square className="h-3.5 w-3.5 fill-current" /> Check out</span></button>}{completed && <StatusBadge label="Completed" tone="success" />}</div></div><div className="relative mx-auto flex h-44 w-44 items-center justify-center rounded-full" style={{ background: `conic-gradient(#a78bfa ${progress}%, rgb(255 255 255 / 0.12) ${progress}% 100%)` }}><div className="flex h-36 w-36 flex-col items-center justify-center rounded-full bg-[#211a4b] text-center"><Clock3 className="mb-1 h-5 w-5 text-indigo-200" /><span className="text-3xl font-extrabold">{Math.floor(workedHours)}h</span><span className="text-[10px] text-indigo-200">of 8h 30m target</span></div></div></div><div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/10" /><div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full border border-white/5" /></section>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"><StatCard label="Attendance Rate" value="96%" subLabel="↑ 2.4% this month" icon={Activity} accent="emerald" /><StatCard label="Leave Balance" value={`${leaveBalance} days`} subLabel="Paid leave available" icon={CalendarDays} accent="indigo" /><StatCard label="Pending Requests" value={employeeStats?.pendingLeavesCount || 0} subLabel="Awaiting review" icon={AlertCircle} accent="amber" /><StatCard label="Next Payslip" value="30 Aug" subLabel="Payroll status: ready" icon={FileText} accent="blue" /></div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_.85fr]"><div className="panel-elevated rounded-2xl p-5"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-500">Your week</p><h2 className="mt-1 text-base font-bold text-slate-900">Attendance rhythm</h2></div><span className="text-xs font-semibold text-slate-400">Worked hours</span></div><div className="mt-4 h-48"><ResponsiveContainer width="100%" height="100%"><BarChart data={adminStats?.attendanceTrend || []}><XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={11} /><YAxis hide /><Tooltip /><Bar dataKey="Present" fill="#4f46e5" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></div><div className="panel-elevated rounded-2xl p-5"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Activity className="h-4 w-4" /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-500">Signature feature</p><h2 className="text-base font-bold text-slate-900">Workday Pulse</h2></div></div><div className="mt-4 space-y-3 text-xs"><div className="flex items-center justify-between"><span className="text-slate-500">Attendance</span><StatusBadge label={working ? 'On track' : completed ? 'Complete' : 'Not started'} tone={working || completed ? 'success' : 'warning'} /></div><div className="flex items-center justify-between"><span className="text-slate-500">Hours</span><span className="font-bold text-slate-800">{formatHours(today?.checkIn, today?.checkOut, today?.totalHours)} / 8h 30m</span></div><div className="flex items-center justify-between"><span className="text-slate-500">Leave available</span><span className="font-bold text-slate-800">{leaveBalance} days</span></div><div className="flex items-center justify-between"><span className="text-slate-500">Next payslip</span><span className="font-bold text-slate-800">30 Aug</span></div></div></div></div>
      <div className="panel-elevated rounded-2xl p-5"><div className="flex items-center justify-between"><h2 className="text-base font-bold text-slate-900">Make a move</h2><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Quick actions</span></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => setActiveTab('attendance')} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:border-indigo-200 hover:bg-indigo-50"><Clock3 className="h-3.5 w-3.5 text-indigo-600" /> Check attendance</button><button onClick={() => setActiveTab('leaves')} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:border-indigo-200 hover:bg-indigo-50"><CalendarDays className="h-3.5 w-3.5 text-indigo-600" /> Apply leave</button><button onClick={() => setActiveTab('payroll')} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:border-indigo-200 hover:bg-indigo-50"><Wallet className="h-3.5 w-3.5 text-indigo-600" /> View payslip</button><button onClick={() => setActiveTab('profile')} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:border-indigo-200 hover:bg-indigo-50"><Users className="h-3.5 w-3.5 text-indigo-600" /> Edit profile</button></div></div>
    </div>
  );
};

const TrendingIcon = Activity;
