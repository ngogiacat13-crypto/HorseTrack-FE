import { DEMO_NOW } from '../http';
import type { Vaccination } from '../trainerApi';

export const dateKey = (d: string) => d.split('/').reverse().join('');
const pad = (n: number) => String(n).padStart(2, '0');
const toDate = (d: string) => { const [dd, mm, yy] = d.split('/').map(Number); return new Date(yy, mm - 1, dd); };
const fmt = (x: Date) => `${pad(x.getDate())}/${pad(x.getMonth() + 1)}/${x.getFullYear()}`;
export const addDays = (d: string, n: number) => { const x = toDate(d); x.setDate(x.getDate() + n); return fmt(x); };
export const addMonths = (d: string, n: number) => { const x = toDate(d); x.setMonth(x.getMonth() + n); return fmt(x); };
export const isDate = (d: string) => /^\d{2}\/\d{2}\/\d{4}$/.test(d) && fmt(toDate(d)) === d;
export const daysFromToday = (d: string) => Math.round((toDate(d).getTime() - toDate(DEMO_NOW.date).getTime()) / 86400000);
export const dueWithin7 = (v: Pick<Vaccination, 'due' | 'status'>) => v.status !== 'DONE' && daysFromToday(v.due) <= 7;
