import React, { useRef } from 'react';

/** Six single-digit boxes; typing moves to the next box, Backspace goes back, paste fills all. */
export const OtpInput: React.FC<{ value: string; onChange: (v: string) => void; invalid?: boolean; labelledBy: string }> = ({ value, onChange, invalid, labelledBy }) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '');
  const setAt = (i: number, d: string) => {
    const next = digits.slice();
    next[i] = d;
    onChange(next.join('').slice(0, 6));
  };
  return (
    <div className="ht-otp" role="group" aria-labelledby={labelledBy} aria-invalid={invalid || undefined}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          inputMode="numeric"
          maxLength={1}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Chữ số ${i + 1}`}
          value={d}
          onChange={(e) => {
            const c = e.target.value.replace(/\D/g, '').slice(-1);
            setAt(i, c);
            if (c && i < 5) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => { if (e.key === 'Backspace' && !d && i > 0) refs.current[i - 1]?.focus(); }}
          onPaste={(e) => {
            const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
            if (!p) return;
            e.preventDefault();
            onChange(p);
            refs.current[Math.min(p.length, 5)]?.focus();
          }}
        />
      ))}
    </div>
  );
};
