import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { Employee, Role } from '../types';
import { Users, Search, UserPlus, Mail, Phone, Building, Briefcase, Calendar, X, Trash2, Shield } from 'lucide-react';
import { PageInsights } from '../components/PageInsights';

interface EmployeesProps { onSelectEmployee?: (emp: Employee) => void; setActiveTab?: (tab: string) => void; }

export const Employees: React.FC<EmployeesProps> = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmp, setNewEmp] = useState({ employeeId: '', name: '', email: '', password: 'emp123', role: 'Employee', designation: 'Software Engineer', department: 'Engineering', phone: '', address: '', basic: 5500, hra: 2200, specialAllowance: 1500 });
  const [formError, setFormError] = useState<string | null>(null);

  const fetchEmployees = async () => { try { const res = await apiRequest<Employee[]>('/employees'); setEmployees(res); } catch (err) { console.error(err); } finally { setLoading(false); } };
  useEffect(() => { fetchEmployees(); }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError(null);
    try {
      const gross = Number(newEmp.basic) + Number(newEmp.hra) + Number(newEmp.specialAllowance) + 400;
      await apiRequest('/employees', 'POST', { ...newEmp, employeeId: newEmp.employeeId || `EMP-${Math.floor(100 + Math.random() * 900)}`, salaryStructure: { basic: Number(newEmp.basic), hra: Number(newEmp.hra), specialAllowance: Number(newEmp.specialAllowance), conveyance: 400, pfDeduction: 700, taxDeduction: 800, grossSalary: gross, netSalary: gross - 1500 } });
      setShowAddModal(false); await fetchEmployees();
    } catch (err: any) { setFormError(err.message); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Remove ${name} from the system?`)) return;
    try { await apiRequest(`/employees/${id}`, 'DELETE'); await fetchEmployees(); } catch (err: any) { alert(err.message); }
  };

  const departments = ['All', ...Array.from(new Set(employees.map((e) => e.department)))];
  const adminCount = employees.filter((emp) => emp.role === 'Admin').length;
  const filtered = employees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = emp.name.toLowerCase().includes(q) || emp.email.toLowerCase().includes(q) || emp.employeeId.toLowerCase().includes(q) || emp.designation.toLowerCase().includes(q);
    return matchSearch && (selectedDept === 'All' || emp.department === selectedDept);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Users className="w-6 h-6 text-indigo-600" /> Employee Directory</h1>
          <p className="text-sm text-gray-500 mt-1">Manage staff profiles, departments, and onboarding.</p>
        </div>
        {user?.role === 'Admin' && (
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center space-x-2 transition-all">
            <UserPlus className="w-4 h-4" /><span>Add Employee</span>
          </button>
        )}
      </div>

      <PageInsights
        eyebrow="Directory insights"
        title="Quick employee snapshot"
        description="A fast summary of your workforce composition and the currently visible team slice."
        icon={Users}
        cards={[
          { label: 'Total employees', value: String(employees.length), note: 'Full workforce in the directory', icon: Users, tone: 'indigo' },
          { label: 'Departments', value: String(departments.filter((dept) => dept !== 'All').length), note: 'Organizational groups represented', icon: Building, tone: 'cyan' },
          { label: 'Admins', value: String(adminCount), note: 'Users with HR privileges', icon: Shield, tone: 'amber' },
          { label: 'Visible results', value: String(filtered.length), note: 'Matches from the current filters', icon: Search, tone: 'emerald' },
        ]}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input type="text" placeholder="Search by name, email, ID, or title..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all" />
        </div>
        <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}
          className="w-full sm:w-48 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
          {departments.map((dept) => (<option key={dept} value={dept}>{dept === 'All' ? 'All Departments' : dept}</option>))}
        </select>
      </div>

      {/* Employee Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]"><div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-200 border-t-indigo-600" /></div>
      ) : (
        <div className="panel-elevated rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-5">Employee</th>
                <th className="py-3 px-5">Department</th>
                <th className="py-3 px-5">Contact</th>
                <th className="py-3 px-5">Joined</th>
                <th className="py-3 px-5">Net Pay</th>
                {user?.role === 'Admin' && <th className="py-3 px-5 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-xs border border-indigo-100 shrink-0">
                        {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{emp.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono text-gray-400">{emp.employeeId}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${emp.role === 'Admin' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                            {emp.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <p className="text-sm text-gray-800">{emp.designation}</p>
                    <p className="text-xs text-gray-400">{emp.department}</p>
                  </td>
                  <td className="py-3.5 px-5">
                    <p className="text-xs text-gray-600 flex items-center gap-1"><Mail className="w-3 h-3 text-gray-400" /> {emp.email}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3 text-gray-400" /> {emp.phone}</p>
                  </td>
                  <td className="py-3.5 px-5 text-xs text-gray-500">{emp.joiningDate}</td>
                  <td className="py-3.5 px-5 text-sm font-semibold text-gray-800 font-mono">₹{emp.salaryStructure.netSalary.toLocaleString()}</td>
                  {user?.role === 'Admin' && (
                    <td className="py-3.5 px-5 text-right">
                      <button onClick={() => handleDelete(emp.id, emp.name)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors" title="Remove">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="py-12 text-center text-sm text-gray-400">No employees match your search criteria.</div>}
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg p-6 rounded-2xl shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2"><UserPlus className="w-5 h-5 text-indigo-600" /> Add New Employee</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            {formError && <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">{formError}</div>}
            <form onSubmit={handleAddEmployee} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-gray-600 font-medium mb-1">Employee ID</label><input type="text" required placeholder="EMP-105" value={newEmp.employeeId} onChange={(e) => setNewEmp({ ...newEmp, employeeId: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-indigo-400" /></div>
                <div><label className="block text-gray-600 font-medium mb-1">Full Name</label><input type="text" required placeholder="Marcus Vance" value={newEmp.name} onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-indigo-400" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-gray-600 font-medium mb-1">Email</label><input type="email" required placeholder="marcus@dayflow.com" value={newEmp.email} onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-indigo-400" /></div>
                <div><label className="block text-gray-600 font-medium mb-1">Password</label><input type="password" required value={newEmp.password} onChange={(e) => setNewEmp({ ...newEmp, password: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-indigo-400" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-gray-600 font-medium mb-1">Department</label><input type="text" required placeholder="Engineering" value={newEmp.department} onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-indigo-400" /></div>
                <div><label className="block text-gray-600 font-medium mb-1">Designation</label><input type="text" required placeholder="DevOps Specialist" value={newEmp.designation} onChange={(e) => setNewEmp({ ...newEmp, designation: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-indigo-400" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-gray-600 font-medium mb-1">Phone</label><input type="text" placeholder="+1 (555) 321-4321" value={newEmp.phone} onChange={(e) => setNewEmp({ ...newEmp, phone: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-indigo-400" /></div>
                <div><label className="block text-gray-600 font-medium mb-1">Role</label><select value={newEmp.role} onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value as any })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-indigo-400"><option value="Employee">Employee</option><option value="Admin">Admin / HR</option></select></div>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <span className="text-xs font-semibold text-gray-700 block mb-2">Salary Structure ($/mo)</span>
                <div className="grid grid-cols-3 gap-2">
                  <div><label className="block text-[10px] text-gray-400">Basic</label><input type="number" value={newEmp.basic} onChange={(e) => setNewEmp({ ...newEmp, basic: Number(e.target.value) })} className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900" /></div>
                  <div><label className="block text-[10px] text-gray-400">HRA</label><input type="number" value={newEmp.hra} onChange={(e) => setNewEmp({ ...newEmp, hra: Number(e.target.value) })} className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900" /></div>
                  <div><label className="block text-[10px] text-gray-400">Special Allow.</label><input type="number" value={newEmp.specialAllowance} onChange={(e) => setNewEmp({ ...newEmp, specialAllowance: Number(e.target.value) })} className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900" /></div>
                </div>
              </div>
              <div className="pt-4 flex items-center justify-end space-x-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm">Add Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
