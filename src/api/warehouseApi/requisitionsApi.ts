import { http } from '../http';
import { addAudit, type Actor } from '../managerApi';
import { available, OPEN_SHIPMENT } from './labels';
import { get, min, moveStock, now, posInt } from './shared';
import type { HistoryLine, Requisition, ShipmentOrder, StockItem } from './types';

const step = (r: Requisition, patch: Partial<Requisition>, line: HistoryLine) =>
  http.patch<Requisition>(`/requisitions/${r.id}`, { ...patch, history: [line, ...r.history] }).then((x) => x.data);

/* 4.1–4.3 non-medical supply requests from Grooms. Status: SUBMITTED → CHECKING_STOCK → APPROVED_FOR_ISSUE / WAITING_RESTOCK / REJECTED → ISSUED. */
export const requisitionsApi = {
  async getRequisitions() {
    const [requisitions, items, shipments] = await Promise.all([get<Requisition[]>('/requisitions'), get<StockItem[]>('/inventory'), get<ShipmentOrder[]>('/shipments')]);
    return { requisitions: [...requisitions].sort((a, b) => b.id.localeCompare(a.id)), items, openShipments: shipments.filter((s) => OPEN_SHIPMENT.includes(s.status)) };
  },

  async startCheck(r: Requisition, actor: Actor) {
    if (r.status !== 'SUBMITTED') return r;
    return step(r, { status: 'CHECKING_STOCK' }, { at: now(), who: actor.name, text: 'đang kiểm tồn' });
  },

  /** 4.2 — enough stock: approve and hand it over in one go (quantity and receiver recorded, stock goes down). */
  async issue(r: Requisition, input: { qty: number; to: string }, actor: Actor) {
    if (!['SUBMITTED', 'CHECKING_STOCK', 'APPROVED_FOR_ISSUE'].includes(r.status)) throw new Error('Yêu cầu này không ở bước cấp phát.');
    const qty = posInt(input.qty, 'Số lượng cấp');
    const to = min(input.to, 3, 'Người nhận');
    const it = await get<StockItem>(`/inventory/${r.itemId}`);
    if (qty > available(it)) throw new Error(`Chỉ còn ${available(it)} ${it.unit} khả dụng — chọn “Chờ hàng” hoặc tạo đơn nhập.`);
    await moveStock(it, 'ISSUE', qty, { ref: r.id, note: `Cấp cho ${to} (${r.zone})` }, actor);
    const issued = { qty, to, at: now(), by: actor.name };
    const data = await http.patch<Requisition>(`/requisitions/${r.id}`, {
      status: 'ISSUED', issued,
      history: [{ at: now(), who: actor.name, text: `cấp phát ${qty} ${r.unit} cho ${to}${qty < r.qty ? ` (yêu cầu ${r.qty})` : ''}`, tone: 'success' }, ...(r.status !== 'APPROVED_FOR_ISSUE' ? [{ at: now(), who: actor.name, text: 'duyệt cấp' }] : []), ...r.history],
    }).then((x) => x.data);
    await addAudit(actor, { action: 'ISSUE_REQUISITION', label: 'Cấp phát vật tư', object: `${r.id} · ${r.item}`, area: 'med', from: r.status, to: 'ISSUED', reason: `${qty} ${r.unit} cho ${to}` });
    return data;
  },

  /** 4.2 / 4.3 — not enough: wait for an open shipment (a new order is made from the shipments page). */
  async waitRestock(r: Requisition, shipmentId: string, actor: Actor) {
    if (!['SUBMITTED', 'CHECKING_STOCK'].includes(r.status)) throw new Error('Yêu cầu này không ở bước kiểm tồn.');
    const s = await get<ShipmentOrder>(`/shipments/${shipmentId}`);
    if (!OPEN_SHIPMENT.includes(s.status)) throw new Error('Lô hàng đã đóng.');
    if (!s.lines.some((l) => l.itemId === r.itemId)) throw new Error(`Đơn ${s.id} không có ${r.item}.`);
    const data = await step(r, { status: 'WAITING_RESTOCK', shipmentId: s.id }, { at: now(), who: actor.name, text: `chờ đơn nhập ${s.id} (ETA ${s.eta.slice(0, 5)}) · đã báo ${r.by}`, tone: 'warning' });
    await addAudit(actor, { action: 'REQUISITION_WAIT_RESTOCK', label: 'Yêu cầu vật tư chờ hàng', object: `${r.id} · ${r.item}`, area: 'med', from: r.status, to: 'WAITING_RESTOCK', reason: s.id });
    return data;
  },

  /** 4.2 — rejecting always needs a reason. */
  async reject(r: Requisition, reason: string, actor: Actor) {
    if (['ISSUED', 'REJECTED', 'CLOSED'].includes(r.status)) throw new Error('Yêu cầu đã được xử lý.');
    const why = min(reason, 10, 'Lý do từ chối');
    const data = await step(r, { status: 'REJECTED', rejectReason: why }, { at: now(), who: actor.name, text: `từ chối: ${why}`, tone: 'danger' });
    await addAudit(actor, { action: 'REJECT_REQUISITION', label: 'Từ chối yêu cầu vật tư', object: `${r.id} · ${r.item}`, area: 'med', from: r.status, to: 'REJECTED', reason: why });
    return data;
  },
};
