import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Employee } from '../types';
import { apiRequest } from '../api/client';

interface AuthContextType {
  user: User | null;
  employee: Employee | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  demoLogin: (role: 'Admin' | 'Employee') => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('dayflow_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('dayflow_token');
      if (storedToken) {
        try {
          const res = await apiRequest('/auth/me', 'GET', undefined, storedToken);
          setUser(res.user);
          setEmployee(res.employee);
        } catch (err) {
          console.error('Failed to verify token:', err);
          localStorage.removeItem('dayflow_token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await apiRequest('/auth/login', 'POST', { email, password: pass });
    localStorage.setItem('dayflow_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setEmployee(res.employee);
  };

  const register = async (formData: any) => {
    const res = await apiRequest('/auth/register', 'POST', formData);
    localStorage.setItem('dayflow_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setEmployee(res.employee);
  };

  const logout = () => {
    localStorage.removeItem('dayflow_token');
    setToken(null);
    setUser(null);
    setEmployee(null);
  };

  const demoLogin = async (role: 'Admin' | 'Employee') => {
    const email = role === 'Admin' ? 'admin@dayflow.com' : 'employee@dayflow.com';
    const password = role === 'Admin' ? 'admin123' : 'emp123';
    await login(email, password);
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const res = await apiRequest('/auth/me', 'GET', undefined, token);
      setUser(res.user);
      setEmployee(res.employee);
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        employee,
        token,
        loading,
        login,
        register,
        logout,
        demoLogin,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
