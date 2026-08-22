import React from 'react';

type BrandLogoSize = 'sm' | 'md' | 'lg';

interface BrandLogoProps {
  size?: BrandLogoSize;
  showText?: boolean;
  className?: string;
  textClassName?: string;
  subtitleClassName?: string;
}

const sizeClasses: Record<BrandLogoSize, { box: string; icon: string; title: string; subtitle: string }> = {
  sm: { box: 'h-8 w-8 rounded-lg', icon: 'h-4.5 w-4.5', title: 'text-sm', subtitle: 'text-[9px]' },
  md: { box: 'h-10 w-10 rounded-xl', icon: 'h-5 w-5', title: 'text-lg', subtitle: 'text-[10px]' },
  lg: { box: 'h-12 w-12 rounded-2xl', icon: 'h-6 w-6', title: 'text-2xl', subtitle: 'text-[11px]' },
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  textClassName = 'text-slate-900',
  subtitleClassName = 'text-indigo-700',
}) => {
  const styles = sizeClasses[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div className={`brand-gradient ${styles.box} flex items-center justify-center shadow-sm`}>
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <g stroke="white" strokeWidth="1.3" strokeLinecap="round">
            <ellipse cx="12" cy="12" rx="8.8" ry="3.45" />
            <ellipse cx="12" cy="12" rx="8.8" ry="3.45" transform="rotate(60 12 12)" />
            <ellipse cx="12" cy="12" rx="8.8" ry="3.45" transform="rotate(120 12 12)" />
          </g>
          <circle cx="12" cy="12" r="1.8" fill="white" />
        </svg>
      </div>

      {showText && (
        <div className="min-w-0 leading-tight">
          <div className={`font-extrabold tracking-tight ${styles.title} ${textClassName}`}>PeopleOps</div>
          <div className={`font-semibold uppercase tracking-[0.24em] ${styles.subtitle} ${subtitleClassName}`}>HR</div>
        </div>
      )}
    </div>
  );
};
