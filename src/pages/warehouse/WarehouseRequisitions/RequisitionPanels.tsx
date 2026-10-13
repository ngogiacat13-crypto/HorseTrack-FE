import React from 'react';
import { Link } from 'react-router-dom';
import { available, REQ_LABEL, Requisition, ShipmentOrder, StockItem } from '../../../api/warehouseApi';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Callout, Panel, Timeline } from '../../../components/ui/Ht';

export type ReqAction = 'issue' | 'wait' | 'reject';

export const RequisitionTable: React.FC<{ rows: Requisition[]; items: StockItem[]; selectedId?: string; onSelect: (id: string) => void }> = ({ rows, items, selectedId, onSelect }) => (
  <Panel>
    <div style={{ overflowX: 'auto' }}>
      <table className="ht-table">
        <thead><tr><th>Mã</th><th>Mã phu · khu</th><th>Vật tư</th><th className="num">SL</th><th className="num">Khả dụng</th><th>Cần trước</th><th>Trạng thái</th></tr></thead>
        <tbody>
          {rows.map((r) => {
            const it = items.find((i) => i.id === r.itemId);
            const enough = it ? available(it) >= r.qty : false;
            return (
              <tr key={r.id} className={selectedId === r.id ? 'is-selected' : undefined} style={{ cursor: 'pointer' }} tabIndex={0}
                onClick={() => onSelect(r.id)} onKeyDown={(e) => { if (e.key === 'Enter') onSelect(r.id); }}>
                <td className="id">{r.id}<span className="sub">{r.at}</span></td>
                <td><span className="strong">{r.by}</span><span className="sub">{r.zone}</span></td>
                <td>{r.item}</td>
                <td className="num">{r.qty} {r.unit}</td>
                <td className="num" style={{ color: enough ? undefined : 'var(--danger-ink)' }}>{it ? available(it) : '—'}</td>
                <td className="mono">{r.neededBy.slice(0, 5)}</td>
                <td><Badge tone={REQ_LABEL[r.status][1]}>{REQ_LABEL[r.status][0]}</Badge></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && <div className="ht-empty">Không có yêu cầu ở mục này.</div>}
    </div>
  </Panel>
);

/* 4.2–4.3 — one request: stock check, then issue / wait for a shipment / reject with a reason. */
export const RequisitionDetail: React.FC<{ req: Requisition; item?: StockItem; openShipments: ShipmentOrder[]; onAction: (a: ReqAction) => void }> = ({ req: r, item, openShipments, onAction }) => {
  const avail = item ? available(item) : 0;
  const enough = avail >= r.qty;
  const active = ['SUBMITTED', 'CHECKING_STOCK', 'APPROVED_FOR_ISSUE'].includes(r.status);
  const ship = openShipments.find((s) => s.id === r.shipmentId);
  const carrying = openShipments.filter((s) => s.lines.some((l) => l.itemId === r.itemId));
  return (
    <Panel as="h3" title={<span className="ht-mono">{r.id}</span>} sub={`${r.by} · ${r.zone}`} right={<Badge tone={REQ_LABEL[r.status][1]}>{REQ_LABEL[r.status][0]}</Badge>}>
      <div className="ht-panel__body" style={{ display: 'grid', gap: 14 }}>
        <dl className="ht-kv" style={{ gridTemplateColumns: '100px 1fr' }}>
          <dt>Vật tư</dt><dd>{r.item} <span className="ht-mono" style={{ color: 'var(--muted)', fontSize: 12 }}>{r.itemId}</span></dd>
          <dt>Số lượng</dt><dd><b>{r.qty} {r.unit}</b></dd>
          <dt>Cần trước</dt><dd className="ht-mono">{r.neededBy}</dd>
          <dt>Tồn khả dụng</dt><dd style={{ color: enough ? 'var(--success-ink)' : 'var(--danger-ink)', fontWeight: 600 }}>{avail} {r.unit}{!enough && ` · thiếu ${r.qty - avail}`}</dd>
          {item && item.unitPrice * r.qty >= 2_000_000 && <><dt>Giá trị</dt><dd>{(item.unitPrice * r.qty).toLocaleString('vi-VN')} ₫ <span style={{ color: 'var(--muted)', fontSize: 12 }}>· thiết bị giá trị cao</span></dd></>}
        </dl>
        <div className="ht-quote"><span className="ht-overline">Lý do</span>{r.reason}</div>
        {r.rejectReason && <Callout tone="danger" title="Đã từ chối">{r.rejectReason}</Callout>}
        {r.issued && <Callout tone="success" title="Đã cấp phát">{r.issued.qty} {r.unit} cho {r.issued.to} · {r.issued.at} · {r.issued.by}</Callout>}
        {r.status === 'WAITING_RESTOCK' && <Callout tone="info" icon="truck">Chờ đơn <b className="ht-mono">{r.shipmentId}</b>{ship ? ` · ETA ${ship.eta}` : ''}. Khi nhận hàng, yêu cầu tự chuyển “Sẵn sàng cấp” và báo {r.by}.</Callout>}

        {active && (
          <div className="ht-actions-grid">
            <button type="button" className="ht-btn ht-btn--primary ht-btn--block" disabled={!enough} onClick={() => onAction('issue')} title={enough ? undefined : 'Không đủ tồn khả dụng'}><Icon name="check" />{r.status === 'APPROVED_FOR_ISSUE' ? 'Cấp phát' : 'Duyệt & cấp phát'}</button>
            {r.status !== 'APPROVED_FOR_ISSUE' && (carrying.length
              ? <button type="button" className="ht-btn ht-btn--secondary" onClick={() => onAction('wait')}><Icon name="clock" />Chờ hàng</button>
              : <Link className="ht-btn ht-btn--secondary" to={`/warehouse/shipments?for=${r.id}`}><Icon name="truck" />Tạo đơn nhập</Link>)}
            <button type="button" className="ht-btn ht-btn--ghost" onClick={() => onAction('reject')}>Từ chối</button>
          </div>
        )}
        <div>
          <div className="ht-overline" style={{ marginBottom: 10 }}>Lịch sử trạng thái</div>
          <Timeline items={r.history.map((h) => ({ tone: h.tone, what: <><b>{h.who}</b> {h.text}</>, when: h.at }))} />
        </div>
      </div>
    </Panel>
  );
};
