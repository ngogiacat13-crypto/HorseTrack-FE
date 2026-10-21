import React, { useState } from 'react';
import { Callout, Dialog } from '../../components/ui/Ht';
import { useAction } from '../../hooks/useAction';
import { billingApi, previousMonth, type GenerateResult } from './billingApi';

export const GenerateInvoicesDialog: React.FC<{ onClose: () => void; onDone: (result: GenerateResult) => void }> = ({ onClose, onDone }) => {
  const { busy, error, run } = useAction();
  const [month, setMonth] = useState(previousMonth());
  const confirm = async () => {
    let result: GenerateResult | null = null;
    const ok = await run(async () => { result = await billingApi.generateInvoices(month); });
    if (ok && result) onDone(result);
  };
  return (
    <Dialog open testId="generate-invoices-dialog" onClose={onClose} icon="receipt" tone="brand" busy={busy} busyLabel="Đang phát hành…"
      title="Phát hành hóa đơn tháng" sub="Lập hóa đơn cho mọi ngựa đang ở CLB từ chi phí thật (lưu chuồng, chăm sóc, thuốc, thi đấu). Gọi lại cùng kỳ không tạo trùng."
      confirmLabel="Phát hành" onConfirm={confirm} disabled={!month}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      <label className="ht-label" htmlFor="gen-month" style={{ display: 'block', marginBottom: 6 }}>Kỳ hóa đơn</label>
      <input id="gen-month" data-testid="generate-month-input" type="month" className="ht-input" value={month} onChange={(e) => setMonth(e.target.value)} />
      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>Hệ thống cũng tự phát hành ngày 1 hằng tháng cho kỳ tháng trước.</p>
    </Dialog>
  );
};
