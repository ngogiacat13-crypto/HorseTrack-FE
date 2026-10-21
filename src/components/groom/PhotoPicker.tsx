import React, { useRef, useState } from 'react';
import { toSquareAvatar } from '../../utils/image';
import { Icon } from '../ui/Icon';

export const PhotoPicker: React.FC<{ value: string | null; onChange: (v: string | null) => void; label?: string }> = ({ value, onChange, label = 'Ảnh minh chứng (không bắt buộc)' }) => {
  const input = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState('');
  const pick = async (f?: File) => {
    setErr('');
    if (!f) return;
    try { onChange(await toSquareAvatar(f, 480)); } catch (e) { setErr((e as Error).message); }
  };
  return (
    <div className="ht-field" style={{ margin: 0 }}>
      <span className="ht-label">{label}</span>
      <div className="ht-photo-pick">
        {value && <img src={value} alt="Ảnh đã chọn" />}
        <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" onClick={() => input.current?.click()}><Icon name="file" size={14} />{value ? 'Đổi ảnh' : 'Chọn ảnh'}</button>
        {value && <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" onClick={() => onChange(null)}>Bỏ ảnh</button>}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
      {err && <div className="ht-error" style={{ marginTop: 6 }}><Icon name="alert" /><span>{err}</span></div>}
    </div>
  );
};
