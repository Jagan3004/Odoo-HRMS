import React from 'react';
import { ArrowLeft, Inbox, type LucideIcon } from 'lucide-react';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'violet';

const badgeClasses: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
  brand: 'bg-cyan-50 text-cyan-800 ring-cyan-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  danger: 'bg-rose-50 text-rose-700 ring-rose-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
};

export const StatusBadge: React.FC<{ label: string; tone?: BadgeTone; className?: string }> = ({ label, tone = 'neutral', className = '' }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ring-1 ring-inset ${badgeClasses[tone]} ${className}`}>
    {label}
  </span>
);

export const Avatar: React.FC<{ name: string; src?: string; size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ name, src, size = 'md', className = '' }) => {
  const sizeClasses = { sm: 'h-9 w-9 text-xs', md: 'h-11 w-11 text-sm', lg: 'h-16 w-16 text-xl' };
  const initials = name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const [loadFailed, setLoadFailed] = React.useState(false);

  return src && !loadFailed ? (
    <img
      src={src}
      alt={name}
      onError={() => setLoadFailed(true)}
      className={`${sizeClasses[size]} rounded-2xl object-cover ring-2 ring-white shadow-sm ${className}`}
    />
  ) : (
    <div className={`${sizeClasses[size]} flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-700 font-extrabold text-white shadow-sm ${className}`}>
      {initials}
    </div>
  );
};

export const PageHeader: React.FC<{
  eyebrow?: string;
  title: string;
  description: string;
  icon: LucideIcon;
  actions?: React.ReactNode;
}> = ({ eyebrow, title, description, icon: Icon, actions }) => (
  <div className="page-header">
    <div className="flex min-w-0 items-start gap-3">
      <div className="page-header-icon"><Icon className="h-5 w-5" /></div>
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-cyan-700">{eyebrow}</p>}
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-[28px]">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const SectionCard: React.FC<{
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, description, action, children, className = '' }) => (
  <section className={`surface-card ${className}`}>
    {(title || action) && (
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div>
          {title && <h2 className="text-sm font-bold text-slate-900">{title}</h2>}
          {description && <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>}
        </div>
        {action}
      </div>
    )}
    {children}
  </section>
);

export const EmptyState: React.FC<{ title: string; description: string; action?: React.ReactNode }> = ({ title, description, action }) => (
  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Inbox className="h-5 w-5" /></div>
    <h3 className="text-sm font-bold text-slate-800">{title}</h3>
    <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const LoadingState: React.FC<{ label?: string }> = ({ label = 'Loading your workspace…' }) => (
  <div className="flex min-h-[280px] flex-col items-center justify-center gap-3">
    <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-cyan-100 border-t-cyan-600" />
    <p className="text-xs font-medium text-slate-400">{label}</p>
  </div>
);

export const BackButton: React.FC<{ onClick: () => void; label?: string }> = ({ onClick, label = 'Back' }) => (
  <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
    <ArrowLeft className="h-3.5 w-3.5" /> {label}
  </button>
);
