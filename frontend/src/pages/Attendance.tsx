import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { AttendanceRecord } from '../types';
import { Clock, Play, Square, Calendar, Filter, Edit2, Search } from 'lucide-react';
import { PageInsights } from '../components/PageInsights';

export const Attendance: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [myAttendance, setMyAttendance] = useState<AttendanceRecord[]>([]);
  const [weekEnd, setWeekEnd] = useState(new Date().toISOString().split('T')[0]);
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [clockActionLoading, setClockActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editStatus, setEditStatus] = useState<string>('Present');
  const [editNotes, setEditNotes] = useState('');
  const [weeklyRecords, setWeeklyRecords] = useState<AttendanceRecord[]>([]);

  const fetchData = async () => {
    try {
      const t = await apiRequest('/attendance/today'); setTodayRecord(t.record);
      const m = await apiRequest<AttendanceRecord[]>('/attendance/my'); setMyAttendance(m);
      if (user?.role !== 'Admin') { const week = await apiRequest<{ records: AttendanceRecord[] }>(`/attendance/weekly?endDate=${weekEnd}`); setWeeklyRecords(week.records); }
      if (user?.role === 'Admin') { const a = await apiRequest<AttendanceRecord[]>('/attendance/all'); setAllAttendance(a); }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, [user, weekEnd]);

  const handleCheckIn = async () => { setClockActionLoading(true); setActionMessage(null); try { await apiRequest('/attendance/check-in', 'POST'); setActionMessage('Checked in!'); await fetchData(); await refreshProfile(); } catch (err: any) { setActionMessage(err.message); } finally { setClockActionLoading(false); } };
  const handleCheckOut = async () => { setClockActionLoading(true); setActionMessage(null); try { await apiRequest('/attendance/check-out', 'POST'); setActionMessage('Checked out!'); await fetchData(); await refreshProfile(); } catch (err: any) { setActionMessage(err.message); } finally { setClockActionLoading(false); } };
  const handleSaveEdit = async () => { if (!editingRecord) return; try { await apiRequest(`/attendance/${editingRecord.id}`, 'PUT', { status: editStatus, notes: editNotes }); setEditingRecord(null); await fetchData(); } catch (err: any) { alert(err.message); } };

  const isCheckedIn = !!todayRecord?.checkIn && !todayRecord?.checkOut;
  const isCheckedOut = !!todayRecord?.checkOut;
  const filteredAll = allAttendance.filter((r) => {
    const q = searchFilter.toLowerCase();
    return ((r.employeeName || '').toLowerCase().includes(q) || r.employeeId.toLowerCase().includes(q) || r.date.includes(searchFilter)) && (statusFilter === 'All' || r.status === statusFilter);
  });
  const attendanceInsights = user?.role === 'Admin'
    ? [
        { label: 'All attendance records', value: String(allAttendance.length), note: 'Master log for every employee', icon: Calendar, tone: 'indigo' as const },
        { label: 'Filtered results', value: String(filteredAll.length), note: 'Matches for the current search', icon: Search, tone: 'cyan' as const },
        { label: 'Today\'s status', value: todayRecord?.status || 'No record', note: todayRecord ? `Check-in ${todayRecord.checkIn || '--'} • Check-out ${todayRecord.checkOut || '--'}` : 'No entry for today yet', icon: Clock, tone: 'amber' as const },
        { label: 'Hours today', value: todayRecord?.totalHours != null ? `${todayRecord.totalHours}h` : '--', note: 'Work time captured so far', icon: Play, tone: 'emerald' as const },
      ]
    : [
        { label: 'My attendance logs', value: String(myAttendance.length), note: 'Personal attendance history', icon: Calendar, tone: 'indigo' as const },
        { label: 'Weekly records', value: String(weeklyRecords.length), note: 'Entries in the current weekly view', icon: Filter, tone: 'cyan' as const },
        { label: 'Today\'s status', value: todayRecord?.status || 'No record', note: isCheckedOut ? 'Session completed' : isCheckedIn ? 'You are clocked in' : 'Not clocked in yet', icon: Clock, tone: 'amber' as const },
        { label: 'Hours today', value: todayRecord?.totalHours != null ? `${todayRecord.totalHours}h` : '--', note: 'Live work duration snapshot', icon: Square, tone: 'emerald' as const },
      ];

  const statusBadge = (s: string) => {
    const styles: Record<string, string> = { Present: 'bg-green-50 text-green-700 border-green-200', 'Half-day': 'bg-amber-50 text-amber-700 border-amber-200', Leave: 'bg-purple-50 text-purple-700 border-purple-200', Absent: 'bg-red-50 text-red-700 border-red-200' };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${styles[s] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>{s}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header + Clock Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Clock className="w-6 h-6 text-indigo-600" /> Attendance Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">Record check-in/out, review timesheets, and manage records.</p>
        </div>
        <div className="panel px-4 py-3 rounded-xl flex items-center space-x-4">
          <div className="text-right">
            <p className="text-[10px] text-gray-400 font-semibold uppercase">Now</p>
            <p className="text-base font-bold text-gray-800 font-mono">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          {!isCheckedIn && !isCheckedOut ? (
            <button onClick={handleCheckIn} disabled={clockActionLoading} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm"><Play className="w-3.5 h-3.5 fill-current" /><span>Clock In</span></button>
          ) : isCheckedIn ? (
            <button onClick={handleCheckOut} disabled={clockActionLoading} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm"><Square className="w-3.5 h-3.5 fill-current" /><span>Clock Out</span></button>
          ) : (<span className="text-xs font-semibold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">Done</span>)}
        </div>
      </div>

      <PageInsights
        eyebrow="Attendance overview"
        title="Live attendance summary"
        description="See the current clock status, weekly activity, and the most relevant attendance signals at a glance."
        icon={Clock}
        cards={attendanceInsights}
      />

      {actionMessage && <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium text-center">{actionMessage}</div>}

      {user?.role !== 'Admin' && <div className="panel-elevated rounded-xl overflow-hidden"><div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between"><h3 className="font-semibold text-sm text-gray-800">Weekly view</h3><input type="date" value={weekEnd} onChange={(e) => setWeekEnd(e.target.value)} className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs" /></div><div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 lg:grid-cols-7">{weeklyRecords.map((record) => <div key={record.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3"><p className="text-[10px] font-semibold text-gray-400">{record.date}</p><p className="mt-2 text-xs font-bold text-gray-800">{record.status}</p><p className="mt-1 text-[10px] text-gray-500">{record.totalHours ? `${record.totalHours}h` : 'No hours'}</p></div>)}{weeklyRecords.length === 0 && <p className="col-span-full py-4 text-center text-xs text-gray-400">No attendance records for this week.</p>}</div></div>}

      {/* My Attendance */}
      <div className="panel-elevated rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-sm text-gray-800 flex items-center gap-2"><Calendar className="w-4 h-4 text-indigo-500" /> My Attendance History</h3></div>
        <table className="w-full text-left text-xs">
          <thead><tr className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider text-[10px]"><th className="py-2.5 px-5">Date</th><th className="py-2.5 px-5">Check-In</th><th className="py-2.5 px-5">Check-Out</th><th className="py-2.5 px-5">Hours</th><th className="py-2.5 px-5">Status</th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {myAttendance.length === 0 ? <tr><td colSpan={5} className="py-8 text-center text-gray-400">No records yet.</td></tr> : myAttendance.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50/50"><td className="py-2.5 px-5 font-mono font-medium text-gray-700">{r.date}</td><td className="py-2.5 px-5 font-mono text-green-600">{r.checkIn || '--'}</td><td className="py-2.5 px-5 font-mono text-red-500">{r.checkOut || '--'}</td><td className="py-2.5 px-5 font-mono text-gray-600">{r.totalHours ? `${r.totalHours}h` : '--'}</td><td className="py-2.5 px-5">{statusBadge(r.status)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Admin Master Attendance */}
      {user?.role === 'Admin' && (
        <div className="panel-elevated rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-semibold text-sm text-gray-800 flex items-center gap-2"><Filter className="w-4 h-4 text-amber-500" /> All Employee Attendance</h3>
            <div className="flex items-center space-x-2">
              <div className="relative"><Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" /><input type="text" placeholder="Filter..." value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} className="pl-7 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-indigo-400 w-40" /></div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-indigo-400">
                <option value="All">All Status</option><option value="Present">Present</option><option value="Half-day">Half-day</option><option value="Leave">Leave</option><option value="Absent">Absent</option>
              </select>
            </div>
          </div>
          <table className="w-full text-left text-xs">
            <thead><tr className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider text-[10px]"><th className="py-2.5 px-5">Employee</th><th className="py-2.5 px-5">Date</th><th className="py-2.5 px-5">In</th><th className="py-2.5 px-5">Out</th><th className="py-2.5 px-5">Hours</th><th className="py-2.5 px-5">Status</th><th className="py-2.5 px-5 text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-gray-50">
              {filteredAll.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="py-2.5 px-5"><span className="font-medium text-gray-800">{r.employeeName || r.employeeId}</span><span className="text-[10px] text-gray-400 ml-1.5 font-mono">{r.employeeId}</span></td>
                  <td className="py-2.5 px-5 font-mono text-gray-600">{r.date}</td>
                  <td className="py-2.5 px-5 font-mono text-green-600">{r.checkIn || '--'}</td>
                  <td className="py-2.5 px-5 font-mono text-red-500">{r.checkOut || '--'}</td>
                  <td className="py-2.5 px-5 font-mono text-gray-600">{r.totalHours ? `${r.totalHours}h` : '--'}</td>
                  <td className="py-2.5 px-5">{statusBadge(r.status)}</td>
                  <td className="py-2.5 px-5 text-right"><button onClick={() => { setEditingRecord(r); setEditStatus(r.status); setEditNotes(r.notes || ''); }} className="px-2.5 py-1 bg-gray-100 hover:bg-indigo-600 hover:text-white text-gray-600 rounded-md text-[11px] flex items-center space-x-1 ml-auto transition-colors"><Edit2 className="w-3 h-3" /><span>Edit</span></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-xl border border-gray-200">
            <h3 className="font-bold text-base text-gray-900 mb-1">Edit Attendance</h3>
            <p className="text-xs text-gray-500 mb-4"><span className="font-semibold text-gray-700">{editingRecord.employeeName}</span> — {editingRecord.date}</p>
            <div className="space-y-3 text-xs">
              <div><label className="block text-gray-600 font-medium mb-1">Status</label><select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-indigo-400"><option value="Present">Present</option><option value="Half-day">Half-day</option><option value="Leave">Leave</option><option value="Absent">Absent</option></select></div>
              <div><label className="block text-gray-600 font-medium mb-1">Notes</label><input type="text" placeholder="Reason for change..." value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-indigo-400" /></div>
              <div className="pt-3 flex items-center justify-end space-x-2">
                <button onClick={() => setEditingRecord(null)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg">Cancel</button>
                <button onClick={handleSaveEdit} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
