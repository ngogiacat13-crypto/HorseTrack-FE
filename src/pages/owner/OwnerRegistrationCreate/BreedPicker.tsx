import React, { useId, useMemo, useState } from 'react';
import { HORSE_BREEDS } from '../../../api/ownerApi';
import { Icon } from '../../../components/ui/Icon';

const fold = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();

export const BreedPicker: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const options = useMemo(() => {
    const q = fold(value);
    const exact = HORSE_BREEDS.some((b) => fold(b) === q);
    return !q || exact ? [...HORSE_BREEDS] : HORSE_BREEDS.filter((b) => fold(b).includes(q));
  }, [value]);
  const choose = (b: string) => {
    onChange(b);
    setOpen(false);
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((i) => Math.min(i + 1, options.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && open && options[active]) { e.preventDefault(); choose(options[active]); }
    if (e.key === 'Escape') setOpen(false);
  };
  return (
    <div style={{ position: 'relative' }}>
      <input
        id="rg-breed" data-testid="rg-breed-input" className="ht-input" role="combobox" aria-expanded={open} aria-controls={listId} aria-autocomplete="list"
        autoComplete="off" value={value} placeholder="Bấm để chọn giống, hoặc gõ để tìm"
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onKeyDown={onKeyDown}
        style={{ paddingRight: 36 }}
      />
      <span aria-hidden style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none', display: 'flex' }}>
        <Icon name="down" size={16} />
      </span>
      {open && (
        <ul id={listId} role="listbox" data-testid="rg-breed-list"
          style={{ position: 'absolute', zIndex: 20, left: 0, right: 0, top: 'calc(100% + 4px)', maxHeight: 260, overflowY: 'auto', margin: 0, padding: 4, listStyle: 'none', background: 'var(--surface, #fff)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.12)' }}>
          {options.length ? options.map((b, i) => (
            <li key={b} role="option" aria-selected={b === value} data-testid="rg-breed-option"
              onMouseDown={(e) => { e.preventDefault(); choose(b); }} onMouseEnter={() => setActive(i)}
              style={{ padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: i === active ? 'var(--primary-soft, #e3efe8)' : undefined, fontWeight: b === value ? 600 : undefined }}>
              {b}
            </li>
          )) : <li style={{ padding: '8px 10px', color: 'var(--muted)' }}>Không có giống “{value}” — chọn giống gần nhất hoặc “Ngựa lai”.</li>}
        </ul>
      )}
    </div>
  );
};
