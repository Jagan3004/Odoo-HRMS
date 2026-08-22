import React from 'react';
import { LucideIcon } from 'lucide-react';

type Accent = 'indigo' | 'emerald' | 'amber' | 'rose' | 'blue' | 'violet';
const accents: Record<Accent, string> = { indigo: 'border-indigo-100 bg-indigo-50 text-indigo-600', emerald: 'border-emerald-100 bg-emerald-50 text-emerald-600', amber: 'border-amber-100 bg-amber-50 text-amber-600', rose: 'border-rose-100 bg-rose-50 text-rose-600', blue: 'border-blue-100 bg-blue-50 text-blue-600', violet: 'border-violet-100 bg-violet-50 text-violet-600' };
export const StatCard: React.FC<{ label: string; value: string | number; subLabel?: string; icon: LucideIcon; accent?: Accent }> = ({ label, value, subLabel, icon: Icon, accent = 'indigo' }) => <div className="stat-card rounded-xl p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">{value}</p>{subLabel && <p className="mt-1 text-[10px] text-slate-400">{subLabel}</p>}</div><span className={`rounded-lg border p-2.5 ${accents[accent]}`}><Icon className="h-4 w-4" /></span></div></div>;
