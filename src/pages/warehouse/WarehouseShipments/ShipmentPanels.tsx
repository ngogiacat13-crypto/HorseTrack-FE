import React from 'react';
import { OPEN_SHIPMENT, SHIPMENT_LABEL, ShipmentOrder } from '../../../api/warehouseApi';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Panel, Timeline } from '../../../components/ui/Ht';

export type ShipmentAction = 'transit' | 'eta' | 'receive' | 'cancel';

/** 3.2 — orders with status and ETA (old ETA struck through when it moved). */
export const ShipmentTable: React.FC<{ shipments: ShipmentOrder[]; selectedId?: string; onSelect: (id: string) => void }> = ({ shipments, selectedId, onSelect }) => (
  <Panel>
    <div style={{ overflowX: 'auto' }}>
      <table className="ht-table">
        <thead><tr><th>Mã</th><th>Nhà cung cấp</th><th>Mặt hàng</th><th>ETA</th><th>Cho</th><th>Trạng thái</th></tr></thead>
        <tbody>
          {shipments.map((s) => (
            <tr key={s.id} className={`${selectedId === s.id ? 'is-selected' : ''}${s.status === 'DELAYED' ? ' is-danger' : ''}`} style={{ cursor: 'pointer' }} tabIndex={0}
              onClick={() => onSelect(s.id)} onKeyDown={(e) => { if (e.key === 'Enter') onSelect(s.id); }}>
              <td className="id">{s.id}<span className="sub">đặt {s.orderedAt.slice(0, 5)}</span></td>
              <td>{s.supplier}</td>
              <td style={{ fontSize: 13 }}>{s.item}</td>
              <td className="mono">{s.etaOld && <s style={{ color: 'var(--muted)' }}>{s.etaOld.slice(0, 5)}</s>} {s.eta.slice(0, 5)}</td>
              <td className="mono">{s.forRef}</td>
              <td><Badge tone={SHIPMENT_LABEL[s.status][1]}>{SHIPMENT_LABEL[s.status][0]}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
      {shipments.length === 0 && <div className="ht-empty">Không có đơn nhập ở mục này.</div>}
    </div>
  </Panel>
);

/** One order: lines (ordered / received / lot), what it is for, history, and the next actions. */
export const ShipmentDetail: React.FC<{ shipment: ShipmentOrder; onAction: (a: ShipmentAction) => void }> = ({ shipment: s, onAction }) => {
  const open = OPEN_SHIPMENT.includes(s.status);
  return (
    <Panel as="h3" title={<span className="ht-mono">{s.id}</span>} sub={s.supplier} right={<Badge tone={SHIPMENT_LABEL[s.status][1]}>{SHIPMENT_LABEL[s.status][0]}</Badge>}>
      <div className="ht-panel__body" style={{ display: 'grid', gap: 14 }}>
        <dl className="ht-kv" style={{ gridTemplateColumns: '100px 1fr' }}>
          <dt>Ngày đặt</dt><dd className="ht-mono">{s.orderedAt}</dd>
          <dt>ETA</dt><dd className="ht-mono">{s.etaOld && <><s style={{ color: 'var(--muted)' }}>{s.etaOld}</s> → </>}<b style={{ color: s.status === 'DELAYED' ? 'var(--danger-ink)' : undefined }}>{s.eta}</b></dd>
          {s.requiredBy && <><dt>Cần trước</dt><dd className="ht-mono">{s.requiredBy}</dd></>}
          <dt>Cho</dt><dd className="ht-mono">{s.forRef}</dd>
          {s.receivedAt && <><dt>Đã nhận</dt><dd className="ht-mono">{s.receivedAt}</dd></>}
          {s.cancelReason && <><dt>Lý do hủy</dt><dd>{s.cancelReason}</dd></>}
        </dl>
        <table className="ht-proto-items">
          <thead><tr><th>Mặt hàng</th><th className="num">Đặt</th><th className="num">Nhận</th><th>Lô · HSD</th></tr></thead>
          <tbody>
            {s.lines.map((l) => (
              <tr key={l.itemId} className={l.received !== null && l.received < l.qty ? 'is-warn' : undefined}>
                <td><b>{l.name}</b></td><td className="num">{l.qty} {l.unit}</td><td className="num">{l.received ?? '—'}</td>
                <td className="ht-mono" style={{ fontSize: 12 }}>{l.lot ? `${l.lot} · ${l.expiry}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {open && (
          <div className="ht-actions-grid">
            {s.status === 'ORDERED' && <button type="button" className="ht-btn ht-btn--secondary" onClick={() => onAction('transit')}><Icon name="truck" />Đang giao</button>}
            <button type="button" className="ht-btn ht-btn--secondary" onClick={() => onAction('eta')}><Icon name="clock" />Cập nhật ETA</button>
            <button type="button" className="ht-btn ht-btn--primary ht-btn--block" onClick={() => onAction('receive')}><Icon name="box" />Nhận hàng & nhập kho</button>
            <button type="button" className="ht-btn ht-btn--ghost ht-btn--block" onClick={() => onAction('cancel')}>Hủy đơn</button>
          </div>
        )}
        <div>
          <div className="ht-overline" style={{ marginBottom: 10 }}>Lịch sử</div>
          <Timeline items={s.history.map((h) => ({ tone: h.tone, what: <><b>{h.who}</b> {h.text}</>, when: h.at }))} />
        </div>
      </div>
    </Panel>
  );
};
