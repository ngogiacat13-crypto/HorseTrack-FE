import React, { useState } from 'react';
import type { UploadedDoc } from '../../../api/ownerApi';
import { Icon } from '../../../components/ui/Icon';
import { needsShrink, prepareDoc } from '../../../features/registration-attachments';

export const DocUpload: React.FC<{ id: string; label: string; hint: string; required?: boolean; value: UploadedDoc | null; onChange: (d: UploadedDoc | null) => void; onError: (m: string) => void }> = ({ id, label, hint, required, value, onChange, onError }) => {
  const [busy, setBusy] = useState(false);
  const pick = async (picked?: File) => {
    if (!picked) return;
    setBusy(needsShrink(picked));
    try {
      const f = await prepareDoc(picked, label);
      onError('');
      onChange({ name: f.name, size: f.size, type: f.type, file: f });
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <label className="ht-upload" htmlFor={id} data-ok={!!value} data-testid={`${id}-upload`}>
      <Icon name={value ? 'check' : 'file'} size={18} />
      <div><b>{label}{required && <span className="ht-req">*</span>}</b><small title={value?.name}>{busy ? 'Đang nén ảnh…' : value ? `${value.name} · ${(value.size / 1048576).toFixed(1)} MB` : hint}</small></div>
      <span className="ht-btn ht-btn--secondary ht-btn--sm">{value ? 'Đổi tệp' : 'Chọn tệp'}</span>
      {value && <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" onClick={(e) => { e.preventDefault(); onChange(null); }} aria-label={`Bỏ ${label}`}><Icon name="x" size={14} /></button>}
      <input id={id} data-testid={`${id}-input`} type="file" accept=".pdf,.jpg,.jpeg,.png" disabled={busy} onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ''; }} />
    </label>
  );
};
