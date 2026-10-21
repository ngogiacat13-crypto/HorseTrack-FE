import React, { useState } from 'react';
import { Requisition, ShipmentOrder, warehouseApi } from '../../../api/warehouseApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Callout, Dialog, ReasonField } from '../../../components/ui/Ht';
import type { ReqAction } from './RequisitionPanels';

export const RequisitionDialog: React.FC<{ req: Requisition; kind: ReqAction; openShipments: ShipmentOrder[]; onClose: () => void; onDone: () => void }> = ({ req: r, kind, openShipments, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const [qty, setQty] = useState(String(r.qty));
  const [to, setTo] = useState(r.by);
  const carrying = openShipments.filter((s) => s.lines.some((l) => l.itemId === r.itemId));
  const [ship, setShip] = useState(carrying[0]?.id ?? '');
  const [reason, setReason] = useState('');

  const confirm = async () => {
    const ok = kind === 'issue' ? await run(() => warehouseApi.issue(r, { qty: Number(qty), to }, actor), `${r.id}: đã cấp phát ${qty} ${r.unit} cho ${to}.`)
      : kind === 'wait' ? await run(() => warehouseApi.waitRestock(r, ship, actor), `${r.id}: chờ hàng ${ship} · đã báo ${r.by}.`)
      : await run(() => warehouseApi.reject(r, reason, actor), `${r.id}: đã từ chối.`);
    if (ok) onDone();
  };

  return (
    <Dialog open onClose={onClose} icon={kind === 'reject' ? 'x' : kind === 'wait' ? 'clock' : 'check'} tone={kind === 'reject' ? 'danger' : 'brand'} danger={kind === 'reject'} busy={busy}
      title={kind === 'issue' ? `Cấp phát · ${r.item}` : kind === 'wait' ? `Chờ hàng · ${r.id}` : `Từ chối ${r.id}`}
      sub={`${r.by} · ${r.zone} · yêu cầu ${r.qty} ${r.unit}`}
      confirmLabel={kind === 'issue' ? 'Xác nhận cấp phát' : kind === 'wait' ? 'Chờ hàng' : 'Từ chối'} onConfirm={confirm}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      {kind === 'issue' && (
        <div className="ht-grid-2">
          <div className="ht-field" style={{ margin: 0 }}><label className="ht-label" htmlFor="rq-qty">Số lượng cấp ({r.unit})</label><input id="rq-qty" className="ht-input" type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} /></div>
          <div className="ht-field" style={{ margin: 0 }}><label className="ht-label" htmlFor="rq-to">Người nhận<span className="ht-req">*</span></label><input id="rq-to" className="ht-input" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        </div>
      )}
      {kind === 'wait' && (
        <div className="ht-field" style={{ margin: 0 }}>
          <label className="ht-label" htmlFor="rq-ship">Đơn nhập có mặt hàng này</label>
          <select id="rq-ship" className="ht-select" style={{ height: 40, width: '100%' }} value={ship} onChange={(e) => setShip(e.target.value)}>
            {carrying.map((s) => <option key={s.id} value={s.id}>{s.id} · {s.supplier} · ETA {s.eta}</option>)}
          </select>
        </div>
      )}
      {kind === 'reject' && <ReasonField id="rq-reason" label="Lý do từ chối (gửi cho Mã phu)" value={reason} onChange={setReason} placeholder="VD: Đã cấp đủ trong tháng, dùng luân phiên trong khu." />}
    </Dialog>
  );
};
