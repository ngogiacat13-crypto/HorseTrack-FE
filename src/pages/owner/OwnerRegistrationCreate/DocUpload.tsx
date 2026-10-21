import React from 'react';
import type { UploadedDoc } from '../../../api/ownerApi';
import { Icon } from '../../../components/ui/Icon';

const MAX_MB = 10;

export const DocUpload: React.FC<{ id: string; label: string; hint: string; required?: boolean; value: UploadedDoc | null; onChange: (d: UploadedDoc | null) => void; onError: (m: string) => void }> = ({ id, label, hint, required, value, onChange, onError }) => {
  const pick = (f?: File) => {
    if (!f) return;
    if (!/\.(pdf|jpe?g|png)$/i.test(f.name)) return onError(`${label}: chỉ nhận PDF, JPG hoặc PNG.`);
    if (f.size > MAX_MB * 1048576) return onError(`${label}: tối đa ${MAX_MB} MB.`);
    onError('');
    onChange({ name: f.name, size: f.size, type: f.type });
  };
  return (
    <label className="ht-upload" htmlFor={id} data-ok={!!value}>
      <Icon name={value ? 'check' : 'file'} size={18} />
      <div><b>{label}{required && <span className="ht-req">*</span>}</b><small>{value ? `${value.name} · ${(value.size / 1048576).toFixed(1)} MB` : hint}</small></div>
      <span className="ht-btn ht-btn--secondary ht-btn--sm">{value ? 'Đổi tệp' : 'Chọn tệp'}</span>
      {value && <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" onClick={(e) => { e.preventDefault(); onChange(null); }} aria-label={`Bỏ ${label}`}><Icon name="x" size={14} /></button>}
      <input id={id} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
    </label>
  );
};
