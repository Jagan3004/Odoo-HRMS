import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { LeaveRequest, LeaveType } from '../types';
import { CalendarDays, PlusCircle, Clock, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { PageInsights } from '../components/PageInsights';

export const Leaves: React.FC = () => {
  const { user } = useAuth();
  const [leaveBalance, setLeaveBalance] = useState({ paidLeave: 0, sickLeave: 0, unpaidLeave: 0 });
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);
  const [allLeaves, setAllLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>('Paid');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [applyError, setApplyError] = useState<string | null>(null);
  const [reviewingLeave, setReviewingLeave] = useState<LeaveRequest | null>(null);
  const [adminComment, setAdminComment] = useState('');

  const fetchData = async () => {
    try { const my = await apiRequest('/leaves/my'); setLeaveBalance(my.balance); setMyLeaves(my.requests); if (user?.role === 'Admin') { const all = await apiRequest<LeaveRequest[]>('/leaves/all'); setAllLeaves(all); } } catch (err) { console.error(err); } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, [user]);

  const handleApply = async (e: React.FormEvent) => { e.preventDefault(); setApplyError(null); try { await apiRequest('/leaves/apply', 'POST', { leaveType, startDate, endDate, reason }); setShowApplyModal(false); setReason(''); await fetchData(); } catch (err: any) { setApplyError(err.message); } };
  const handleReview = async (status: 'Approved' | 'Rejected') => { if (!reviewingLeave) return; try { await apiRequest(`/leaves/${reviewingLeave.id}/review`, 'PUT', { status, adminComment }); setReviewingLeave(null); setAdminComment(''); await fetchData(); } catch (err: any) { alert(err.message); } };

  const statusBadge = (s: string) => {
    const m: Record<string, string> = { Approved: 'bg-green-50 text-green-700 border-green-200', Rejected: 'bg-red-50 text-red-700 border-red-200', Pending: 'bg-amber-50 text-amber-700 border-amber-200' };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${m[s] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>{s}</span>;
  };

  const myPending = myLeaves.filter((leave) => leave.status === 'Pending').length;
  const myApproved = myLeaves.filter((leave) => leave.status === 'Approved').length;
  const adminPending = allLeaves.filter((leave) => leave.status === 'Pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><CalendarDays className="w-6 h-6 text-pink-500" /> Leave Management</h1>
          <p className="text-sm text-gray-500 mt-1">Submit time-off requests and manage approval workflows.</p>
        </div>
        <button onClick={() => setShowApplyModal(true)} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center space-x-2 transition-all"><PlusCircle className="w-4 h-4" /><span>Apply for Leave</span></button>
      </div>

      <PageInsights
        eyebrow="Leave insights"
        title="Time-off at a glance"
        description="Track balances, pending requests, and the current approval load without digging into the tables."
        icon={CalendarDays}
        cards={user?.role === 'Admin' ? [
          { label: 'Total requests', value: String(allLeaves.length), note: 'Requests currently in the HR queue', icon: CalendarDays, tone: 'indigo' },
          { label: 'Pending approvals', value: String(adminPending), note: 'Needs review from the HR team', icon: AlertCircle, tone: 'amber' },
          { label: 'Reviewed requests', value: String(allLeaves.length - adminPending), note: 'Already processed by HR', icon: CheckCircle2, tone: 'emerald' },
          { label: 'Available balance', value: `${leaveBalance.paidLeave + leaveBalance.sickLeave}d`, note: 'Combined paid and sick leave', icon: Clock, tone: 'cyan' },
        ] : [
          { label: 'Leave balance', value: `${leaveBalance.paidLeave + leaveBalance.sickLeave}d`, note: 'Paid and sick leave available', icon: CheckCircle2, tone: 'indigo' },
          { label: 'Pending requests', value: String(myPending), note: 'Waiting for HR approval', icon: AlertCircle, tone: 'amber' },
          { label: 'Approved requests', value: String(myApproved), note: 'Completed leave applications', icon: CalendarDays, tone: 'emerald' },
          { label: 'Total requests', value: String(myLeaves.length), note: 'Full leave history on record', icon: Clock, tone: 'cyan' },
        ]}
      />

      {/* Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Paid Leave', value: leaveBalance.paidLeave, icon: CheckCircle2, color: 'green' },
          { label: 'Sick Leave', value: leaveBalance.sickLeave, icon: Clock, color: 'indigo' },
          { label: 'Unpaid Leave', value: 'Available', icon: CalendarDays, color: 'purple' },
        ].map((b) => { const Icon = b.icon; return (
          <div key={b.label} className="stat-card p-5 rounded-xl flex items-center justify-between">
            <div><p className="text-xs text-gray-500 font-medium">{b.label}</p><p className="text-2xl font-bold text-gray-900 mt-1">{b.value} {typeof b.value === 'number' && <span className="text-xs font-normal text-gray-400">days</span>}</p></div>
            <div className={`p-3 bg-${b.color}-50 rounded-lg border border-${b.color}-100`}><Icon className={`w-5 h-5 text-${b.color}-600`} /></div>
          </div>
        ); })}
      </div>

      {/* Admin Queue */}
      {user?.role === 'Admin' && (
        <div className="panel-elevated rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-sm text-gray-800 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-500" /> Leave Applications (HR Queue)</h3></div>
          <table className="w-full text-left text-xs">
            <thead><tr className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider text-[10px]"><th className="py-2.5 px-5">Employee</th><th className="py-2.5 px-5">Type</th><th className="py-2.5 px-5">Dates</th><th className="py-2.5 px-5">Days</th><th className="py-2.5 px-5">Reason</th><th className="py-2.5 px-5">Status</th><th className="py-2.5 px-5 text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-gray-50">
              {allLeaves.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="py-2.5 px-5"><span className="font-medium text-gray-800">{r.employeeName}</span><br /><span className="text-[10px] text-gray-400 font-mono">{r.employeeId} · {r.department}</span></td>
                  <td className="py-2.5 px-5"><span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium text-[10px]">{r.leaveType}</span></td>
                  <td className="py-2.5 px-5 font-mono text-gray-600">{r.startDate} → {r.endDate}</td>
                  <td className="py-2.5 px-5 font-semibold text-indigo-600">{r.totalDays}d</td>
                  <td className="py-2.5 px-5 text-gray-600 max-w-[200px] truncate">{r.reason}</td>
                  <td className="py-2.5 px-5">{statusBadge(r.status)}</td>
                  <td className="py-2.5 px-5 text-right">{r.status === 'Pending' ? (<button onClick={() => setReviewingLeave(r)} className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-md text-[11px] shadow-sm">Review</button>) : (<span className="text-[10px] text-gray-400 italic">Reviewed</span>)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* My Leaves */}
      <div className="panel-elevated rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-sm text-gray-800 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-indigo-500" /> My Leave History</h3></div>
        <table className="w-full text-left text-xs">
          <thead><tr className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider text-[10px]"><th className="py-2.5 px-5">Type</th><th className="py-2.5 px-5">Dates</th><th className="py-2.5 px-5">Days</th><th className="py-2.5 px-5">Reason</th><th className="py-2.5 px-5">Status</th><th className="py-2.5 px-5">HR Comment</th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {myLeaves.length === 0 ? <tr><td colSpan={6} className="py-8 text-center text-gray-400">No leave requests submitted.</td></tr> : myLeaves.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50/50"><td className="py-2.5 px-5 font-medium text-gray-800">{r.leaveType}</td><td className="py-2.5 px-5 font-mono text-gray-600">{r.startDate} → {r.endDate}</td><td className="py-2.5 px-5 font-semibold text-indigo-600">{r.totalDays}d</td><td className="py-2.5 px-5 text-gray-600">{r.reason}</td><td className="py-2.5 px-5">{statusBadge(r.status)}</td><td className="py-2.5 px-5 text-gray-400 italic text-[11px]">{r.adminComment || '--'}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-xl border border-gray-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100"><h3 className="font-bold text-base text-gray-900 flex items-center gap-2"><CalendarDays className="w-5 h-5 text-pink-500" /> Apply for Leave</h3><button onClick={() => setShowApplyModal(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"><X className="w-5 h-5" /></button></div>
            {applyError && <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">{applyError}</div>}
            <form onSubmit={handleApply} className="mt-4 space-y-4 text-xs">
              <div><label className="block text-gray-600 font-medium mb-1">Leave Type</label><select value={leaveType} onChange={(e) => setLeaveType(e.target.value as any)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-indigo-400"><option value="Paid">Paid Leave ({leaveBalance.paidLeave} left)</option><option value="Sick">Sick Leave ({leaveBalance.sickLeave} left)</option><option value="Unpaid">Unpaid Leave</option></select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-gray-600 font-medium mb-1">Start Date</label><input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-indigo-400" /></div>
                <div><label className="block text-gray-600 font-medium mb-1">End Date</label><input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-indigo-400" /></div>
              </div>
              <div><label className="block text-gray-600 font-medium mb-1">Reason</label><textarea rows={3} required placeholder="State the reason..." value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-indigo-400" /></div>
              <div className="pt-3 flex items-center justify-end space-x-2">
                <button type="button" onClick={() => setShowApplyModal(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewingLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-xl border border-gray-200">
            <h3 className="font-bold text-base text-gray-900 mb-2">Review Leave Request</h3>
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs space-y-1 mb-4">
              <p className="text-gray-800"><span className="font-bold">{reviewingLeave.employeeName}</span> — {reviewingLeave.department}</p>
              <p className="text-gray-500">Type: <span className="text-indigo-600 font-semibold">{reviewingLeave.leaveType}</span> · {reviewingLeave.totalDays} day(s) ({reviewingLeave.startDate} to {reviewingLeave.endDate})</p>
              <p className="text-gray-600 mt-1">"{reviewingLeave.reason}"</p>
            </div>
            <div className="space-y-3 text-xs">
              <div><label className="block text-gray-600 font-medium mb-1">HR Comment</label><input type="text" placeholder="Optional comment..." value={adminComment} onChange={(e) => setAdminComment(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-indigo-400" /></div>
              <div className="pt-3 flex items-center justify-end space-x-2">
                <button onClick={() => setReviewingLeave(null)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg">Cancel</button>
                <button onClick={() => handleReview('Rejected')} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm">Reject</button>
                <button onClick={() => handleReview('Approved')} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-sm">Approve</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
