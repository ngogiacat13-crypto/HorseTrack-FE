import { DEMO_NOW } from '../../../api/http';

/* Dates are dd/MM/yyyy everywhere in the trainer screens. Today follows the app clock (demo day, or the real date with the backend). */
const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const pad = (n: number) => String(n).padStart(2, '0');
export const toDmy = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
export const fromDmy = (s: string) => { const [d, m, y] = s.split('/').map(Number); return new Date(y, m - 1, d); };
/** dd/MM/yyyy ↔ yyyy-MM-dd (value of <input type="date">) */
export const dmyToIso = (s: string) => s.split('/').reverse().join('-');
export const isoToDmy = (s: string) => s.split('-').reverse().join('/');
export const dowOf = (s: string) => DOW[fromDmy(s).getDay()];

export const TODAY = DEMO_NOW.date;
/* Week of today (Monday → Sunday). */
const monday = fromDmy(TODAY);
monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
export const WEEK = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(monday);
  d.setDate(monday.getDate() + i);
  return [DOW[d.getDay()], toDmy(d)] as const;
});
/* What the Mã phu has to record during the session. */
export const METRICS = ['Nhịp tim (bpm)', 'Tốc độ (km/h)', 'Quãng đường (m)', 'Thời gian hồi phục'];
