import React, { useState } from 'react';
import { Invoice, managerApi, SUSPEND_AT } from '../../../api/managerApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Callout, Dialog, money, Rules } from '../../../components/ui/Ht';

export const SuspendDialog: React.FC<{ invoice: Invoice; onClose: () => void; onDone: () => void }> = ({ invoice: inv, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const [reason, setReason] = useState(`Hóa đơn ${inv.id} quá hạn ${inv.overdueDays} ngày, chưa có thanh toán được xác minh (BR_13).`);
  const confirm = async () => { if (await run(() => managerApi.suspendService(inv, reason, actor), `Đã đình chỉ dịch vụ của ${inv.owner} · ghi Audit Log.`)) onDone(); };
  return (
    <Dialog open onClose={onClose} icon="ban" tone="danger" danger busy={busy} title={`Đình chỉ dịch vụ của ${inv.owner}?`}
      sub={`${inv.id} · ${inv.horse} · ${money(inv.amount)} · quá hạn ${inv.overdueDays} ngày.`}
      confirmLabel="Xác nhận đình chỉ" onConfirm={confirm} disabled={reason.trim().length < 10}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      <Rules style={{ marginBottom: 14 }} items={[
        { ok: inv.overdueDays >= SUSPEND_AT, label: `Quá hạn ≥ ${SUSPEND_AT} ngày (BR_13)` },
        { ok: true, label: 'Đã gửi cảnh báo trước mốc đình chỉ' },
      ]} />
      <Callout tone="danger" style={{ marginBottom: 14 }}>Dịch vụ huấn luyện và chăm sóc của chủ ngựa tạm dừng. Chủ ngựa vẫn xem và thanh toán được hóa đơn.</Callout>
      <label className="ht-label" htmlFor="sus-reason" style={{ display: 'block', marginBottom: 6 }}>Lý do ghi nhật ký</label>
      <textarea id="sus-reason" className="ht-textarea" style={{ minHeight: 72 }} value={reason} onChange={(e) => setReason(e.target.value)} />
    </Dialog>
  );
};

export const ReactivateDialog: React.FC<{ invoice: Invoice; otherOverdue: boolean; onClose: () => void; onDone: () => void }> = ({ invoice: inv, otherOverdue, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const confirm = async () => { if (await run(() => managerApi.reactivateService(inv, actor), `Đã kích hoạt lại dịch vụ cho ${inv.owner}.`)) onDone(); };
  return (
    <Dialog open onClose={onClose} icon="refresh" tone="brand" busy={busy}
      title={`Kích hoạt lại dịch vụ cho ${inv.owner}?`} sub={`${inv.id} · ${inv.horse} · thanh toán ${inv.paidRef}`}
      confirmLabel="Kích hoạt lại" onConfirm={confirm}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      <Rules items={[
        { ok: true, label: <>Nợ gốc {money(inv.amount)} — VNPay đã xác minh qua callback</> },
        { ok: true, label: 'Phí phạt quá hạn đã thu' },
        { ok: true, label: 'Phí kích hoạt lại đã thu (BR_14)' },
        { ok: !otherOverdue, label: 'Không còn hóa đơn quá hạn khác' },
      ]} />
    </Dialog>
  );
};
