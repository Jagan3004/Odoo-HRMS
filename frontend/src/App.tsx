import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { Attendance } from './pages/Attendance';
import { Leaves } from './pages/Leaves';
import { Payroll } from './pages/Payroll';
import { Analytics } from './pages/Analytics';
import { Profile } from './pages/Profile';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4" style={{ background: '#fdf8f5' }}>
        <div className="w-10 h-10 rounded-xl brand-gradient flex items-center justify-center glow-apricot animate-pulse">
          <div className="w-4 h-4 rounded-full" style={{ background: 'rgba(255,255,255,0.9)' }} />
        </div>
        <p className="text-xs font-medium tracking-wide" style={{ color: '#9568ae', fontFamily: 'Cormorant Garamond, serif' }}>Loading Dayflow HRMS…</p>
      </div>
    );
  }

  if (!user) return <Login />;

  const isAdmin = user?.role === 'Admin';

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard setActiveTab={setActiveTab} />;
      case 'employees': return isAdmin ? <Employees setActiveTab={setActiveTab} /> : <Dashboard setActiveTab={setActiveTab} />;
      case 'attendance': return <Attendance />;
      case 'leaves': return <Leaves />;
      case 'payroll': return <Payroll />;
      case 'analytics': return isAdmin ? <Analytics /> : <Dashboard setActiveTab={setActiveTab} />;
      case 'profile': return <Profile />;
      default: return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: '#fdf8f5', color: '#1a0a1e' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}
