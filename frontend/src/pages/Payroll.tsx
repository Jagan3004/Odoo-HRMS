import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { Payslip, SalaryStructure, Employee } from '../types';
import { CreditCard, Download, Eye, X, DollarSign, Minus, Plus, Save } from 'lucide-react';

interface PayrollOverviewItem {
  employeeId: string;
  id: string;
  name: string;
  department: string;
  designation: string;
  salaryStructure: SalaryStructure;
  latestPayslip: Payslip | null;
  totalPayslips: number;
}

export const Payroll: React.FC = () => {
  const { user, employee } = useAuth();
  const [myPayslips, setMyPayslips] = useState<Payslip[]>([]);
  const [mySalary, setMySalary] = useState<SalaryStructure | null>(null);
  const [payrollOverview, setPayrollOverview] = useState<PayrollOverviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewSlip, setViewSlip] = useState<Payslip | null>(null);
  const [editingSalary, setEditingSalary] = useState<PayrollOverviewItem | null>(null);
  const [salaryForm, setSalaryForm] = useState<SalaryStructure>({ basic: 0, hra: 0, specialAllowance: 0, conveyance: 0, grossSalary: 0, pfDeduction: 0, taxDeduction: 0, netSalary: 0 });
  const [generateMonth, setGenerateMonth] = useState('');
  const [generateLoading, setGenerateLoading] = useState(false);

  const fetchData = async () => {
    try {
      // Employee payslip data
      const my = await apiRequest<{ currentSalaryStructure: SalaryStructure | null; payslips: Payslip[] }>('/payroll/my');
      setMySalary(my.currentSalaryStructure);
      setMyPayslips(my.payslips);
      // Admin payroll overview
      if (user?.role === 'Admin') {
        const all = await apiRequest<PayrollOverviewItem[]>('/payroll/all');
        setPayrollOverview(all);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, [user]);

  const handleGeneratePayslips = async () => {
    if (!generateMonth) {
      // Default to current month
      const now = new Date();
      const monthCode = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      setGenerateLoading(true);
      try { await apiRequest('/payroll/generate', 'POST', { month: monthLabel, monthCode }); await fetchData(); } catch (err: any) { alert(err.message); }
      finally { setGenerateLoading(false); }
      return;
    }
    // Use provided month
    const [y, m] = generateMonth.split('-');
    const d = new Date(Number(y), Number(m) - 1);
    const monthLabel = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    setGenerateLoading(true);
    try { await apiRequest('/payroll/generate', 'POST', { month: monthLabel, monthCode: generateMonth }); await fetchData(); } catch (err: any) { alert(err.message); }
    finally { setGenerateLoading(false); }
  };

  const handleSaveSalary = async () => {
    if (!editingSalary) return;
    try {
      await apiRequest(`/payroll/salary-structure/${editingSalary.id}`, 'PUT', salaryForm);
      setEditingSalary(null);
      await fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const downloadPayslip = (payslip: Payslip) => {
    const sal = payslip.salaryStructure;
    const content = `
DAYFLOW HRMS — PAY SLIP
${'═'.repeat(50)}
Employee ID: ${payslip.employeeId}
Period: ${payslip.month}
Paid Days: ${payslip.paidDays}
Date Issued: ${payslip.issuedDate}
${'─'.repeat(50)}
EARNINGS
  Basic Salary        $${sal.basic.toLocaleString()}
  HRA                 $${sal.hra.toLocaleString()}
  Special Allowance   $${sal.specialAllowance.toLocaleString()}
  Conveyance          $${sal.conveyance.toLocaleString()}
  Gross Salary        $${sal.grossSalary.toLocaleString()}
${'─'.repeat(50)}
DEDUCTIONS
  PF Deduction        $${sal.pfDeduction.toLocaleString()}
  Tax Deduction       $${sal.taxDeduction.toLocaleString()}
${'─'.repeat(50)}
NET PAY:              $${sal.netSalary.toLocaleString()}
${'═'.repeat(50)}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `payslip_${payslip.employeeId}_${payslip.monthCode}.txt`; a.click(); URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-200 border-t-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><CreditCard className="w-6 h-6 text-purple-600" /> Payroll & Payslips</h1>
          <p className="text-sm text-gray-500 mt-1">View salary structures, generate payslips, and download reports.</p>
        </div>
        {user?.role === 'Admin' && (
          <div className="flex items-center space-x-2">
            <input type="month" value={generateMonth} onChange={(e) => setGenerateMonth(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-indigo-400" />
            <button onClick={handleGeneratePayslips} disabled={generateLoading}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center space-x-2 transition-all disabled:opacity-50">
              <DollarSign className="w-4 h-4" /><span>{generateLoading ? 'Generating...' : 'Generate Payslips'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Current Salary (Employee View) */}
      {mySalary && (
        <div className="panel-elevated rounded-xl p-6">
          <h3 className="font-semibold text-sm text-gray-900 mb-4">My Salary Structure</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Basic', value: mySalary.basic, icon: DollarSign, color: 'indigo' },
              { label: 'HRA', value: mySalary.hra, icon: Plus, color: 'green' },
              { label: 'Deductions', value: mySalary.pfDeduction + mySalary.taxDeduction, icon: Minus, color: 'red' },
              { label: 'Net Pay', value: mySalary.netSalary, icon: CreditCard, color: 'purple' },
            ].map((s) => { const Icon = s.icon; return (
              <div key={s.label} className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Icon className={`w-5 h-5 text-${s.color}-500 mx-auto mb-2`} />
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5 font-mono">${s.value.toLocaleString()}</p>
              </div>
            ); })}
          </div>
        </div>
      )}

      {/* Admin Salary Structures Table */}
      {user?.role === 'Admin' && payrollOverview.length > 0 && (
        <div className="panel-elevated rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-sm text-gray-800 flex items-center gap-2"><DollarSign className="w-4 h-4 text-amber-500" /> Salary Structures</h3></div>
          <table className="w-full text-left text-xs">
            <thead><tr className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider text-[10px]"><th className="py-2.5 px-5">Employee</th><th className="py-2.5 px-5">Department</th><th className="py-2.5 px-5">Basic</th><th className="py-2.5 px-5">Gross</th><th className="py-2.5 px-5">Net</th><th className="py-2.5 px-5 text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-gray-50">
              {payrollOverview.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="py-2.5 px-5"><span className="font-medium text-gray-800">{item.name}</span><span className="text-[10px] text-gray-400 ml-1.5 font-mono">{item.employeeId}</span></td>
                  <td className="py-2.5 px-5 text-gray-600">{item.department}</td>
                  <td className="py-2.5 px-5 font-mono text-gray-700">${item.salaryStructure.basic.toLocaleString()}</td>
                  <td className="py-2.5 px-5 font-mono text-gray-700">${item.salaryStructure.grossSalary.toLocaleString()}</td>
                  <td className="py-2.5 px-5 font-mono font-semibold text-indigo-600">${item.salaryStructure.netSalary.toLocaleString()}</td>
                  <td className="py-2.5 px-5 text-right">
                    <button onClick={() => { setEditingSalary(item); setSalaryForm({ ...item.salaryStructure }); }}
                      className="px-3 py-1 bg-gray-100 hover:bg-indigo-600 hover:text-white text-gray-600 rounded-md text-[11px] transition-colors">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payslip History */}
      <div className="panel-elevated rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-sm text-gray-800 flex items-center gap-2"><CreditCard className="w-4 h-4 text-indigo-500" /> Payslip History</h3></div>
        <table className="w-full text-left text-xs">
          <thead><tr className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider text-[10px]"><th className="py-2.5 px-5">Period</th><th className="py-2.5 px-5">Paid Days</th><th className="py-2.5 px-5">Gross</th><th className="py-2.5 px-5">Deductions</th><th className="py-2.5 px-5">Net</th><th className="py-2.5 px-5">Issued</th><th className="py-2.5 px-5">Status</th><th className="py-2.5 px-5 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {myPayslips.length === 0 ? <tr><td colSpan={8} className="py-8 text-center text-gray-400">No payslips generated yet. {user?.role === 'Admin' && 'Click "Generate Payslips" to create them.'}</td></tr> : myPayslips.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50/50">
                <td className="py-2.5 px-5 font-medium text-gray-800">{p.month}</td>
                <td className="py-2.5 px-5 text-gray-600">{p.paidDays}</td>
                <td className="py-2.5 px-5 font-mono text-gray-700">${p.salaryStructure.grossSalary.toLocaleString()}</td>
                <td className="py-2.5 px-5 font-mono text-red-500">-${(p.salaryStructure.pfDeduction + p.salaryStructure.taxDeduction).toLocaleString()}</td>
                <td className="py-2.5 px-5 font-mono font-semibold text-indigo-600">${p.salaryStructure.netSalary.toLocaleString()}</td>
                <td className="py-2.5 px-5 text-gray-400 font-mono">{p.issuedDate}</td>
                <td className="py-2.5 px-5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${p.status === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{p.status}</span></td>
                <td className="py-2.5 px-5 text-right space-x-1">
                  <button onClick={() => setViewSlip(p)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                  <button onClick={() => downloadPayslip(p)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"><Download className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Payslip Modal */}
      {viewSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg p-6 rounded-2xl shadow-xl border border-gray-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div><h3 className="font-bold text-base text-gray-900">Pay Statement</h3><p className="text-xs text-gray-500">{viewSlip.employeeId} — {viewSlip.month}</p></div>
              <button onClick={() => setViewSlip(null)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"><X className="w-5 h-5" /></button>
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-semibold text-gray-700 mb-2">Earnings</p>
                {[['Basic', viewSlip.salaryStructure.basic], ['HRA', viewSlip.salaryStructure.hra], ['Special Allowance', viewSlip.salaryStructure.specialAllowance], ['Conveyance', viewSlip.salaryStructure.conveyance]].map(([l, v]) => (
                  <div key={l as string} className="flex justify-between py-1 text-gray-600"><span>{l}</span><span className="font-mono font-medium text-gray-800">${(v as number).toLocaleString()}</span></div>
                ))}
                <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-semibold text-gray-800"><span>Gross Salary</span><span className="font-mono">${viewSlip.salaryStructure.grossSalary.toLocaleString()}</span></div>
              </div>
              <div className="p-3 bg-red-50/50 rounded-lg border border-red-100">
                <p className="font-semibold text-red-700 mb-2">Deductions</p>
                <div className="flex justify-between py-1 text-red-600"><span>PF</span><span className="font-mono">-${viewSlip.salaryStructure.pfDeduction.toLocaleString()}</span></div>
                <div className="flex justify-between py-1 text-red-600"><span>Tax</span><span className="font-mono">-${viewSlip.salaryStructure.taxDeduction.toLocaleString()}</span></div>
              </div>
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200 flex justify-between text-base font-bold text-indigo-800"><span>Net Pay</span><span className="font-mono">${viewSlip.salaryStructure.netSalary.toLocaleString()}</span></div>
              <div className="pt-2 flex justify-end"><button onClick={() => downloadPayslip(viewSlip)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1.5"><Download className="w-3.5 h-3.5" /><span>Download</span></button></div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Salary Modal */}
      {editingSalary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-xl border border-gray-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100"><h3 className="font-bold text-base text-gray-900">Edit Salary — {editingSalary.name}</h3><button onClick={() => setEditingSalary(null)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"><X className="w-5 h-5" /></button></div>
            <div className="mt-4 space-y-3 text-xs">
              {(['basic', 'hra', 'specialAllowance', 'conveyance', 'pfDeduction', 'taxDeduction'] as (keyof SalaryStructure)[]).map((field) => (
                <div key={field} className="flex items-center justify-between"><label className="text-gray-600 font-medium capitalize">{field.replace(/([A-Z])/g, ' $1')}</label><input type="number" value={salaryForm[field]} onChange={(e) => { const v = Number(e.target.value); const nf = { ...salaryForm, [field]: v }; nf.grossSalary = nf.basic + nf.hra + nf.specialAllowance + nf.conveyance; nf.netSalary = nf.grossSalary - nf.pfDeduction - nf.taxDeduction; setSalaryForm(nf); }} className="w-28 p-2 bg-gray-50 border border-gray-200 rounded-lg text-right font-mono text-gray-800 focus:outline-none focus:border-indigo-400" /></div>
              ))}
              <div className="border-t border-gray-200 pt-3 space-y-1">
                <div className="flex justify-between text-gray-600"><span>Gross</span><span className="font-mono font-medium text-gray-800">${salaryForm.grossSalary.toLocaleString()}</span></div>
                <div className="flex justify-between text-indigo-700 font-bold"><span>Net Pay</span><span className="font-mono">${salaryForm.netSalary.toLocaleString()}</span></div>
              </div>
              <div className="pt-3 flex items-center justify-end space-x-2">
                <button onClick={() => setEditingSalary(null)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg">Cancel</button>
                <button onClick={handleSaveSalary} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm flex items-center space-x-1.5"><Save className="w-3.5 h-3.5" /><span>Save</span></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
