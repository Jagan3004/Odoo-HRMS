import React from 'react';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
const tones: Record<Tone, string> = { success: 'border-emerald-200 bg-emerald-50 text-emerald-700', warning: 'border-amber-200 bg-amber-50 text-amber-700', danger: 'border-rose-200 bg-rose-50 text-rose-700', info: 'border-blue-200 bg-blue-50 text-blue-700', neutral: 'border-slate-200 bg-slate-100 text-slate-700' };
export const StatusBadge: React.FC<{ label: string; tone?: Tone }> = ({ label, tone = 'neutral' }) => <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide ${tones[tone]}`} aria-label={`Status: ${label}`}>{label}</span>;
