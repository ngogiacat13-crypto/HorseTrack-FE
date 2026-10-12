import React, { useState } from 'react';
import { InventoryItem, ProtoPhase, protoCost } from '../../../api/vetApi';
import { Icon } from '../../../components/ui/Icon';
import { money, useToast } from '../../../components/ui/Ht';
import { MedicinePicker } from '../../../components/vet/MedicinePicker';

interface Props {
  phase: ProtoPhase; index: number; open: boolean;
  inventory: InventoryItem[];
  /** Stock the vet may count on for an item, and how much the whole protocol needs of it. */
  availableOf: (itemId: string) => number; needOf: (itemId: string) => number;
  onToggle: () => void; onRemove?: () => void; onChange: (patch: Partial<ProtoPhase>) => void;
}

/* 2.1 — one phase of the protocol: name, dates, goal and its medicines. */
export const PhaseEditor: React.FC<Props> = ({ phase: ph, index, open, inventory, availableOf, needOf, onToggle, onRemove, onChange }) => {
  const toast = useToast();
  const [adding, setAdding] = useState('');
  const inv = Object.fromEntries(inventory.map((i) => [i.id, i]));
  const id = (k: string) => `ph-${k}-${index}`;

  const addItem = () => {
    const it = inv[adding];
    if (!it) return;
    if (ph.items.some((x) => x.itemId === it.id)) { toast(`${it.name} đã có trong giai đoạn này.`); return; }
    onChange({ items: [...ph.items, { itemId: it.id, name: it.name, unit: it.unit, unitPrice: it.unitPrice, qty: 1 }] });
    setAdding('');
  };

  return (
    <section className="ht-proto-phase">
      <div className="ht-proto-phase__head">
        <span className="ht-phase__no">{String(index + 1).padStart(2, '0')}</span>
        <h3>Giai đoạn {index + 1}{ph.name && ` · ${ph.name}`}</h3>
        {!open && <span style={{ fontSize: 13, color: 'var(--muted)' }}>Bắt đầu <span className="ht-mono">{ph.startDate}</span> · {ph.items.map((i) => `${i.name} × ${i.qty}`).join(', ') || 'chưa có thuốc'}</span>}
        <b className="ht-mono" style={{ fontSize: 14 }}>{money(protoCost([ph]))}</b>
        <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" onClick={onToggle} aria-expanded={open}>{open ? 'Thu gọn' : 'Mở'}</button>
        {onRemove && <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" onClick={onRemove} aria-label={`Xóa giai đoạn ${index + 1}`}><Icon name="x" /></button>}
      </div>
      {open && (
        <div className="ht-proto-phase__body">
          <div className="ht-proto-phase__grid">
            <div className="ht-field"><label className="ht-label" htmlFor={id('name')}>Tên giai đoạn<span className="ht-req">*</span></label>
              <input id={id('name')} className="ht-input" value={ph.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="VD: Chống viêm cấp" /></div>
            <div className="ht-field"><label className="ht-label" htmlFor={id('start')}>Ngày bắt đầu</label>
              <input id={id('start')} className="ht-input ht-mono" value={ph.startDate} onChange={(e) => onChange({ startDate: e.target.value })} placeholder="dd/mm/yyyy" /></div>
            <div className="ht-field"><label className="ht-label" htmlFor={id('days')}>Thời lượng (ngày)</label>
              <input id={id('days')} className="ht-input" type="number" min={1} value={ph.days} onChange={(e) => onChange({ days: Number(e.target.value) })} /></div>
            <div className="ht-field"><label className="ht-label" htmlFor={id('goal')}>Mục tiêu</label>
              <input id={id('goal')} className="ht-input" value={ph.goal} onChange={(e) => onChange({ goal: e.target.value })} placeholder="VD: Giảm sưng" /></div>
          </div>
          <table className="ht-proto-items">
            <thead><tr><th>Thuốc / vật tư</th><th className="num">Số lượng</th><th className="num">Đơn giá</th><th className="num">Thành tiền</th><th className="num">Tồn khả dụng</th><th /></tr></thead>
            <tbody>
              {ph.items.map((it, j) => {
                const info = inv[it.itemId];
                const avail = availableOf(it.itemId);
                const warn = needOf(it.itemId) > avail;
                return (
                  <tr key={it.itemId} className={warn ? 'is-warn' : undefined}>
                    <td><b>{it.name}</b>{info?.note && <span style={{ color: 'var(--muted)' }}> · {info.note}</span>}{warn && <> <Icon name="warn" size={14} style={{ color: 'var(--warning-ink)' }} /></>}
                      {info && <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)' }}>{info.route}{info.doseRef && ` · liều tham khảo ${info.doseRef}`}{info.detectionHours && <b style={{ color: 'var(--warning-ink)' }}> · phát hiện thi đấu ~{Math.round(info.detectionHours / 24)} ngày</b>}</span>}</td>
                    <td className="num"><input className="ht-input" type="number" min={1} value={it.qty} aria-label={`Số lượng ${it.name}`}
                      onChange={(e) => onChange({ items: ph.items.map((x, k) => (k === j ? { ...x, qty: Number(e.target.value) } : x)) })} /> {it.unit}</td>
                    <td className="num ht-mono">{money(it.unitPrice)}</td>
                    <td className="num"><b>{money(it.qty * it.unitPrice)}</b></td>
                    <td className="num ht-mono" style={{ color: warn ? 'var(--warning-ink)' : undefined }}>{avail} {it.unit}</td>
                    <td className="num"><button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" aria-label={`Bỏ ${it.name}`} onClick={() => onChange({ items: ph.items.filter((_, k) => k !== j) })}><Icon name="x" /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="ht-proto-add">
            <MedicinePicker items={inventory} value={adding} onChange={setAdding} />
            <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" onClick={addItem} disabled={!adding}><Icon name="check" />Thêm thuốc</button>
            <span style={{ marginLeft: 'auto', fontSize: 13 }}>Chi phí giai đoạn: <b>{money(protoCost([ph]))}</b></span>
          </div>
        </div>
      )}
    </section>
  );
};
