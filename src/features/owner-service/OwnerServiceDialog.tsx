import React, { useState } from 'react';
import { be, beData } from '../../api/beClient';
import { financeBe } from '../../api/beFinance';
import { invalidate } from '../../api/hybridAdapter';
import { useAction } from '../../hooks/useAction';
import { useFetch } from '../../hooks/useFetch';
import { Badge, Callout, Dialog, ReasonField } from '../../components/ui/Ht';

interface BeOwnerService { ownerId: number; fullName: string; email?: string | null; serviceStatus: string; suspendedSince?: string | null; suspensionReason?: string | null }

const loadService = (ownerId: number) => beData<BeOwnerService>(be.get(`/billing/owners/${ownerId}/service`));
const dmy = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/');

export const OwnerServiceDialog: React.FC<{ ownerId: number; ownerName: string; onClose: () => void }> = ({ ownerId, ownerName, onClose }) => {
  const { data, error, loading, reload } = useFetch(() => loadService(ownerId), [ownerId]);
  const { busy, error: actionError, run } = useAction();
  const [reason, setReason] = useState('');
  const suspended = data?.serviceStatus === 'SUSPENDED';
  const confirm = async () => {
    if (!data) return onClose();
    const ok = suspended
      ? await run(async () => { await financeBe.reactivateOwner(ownerId); }, `Đã mở lại dịch vụ cho ${ownerName}.`)
      : await run(async () => {
        if (reason.trim().length < 10) throw new Error('Lý do tạm ngưng ít nhất 10 ký tự.');
        await financeBe.suspendOwner(ownerId, reason.trim());
      }, `Đã tạm ngưng dịch vụ của ${ownerName}.`);
    if (ok) { invalidate('invoices'); setReason(''); reload(); }
  };

  return (
    <Dialog open onClose={onClose} icon="card" tone={suspended ? 'brand' : 'danger'} width={560} busy={busy} busyLabel="Đang lưu…" testId="owner-service-dialog"
      title={`Dịch vụ chủ ngựa · ${ownerName}`} sub="Tạm ngưng khi nợ quá hạn: chủ ngựa không gửi thêm yêu cầu dịch vụ cho tới khi mở lại."
      confirmLabel={!data ? 'Đóng' : suspended ? 'Mở lại dịch vụ' : 'Tạm ngưng dịch vụ'} onConfirm={confirm}>
      {(error || actionError) && <Callout tone="danger" style={{ marginBottom: 14 }}>{actionError || error}</Callout>}
      {loading && !data && <div className="ht-empty">Đang tải…</div>}
      {data && (
        <div style={{ display: 'grid', gap: 12 }} data-testid="owner-service-status">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {suspended ? <Badge tone="danger">Đang tạm ngưng</Badge> : <Badge tone="success">Đang hoạt động</Badge>}
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{data.email ?? ''}</span>
          </div>
          {suspended && (
            <Callout tone="danger">
              Tạm ngưng từ {data.suspendedSince ? dmy(data.suspendedSince) : '—'}{data.suspensionReason ? ` · Lý do: ${data.suspensionReason}` : ''}
            </Callout>
          )}
          {!suspended && <ReasonField id="owner-service-reason" label="Lý do tạm ngưng" min={10} value={reason} onChange={setReason} placeholder="VD: Hóa đơn tháng 08 quá hạn 30 ngày" minHeight={56} />}
        </div>
      )}
    </Dialog>
  );
};
