import React, { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { Payslip, SalaryStructure } from '../types';
import { Download, Eye, FilePlus2, ReceiptText, Save, Search, WalletCards, X } from 'lucide-react';
import { EmptyState, LoadingState, PageHeader, SectionCard, StatusBadge } from '../components/UiPrimitives';

interface PayrollOverviewItem {
  employeeId: string; id: string; name: string; department: string; designation: string; salaryStructure: SalaryStructure; latestPayslip: Payslip | null; totalPayslips: number;
}

const money = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const currentMonth = () => new Date().toISOString().slice(0, 7);
const totalEarnings = (salary: SalaryStructure) => salary.basic + salary.hra + salary.specialAllowance + salary.conveyance;
const totalDeductions = (salary: SalaryStructure) => salary.pfDeduction + salary.taxDeduction;

const downloadPayslip = (payslip: Payslip) => {
  const salary = payslip.salaryStructure;
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const addLine = (label: string, value: string, y: number, emphasis = false) => {
    pdf.setFont('helvetica', emphasis ? 'bold' : 'normal'); pdf.setFontSize(emphasis ? 11 : 10); pdf.setTextColor(emphasis ? 15 : 71, emphasis ? 23 : 85, emphasis ? 42 : 100);
    pdf.text(label, 56, y); pdf.text(value, 540, y, { align: 'right' });
  };
  pdf.setFillColor(8, 145, 178); pdf.rect(0, 0, 595, 116, 'F');
  pdf.setTextColor(255, 255, 255); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(25); pdf.text('DAYFLOW', 56, 60); pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.text('PAY STATEMENT', 56, 80);
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(15); pdf.text(payslip.month.toUpperCase(), 540, 60, { align: 'right' }); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.text(`Issued ${payslip.issuedDate}`, 540, 80, { align: 'right' });
  pdf.setTextColor(71, 85, 105); pdf.setFontSize(10); pdf.text(`Employee ID: ${payslip.employeeId}`, 56, 150); pdf.text(`Paid days: ${payslip.paidDays}`, 56, 170);
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(15, 23, 42); pdf.text('EARNINGS', 56, 215); pdf.setDrawColor(226, 232, 240); pdf.line(56, 224, 540, 224);
  [['Basic salary', salary.basic], ['House rent allowance', salary.hra], ['Special allowance', salary.specialAllowance], ['Conveyance', salary.conveyance]].forEach(([label, amount], index) => addLine(String(label), `INR ${money.format(Number(amount))}`, 250 + index * 26));
  pdf.setDrawColor(203, 213, 225); pdf.line(56, 362, 540, 362); addLine('Gross earnings', `INR ${money.format(salary.grossSalary)}`, 385, true);
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(15, 23, 42); pdf.text('DEDUCTIONS', 56, 435); pdf.setDrawColor(226, 232, 240); pdf.line(56, 444, 540, 444);
  [['Provident fund', salary.pfDeduction], ['Tax deduction', salary.taxDeduction]].forEach(([label, amount], index) => addLine(String(label), `INR ${money.format(Number(amount))}`, 470 + index * 26));
  pdf.setFillColor(236, 254, 255); pdf.roundedRect(56, 545, 484, 56, 10, 10, 'F'); addLine('NET PAY', `INR ${money.format(salary.netSalary)}`, 579, true);
  pdf.setTextColor(100, 116, 139); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.text('This is a system-generated pay statement from Dayflow HRMS.', 56, 755);
  pdf.save(`dayflow-payslip-${payslip.employeeId}-${payslip.monthCode}.pdf`);
};

export const Payroll: React.FC = () => {
  const { user } = useAuth();
  const [myPayslips, setMyPayslips] = useState<Payslip[]>([]);
  const [mySalary, setMySalary] = useState<SalaryStructure | null>(null);
  const [overview, setOverview] = useState<PayrollOverviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Payslip | null>(null);
  const [editing, setEditing] = useState<PayrollOverviewItem | null>(null);
  const [salaryForm, setSalaryForm] = useState<SalaryStructure>({ basic: 0, hra: 0, specialAllowance: 0, conveyance: 0, pfDeduction: 0, taxDeduction: 0, grossSalary: 0, netSalary: 0 });
  const [generateMonth, setGenerateMonth] = useState(currentMonth());
  const [query, setQuery] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      const mine = await apiRequest<{ currentSalaryStructure: SalaryStructure | null; payslips: Payslip[] }>('/payroll/my');
      setMySalary(mine.currentSalaryStructure); setMyPayslips(mine.payslips);
      if (user?.role === 'Admin') setOverview(await apiRequest<PayrollOverviewItem[]>('/payroll/all'));
    } catch (error: any) { setMessage({ tone: 'error', text: error.message || 'Unable to load payroll information.' }); } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, [user?.role]);

  const generatePayslips = async () => {
    if (!generateMonth) return;
    setGenerating(true); setMessage(null);
    try {
      const [year, month] = generateMonth.split('-').map(Number);
      const label = new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      const response = await apiRequest<{ message: string }>('/payroll/generate', 'POST', { month: label, monthCode: generateMonth });
      setMessage({ tone: 'success', text: response.message }); await fetchData();
    } catch (error: any) { setMessage({ tone: 'error', text: error.message || 'Unable to generate payslips.' }); } finally { setGenerating(false); }
  };

  const editSalary = (item: PayrollOverviewItem) => { setEditing(item); setSalaryForm({ ...item.salaryStructure }); };
  const setAmount = (field: keyof SalaryStructure, value: number) => setSalaryForm((salary) => {
    const next = { ...salary, [field]: value };
    next.grossSalary = totalEarnings(next); next.netSalary = next.grossSalary - totalDeductions(next);
    return next;
  });
  const saveSalary = async () => {
    if (!editing) return;
    setSaving(true);
    try { await apiRequest(`/payroll/salary-structure/${editing.id}`, 'PUT', salaryForm); setEditing(null); setMessage({ tone: 'success', text: `Salary structure saved for ${editing.name}.` }); await fetchData(); } catch (error: any) { setMessage({ tone: 'error', text: error.message || 'Unable to save salary changes.' }); } finally { setSaving(false); }
  };
  const visibleOverview = useMemo(() => overview.filter((item) => !query || [item.name, item.employeeId, item.department, item.designation].some((value) => value.toLowerCase().includes(query.toLowerCase()))), [overview, query]);
  const exportOverview = () => {
    const rows = [['Employee ID', 'Employee', 'Department', 'Basic', 'Gross', 'Deductions', 'Net'], ...overview.map((item) => [item.employeeId, item.name, item.department, item.salaryStructure.basic, item.salaryStructure.grossSalary, totalDeductions(item.salaryStructure), item.salaryStructure.netSalary])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n'); const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = `dayflow-payroll-${generateMonth}.csv`; link.click(); URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingState label="Loading payroll…" />;
  const currentSalaryItems = mySalary ? [{ label: 'Basic salary', value: mySalary.basic, note: 'Fixed monthly base', color: 'text-cyan-700 bg-cyan-50 border-cyan-100' }, { label: 'Gross earnings', value: mySalary.grossSalary, note: 'Before deductions', color: 'text-violet-700 bg-violet-50 border-violet-100' }, { label: 'Deductions', value: totalDeductions(mySalary), note: 'PF and tax', color: 'text-rose-700 bg-rose-50 border-rose-100' }, { label: 'Net pay', value: mySalary.netSalary, note: 'Expected monthly pay', color: 'text-emerald-700 bg-emerald-50 border-emerald-100' }] : [];

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Payroll & payslips" title="Clear, reliable compensation" description={user?.role === 'Admin' ? 'Maintain salary structures and issue consistent monthly pay statements for every employee.' : 'Review your monthly salary structure and download your official pay statements.'} icon={WalletCards} actions={user?.role === 'Admin' ? <><button onClick={exportOverview} className="secondary-button"><Download className="h-3.5 w-3.5" />Export payroll</button><div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm"><input type="month" className="w-34 border-0 bg-transparent px-2 text-xs font-semibold text-slate-600 outline-none" value={generateMonth} onChange={(event) => setGenerateMonth(event.target.value)} /><button onClick={generatePayslips} disabled={generating} className="primary-button px-3 py-2">{generating ? 'Generating…' : <><FilePlus2 className="h-3.5 w-3.5" />Generate</>}</button></div></> : undefined} />
      {message && <div className={`rounded-xl border px-4 py-3 text-xs font-semibold ${message.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{message.text}</div>}
      {mySalary && <section className="surface-card overflow-hidden"><div className="flex flex-col justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-cyan-50/70 to-blue-50/60 px-5 py-4 sm:flex-row sm:items-center sm:px-6"><div><h2 className="text-sm font-extrabold text-slate-900">My monthly compensation</h2><p className="mt-1 text-xs text-slate-500">Your current salary structure. Payroll changes are managed by HR.</p></div><StatusBadge label="Read only" tone="neutral" /></div><div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">{currentSalaryItems.map(({ label, value, note, color }) => <div key={label} className={`rounded-2xl border p-4 ${color}`}><p className="text-xs font-bold opacity-80">{label}</p><p className="mt-2 font-mono text-xl font-extrabold">₹{money.format(value)}</p><p className="mt-2 text-[10px] opacity-75">{note}</p></div>)}</div></section>}

      {user?.role === 'Admin' && <SectionCard title="Salary structures" description="Each change updates the employee’s current salary. Existing payslips remain unchanged snapshots."><div className="border-b border-slate-100 p-4 sm:p-5"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input className="input-field pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search employee, team, or title…" /></div></div>{visibleOverview.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Employee</th><th>Department</th><th>Basic</th><th>Gross</th><th>Deductions</th><th>Net pay</th><th>Latest payslip</th><th className="text-right">Manage</th></tr></thead><tbody>{visibleOverview.map((item) => <tr key={item.id}><td><p className="font-extrabold text-slate-800">{item.name}</p><p className="mt-1 font-mono text-[10px] text-slate-400">{item.employeeId}</p></td><td><p className="font-semibold text-slate-700">{item.department}</p><p className="mt-1 text-[10px] text-slate-400">{item.designation}</p></td><td className="font-mono text-slate-700">₹{money.format(item.salaryStructure.basic)}</td><td className="font-mono text-slate-700">₹{money.format(item.salaryStructure.grossSalary)}</td><td className="font-mono text-rose-600">₹{money.format(totalDeductions(item.salaryStructure))}</td><td className="font-mono font-extrabold text-emerald-700">₹{money.format(item.salaryStructure.netSalary)}</td><td>{item.latestPayslip ? <button onClick={() => setViewing(item.latestPayslip)} className="text-xs font-bold text-cyan-700 hover:text-cyan-800">{item.latestPayslip.month}</button> : <span className="text-xs text-slate-400">Not generated</span>}</td><td className="text-right"><button onClick={() => editSalary(item)} className="secondary-button px-2.5 py-1.5">Edit</button></td></tr>)}</tbody></table></div> : <EmptyState title="No salary structures found" description="Try a different employee search." />}</SectionCard>}

      <SectionCard title="My pay statements" description="A pay statement is a fixed record of the salary and deductions for that month.">{myPayslips.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Pay period</th><th>Paid days</th><th>Gross earnings</th><th>Deductions</th><th>Net pay</th><th>Issued</th><th>Status</th><th className="text-right">Statement</th></tr></thead><tbody>{myPayslips.map((payslip) => <tr key={payslip.id}><td className="font-extrabold text-slate-800">{payslip.month}</td><td className="font-mono text-slate-600">{payslip.paidDays}</td><td className="font-mono text-slate-700">₹{money.format(payslip.salaryStructure.grossSalary)}</td><td className="font-mono text-rose-600">₹{money.format(totalDeductions(payslip.salaryStructure))}</td><td className="font-mono font-extrabold text-emerald-700">₹{money.format(payslip.salaryStructure.netSalary)}</td><td className="text-slate-500">{payslip.issuedDate}</td><td><StatusBadge label={payslip.status} tone={payslip.status === 'Paid' ? 'success' : 'warning'} /></td><td className="text-right"><button onClick={() => setViewing(payslip)} className="secondary-button px-2.5 py-1.5"><Eye className="h-3.5 w-3.5" />View</button></td></tr>)}</tbody></table></div> : <EmptyState title="No pay statements available" description={user?.role === 'Admin' ? 'Generate payslips for a month to create pay statements.' : 'Your issued pay statements will appear here.'} />}</SectionCard>

      {viewing && <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"><div className="modal-card max-h-[92vh] w-full max-w-2xl overflow-y-auto"><div className="flex items-start justify-between border-b border-slate-100 bg-slate-950 p-5 text-white"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-cyan-300">Dayflow pay statement</p><h2 className="mt-1 text-xl font-extrabold">{viewing.month}</h2><p className="mt-1 text-xs text-slate-300">Employee ID · {viewing.employeeId}</p></div><button onClick={() => setViewing(null)} className="rounded-xl p-2 text-slate-300 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button></div><div className="space-y-5 p-5 sm:p-6"><div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-xs"><div><p className="text-slate-400">Pay period</p><p className="mt-1 font-extrabold text-slate-800">{viewing.month}</p></div><div><p className="text-slate-400">Paid days</p><p className="mt-1 font-extrabold text-slate-800">{viewing.paidDays}</p></div><div><p className="text-slate-400">Issued on</p><p className="mt-1 font-extrabold text-slate-800">{viewing.issuedDate}</p></div><div><p className="text-slate-400">Status</p><div className="mt-1"><StatusBadge label={viewing.status} tone={viewing.status === 'Paid' ? 'success' : 'warning'} /></div></div></div><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4"><p className="text-xs font-extrabold text-emerald-800">Earnings</p><div className="mt-3 space-y-2 text-xs text-slate-600">{[['Basic salary', viewing.salaryStructure.basic], ['HRA', viewing.salaryStructure.hra], ['Special allowance', viewing.salaryStructure.specialAllowance], ['Conveyance', viewing.salaryStructure.conveyance]].map(([label, amount]) => <p key={String(label)} className="flex justify-between gap-3"><span>{label}</span><span className="font-mono font-semibold text-slate-800">₹{money.format(Number(amount))}</span></p>)}<p className="flex justify-between border-t border-emerald-200 pt-2 font-extrabold text-emerald-900"><span>Gross earnings</span><span className="font-mono">₹{money.format(viewing.salaryStructure.grossSalary)}</span></p></div></div><div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4"><p className="text-xs font-extrabold text-rose-800">Deductions</p><div className="mt-3 space-y-2 text-xs text-slate-600"><p className="flex justify-between gap-3"><span>Provident fund</span><span className="font-mono font-semibold text-slate-800">₹{money.format(viewing.salaryStructure.pfDeduction)}</span></p><p className="flex justify-between gap-3"><span>Tax deduction</span><span className="font-mono font-semibold text-slate-800">₹{money.format(viewing.salaryStructure.taxDeduction)}</span></p><p className="flex justify-between border-t border-rose-200 pt-2 font-extrabold text-rose-900"><span>Total deductions</span><span className="font-mono">₹{money.format(totalDeductions(viewing.salaryStructure))}</span></p></div></div></div><div className="flex items-center justify-between rounded-2xl border border-cyan-200 bg-cyan-50 p-4"><div><p className="text-xs font-bold text-cyan-800">Net pay</p><p className="mt-1 text-[10px] text-cyan-700">After all listed deductions</p></div><p className="font-mono text-xl font-extrabold text-cyan-900">₹{money.format(viewing.salaryStructure.netSalary)}</p></div><div className="flex justify-end gap-2"><button onClick={() => setViewing(null)} className="secondary-button">Close</button><button onClick={() => downloadPayslip(viewing)} className="primary-button"><Download className="h-3.5 w-3.5" />Download PDF</button></div></div></div></div>}

      {editing && <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"><div className="modal-card w-full max-w-lg"><div className="flex items-start justify-between border-b border-slate-100 p-5"><div><h2 className="text-lg font-extrabold text-slate-950">Edit salary structure</h2><p className="mt-1 text-xs text-slate-500">{editing.name} · {editing.employeeId}</p></div><button onClick={() => setEditing(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="space-y-4 p-5"><div className="grid grid-cols-2 gap-3">{(['basic', 'hra', 'specialAllowance', 'conveyance', 'pfDeduction', 'taxDeduction'] as const).map((field) => <div key={field}><label className="input-label">{field.replace(/([A-Z])/g, ' $1')}</label><input type="number" min="0" className="input-field" value={salaryForm[field]} onChange={(event) => setAmount(field, Number(event.target.value))} /></div>)}</div><div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs"><p className="text-slate-500">Gross earnings <b className="float-right font-mono text-slate-800">₹{money.format(salaryForm.grossSalary)}</b></p><p className="text-slate-500">Net pay <b className="float-right font-mono text-emerald-700">₹{money.format(salaryForm.netSalary)}</b></p></div><div className="flex justify-end gap-2 pt-2"><button onClick={() => setEditing(null)} className="secondary-button">Cancel</button><button onClick={saveSalary} disabled={saving} className="primary-button"><Save className="h-3.5 w-3.5" />{saving ? 'Saving…' : 'Save structure'}</button></div></div></div></div>}
    </div>
  );
};
