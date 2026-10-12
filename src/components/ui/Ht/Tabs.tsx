import React from 'react';

/* ---------- Tabs ---------- */
export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: string; count?: number }[] }) {
  return (
    <div className="ht-tabs" role="tablist">
      {items.map((it) => (
        <button key={it.value} type="button" role="tab" className="ht-tab" aria-selected={it.value === value} onClick={() => onChange(it.value)}>
          {it.label}{it.count !== undefined && <span className="ht-tab__n">{it.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------- Segmented control ---------- */
export function Segmented<T extends string>({ value, onChange, items, label }: { value: T; onChange: (v: T) => void; items: { value: T; label: string }[]; label: string }) {
  return (
    <div className="ht-seg" role="group" aria-label={label}>
      {items.map((it) => (
        <button key={it.value} type="button" aria-pressed={it.value === value} onClick={() => onChange(it.value)}>{it.label}</button>
      ))}
    </div>
  );
}
