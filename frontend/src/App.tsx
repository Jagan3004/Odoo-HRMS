import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
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
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { AccessDenied } from './pages/AccessDenied';
import { isAdminRole } from './utils/roles';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  useEffect(() => {
    if (user && isAdminRole(user.role) && activeTab === 'dashboard') {
      setActiveTab('admin-dashboard');
    }
  }, [user, activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-200 border-t-indigo-600" />
        <p className="text-xs text-gray-400 font-medium">Loading Dayflow HRMS...</p>
      </div>
    );
  }

  if (!user) return <Login />;

  const isAdmin = isAdminRole(user.role);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard setActiveTab={setActiveTab} />;
      case 'admin-dashboard': return isAdmin ? <Dashboard setActiveTab={setActiveTab} /> : <AccessDenied onGoHome={() => setActiveTab('dashboard')} />;
      case 'employees': return isAdmin ? <Employees setActiveTab={setActiveTab} /> : <AccessDenied onGoHome={() => setActiveTab('dashboard')} />;
      case 'attendance': return <Attendance />;
      case 'leaves': return <Leaves />;
      case 'payroll': return <Payroll />;
      case 'analytics': return isAdmin ? <Analytics /> : <Dashboard setActiveTab={setActiveTab} />;
      case 'admin-attendance': return isAdmin ? <Attendance /> : <AccessDenied onGoHome={() => setActiveTab('dashboard')} />;
      case 'leave-requests': return isAdmin ? <Leaves /> : <AccessDenied onGoHome={() => setActiveTab('dashboard')} />;
      case 'reports': return isAdmin ? <Reports /> : <AccessDenied onGoHome={() => setActiveTab('dashboard')} />;
      case 'settings': return isAdmin ? <Settings /> : <AccessDenied onGoHome={() => setActiveTab('dashboard')} />;
      case 'profile': return <Profile />;
      default: return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} isAdminPortal={isAdmin} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isAdminPortal={isAdmin} />
        <main className="page-enter flex-1 overflow-y-auto p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pb-8">
          <div className="max-w-7xl mx-auto w-full">
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return <AuthProvider><ToastProvider><AppContent /></ToastProvider></AuthProvider>;
}
