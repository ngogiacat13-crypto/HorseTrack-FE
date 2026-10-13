import { addAudit, type Actor } from '../managerApi';
import { available, OPEN_SHIPMENT, tracksLots } from './labels';
import { get, min, moveStock, posInt } from './shared';
import type { ShipmentOrder, StockItem, StockTx } from './types';
import { http } from '../http';

export type MoveKind = 'RECEIVE' | 'ISSUE' | 'ADJUST';

/* 1.1–1.4 stock list, manual movements with a reason, safety threshold (BR_08) · 4.4 warehouse log */
export const inventoryApi = {
  async getInventory() {
    const [items, shipments] = await Promise.all([get<StockItem[]>('/inventory'), get<ShipmentOrder[]>('/shipments')]);
    // Quantity on the way per item, from open shipments — shown as "sắp về", never counted as stock.
    const incoming: Record<string, { qty: number; eta: string; id: string; delayed: boolean }[]> = {};
    shipments.filter((s) => OPEN_SHIPMENT.includes(s.status)).forEach((s) => s.lines.forEach((l) => {
      (incoming[l.itemId] ??= []).push({ qty: l.qty, eta: s.eta, id: s.id, delayed: s.status === 'DELAYED' });
    }));
    return { items, incoming };
  },

  /** 1.2 — receive / issue / adjust outside protocols and requisitions. Every movement needs a reason and is logged. */
  async moveStock(item: StockItem, input: { kind: MoveKind; qty: number; lot: string; expiry: string; note: string }, actor: Actor) {
    const note = min(input.note, input.kind === 'RECEIVE' ? 5 : 10, input.kind === 'RECEIVE' ? 'Ghi chú nhập' : 'Lý do');
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

  /** 1.3 — safety threshold per item (BR_08). */
  async setSafety(item: StockItem, safety: number, actor: Actor) {
    if (!Number.isInteger(safety) || safety < 0) throw new Error('Ngưỡng an toàn là số nguyên ≥ 0.');
    const { data } = await http.patch<StockItem>(`/inventory/${item.id}`, { safety });
    await addAudit(actor, { action: 'SET_SAFETY_STOCK', label: 'Đặt ngưỡng an toàn', object: `${item.id} · ${item.name}`, area: 'med', from: `${item.safety} ${item.unit}`, to: `${safety} ${item.unit}` });
    return data;
  },

  /** 4.4 — warehouse log, newest first. */
  async getLog() {
    const txs = await get<StockTx[]>('/stockTx');
    return [...txs].sort((a, b) => b.id.localeCompare(a.id));
  },
};
