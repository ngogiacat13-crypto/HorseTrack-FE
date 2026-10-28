import React from 'react';
import type { InventoryItem } from '../../api/vetApi';
import { money } from '../ui/Ht';

interface Props {
  items: InventoryItem[]; value: string; onChange: (id: string) => void; label?: string;
  id?: string; testId?: string; disabled?: boolean; placeholder?: string; showStock?: boolean; style?: React.CSSProperties;
}

export const MedicinePicker: React.FC<Props> = ({ items, value, onChange, label = 'Chọn thuốc / vật tư', id, testId, disabled, placeholder = '— Chọn thuốc / vật tư từ danh mục kho —', showStock, style }) => (
  <select id={id} data-testid={testId} className="ht-select" style={style} value={value} onChange={(e) => onChange(e.target.value)} aria-label={id ? undefined : label} disabled={disabled}>
    <option value="">{placeholder}</option>
    {[...new Set(items.map((i) => i.group || 'Khác'))].map((g) => (
      <optgroup key={g} label={g}>
        {items.filter((i) => (i.group || 'Khác') === g).map((i) => (
          <option key={i.id} value={i.id}>{i.name}{i.note ? ` (${i.note})` : ''} · {money(i.unitPrice)}/{i.unit}{showStock ? ` · còn ${Math.max(0, i.onHand - i.held)}` : ''}</option>
        ))}
      </optgroup>
    ))}
  </select>
);
