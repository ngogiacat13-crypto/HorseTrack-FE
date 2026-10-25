import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Protocol } from '../../../api/vetApi';
import { USE_BACKEND } from '../../../api/beClient';
import { previewStock, ShipmentOrder, StockItem, warehouseApi } from '../../../api/warehouseApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Busy, Callout, Panel } from '../../../components/ui/Ht';

export const StockCheckForm: React.FC<{ protocol: Protocol; items: StockItem[]; openShipments: ShipmentOrder[]; onDone: () => void }> = ({ protocol: p, items, openShipments, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction(onDone);
  const remaining = p.phases.filter((ph) => !(p.approvedPhases ?? []).includes(ph.no));
  const [phaseNos, setPhaseNos] = useState<number[]>(remaining.map((ph) => ph.no));
  const checkedPhases = USE_BACKEND ? p.phases.map((ph) => ph.no) : phaseNos;
  const lines = previewStock(p, items, checkedPhases);
  const short = lines.filter((l) => l.short > 0);
  const [eta, setEta] = useState<Record<string, string>>({});
  const submit = () => run(() => warehouseApi.respondStock(p, Object.fromEntries(short.map((l) => [`${l.phaseNo}:${l.itemId}`, eta[`${l.phaseNo}:${l.itemId}`] || null])), actor, checkedPhases),
    short.length ? `${p.id}: đã phản hồi kho.` : `${p.id}: đã giữ đủ hàng.`);

  return (
    <Panel title="Kiểm tồn & phản hồi" sub={USE_BACKEND ? 'Đối chiếu toàn bộ thuốc của phác đồ với tồn khả dụng trên server.' : `Đối chiếu thuốc cho ${checkedPhases.length} giai đoạn đang chọn · tồn khả dụng.`}>
      {!USE_BACKEND && (
      <div className="ht-panel__body" style={{ display: 'grid', gap: 8, paddingBottom: 0 }}>
        <div className="ht-label">Chọn giai đoạn cần duyệt</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
          {p.phases.map((ph) => { const done = (p.approvedPhases ?? []).includes(ph.no); return <label key={ph.no} className="ht-role" style={{ opacity: done ? 0.6 : 1 }}><input type="checkbox" checked={done || phaseNos.includes(ph.no)} disabled={done} onChange={() => setPhaseNos((xs) => xs.includes(ph.no) ? xs.filter((x) => x !== ph.no) : [...xs, ph.no])} /><span><b>Giai đoạn {ph.no} · {ph.name}</b><small className="sub">Bắt đầu {ph.startDate} · {ph.items.length} thuốc/vật tư{done ? ' · Đã duyệt' : ''}</small></span></label>; })}
        </div>
        <Callout tone="info">Chỉ giai đoạn được chọn mới được kiểm tồn và giữ thuốc. Giai đoạn còn lại sẽ xử lý khi thuốc nhập về.</Callout>
      </div>
      )}
      <table className="ht-table">
        <thead><tr><th>Vật tư</th><th className="num">Cần</th><th className="num">Khả dụng</th><th className="num">Sẽ giữ</th><th>Lô xuất trước (FEFO)</th><th>Thiếu · ETA</th></tr></thead>
        <tbody>
          {lines.map((l) => {
            const ships = openShipments.filter((s) => s.lines.some((x) => x.itemId === l.itemId));
            return (
              <tr key={l.itemId} className={l.short ? 'is-warn' : undefined}>
                <td className="strong">{l.name}</td>
                <td className="num">{l.need} {l.unit}</td>
                <td className="num">{l.available}</td>
                <td className="num"><b>{l.held}</b></td>
                <td className="mono" style={{ fontSize: 12 }}>{l.lot ? `${l.lot} · HSD ${l.expiry}` : '—'}</td>
                <td>
                  {l.short === 0 ? <Badge tone="success">Đủ</Badge> : (
                    <div style={{ display: 'grid', gap: 6 }}>
                      <Badge tone="danger">Thiếu {l.short} {l.unit}</Badge>
                      <select className="ht-select" style={{ height: 34 }} value={eta[`${l.phaseNo}:${l.itemId}`] ?? ''} onChange={(e) => setEta({ ...eta, [`${l.phaseNo}:${l.itemId}`]: e.target.value })} aria-label={`ETA cho ${l.name}`}>
                        <option value="">ETA chưa xác định</option>
                        {ships.map((s) => <option key={s.id} value={s.id}>{s.id} · về {s.eta.slice(0, 5)}{s.status === 'DELAYED' ? ' (trễ)' : ''}</option>)}
                      </select>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="ht-panel__body" style={{ display: 'grid', gap: 12, paddingTop: 16 }}>
        {short.length > 0 && (
          <Callout tone="info" icon="truck">
            Chỉ chọn ETA từ một đơn nhập có thật. Nếu chưa có đơn, để “chưa xác định” rồi <Link to={`/warehouse/shipments?for=${p.id}`}>tạo đơn nhập</Link> — ETA sẽ được cập nhật cho bác sĩ.
          </Callout>
        )}
        {error && <Callout tone="danger">{error}</Callout>}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="ht-btn ht-btn--primary" onClick={submit} disabled={busy || !checkedPhases.length}>
            <Busy busy={busy} label="Đang gửi…"><Icon name="send" />{short.length ? 'Giữ phần có sẵn và báo thiếu' : 'Đủ hàng — giữ và gửi bác sĩ xác nhận'}</Busy>
          </button>
        </div>
      </div>
    </Panel>
  );
};
