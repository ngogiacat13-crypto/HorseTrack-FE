import React from 'react';
import { Icon } from '../Icon';

/* ---------- Rules checklist ---------- */
export const Rules: React.FC<{ items: { ok: boolean; label: React.ReactNode }[]; style?: React.CSSProperties }> = ({ items, style }) => (
  <ul className="ht-rules" style={style}>
    {items.map((r, i) => (
      <li key={i} data-ok={r.ok}><span className="ht-rule-dot"><Icon name="check" /></span>{r.label}</li>
    ))}
  </ul>
);
