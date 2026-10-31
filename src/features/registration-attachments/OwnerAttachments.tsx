import React, { useRef, useState } from 'react';
import { USE_BACKEND, be } from '../../api/beClient';
import { invalidate } from '../../api/hybridAdapter';
import { managerApi, type Registration } from '../../api/managerApi';
import { useAction } from '../../hooks/useAction';
import { Icon } from '../../components/ui/Icon';
import { Callout } from '../../components/ui/Ht';
import { needsShrink, prepareDoc } from './prepareDoc';

type Attachment = Registration['attachments'][number];
type DocKind = { docType: 'OWNERSHIP' | 'OTHER'; label: string };

const DOC_KINDS: DocKind[] = [
  { docType: 'OWNERSHIP', label: 'Giấy tờ sở hữu' },
  { docType: 'OTHER', label: 'Giấy chứng nhận sức khỏe' },
];
const UPLOAD_TIMEOUT_MS = 120000;

const uploadAttachment = async (horseId: number, docType: string, file: File) => {
  const form = new FormData();
  form.append('file', file);
  form.append('docType', docType);
  await be.post(`/horses/${horseId}/registration-attachments`, form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: UPLOAD_TIMEOUT_MS });
};

const replaceAttachment = async (horseId: number, docType: string, file: File, oldId?: number) => {
  await uploadAttachment(horseId, docType, file);
  if (oldId) await be.delete(`/horses/${horseId}/registration-attachments/${oldId}`);
  invalidate('registrations');
};

const kindOf = (a: Attachment): DocKind => DOC_KINDS.find((k) => k.docType === a.docType) ?? DOC_KINDS[1];

export const OwnerAttachments: React.FC<{ reg: Registration; onChanged: () => void }> = ({ reg, onChanged }) => {
  const { busy, error, setError, run } = useAction();
  const input = useRef<HTMLInputElement>(null);
  const [target, setTarget] = useState<{ kind: DocKind; old?: Attachment } | null>(null);
  const [working, setWorking] = useState<string | null>(null);
  if (!USE_BACKEND) return null;
  const editable = reg.status === 'Pending' && !!reg.beId;
  const missing = DOC_KINDS.filter((k) => !reg.attachments.some((a) => a.docType === k.docType));

  const choose = (kind: DocKind, old?: Attachment) => {
    setError('');
    setTarget({ kind, old });
    input.current?.click();
  };
  const onPicked = async (picked?: File) => {
    if (!picked || !target || !reg.beId) return;
    const { kind, old } = target;
    const key = old?.beId ? String(old.beId) : kind.docType;
    setWorking(needsShrink(picked) ? `${key}:shrink` : `${key}:upload`);
    const ok = await run(async () => {
      const file = await prepareDoc(picked, kind.label);
      setWorking(`${key}:upload`);
      await replaceAttachment(reg.beId as number, kind.docType, file, old?.beId);
    }, old ? `Đã thay ${kind.label} bằng ${picked.name}.` : `Đã bổ sung ${kind.label}.`);
    setWorking(null);
    setTarget(null);
    if (ok) onChanged();
  };
  const status = (key: string) => (working?.startsWith(`${key}:`) ? (working.endsWith('shrink') ? 'Đang nén ảnh…' : 'Đang tải lên…') : null);

  return (
    <div style={{ display: 'grid', gap: 8 }} data-testid={`owner-attachments-${reg.id}`}>
      <b style={{ fontSize: 13 }}>Giấy tờ đã gửi ({reg.attachments.length}/{DOC_KINDS.length})</b>
      {reg.attachments.length === 0 && <span style={{ fontSize: 13, color: 'var(--muted)' }}>Chưa có tệp đính kèm.</span>}
      {reg.attachments.map((a) => {
        const st = a.beId ? status(String(a.beId)) : null;
        return (
          <div key={a.beId ?? a.name} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, minWidth: 0 }}>
            <Icon name="file" size={15} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <b>{a.name}</b>
              <small style={{ display: 'block', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.file}>{st ?? `${a.file ? `${a.file} · ` : ''}${a.meta}`}</small>
            </span>
            {a.beId && <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" data-testid={`owner-view-attachment-${a.beId}`} onClick={() => run(() => managerApi.openAttachment(a.beId as number))}>Xem</button>}
            {editable && a.beId && <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" data-testid={`edit-attachment-${a.beId}`} disabled={busy} onClick={() => choose(kindOf(a), a)}><Icon name="refresh" size={14} />Sửa</button>}
          </div>
        );
      })}
      {editable && missing.map((k) => (
        <div key={k.docType} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }} data-testid={`missing-attachment-${k.docType}`}>
          <Icon name="alert" size={15} />
          <span style={{ flex: 1, color: 'var(--danger-ink)' }}><b>{k.label}</b> — chưa có{status(k.docType) ? ` · ${status(k.docType)}` : ''}</span>
          <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" data-testid={`add-attachment-${k.docType}`} disabled={busy} onClick={() => choose(k)}>Bổ sung</button>
        </div>
      ))}
      {editable && <small style={{ color: 'var(--muted)' }}>PDF, JPG hoặc PNG · tối đa 4 MB (ảnh lớn hơn được tự nén). Chỉ sửa được khi hồ sơ còn chờ duyệt.</small>}
      <input ref={input} type="file" accept=".pdf,.jpg,.jpeg,.png" hidden data-testid={`attachment-file-input-${reg.id}`} onChange={(e) => { void onPicked(e.target.files?.[0]); e.target.value = ''; }} />
      {error && <Callout tone="danger">{error}</Callout>}
    </div>
  );
};
