import React, { useState } from 'react';
import type { Protocol } from '../../../api/vetApi';
import { byExpiry, needs, StockItem, warehouseApi } from '../../../api/warehouseApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Icon } from '../../../components/ui/Icon';
import { Busy, Callout, Panel } from '../../../components/ui/Ht';

export const DispenseForm: React.FC<{ protocol: Protocol; items: StockItem[]; groom?: string; onDone: () => void }> = ({ protocol: p, items, groom, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction(onDone);
  const [receiver, setReceiver] = useState(groom ?? '');
  const [lines, setLines] = useState(() => needs(p).map((n) => {
    const it = items.find((i) => i.id === n.itemId);
    const held = p.stock?.lines.find((l) => l.itemId === n.itemId);
    return { itemId: n.itemId, name: n.name, unit: n.unit, need: n.need, qty: String(n.need), lot: held?.lot ?? byExpiry((it?.lots ?? []).filter((l) => l.qty > 0))[0]?.lot ?? '', lots: it?.lots?.filter((l) => l.qty > 0) ?? [] };
  }));
  const set = (i: number, patch: Partial<(typeof lines)[number]>) => setLines(lines.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  const submit = () => run(() => warehouseApi.dispense(p, { receiver, lines: lines.map((l) => ({ itemId: l.itemId, qty: Number(l.qty), lot: l.lot })) }, actor), `${p.id}: đã cấp phát cho ${receiver}.`);

  return (
    <Panel title="Cấp phát theo phác đồ" sub="Bác sĩ đã xác nhận phác đồ. Ghi số lượng thực xuất, lô thuốc và người nhận.">
      <table className="ht-table">
        <thead><tr><th>Vật tư</th><th className="num">Theo phác đồ</th><th className="num">Thực xuất</th><th>Lô</th></tr></thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={l.itemId}>
              <td className="strong">{l.name}</td>
              <td className="num">{l.need} {l.unit}</td>
              <td className="num"><input className="ht-input" type="number" min={1} style={{ width: 80, height: 34, textAlign: 'right' }} value={l.qty} onChange={(e) => set(i, { qty: e.target.value })} aria-label={`Số lượng xuất ${l.name}`} /> {l.unit}</td>
              <td>{l.lots.length ? (
                <select className="ht-select" style={{ height: 34 }} value={l.lot} onChange={(e) => set(i, { lot: e.target.value })} aria-label={`Lô ${l.name}`}>
                  {byExpiry(l.lots).map((x) => <option key={x.lot} value={x.lot}>{x.lot} · HSD {x.expiry} · còn {x.qty}</option>)}
                </select>
              ) : <span style={{ color: 'var(--muted)' }}>Không quản lý lô</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ht-panel__body" style={{ display: 'grid', gap: 12, paddingTop: 16 }}>
        <div className="ht-field" style={{ margin: 0, maxWidth: 360 }}>
          <label className="ht-label" htmlFor="ds-to">Người nhận<span className="ht-req">*</span></label>
          <input id="ds-to" className="ht-input" value={receiver} onChange={(e) => setReceiver(e.target.value)} placeholder="Mã phu / bác sĩ nhận thuốc" />
        </div>
        {error && <Callout tone="danger">{error}</Callout>}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="ht-btn ht-btn--primary" onClick={submit} disabled={busy}><Busy busy={busy} label="Đang cấp phát…"><Icon name="check" />Xác nhận đã cấp phát</Busy></button>
        </div>
      </div>
    </Panel>
  );
};
