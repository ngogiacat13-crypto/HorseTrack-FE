import { DEMO_NOW, http } from '../http';
import type { Actor } from '../managerApi';
import type { VetHorse } from '../vetApi';

export const get = async <T,>(url: string, params?: Record<string, unknown>) => (await http.get<T>(url, { params })).data;
export const nextId = (ids: string[], prefix: string, width = 4) => {
  const max = ids.reduce((m, id) => Math.max(m, Number(id.replace(/\D/g, '')) || 0), 0);
  return `${prefix}${String(max + 1).padStart(width, '0')}`;
};
export const now = () => DEMO_NOW.short;
export const min = (v: string, n: number, what: string) => { if (v.trim().length < n) throw new Error(`${what} ít nhất ${n} ký tự.`); return v.trim(); };

export const DENIED = 'Bạn chỉ xem được dữ liệu của ngựa thuộc sở hữu của mình (BR_09).';

export const myHorses = async (actor: Actor) => (await get<VetHorse[]>('/horses')).filter((h) => h.owner === actor.name);

export const myHorse = async (id: string, actor: Actor) => {
  const h = await get<VetHorse>(`/horses/${id}`).catch(() => { throw new Error('Không tìm thấy ngựa.'); });
  if (h.owner !== actor.name) throw new Error(DENIED);
  return h;
};

export const SYSTEM: Actor = { id: '0', name: 'Hệ thống · VNPay IPN', role: 'System' };
