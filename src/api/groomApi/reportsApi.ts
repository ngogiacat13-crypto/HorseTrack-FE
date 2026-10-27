import { DEMO_NOW, http } from '../http';
import { USE_BACKEND } from '../beClient';
import { addAudit, type Actor } from '../managerApi';
import type { Horse, TrainingSession } from '../trainerApi';
import type { Severity, VetCase } from '../vetApi';
import type { Requisition, StockItem } from '../warehouseApi';
import { get, me, min, nextId, now } from './shared';

const PRESCRIPTION_ONLY = ['Thuốc', 'Vaccine'];
export const CANCELLABLE: Requisition['status'][] = ['SUBMITTED', 'CHECKING_STOCK', 'WAITING_RESTOCK'];

export const reportsApi = {
  async getReports(actor: Actor) {
    const g = await me(actor);
    const [cases, horses, stalls] = await Promise.all([get<VetCase[]>('/vetCases'), get<Horse[]>('/horses'), get<{ id: string; zone: string; horseId: string | null }[]>('/stalls')]);
    const mineHorses = horses.filter((h) => stalls.some((s) => s.horseId === h.id && g.zones.includes(s.zone)));
    return { groom: g, cases: cases.filter((c) => c.sender === g.name).sort((a, b) => b.id.localeCompare(a.id)), horses: mineHorses };
  },

  async reportIncident(input: { horseId: string; type: string; severity: Severity; note: string; photo: string | null; notifyTrainer: boolean }, actor: Actor) {
    const horse = await get<Horse>(`/horses/${input.horseId}`);
    const type = min(input.type, 3, 'Loại sự cố');
    const note = input.note.trim();
    const cases = await get<VetCase[]>('/vetCases');
    const c = {
      id: nextId(cases.map((x) => x.id), 'C-'), horseId: horse.id, horse: horse.name, source: 'GROOM_REPORT', type, severity: input.severity, status: 'NEW',
      sender: actor.name, at: now(), note, photo: input.photo, exam: null, protocolId: null,
    };
    const { data } = await http.post<VetCase>('/vetCases', c);
    await http.patch(`/horses/${horse.id}`, { pendingCase: data.id });
    let paused: string | null = null;
    if (input.notifyTrainer && !USE_BACKEND) {
      const running = (await get<TrainingSession[]>('/trainingSessions', { horseId: horse.id })).find((s) => s.date === DEMO_NOW.date && (s.status === 'IN_PROGRESS' || s.status === 'RESUMED'));
      if (running) {
        await http.patch(`/trainingSessions/${running.id}`, {
          status: 'PAUSED_PENDING_TRAINER', pausedAt: DEMO_NOW.time, pausedReason: `Mã phu báo sự cố: ${type} — ${note} (ca ${data.id}).`, recovery: [],
          alerts: [{ to: 'HLV trưởng', role: 'HLV trưởng', channel: 'alert chặn', at: DEMO_NOW.time, seen: false }],
        });
        paused = running.id;
      }
    }
    await addAudit(actor, { action: 'GROOM_INCIDENT_REPORT', label: 'Báo cáo sự cố', object: `${data.id} · ${horse.name}`, area: 'med', to: `NEW${paused ? ` · tạm dừng ${paused}` : ''}`, reason: `${type}: ${note}` });
    return { vetCase: data, paused };
  },

  async getRequisitions(actor: Actor) {
    const g = await me(actor);
    const [reqs, items] = await Promise.all([get<Requisition[]>('/requisitions'), get<StockItem[]>('/inventory')]);
    return { groom: g, requisitions: reqs.filter((r) => r.by === g.name).sort((a, b) => b.id.localeCompare(a.id)), items: items.filter((i) => !PRESCRIPTION_ONLY.includes(i.category)) };
  },

  async createRequisition(input: { itemId: string; qty: number; reason: string; neededBy: string }, actor: Actor) {
    const g = await me(actor);
    const item = await get<StockItem>(`/inventory/${input.itemId}`).catch(() => { throw new Error('Chọn vật tư.'); });
    if (!Number.isInteger(input.qty) || input.qty < 1) throw new Error('Số lượng phải là số nguyên ≥ 1.');
    const reason = min(input.reason, 10, 'Lý do');
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(input.neededBy)) throw new Error('Ngày cần theo dạng dd/mm/yyyy.');
    const all = await get<Requisition[]>('/requisitions');
    const r: Requisition = {
      id: nextId(all.map((x) => x.id), 'RQ-'), by: g.name, zone: g.zones.join(', '), itemId: item.id, item: item.name, unit: item.unit, qty: input.qty, reason,
      at: now(), neededBy: input.neededBy, status: 'SUBMITTED', history: [{ at: now(), who: g.name, text: 'gửi yêu cầu' }],
    };
    const { data } = await http.post<Requisition>('/requisitions', r);
    await addAudit(actor, { action: 'CREATE_REQUISITION', label: 'Yêu cầu vật tư', object: `${data.id} · ${item.name}`, area: 'med', to: 'SUBMITTED', reason: `${input.qty} ${item.unit} — ${reason}` });
    return data;
  },

  async cancelRequisition(r: Requisition, actor: Actor) {
    if (!CANCELLABLE.includes(r.status)) throw new Error('Chỉ hủy được yêu cầu kho chưa xử lý xong.');
    const { data } = await http.patch<Requisition>(`/requisitions/${r.id}`, { status: 'CLOSED', history: [{ at: now(), who: actor.name, text: 'hủy yêu cầu' }, ...r.history] });
    await addAudit(actor, { action: 'CANCEL_REQUISITION', label: 'Hủy yêu cầu vật tư', object: `${r.id} · ${r.item}`, area: 'med', from: r.status, to: 'CLOSED' });
    return data;
  },

  async confirmReceived(r: Requisition, actor: Actor) {
    if (r.status !== 'ISSUED') throw new Error('Chỉ xác nhận khi kho đã cấp phát.');
    const { data } = await http.patch<Requisition>(`/requisitions/${r.id}`, { status: 'CLOSED', history: [{ at: now(), who: actor.name, text: 'xác nhận đã nhận vật tư', tone: 'success' }, ...r.history] });
    await addAudit(actor, { action: 'CLOSE_REQUISITION', label: 'Xác nhận nhận vật tư', object: `${r.id} · ${r.item}`, area: 'med', from: 'ISSUED', to: 'CLOSED' });
    return data;
  },
};
