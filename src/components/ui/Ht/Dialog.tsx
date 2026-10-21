import React, { useEffect, useId, useRef } from 'react';
import { Icon, IconName } from '../Icon';
import { Busy } from './Busy';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  icon: IconName;
  tone: 'brand' | 'danger';
  title: React.ReactNode;
  sub?: React.ReactNode;
  children?: React.ReactNode;
  confirmLabel: string;
  busyLabel?: string;
  onConfirm: () => void;
  busy?: boolean;
  disabled?: boolean;
  danger?: boolean;
  width?: number;
  testId?: string;
}
export const Dialog: React.FC<DialogProps> = ({ open, onClose, icon, tone, title, sub, children, confirmLabel, busyLabel = 'Đang xử lý…', onConfirm, busy, disabled, danger, width, testId = 'dialog' }) => {
  const titleId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const first = boxRef.current?.querySelector<HTMLElement>('textarea, input:not([disabled]), button:not([disabled])');
    first?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!open) return null;
  return (
    <div className="ht-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <div className="ht-dialog" data-testid={testId} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={boxRef} style={width ? { maxWidth: width } : undefined}>
        <div className="ht-dialog__head">
          <span className={`ht-dialog__icon ht-tone-${tone}`}><Icon name={icon} /></span>
          <div><h2 id={titleId}>{title}</h2>{sub && <p>{sub}</p>}</div>
        </div>
        {children && <div className="ht-dialog__body">{children}</div>}
        <div className="ht-dialog__foot">
          <button type="button" className="ht-btn ht-btn--secondary" data-testid="dialog-cancel" onClick={onClose} disabled={busy}>Hủy</button>
          <button type="button" className={`ht-btn ${danger ? 'ht-btn--danger' : 'ht-btn--primary'}`} data-testid="dialog-confirm" onClick={onConfirm} disabled={busy || disabled} aria-busy={busy || undefined}>
            <Busy busy={!!busy} label={busyLabel}>{confirmLabel}</Busy>
          </button>
        </div>
      </div>
    </div>
  );
};
