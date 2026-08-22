import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiRequest } from '../api/client';
import { AttendanceRecord } from '../types';
import { CalendarDays, Clock3, Download, Filter, Play, Search, Square, Timer } from 'lucide-react';
import { formatDate, formatHours, formatTime } from '../utils/format';
import { StatusBadge } from '../components/ui/StatusBadge';
import { StatCard } from '../components/ui/StatCard';
import { LoadingState } from '../components/ui/LoadingState';

const tone = (status: string) => status === 'Present' ? 'success' as const : status === 'Half-day' ? 'warning' as const : status === 'Absent' ? 'danger' as const : 'info' as const;

export const Attendance: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === 'Admin' || user?.role === 'HR';
  const [today, setToday] = useState<AttendanceRecord | null>(null);
  const [mine, setMine] = useState<AttendanceRecord[]>([]);
  const [all, setAll] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [department, setDepartment] = useState('All');
  const [clockLoading, setClockLoading] = useState(false);

  const load = async () => {
    try {
      const [todayResponse, mineResponse] = await Promise.all([apiRequest('/attendance/today'), apiRequest<AttendanceRecord[]>('/attendance/my')]);
      setToday(todayResponse.record);
      setMine(mineResponse);
      if (isAdmin) setAll(await apiRequest<AttendanceRecord[]>('/attendance/all'));
    } catch { showToast('Unable to load attendance', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [user?.role]);

  const clock = async (action: 'in' | 'out') => {
    setClockLoading(true);
    try { await apiRequest(`/attendance/check-${action}`, 'POST'); showToast(action === 'in' ? 'Checked in successfully' : 'Checked out successfully', 'success'); await load(); await refreshProfile(); }
    catch (error: any) { showToast(error.message || 'Attendance action failed', 'error'); }
    finally { setClockLoading(false); }
  };

  const working = Boolean(today?.checkIn && !today?.checkOut);
  const complete = Boolean(today?.checkOut);
  const history = period === 'Daily' ? mine.slice(0, 1) : period === 'Weekly' ? mine.slice(0, 7) : mine;
  const presentCount = mine.filter((item) => item.status === 'Present' || item.status === 'Half-day').length;
  const attendanceRate = mine.length ? Math.round((presentCount / mine.length) * 100) : 0;
  const departments = ['All', ...Array.from(new Set(all.map((item) => item.department || 'General')))];
  const filteredAll = all.filter((item) => {
    const needle = query.toLowerCase();
    return (!needle || (item.employeeName || '').toLowerCase().includes(needle) || item.employeeId.toLowerCase().includes(needle)) && (status === 'All' || item.status === status) && (department === 'All' || (item.department || 'General') === department);
  });

  const exportCsv = () => {
    const rows = [['Employee', 'Employee ID', 'Date', 'Check-in', 'Check-out', 'Hours', 'Status'], ...filteredAll.map((item) => [item.employeeName || '', item.employeeId, formatDate(item.date), formatTime(item.checkIn), formatTime(item.checkOut), formatHours(item.checkIn, item.checkOut, item.totalHours), item.status])];
    const url = URL.createObjectURL(new Blob([rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')], { type: 'text/csv' }));
    const link = document.createElement('a'); link.href = url; link.download = 'dayflow-attendance.csv'; link.click(); URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingState label="Loading attendance workspace..." />;
  return <div className="page-enter space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600">Workday signal</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">{isAdmin ? 'Attendance overview' : 'My attendance'}</h1><p className="mt-1 text-sm text-slate-500">{isAdmin ? 'See how the workforce is showing up today.' : 'Keep your workday accurate, visible, and on track.'}</p></div>{isAdmin ? <button onClick={exportCsv} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700"><Download className="h-3.5 w-3.5" /> Export CSV</button> : null}</div>
    {!isAdmin && <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_.9fr]"><div className="relative overflow-hidden rounded-2xl bg-[#211a4b] p-6 text-white"><div className="relative z-10"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-200"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Today</div><h2 className="mt-3 text-xl font-extrabold">{complete ? 'Completed' : working ? 'Currently working' : 'Not started'}</h2><div className="mt-5 grid grid-cols-3 gap-3"><div><p className="text-[10px] text-indigo-200">Check-in</p><p className="mt-1 text-lg font-bold">{formatTime(today?.checkIn)}</p></div><div><p className="text-[10px] text-indigo-200">Check-out</p><p className="mt-1 text-lg font-bold">{formatTime(today?.checkOut)}</p></div><div><p className="text-[10px] text-indigo-200">Worked</p><p className="mt-1 text-lg font-bold">{formatHours(today?.checkIn, today?.checkOut, today?.totalHours)}</p></div></div><div className="mt-6">{!working && !complete && <button disabled={clockLoading} onClick={() => clock('in')} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-extrabold text-indigo-900"><Play className="h-3.5 w-3.5 fill-current" /> Check in</button>}{working && <button disabled={clockLoading} onClick={() => clock('out')} className="inline-flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-xs font-extrabold text-white"><Square className="h-3.5 w-3.5 fill-current" /> Check out</button>}</div></div><div className="absolute -right-24 -top-24 h-64 w-64 rounded-full border border-white/10" /></div><div className="panel-elevated rounded-2xl p-5"><div className="flex items-center gap-2"><Timer className="h-4 w-4 text-indigo-600" /><h2 className="text-sm font-bold text-slate-900">Today's timeline</h2></div><div className="relative mt-6 space-y-6 pl-7 text-xs before:absolute before:left-[7px] before:top-1 before:h-[calc(100%-10px)] before:w-px before:bg-indigo-100"><div className="relative"><span className="absolute -left-7 top-0 h-3.5 w-3.5 rounded-full border-2 border-indigo-600 bg-white" /><p className="font-bold text-slate-800">{formatTime(today?.checkIn)} <span className="font-normal text-slate-400">Check-in</span></p></div><div className="relative"><span className="absolute -left-7 top-0 h-3.5 w-3.5 rounded-full border-2 border-indigo-200 bg-white" /><p className="font-bold text-slate-800">{working ? 'In progress' : complete ? formatHours(today?.checkIn, today?.checkOut, today?.totalHours) : 'Awaiting check-in'} <span className="font-normal text-slate-400">Work block</span></p></div><div className="relative"><span className="absolute -left-7 top-0 h-3.5 w-3.5 rounded-full border-2 border-slate-200 bg-white" /><p className="font-bold text-slate-800">{formatTime(today?.checkOut)} <span className="font-normal text-slate-400">Check-out</span></p></div></div></div></section>}
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><StatCard label="This month" value={`${attendanceRate}%`} subLabel="Attendance rate" icon={CalendarDays} accent="indigo" /><StatCard label="Worked hours" value={`${mine.reduce((sum, item) => sum + (item.totalHours || 0), 0).toFixed(1)}h`} subLabel="Recorded total" icon={Clock3} accent="emerald" /><StatCard label="Half-days" value={mine.filter((item) => item.status === 'Half-day').length} subLabel="Needs attention" icon={Timer} accent="amber" /><StatCard label="Leave days" value={mine.filter((item) => item.status === 'Leave').length} subLabel="Attendance records" icon={CalendarDays} accent="blue" /></div>
    {!isAdmin && <div className="panel-elevated rounded-2xl p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-500">History</p><h2 className="mt-1 text-base font-bold text-slate-900">Your attendance records</h2></div><div className="flex rounded-lg border border-slate-200 bg-white p-1 text-xs">{(['Daily', 'Weekly', 'Monthly'] as const).map((item) => <button key={item} onClick={() => setPeriod(item)} className={`rounded-md px-3 py-1.5 font-semibold ${period === item ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>{item}</button>)}</div></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[650px] text-left text-xs"><thead><tr className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase tracking-[0.12em] text-slate-500"><th className="px-4 py-3">Date</th><th className="px-4 py-3">Check-in</th><th className="px-4 py-3">Check-out</th><th className="px-4 py-3">Hours</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{history.map((item) => <tr key={item.id} className="hover:bg-indigo-50/30"><td className="px-4 py-3 font-semibold text-slate-700">{formatDate(item.date)}</td><td className="px-4 py-3 text-slate-600">{formatTime(item.checkIn)}</td><td className="px-4 py-3 text-slate-600">{formatTime(item.checkOut)}</td><td className="px-4 py-3 font-semibold text-slate-700">{formatHours(item.checkIn, item.checkOut, item.totalHours)}</td><td className="px-4 py-3"><StatusBadge label={item.status} tone={tone(item.status)} /></td></tr>)}</tbody></table></div></div>}
    {isAdmin && <div className="panel-elevated rounded-2xl p-5"><div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_180px]"><div className="relative"><Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search employee or ID" className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-xs" /></div><select value={department} onChange={(event) => setDepartment(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs">{departments.map((item) => <option key={item}>{item}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs"><option>All</option><option>Present</option><option>Absent</option><option>Half-day</option><option>Leave</option></select></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[850px] text-left text-xs"><thead><tr className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase tracking-[0.12em] text-slate-500"><th className="px-4 py-3">Employee</th><th className="px-4 py-3">ID</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Check-in</th><th className="px-4 py-3">Check-out</th><th className="px-4 py-3">Hours</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredAll.map((item) => <tr key={item.id} className="hover:bg-indigo-50/30"><td className="px-4 py-3 font-semibold text-slate-700">{item.employeeName || 'Unknown'}</td><td className="px-4 py-3 text-slate-500">{item.employeeId}</td><td className="px-4 py-3 text-slate-600">{formatDate(item.date)}</td><td className="px-4 py-3 text-slate-600">{formatTime(item.checkIn)}</td><td className="px-4 py-3 text-slate-600">{formatTime(item.checkOut)}</td><td className="px-4 py-3 font-semibold text-slate-700">{formatHours(item.checkIn, item.checkOut, item.totalHours)}</td><td className="px-4 py-3"><StatusBadge label={item.status} tone={tone(item.status)} /></td></tr>)}</tbody></table></div></div>}
  </div>;
};
