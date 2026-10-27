import React, { useState } from 'react';
import type { Protocol } from '../../../api/vetApi';
import { byExpiry, needs, StockItem, warehouseApi } from '../../../api/warehouseApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Icon } from '../../../components/ui/Icon';
import { Busy, Callout, Panel } from '../../../components/ui/Ht';

export const DispenseForm: React.FC<{ protocol: Protocol; items: StockItem[]; onDone: () => void }> = ({ protocol: p, items, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction(onDone);
  const approved = (p.approvedPhases ?? p.phases.map((ph) => ph.no)).filter((no) => !(p.dispensedPhases ?? []).includes(no));
  const [phaseNos, setPhaseNos] = useState<number[]>(approved);
  const [lines, setLines] = useState(() => needs(p, approved).map((n) => {
    const it = items.find((i) => i.id === n.itemId);
    const held = p.stock?.lines.find((l) => l.itemId === n.itemId && l.phaseNo === n.phaseNo);
    return { itemId: n.itemId, phaseNo: n.phaseNo, name: n.name, unit: n.unit, need: n.need, qty: String(n.need), lot: held?.lot ?? byExpiry((it?.lots ?? []).filter((l) => l.qty > 0))[0]?.lot ?? '', lots: it?.lots?.filter((l) => l.qty > 0) ?? [] };
  }));
  const set = (i: number, patch: Partial<(typeof lines)[number]>) => setLines(lines.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  const submit = () => run(() => warehouseApi.dispense(p, { phaseNos, lines: lines.filter((l) => phaseNos.includes(l.phaseNo)).map((l) => ({ itemId: l.itemId, phaseNo: l.phaseNo, qty: Number(l.qty), lot: l.lot })) }, actor), `${p.id}: đã cấp phát ${phaseNos.length} giai đoạn.`);

  return (
    <Panel title="Cấp phát theo phác đồ" sub="Chọn các giai đoạn đã đủ thuốc để cấp phát.">
      <div className="ht-panel__body" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 12 }}>
        {approved.map((no) => { const ph = p.phases.find((x) => x.no === no); return <label key={no} className="ht-role"><input type="checkbox" checked={phaseNos.includes(no)} onChange={() => setPhaseNos((xs) => xs.includes(no) ? xs.filter((x) => x !== no) : [...xs, no])} />Giai đoạn {no} · {ph?.name}</label>; })}
      </div>
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
        {error && <Callout tone="danger">{error}</Callout>}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="ht-btn ht-btn--primary" onClick={submit} disabled={busy || !phaseNos.length}><Busy busy={busy} label="Đang cấp phát…"><Icon name="check" />Cấp phát {phaseNos.length} giai đoạn</Busy></button>
        </div>
      </div>
    </Panel>
  );
};
