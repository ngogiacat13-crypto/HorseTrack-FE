import React, { useMemo, useState } from 'react';
import { DEMO_NOW } from '../../../api/http';
import { StockItem, warehouseApi } from '../../../api/warehouseApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Icon } from '../../../components/ui/Icon';
import { Busy, Callout, Panel } from '../../../components/ui/Ht';

/* 1.5 — count sheet: enter the real count; every difference needs a reason and becomes an ADJUST in the warehouse log. */
export const CountSheet: React.FC<{ items: StockItem[]; onDone: () => void }> = ({ items, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction(onDone);
  const [category, setCategory] = useState('');
  const [counted, setCounted] = useState<Record<string, string>>({});
  const [reason, setReason] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const categories = [...new Set(items.map((i) => i.category))];
  const list = useMemo(() => items.filter((i) => !category || i.category === category), [items, category]);
  const filled = items.filter((i) => counted[i.id] !== undefined && counted[i.id] !== '');
  const diffs = filled.filter((i) => Number(counted[i.id]) !== i.onHand);

  const submit = () => run(() => warehouseApi.submitCheck({ note, lines: filled.map((i) => ({ itemId: i.id, counted: Number(counted[i.id]), reason: reason[i.id] ?? '' })) }, actor),
    `Đã lưu biên bản kiểm kê · ${filled.length} mặt hàng · ${diffs.length} chênh lệch.`);

  return (
    <Panel title={`Phiếu kiểm kê tháng ${DEMO_NOW.date.slice(3)}`} sub="Nhập số đếm thực tế. Chỉ những mặt hàng có số đếm mới được đưa vào biên bản."
      right={<select className="ht-select" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Danh mục"><option value="">Tất cả danh mục</option>{categories.map((c) => <option key={c}>{c}</option>)}</select>}>
      <div style={{ overflowX: 'auto', maxHeight: 520 }}>
        <table className="ht-table">
          <thead><tr><th>Mặt hàng</th><th className="num">Theo hệ thống</th><th className="num">Đếm thực tế</th><th className="num">Chênh lệch</th><th>Lý do chênh lệch</th></tr></thead>
          <tbody>
            {list.map((i) => {
              const c = counted[i.id];
              const diff = c === undefined || c === '' ? null : Number(c) - i.onHand;
              return (
                <tr key={i.id} className={diff ? 'is-warn' : undefined}>
                  <td><span className="strong">{i.name}</span><span className="sub mono">{i.id} · {i.group}</span></td>
                  <td className="num">{i.onHand} {i.unit}</td>
                  <td className="num"><input className="ht-input" type="number" min={0} style={{ width: 90, height: 34, textAlign: 'right' }} value={c ?? ''} aria-label={`Đếm thực tế ${i.name}`}
                    onChange={(e) => setCounted({ ...counted, [i.id]: e.target.value })} /></td>
                  <td className="num" style={{ fontWeight: 600, color: diff ? (diff < 0 ? 'var(--danger-ink)' : 'var(--success-ink)') : 'var(--muted)' }}>{diff === null ? '—' : diff > 0 ? `+${diff}` : diff}</td>
                  <td>{diff ? <input className="ht-input" style={{ height: 34 }} value={reason[i.id] ?? ''} placeholder="VD: 2 cái gãy, thanh lý" aria-label={`Lý do chênh lệch ${i.name}`}
                    onChange={(e) => setReason({ ...reason, [i.id]: e.target.value })} /> : <span style={{ color: 'var(--muted)' }}>{diff === 0 ? 'Khớp' : ''}</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="ht-panel__body" style={{ display: 'grid', gap: 12, paddingTop: 16 }}>
        <div className="ht-field" style={{ margin: 0 }}><label className="ht-label" htmlFor="kk-note">Ghi chú biên bản</label><input id="kk-note" className="ht-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: Kiểm kê cuối tháng 10, kho A" /></div>
        {error && <Callout tone="danger">{error}</Callout>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Đã đếm {filled.length} mặt hàng · {diffs.length} chênh lệch</span>
          <button type="button" className="ht-btn ht-btn--primary" onClick={submit} disabled={busy || !filled.length}><Busy busy={busy} label="Đang lưu…"><Icon name="check" />Lưu biên bản & điều chỉnh tồn</Busy></button>
        </div>
      </div>
    </Panel>
  );
};
