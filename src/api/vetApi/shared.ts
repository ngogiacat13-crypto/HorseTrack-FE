import { DEMO_NOW, http } from '../http';
import type { ProtocolState } from '../managerApi';
import type { Horse } from '../trainerApi';
import type { InventoryItem, ProtoPhase, StockLine, Protocol } from './types';
import { PROTOCOL_LABEL, isOpenProtocol } from './labels';
import { dateKey } from './dates';

export const get = async <T,>(url: string, params?: Record<string, unknown>) => (await http.get<T>(url, { params })).data;
export const nextId = (ids: string[], prefix: string, width = 4) => {
  const max = ids.reduce((m, id) => Math.max(m, Number(id.replace(/\D/g, '')) || 0), 0);
  return `${prefix}${String(max + 1).padStart(width, '0')}`;
};
export const now = () => DEMO_NOW.short;
export const min = (v: string, n: number, what: string) => { if (v.trim().length < n) throw new Error(`${what} ít nhất ${n} ký tự.`); return v.trim(); };
export const addHistory = (h: Horse, title: string, tone: 'danger' | 'warning' | 'success') =>
  http.patch(`/horses/${h.id}`, { medicalHistory: [{ date: DEMO_NOW.date, title, tone }, ...h.medicalHistory] });
export const protoCost = (phases: ProtoPhase[]) => phases.reduce((s, p) => s + p.items.reduce((t, i) => t + i.qty * i.unitPrice, 0), 0);
export const lastEta = (lines: StockLine[]) => lines.filter((l) => l.short > 0 && l.eta).map((l) => l.eta as string).sort((a, b) => dateKey(a).localeCompare(dateKey(b))).pop() ?? null;
export const stockShort = (p: Pick<Protocol, 'stock'>) => (p.stock?.lines ?? []).filter((l) => l.short > 0);

export const watchFields = (p: Protocol, horseLocked: boolean): Partial<Protocol> => {
  const [label, tone] = PROTOCOL_LABEL[p.state];
  const materials = p.stock
    ? p.stock.lines.map((l) => ({
        item: `${l.name} · ${l.need} ${l.unit}`,
        status: l.short > 0 ? `Thiếu ${l.short}${l.eta ? ` · ETA ${l.eta.slice(0, 5)}` : ''}` : p.state === 'SUPERSEDED' ? 'Không cấp — bản đã bị thay' : `Đủ · đã giữ ${l.held}`,
        tone: (l.short > 0 ? 'danger' : p.state === 'SUPERSEDED' ? 'neutral' : 'success') as 'danger' | 'neutral' | 'success',
      }))
    : p.phases.flatMap((ph) => ph.items.map((i) => ({ item: `${i.name} · ${i.qty} ${i.unit}`, status: p.state === 'DRAFT' ? 'Chưa gửi kho' : 'Đang kiểm', tone: 'neutral' as const })));
  return {
    label, cost: protoCost(p.phases), trainingLocked: horseLocked, open: isOpenProtocol(p), materials,
    tone: (tone === 'warning' || tone === 'purple' ? 'info' : tone) as Protocol['tone'],
    alertState: ['STOCK_SHORTAGE', 'REQUIRES_VET_REVIEW'].includes(p.state) || p.delayed ? p.state : undefined,
  };
};
export const saveProtocol = async (p: Protocol, change: Partial<Protocol>, logLine?: Protocol['log'][number]) => {
  const next = { ...p, ...change };
  const horse = await get<Horse>(`/horses/${p.horseId}`);
  const log = logLine ? [logLine, ...p.log] : p.log;
  const { data } = await http.patch<Protocol>(`/protocols/${p.id}`, { ...change, ...watchFields(next, horse.trainingLocked), log });
  return data;
};
export const goTo = (p: Protocol, ...states: ProtocolState[]) => ({ state: states[states.length - 1], path: [...p.path, ...states] });

export const releaseHeld = async (p: Protocol) => {
  const lines = p.stock?.lines.filter((l) => l.held > 0) ?? [];
  await Promise.all(lines.map(async (l) => {
    const it = await get<InventoryItem>(`/inventory/${l.itemId}`).catch(() => null);
    if (it) await http.patch(`/inventory/${it.id}`, { held: Math.max(0, it.held - l.held) });
  }));
};
