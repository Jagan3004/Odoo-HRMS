import React from 'react';
import { type LucideIcon } from 'lucide-react';

export type InsightTone = 'cyan' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate';

export interface InsightCard {
  label: string;
  value: string;
  note?: string;
  icon?: LucideIcon;
  tone?: InsightTone;
}

interface PageInsightsProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  cards: InsightCard[];
  className?: string;
}

const toneClasses: Record<InsightTone, { chip: string; panel: string; icon: string; label: string }> = {
  cyan: { chip: 'bg-cyan-50 text-cyan-700', panel: 'bg-cyan-50/70 border-cyan-100', icon: 'bg-white text-cyan-700 border-cyan-100', label: 'text-cyan-700' },
  indigo: { chip: 'bg-indigo-50 text-indigo-700', panel: 'bg-indigo-50/70 border-indigo-100', icon: 'bg-white text-indigo-700 border-indigo-100', label: 'text-indigo-700' },
  emerald: { chip: 'bg-emerald-50 text-emerald-700', panel: 'bg-emerald-50/70 border-emerald-100', icon: 'bg-white text-emerald-700 border-emerald-100', label: 'text-emerald-700' },
  amber: { chip: 'bg-amber-50 text-amber-700', panel: 'bg-amber-50/70 border-amber-100', icon: 'bg-white text-amber-700 border-amber-100', label: 'text-amber-700' },
  rose: { chip: 'bg-rose-50 text-rose-700', panel: 'bg-rose-50/70 border-rose-100', icon: 'bg-white text-rose-700 border-rose-100', label: 'text-rose-700' },
  violet: { chip: 'bg-violet-50 text-violet-700', panel: 'bg-violet-50/70 border-violet-100', icon: 'bg-white text-violet-700 border-violet-100', label: 'text-violet-700' },
  slate: { chip: 'bg-slate-100 text-slate-700', panel: 'bg-slate-50 border-slate-100', icon: 'bg-white text-slate-700 border-slate-100', label: 'text-slate-700' },
};

export const PageInsights: React.FC<PageInsightsProps> = ({ eyebrow, title, description, icon: Icon, cards, className = '' }) => {
  const chipTone = toneClasses[(cards[0]?.tone || 'cyan') as InsightTone];

  return (
    <section className={`panel-elevated overflow-hidden rounded-2xl border border-slate-200/70 ${className}`}>
      <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-white via-slate-50/50 to-cyan-50/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${chipTone.icon}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] ${chipTone.chip}`}>{eyebrow}</p>
            <h2 className="mt-2 text-lg font-black tracking-tight text-slate-950">{title}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const tone = toneClasses[card.tone || 'slate'];
          const CardIcon = card.icon;

          return (
            <div key={card.label} className={`rounded-2xl border p-4 ${tone.panel}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${tone.label}`}>{card.label}</p>
                  <p className="mt-2 text-xl font-black tracking-tight text-slate-950">{card.value}</p>
                </div>
                {CardIcon && (
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${tone.icon}`}>
                    <CardIcon className="h-4.5 w-4.5" />
                  </div>
                )}
              </div>
              {card.note && <p className="mt-3 text-xs leading-5 text-slate-500">{card.note}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
};
