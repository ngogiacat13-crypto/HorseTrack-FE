import { addAudit, type Actor } from '../managerApi';
import { available, OPEN_SHIPMENT, tracksLots } from './labels';
import { get, min, moveStock, posInt } from './shared';
import type { ShipmentOrder, StockItem, StockTx } from './types';
import { http } from '../http';
import { USE_BACKEND, be, beData } from '../beClient';

export type MoveKind = 'RECEIVE' | 'ISSUE' | 'ADJUST';

export const inventoryApi = {
  async getInventory() {
    const [items, shipments] = await Promise.all([get<StockItem[]>('/inventory'), get<ShipmentOrder[]>('/shipments')]);
    const incoming: Record<string, { qty: number; eta: string; id: string; delayed: boolean }[]> = {};
    shipments.filter((s) => OPEN_SHIPMENT.includes(s.status)).forEach((s) => s.lines.forEach((l) => {
      (incoming[l.itemId] ??= []).push({ qty: l.qty, eta: s.eta, id: s.id, delayed: s.status === 'DELAYED' });
    }));
    const lowIds = USE_BACKEND
      ? await beData<{ itemCode: string }[]>(be.get('/inventory/low-stock')).then((rows) => new Set(rows.map((r) => r.itemCode))).catch(() => null)
      : null;
    return { items, incoming, lowIds };
  },

  async moveStock(item: StockItem, input: { kind: MoveKind; qty: number; lot: string; expiry: string; note: string }, actor: Actor) {
    const note = input.kind === 'RECEIVE' ? input.note.trim() : min(input.note, 10, 'Lý do');
    let qty = input.qty;
    if (input.kind === 'ADJUST') {
      if (!Number.isInteger(qty) || qty === 0) throw new Error('Số lượng điều chỉnh phải là số nguyên khác 0 (âm = giảm).');
    } else qty = posInt(qty, 'Số lượng');
    if (input.kind === 'ISSUE' && qty > available(item)) throw new Error(`Chỉ còn ${available(item)} ${item.unit} khả dụng — phần còn lại đang được giữ cho phác đồ.`);
    if (input.kind === 'RECEIVE' && tracksLots(item)) {
      if (!input.lot.trim()) throw new Error('Thuốc / vaccine phải nhập số lô.');
      if (!/^(0[1-9]|1[0-2])\/\d{4}$/.test(input.expiry)) throw new Error('Hạn dùng theo dạng mm/yyyy.');
    }
    const data = await moveStock(item, input.kind, qty, { note, lot: input.lot.trim() || undefined, expiry: input.expiry.trim() || undefined }, actor);
    const label = { RECEIVE: 'Nhập kho', ISSUE: 'Xuất kho', ADJUST: 'Điều chỉnh tồn' }[input.kind];
    await addAudit(actor, { action: `STOCK_${input.kind}`, label, object: `${item.id} · ${item.name}`, area: 'med', from: `${item.onHand} ${item.unit}`, to: `${data.onHand} ${item.unit}`, reason: note });
    return data;
  },

  async setSafety(item: StockItem, safety: number, actor: Actor) {
    if (!Number.isInteger(safety) || safety < 0) throw new Error('Ngưỡng an toàn là số nguyên ≥ 0.');
    const { data } = await http.patch<StockItem>(`/inventory/${item.id}`, { safety });
    await addAudit(actor, { action: 'SET_SAFETY_STOCK', label: 'Đặt ngưỡng an toàn', object: `${item.id} · ${item.name}`, area: 'med', from: `${item.safety} ${item.unit}`, to: `${safety} ${item.unit}` });
    return data;
  },

  async getLog() {
    const txs = await get<StockTx[]>('/stockTx');
    return [...txs].sort((a, b) => String(b.id ?? '').localeCompare(String(a.id ?? '')));
  },
};
