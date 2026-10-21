import React, { useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { useToast } from '../../components/ui/Ht';
import { GenerateInvoicesDialog } from './GenerateInvoicesDialog';
import { StallFeeDialog } from './StallFeeDialog';

export const BillingActions: React.FC<{ onChanged: () => void }> = ({ onChanged }) => {
  const toast = useToast();
  const [open, setOpen] = useState<null | 'generate' | 'fee'>(null);
  return (
    <>
      <button type="button" className="ht-btn ht-btn--secondary" data-testid="stall-fee-btn" onClick={() => setOpen('fee')}><Icon name="stable" />Phí lưu chuồng</button>
      <button type="button" className="ht-btn ht-btn--primary" data-testid="generate-invoices-btn" onClick={() => setOpen('generate')}><Icon name="receipt" />Phát hành hóa đơn tháng</button>
      {open === 'generate' && <GenerateInvoicesDialog onClose={() => setOpen(null)} onDone={(r) => {
        setOpen(null);
        toast(`Kỳ ${r.billingMonth}: phát hành ${r.created} hóa đơn · bỏ qua ${r.skippedExisting} đã có · ${r.skippedZero} không phát sinh phí.`);
        onChanged();
      }} />}
      {open === 'fee' && <StallFeeDialog onClose={() => setOpen(null)} onDone={() => setOpen(null)} />}
    </>
  );
};
