import { DEMO_NOW, http } from '../http';
import { addAudit, type Actor } from '../managerApi';
import { get, moveStock } from './shared';
import type { StockCheck, StockItem } from './types';

export const checksApi = {
  async getChecks() {
    const [checks, items] = await Promise.all([get<StockCheck[]>('/stockChecks'), get<StockItem[]>('/inventory')]);
    return { checks: [...checks].sort((a, b) => b.id.localeCompare(a.id)), items };
  },

  getCheck: (id: string) => get<StockCheck>(`/stockChecks/${encodeURIComponent(id)}`),

  async submitCheck(input: { note: string; lines: { itemId: string; counted: number; reason: string }[] }, actor: Actor) {
    if (!input.lines.length) throw new Error('Chưa có mặt hàng nào được đếm.');
    const [items, checks] = await Promise.all([get<StockItem[]>('/inventory'), get<StockCheck[]>('/stockChecks')]);
    const month = DEMO_NOW.date.slice(3);
    const base = `KK-${month.split('/').reverse().join('-')}`;
    const id = checks.some((c) => c.id === base) ? `${base}-${checks.filter((c) => c.id.startsWith(base)).length + 1}` : base;
    const lines = input.lines.map((l) => {
      const it = items.find((i) => i.id === l.itemId) as StockItem;
      if (!Number.isInteger(l.counted) || l.counted < 0) throw new Error(`${it.name}: số đếm thực tế phải là số nguyên ≥ 0.`);
      const diff = l.counted - it.onHand;
      if (diff !== 0 && l.reason.trim().length < 5) throw new Error(`${it.name}: chênh lệch ${diff > 0 ? '+' : ''}${diff} ${it.unit} — ghi lý do (ít nhất 5 ký tự).`);
      if (l.counted < it.held) throw new Error(`${it.name}: số đếm thấp hơn lượng đang giữ cho phác đồ (${it.held} ${it.unit}) — kiểm tra lại trước khi lưu.`);
      return { itemId: it.id, item: it.name, unit: it.unit, system: it.onHand, counted: l.counted, reason: l.reason.trim() };
    });
    for (const l of lines.filter((x) => x.counted !== x.system)) {
      const it = items.find((i) => i.id === l.itemId) as StockItem;
      await moveStock(it, 'ADJUST', l.counted - l.system, { ref: id, note: `Kiểm kê: ${l.reason}` }, actor);
    }
    const record: StockCheck = { id, month, at: `${DEMO_NOW.date} ${DEMO_NOW.time}`, by: actor.name, status: 'DONE', note: input.note.trim(), lines };
    const { data } = await http.post<StockCheck>('/stockChecks', record);
    const diffs = lines.filter((l) => l.counted !== l.system);
    await addAudit(actor, { action: 'STOCK_COUNT', label: 'Kiểm kê kho', object: id, area: 'med', to: `${lines.length} mặt hàng · ${diffs.length} chênh lệch`, reason: diffs.map((l) => `${l.item} ${l.counted - l.system > 0 ? '+' : ''}${l.counted - l.system}`).join(', ') || 'Khớp số liệu' });
    return data;
  },
};
