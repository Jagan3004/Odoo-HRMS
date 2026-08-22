import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Shield, User, Key, Mail, ArrowRight, UserPlus } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, register, demoLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Admin' | 'Employee'>('Employee');
  const [department, setDepartment] = useState('Engineering');
  const [designation, setDesignation] = useState('Software Engineer');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        await register({ email, password, employeeId: employeeId || `EMP-${Math.floor(100 + Math.random() * 900)}`, name, role, department, designation });
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (demoRole: 'Admin' | 'Employee') => {
    setError(null);
    setLoading(true);
    try { await demoLogin(demoRole); } catch (err: any) { setError(err.message || 'Demo login failed'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 brand-gradient relative overflow-hidden flex-col justify-between p-12 text-white">
        <div>
          <div className="flex items-center space-x-3 mb-12">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight">Dayflow</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight max-w-lg">
            Streamline Your<br />HR Operations
          </h1>
          <p className="text-white/80 text-base mt-6 max-w-md leading-relaxed">
            A comprehensive Human Resource Management System for modern organizations. 
            Manage attendance, leaves, payroll, and employee records — all from one unified platform.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-sm text-white/70">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><Shield className="w-4 h-4" /></div>
            <span>Enterprise-grade security & role-based access</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-white/70">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><User className="w-4 h-4" /></div>
            <span>Multi-department employee management</span>
          </div>
        </div>

        {/* Decorative shapes */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-20 -right-20 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 py-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile brand header */}
          <div className="lg:hidden flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 rounded-xl brand-gradient flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">Dayflow HRMS</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">
            {isRegister ? 'Create Your Account' : 'Welcome Back'}
          </h2>
          <p className="text-sm text-gray-500 mt-1 mb-6">
            {isRegister ? 'Set up your employee profile to get started.' : 'Sign in to access your HR dashboard.'}
          </p>

          {/* Quick Demo Access — subtle, professional */}
          <div className="mb-6 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-indigo-700">Quick Demo Access</span>
              <span className="text-[10px] text-indigo-400 font-medium">For evaluation only</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => handleDemoClick('Admin')} disabled={loading}
                className="px-3 py-2 rounded-lg bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-sm">
                <Shield className="w-3.5 h-3.5" /><span>Admin / HR</span>
              </button>
              <button type="button" onClick={() => handleDemoClick('Employee')} disabled={loading}
                className="px-3 py-2 rounded-lg bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-sm">
                <User className="w-3.5 h-3.5" /><span>Employee</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <button type="button" onClick={() => setIsRegister(false)}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${!isRegister ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              Sign In
            </button>
            <button type="button" onClick={() => setIsRegister(true)}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${isRegister ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              Register
            </button>
          </div>

          {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input type="text" required placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Employee ID</label>
                    <input type="text" placeholder="EMP-105" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                    <select value={role} onChange={(e) => setRole(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                      <option value="Employee">Employee</option>
                      <option value="Admin">Admin / HR</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                    <input type="text" placeholder="Engineering" value={department} onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Designation</label>
                    <input type="text" placeholder="Frontend Developer" value={designation} onChange={(e) => setDesignation(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input type="email" required placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Key className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50">
              {loading ? <span>Please wait...</span> : isRegister ? (<><UserPlus className="w-4 h-4" /><span>Create Account</span></>) : (<><span>Sign In</span><ArrowRight className="w-4 h-4" /></>)}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
