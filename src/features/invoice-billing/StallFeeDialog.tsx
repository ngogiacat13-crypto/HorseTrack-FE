import React, { useEffect, useState } from 'react';
import { Callout, Dialog } from '../../components/ui/Ht';
import { useAction } from '../../hooks/useAction';
import { billingApi, type FeeStall } from './billingApi';

export const StallFeeDialog: React.FC<{ onClose: () => void; onDone: () => void }> = ({ onClose, onDone }) => {
  const { busy, error, run } = useAction();
  const [stalls, setStalls] = useState<FeeStall[]>([]);
  const [stallId, setStallId] = useState('');
  const [fee, setFee] = useState('');
  useEffect(() => { billingApi.listStalls().then(setStalls).catch(() => setStalls([])); }, []);
  const stall = stalls.find((s) => String(s.beId) === stallId);
  const confirm = async () => {
    if (!stall) { await run(() => Promise.reject(new Error('Chọn chuồng.'))); return; }
    const amount = Number(fee.replace(/\D/g, ''));
    if (await run(() => billingApi.setStallFee(stall.beId, amount), `Đã đặt phí lưu chuồng ${stall.id}: ${amount.toLocaleString('vi-VN')} ₫/tháng.`)) onDone();
  };
  return (
    <Dialog open testId="stall-fee-dialog" onClose={onClose} icon="stable" tone="brand" busy={busy}
      title="Phí lưu chuồng hằng tháng" sub="Dùng cho dòng “Lưu chuồng” khi phát hành hóa đơn tháng."
      confirmLabel="Lưu phí" onConfirm={confirm} disabled={!stallId || !fee}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      <div className="ht-grid-2">
        <div className="ht-field">
          <label className="ht-label" htmlFor="fee-stall">Chuồng</label>
          <select id="fee-stall" data-testid="stall-fee-stall-select" className="ht-select" style={{ width: '100%' }} value={stallId} onChange={(e) => setStallId(e.target.value)}>
            <option value="">{stalls.length ? 'Chọn chuồng…' : 'Chưa có chuồng'}</option>
            {stalls.map((s) => <option key={s.beId} value={s.beId}>{s.id} · {s.zone}{s.horse ? ` · ${s.horse}` : ''}</option>)}
          </select>
        </div>
        <div className="ht-field">
          <label className="ht-label" htmlFor="fee-amount">Phí / tháng (₫)</label>
          <input id="fee-amount" data-testid="stall-fee-amount-input" className="ht-input" inputMode="numeric" placeholder="VD: 6000000" value={fee} onChange={(e) => setFee(e.target.value.replace(/[^\d]/g, ''))} />
        </div>
      </div>
    </Dialog>
  );
};
