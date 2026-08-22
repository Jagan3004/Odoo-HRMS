import React from 'react';
export const LoadingState: React.FC<{ label?: string }> = ({ label = 'Loading...' }) => <div className="flex min-h-[260px] items-center justify-center"><div className="text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" /><p className="mt-2 text-xs text-slate-400">{label}</p></div></div>;
