import React from 'react';
import { Icon } from '../Icon';

export const ReasonField: React.FC<{ id: string; label: string; value: string; onChange: (v: string) => void; min?: number; error?: string; placeholder?: string; minHeight?: number }> = ({ id, label, value, onChange, min = 10, error, placeholder, minHeight }) => {
  const n = value.trim().length;
  return (
    <div>
      <div className="ht-field__top" style={{ marginBottom: 6 }}>
        <label className="ht-label" htmlFor={id}>{label}<span className="ht-req">*</span></label>
        <span className="ht-counter" data-ok={n >= min}>{n}/{min}</span>
      </div>
      <textarea id={id} data-testid={id} className="ht-textarea" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        aria-invalid={!!error || undefined} aria-describedby={error ? id + '-err' : undefined} style={minHeight ? { minHeight } : undefined} />
      {error && <div className="ht-error" id={id + '-err'} style={{ marginTop: 6 }}><Icon name="alert" /><span>{error}</span></div>}
    </div>
  );
};
