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
    <div className="min-h-screen flex" style={{ background: '#fdf8f5' }}>
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(160deg, #1a0a1e 0%, #2f1840 60%, #3d1a47 100%)', borderRight: '1px solid #4a2558' }}>
        <div>
          <div className="flex items-center space-x-3 mb-12">
            <div className="w-10 h-10 rounded-xl brand-gradient flex items-center justify-center glow-apricot">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl" style={{ color: '#eee0f5', fontFamily: 'Cormorant Garamond, serif', fontSize: '22px' }}>Dayflow</span>
          </div>

          <h1 className="font-bold leading-tight max-w-lg" style={{ color: '#eee0f5', fontFamily: 'Cormorant Garamond, serif', fontSize: '54px', lineHeight: 1.1, letterSpacing: '-1px' }}>
            Streamline<br />Your <span style={{ color: '#F4A261', fontStyle: 'italic' }}>HR</span><br />Operations
          </h1>
          <p className="text-base mt-6 max-w-md leading-relaxed" style={{ color: '#7a5588' }}>
            A comprehensive HRMS for modern organizations.
            Attendance, leaves, payroll &amp; employee records — unified.
          </p>
        </div>

        <div className="space-y-3">
          {[{ icon: Shield, text: 'Enterprise-grade security & role-based access' }, { icon: User, text: 'Multi-department employee management' }].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center space-x-3 text-sm">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(244,162,97,0.15)', border: '1px solid rgba(244,162,97,0.25)' }}>
                <Icon className="w-4 h-4" style={{ color: '#F4A261' }} />
              </div>
              <span style={{ color: '#a07cae' }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Decorative orbs */}
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(244,162,97,0.08) 0%, transparent 70%)' }} />
        <div className="absolute top-24 -right-12 w-56 h-56 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(123,58,138,0.15) 0%, transparent 70%)' }} />
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 py-12" style={{ background: '#ffffff' }}>
        <div className="w-full max-w-md">
          {/* Mobile brand header */}
          <div className="lg:hidden flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 rounded-xl brand-gradient flex items-center justify-center glow-apricot">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl" style={{ color: '#eee0f5', fontFamily: 'Cormorant Garamond, serif', fontSize: '22px' }}>Dayflow HRMS</span>
          </div>

          <h2 className="text-2xl font-bold" style={{ color: '#2f1840', fontFamily: 'Cormorant Garamond, serif', fontSize: '30px' }}>
            {isRegister ? 'Create Your Account' : 'Welcome Back'}
          </h2>
          <p className="text-sm mt-1 mb-6" style={{ color: '#7a5588' }}>
            {isRegister ? 'Set up your employee profile to get started.' : 'Sign in to access your HR dashboard.'}
          </p>

          {/* Quick Demo Access */}
          <div className="mb-6 p-4 rounded-xl" style={{ background: 'rgba(244,162,97,0.08)', border: '1px solid rgba(244,162,97,0.25)' }}>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold" style={{ color: '#F4A261' }}>Quick Demo Access</span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(244,162,97,0.15)', color: '#e8855a', border: '1px solid rgba(244,162,97,0.2)' }}>Demo only</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => handleDemoClick('Admin')} disabled={loading}
                className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all"
                style={{ background: 'rgba(244,162,97,0.12)', border: '1px solid rgba(244,162,97,0.3)', color: '#F4A261' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,162,97,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,162,97,0.12)'; }}>
                <Shield className="w-3.5 h-3.5" /><span>Admin / HR</span>
              </button>
              <button type="button" onClick={() => handleDemoClick('Employee')} disabled={loading}
                className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all"
                style={{ background: 'rgba(122,85,136,0.2)', border: '1px solid rgba(122,85,136,0.35)', color: '#c4a8d0' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(122,85,136,0.35)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(122,85,136,0.2)'; }}>
                <User className="w-3.5 h-3.5" /><span>Employee</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl p-1 mb-6" style={{ background: '#f5eef8', border: '1px solid #dcc5ea' }}>
            <button type="button" onClick={() => setIsRegister(false)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all`}
              style={!isRegister ? { background: '#3d1a47', color: '#fff', boxShadow: '0 1px 4px rgba(61,26,71,0.3)' } : { color: '#9568ae' }}>
              Sign In
            </button>
            <button type="button" onClick={() => setIsRegister(true)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all`}
              style={isRegister ? { background: '#3d1a47', color: '#fff', boxShadow: '0 1px 4px rgba(61,26,71,0.3)' } : { color: '#9568ae' }}>
              Register
            </button>
          </div>

          {error && <div className="mb-4 p-3 rounded-lg text-xs font-medium" style={{ background: 'rgba(232,133,90,0.1)', border: '1px solid rgba(232,133,90,0.3)', color: '#e8855a' }}>{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#4a2558' }}>Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5" style={{ color: '#b894cc' }} />
                    <input type="text" required placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none"
                      style={{ background: '#fdf8f5', border: '1px solid #dcc5ea', color: '#2f1840' }}
                      onFocus={e => { e.target.style.borderColor = '#F4A261'; e.target.style.boxShadow = '0 0 0 3px rgba(244,162,97,0.15)'; }}
                      onBlur={e => { e.target.style.borderColor = '#dcc5ea'; e.target.style.boxShadow = 'none'; }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#4a2558' }}>Employee ID</label>
                    <input type="text" placeholder="EMP-105" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg text-sm transition-all focus:outline-none"
                      style={{ background: '#fdf8f5', border: '1px solid #dcc5ea', color: '#2f1840' }}
                      onFocus={e => { e.target.style.borderColor = '#F4A261'; e.target.style.boxShadow = '0 0 0 3px rgba(244,162,97,0.15)'; }}
                      onBlur={e => { e.target.style.borderColor = '#dcc5ea'; e.target.style.boxShadow = 'none'; }} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#4a2558' }}>Role</label>
                    <select value={role} onChange={(e) => setRole(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none transition-all"
                      style={{ background: '#fdf8f5', border: '1px solid #dcc5ea', color: '#2f1840' }}
                      onFocus={e => { e.target.style.borderColor = '#F4A261'; }}
                      onBlur={e => { e.target.style.borderColor = '#dcc5ea'; }}>
                      <option value="Employee">Employee</option>
                      <option value="Admin">Admin / HR</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#4a2558' }}>Department</label>
                    <input type="text" placeholder="Engineering" value={department} onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg text-sm transition-all focus:outline-none"
                      style={{ background: '#fdf8f5', border: '1px solid #dcc5ea', color: '#2f1840' }}
                      onFocus={e => { e.target.style.borderColor = '#F4A261'; e.target.style.boxShadow = '0 0 0 3px rgba(244,162,97,0.15)'; }}
                      onBlur={e => { e.target.style.borderColor = '#dcc5ea'; e.target.style.boxShadow = 'none'; }} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#4a2558' }}>Designation</label>
                    <input type="text" placeholder="Frontend Developer" value={designation} onChange={(e) => setDesignation(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg text-sm transition-all focus:outline-none"
                      style={{ background: '#fdf8f5', border: '1px solid #dcc5ea', color: '#2f1840' }}
                      onFocus={e => { e.target.style.borderColor = '#F4A261'; e.target.style.boxShadow = '0 0 0 3px rgba(244,162,97,0.15)'; }}
                      onBlur={e => { e.target.style.borderColor = '#dcc5ea'; e.target.style.boxShadow = 'none'; }} />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: '#4a2558' }}>Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5" style={{ color: '#b894cc' }} />
                <input type="email" required placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none"
                  style={{ background: '#fdf8f5', border: '1px solid #dcc5ea', color: '#2f1840' }}
                  onFocus={e => { e.target.style.borderColor = '#F4A261'; e.target.style.boxShadow = '0 0 0 3px rgba(244,162,97,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = '#dcc5ea'; e.target.style.boxShadow = 'none'; }} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: '#4a2558' }}>Password</label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-2.5" style={{ color: '#b894cc' }} />
                <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none"
                  style={{ background: '#fdf8f5', border: '1px solid #dcc5ea', color: '#2f1840' }}
                  onFocus={e => { e.target.style.borderColor = '#F4A261'; e.target.style.boxShadow = '0 0 0 3px rgba(244,162,97,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = '#dcc5ea'; e.target.style.boxShadow = 'none'; }} />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 px-4 font-semibold text-sm rounded-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #3d1a47 0%, #7b3a8a 50%, #F4A261 100%)', color: '#fff', boxShadow: '0 4px 16px -2px rgba(244,162,97,0.4)' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px -2px rgba(244,162,97,0.6)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 16px -2px rgba(244,162,97,0.4)'; e.currentTarget.style.transform = 'none'; }}>
              {loading ? <span>Please wait…</span> : isRegister ? (<><UserPlus className="w-4 h-4" /><span>Create Account</span></>) : (<><span>Sign In</span><ArrowRight className="w-4 h-4" /></>)}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
