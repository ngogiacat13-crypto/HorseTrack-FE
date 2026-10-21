import React, { useState } from 'react';
import type { Invoice } from '../../api/managerApi';
import { Callout, Dialog, money, ReasonField } from '../../components/ui/Ht';
import { useAction } from '../../hooks/useAction';
import { billingApi } from './billingApi';

export const CancelInvoiceDialog: React.FC<{ invoice: Invoice & { beId?: number }; onClose: () => void; onDone: () => void }> = ({ invoice, onClose, onDone }) => {
  const { busy, error, run } = useAction();
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const confirm = async () => {
    if (reason.trim().length < 10) { setReasonError('Lý do hủy ít nhất 10 ký tự.'); return; }
    if (await run(() => billingApi.cancelInvoice(Number(invoice.beId), reason), `Đã hủy hóa đơn ${invoice.id}.`)) onDone();
  };
  return (
    <Dialog open testId="cancel-invoice-dialog" onClose={onClose} icon="x" tone="danger" danger busy={busy}
      title={`Hủy hóa đơn ${invoice.id}?`} sub={`${invoice.horse} · ${invoice.owner} · ${money(invoice.amount)}`}
      confirmLabel="Xác nhận hủy" onConfirm={confirm}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      <ReasonField id="cancel-invoice-reason" label="Lý do hủy" value={reason} placeholder="Tối thiểu 10 ký tự" error={reasonError}
        onChange={(v) => { setReason(v); if (v.trim().length >= 10) setReasonError(''); }} />
    </Dialog>
  );
};
