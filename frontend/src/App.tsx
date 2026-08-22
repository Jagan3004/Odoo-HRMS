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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-200 border-t-indigo-600" />
        <p className="text-xs text-gray-400 font-medium">Loading Dayflow HRMS...</p>
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
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
