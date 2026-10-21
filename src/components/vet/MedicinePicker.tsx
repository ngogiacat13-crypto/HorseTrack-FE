import React from 'react';
import type { InventoryItem } from '../../api/vetApi';
import { money } from '../ui/Ht';

export const MedicinePicker: React.FC<{ items: InventoryItem[]; value: string; onChange: (id: string) => void; label?: string }> = ({ items, value, onChange, label = 'Chọn thuốc / vật tư' }) => (
  <select className="ht-select" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
    <option value="">— Chọn thuốc / vật tư từ danh mục kho —</option>
    {[...new Set(items.map((i) => i.group))].map((g) => (
      <optgroup key={g} label={g}>
        {items.filter((i) => i.group === g).map((i) => <option key={i.id} value={i.id}>{i.name}{i.note ? ` (${i.note})` : ''} · {money(i.unitPrice)}/{i.unit}</option>)}
      </optgroup>
    ))}
  </select>
);
