import React from 'react';
import type { UploadedDoc } from '../../../api/ownerApi';
import { Icon } from '../../../components/ui/Icon';

const MAX_MB = 10;
const MIN_KB = 5;
const SIGNATURES: { ext: RegExp; bytes: number[]; kind: string }[] = [
  { ext: /\.pdf$/i, bytes: [0x25, 0x50, 0x44, 0x46], kind: 'PDF' },
  { ext: /\.png$/i, bytes: [0x89, 0x50, 0x4e, 0x47], kind: 'PNG' },
  { ext: /\.jpe?g$/i, bytes: [0xff, 0xd8, 0xff], kind: 'JPG' },
];

const contentMatches = async (f: File) => {
  const sig = SIGNATURES.find((s) => s.ext.test(f.name));
  if (!sig) return null;
  const head = new Uint8Array(await f.slice(0, sig.bytes.length).arrayBuffer());
  return sig.bytes.every((b, i) => head[i] === b) ? sig.kind : null;
};

export const DocUpload: React.FC<{ id: string; label: string; hint: string; required?: boolean; value: UploadedDoc | null; onChange: (d: UploadedDoc | null) => void; onError: (m: string) => void }> = ({ id, label, hint, required, value, onChange, onError }) => {
  const pick = async (f?: File) => {
    if (!f) return;
    if (!/\.(pdf|jpe?g|png)$/i.test(f.name)) return onError(`${label}: chỉ nhận PDF, JPG hoặc PNG.`);
    if (f.size > MAX_MB * 1048576) return onError(`${label}: tối đa ${MAX_MB} MB.`);
    if (f.size < MIN_KB * 1024) return onError(`${label}: tệp quá nhỏ (dưới ${MIN_KB} KB) — có thể bị lỗi hoặc không đọc được, hãy chụp/quét lại và gửi lại.`);
    if (!(await contentMatches(f))) return onError(`${label}: nội dung tệp không phải PDF/JPG/PNG thật (có thể đổi đuôi hoặc tệp hỏng) — hãy gửi lại giấy tờ hợp lệ.`);
    onError('');
    onChange({ name: f.name, size: f.size, type: f.type, file: f });
  };
  return (
    <label className="ht-upload" htmlFor={id} data-ok={!!value} data-testid={`${id}-upload`}>
      <Icon name={value ? 'check' : 'file'} size={18} />
      <div><b>{label}{required && <span className="ht-req">*</span>}</b><small>{value ? `${value.name} · ${(value.size / 1048576).toFixed(1)} MB` : hint}</small></div>
      <span className="ht-btn ht-btn--secondary ht-btn--sm">{value ? 'Đổi tệp' : 'Chọn tệp'}</span>
      {value && <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" onClick={(e) => { e.preventDefault(); onChange(null); }} aria-label={`Bỏ ${label}`}><Icon name="x" size={14} /></button>}
      <input id={id} data-testid={`${id}-input`} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ''; }} />
    </label>
  );
};
