export const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number): string {
  return inrFormatter.format(Number.isFinite(value) ? value : 0);
}

export const formatCurrencyINR = formatCurrency;

export function formatDate(value?: string): string {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTime(value?: string): string {
  if (!value) return '--';
  const parts = value.trim().split('.')[0].split(':');
  if (parts.length < 2) return value;
  const hour = Number(parts[0]);
  const minute = Number(parts[1]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function calculateHours(checkIn?: string, checkOut?: string): number | null {
  if (!checkIn || !checkOut) return null;
  const start = checkIn.trim().split('.')[0].split(':').map(Number);
  const end = checkOut.trim().split('.')[0].split(':').map(Number);
  if (start.length < 2 || end.length < 2) return null;
  const diffMinutes = (end[0] * 60 + end[1]) - (start[0] * 60 + start[1]);
  if (diffMinutes <= 0) return 0;
  return Math.round((diffMinutes / 60) * 10) / 10;
}

export function formatHours(checkIn?: string, checkOut?: string, totalHours?: number): string {
  if (!checkOut) return 'In Progress';
  const apiHours = typeof totalHours === 'number' && totalHours > 0 ? totalHours : null;
  const computedHours = calculateHours(checkIn, checkOut);
  const hours = apiHours ?? computedHours;
  return hours === null ? '--' : `${Math.max(0, hours).toFixed(1)}h`;
}
