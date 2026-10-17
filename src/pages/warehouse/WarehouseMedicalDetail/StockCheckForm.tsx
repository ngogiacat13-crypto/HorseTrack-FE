import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Protocol } from '../../../api/vetApi';
import { previewStock, ShipmentOrder, StockItem, warehouseApi } from '../../../api/warehouseApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Busy, Callout, Panel } from '../../../components/ui/Ht';

/* 2.2 / 2.3 — compare need with available stock. Enough → hold + STOCK_AVAILABLE. Short → report how much and an ETA from a real order, or "chưa xác định". */
export const StockCheckForm: React.FC<{ protocol: Protocol; items: StockItem[]; openShipments: ShipmentOrder[]; onDone: () => void }> = ({ protocol: p, items, openShipments, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction(onDone);
  const lines = previewStock(p, items);
  const short = lines.filter((l) => l.short > 0);
  // Default ETA source: the first open shipment that carries the item.
  const [eta, setEta] = useState<Record<string, string>>(() =>
    Object.fromEntries(short.map((l) => [l.itemId, openShipments.find((s) => s.lines.some((x) => x.itemId === l.itemId))?.id ?? ''])));
  const submit = () => run(() => warehouseApi.respondStock(p, Object.fromEntries(short.map((l) => [l.itemId, eta[l.itemId] || null])), actor),
    short.length ? `${p.id}: đã báo thiếu cho bác sĩ.` : `${p.id}: đủ hàng, đã giữ — chờ bác sĩ xác nhận.`);

  return (
    <Panel title="Kiểm tồn & phản hồi" sub={`Đối chiếu số cần với tồn khả dụng (tồn thực tế − đã giữ). Mốc cần thuốc ${p.requiredBy}.`}>
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
                      <select className="ht-select" style={{ height: 34 }} value={eta[l.itemId] ?? ''} onChange={(e) => setEta({ ...eta, [l.itemId]: e.target.value })} aria-label={`ETA cho ${l.name}`}>
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
          <button type="button" className="ht-btn ht-btn--primary" onClick={submit} disabled={busy}>
            <Busy busy={busy} label="Đang gửi…"><Icon name="send" />{short.length ? 'Giữ phần có sẵn & báo thiếu cho bác sĩ' : 'Xác nhận đủ hàng & giữ tồn'}</Busy>
          </button>
        </div>
      </div>
    </Panel>
  );
};
