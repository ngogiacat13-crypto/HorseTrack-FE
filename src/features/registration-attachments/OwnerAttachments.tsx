import React, { useState } from 'react';
import { USE_BACKEND, be } from '../../api/beClient';
import { invalidate } from '../../api/hybridAdapter';
import { managerApi, type Registration } from '../../api/managerApi';
import { useAction } from '../../hooks/useAction';
import { Icon } from '../../components/ui/Icon';
import { Callout, Dialog } from '../../components/ui/Ht';

type Attachment = Registration['attachments'][number];

const removeAttachment = async (horseId: number, attachmentId: number) => {
  await be.delete(`/horses/${horseId}/registration-attachments/${attachmentId}`);
  invalidate('registrations');
};

export const OwnerAttachments: React.FC<{ reg: Registration; onChanged: () => void }> = ({ reg, onChanged }) => {
  const { busy, error, run } = useAction();
  const [removing, setRemoving] = useState<Attachment | null>(null);
  if (!USE_BACKEND) return null;
  const editable = reg.status === 'Pending' && !!reg.beId;
  const confirm = async () => {
    if (!removing?.beId || !reg.beId) return;
    if (await run(() => removeAttachment(reg.beId as number, removing.beId as number), `Đã gỡ ${removing.file ?? removing.name}.`)) { setRemoving(null); onChanged(); }
  };

  return (
    <div style={{ display: 'grid', gap: 8 }} data-testid={`owner-attachments-${reg.id}`}>
      <b style={{ fontSize: 13 }}>Giấy tờ đã gửi ({reg.attachments.length})</b>
      {reg.attachments.length === 0 && <span style={{ fontSize: 13, color: 'var(--muted)' }}>Chưa có tệp đính kèm.</span>}
      {reg.attachments.map((a) => (
        <div key={a.beId ?? a.name} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, minWidth: 0 }}>
          <Icon name="file" size={15} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <b>{a.name}</b>
            <small style={{ display: 'block', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.file}>{a.file ? `${a.file} · ` : ''}{a.meta}</small>
          </span>
          {a.beId && <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" data-testid={`owner-view-attachment-${a.beId}`} onClick={() => run(() => managerApi.openAttachment(a.beId as number))}>Xem</button>}
          {editable && a.beId && <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" data-testid={`remove-attachment-${a.beId}`} onClick={() => setRemoving(a)}>Gỡ</button>}
        </div>
      ))}
      {error && !removing && <Callout tone="danger">{error}</Callout>}
      {removing && (
        <Dialog open onClose={() => setRemoving(null)} icon="file" tone="danger" busy={busy} busyLabel="Đang gỡ…" testId="remove-attachment-dialog"
          title={`Gỡ ${removing.name}`} sub={`${removing.file ?? ''} sẽ bị xóa khỏi hồ sơ ${reg.id}. Chỉ gỡ được khi hồ sơ còn chờ duyệt.`} confirmLabel="Gỡ tệp" onConfirm={confirm}>
          {error && <Callout tone="danger">{error}</Callout>}
        </Dialog>
      )}
    </div>
  );
};
