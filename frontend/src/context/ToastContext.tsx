import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';
interface ToastItem { id: string; message: string; type: ToastType; }
interface ToastContextType { showToast: (message: string, type?: ToastType) => void; }
const ToastContext = createContext<ToastContextType | undefined>(undefined);
const styles: Record<ToastType, string> = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-rose-50 border-rose-200 text-rose-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};
const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4" />, error: <XCircle className="h-4 w-4" />, warning: <AlertCircle className="h-4 w-4" />, info: <Info className="h-4 w-4" />,
};
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const remove = useCallback((id: string) => setToasts((items) => items.filter((item) => item.id !== id)), []);
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((items) => [...items, { id, message, type }]);
    window.setTimeout(() => remove(id), 3200);
  }, [remove]);
  const value = useMemo(() => ({ showToast }), [showToast]);
  return <ToastContext.Provider value={value}>{children}<div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">{toasts.map((toast) => <div key={toast.id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs shadow-sm ${styles[toast.type]}`} role="status">{icons[toast.type]}<span>{toast.message}</span><button onClick={() => remove(toast.id)} aria-label="Dismiss notification">x</button></div>)}</div></ToastContext.Provider>;
};
export function useToast() { const context = useContext(ToastContext); if (!context) throw new Error('useToast must be used inside ToastProvider'); return context; }
