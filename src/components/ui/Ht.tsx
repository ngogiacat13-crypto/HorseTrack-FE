import React, { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { Icon, IconName } from './Icon';

/* ============================================================
   HorseTrack UI kit — React versions of the design-system parts.
   Styles live in src/styles/ht.css (ht-* classes).
   ============================================================ */

export const money = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

/* ---------- Field ---------- */
interface FieldProps {
  label: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: React.ReactNode;
  aside?: React.ReactNode; // right side of the label row (e.g. "Quên mật khẩu?")
  children: React.ReactNode;
  style?: React.CSSProperties;
}
export const Field: React.FC<FieldProps> = ({ label, htmlFor, required, error, hint, aside, children, style }) => (
  <div className="ht-field" style={style}>
    {aside ? (
      <div className="ht-field__top">
        <label className="ht-label" htmlFor={htmlFor}>{label}{required && <span className="ht-req">*</span>}</label>
        {aside}
      </div>
    ) : (
      <label className="ht-label" htmlFor={htmlFor}>{label}{required && <span className="ht-req">*</span>}</label>
    )}
    {children}
    {error ? (
      <div className="ht-error" id={htmlFor ? htmlFor + '-err' : undefined} role="alert">
        <Icon name="alert" /><span>{error}</span>
      </div>
    ) : hint ? <span className="ht-hint">{hint}</span> : null}
  </div>
);

/* ---------- Text input with leading icon ---------- */
type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { icon?: IconName; invalid?: boolean };
export const TextInput = React.forwardRef<HTMLInputElement, InputProps>(({ icon, invalid, className, id, ...rest }, ref) => (
  <div className="ht-control">
    {icon && <Icon name={icon} />}
    <input
      ref={ref}
      id={id}
      className={`ht-input${className ? ' ' + className : ''}`}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid && id ? id + '-err' : undefined}
      {...rest}
    />
  </div>
));
TextInput.displayName = 'TextInput';

/* ---------- Password input with show/hide ---------- */
type PasswordProps = Omit<InputProps, 'type'> & { revealed?: boolean; onRevealChange?: (v: boolean) => void };
export const PasswordInput: React.FC<PasswordProps> = ({ icon = 'lock', invalid, id, revealed, onRevealChange, ...rest }) => {
  const [own, setOwn] = useState(false);
  const show = revealed ?? own;
  const toggle = () => (onRevealChange ? onRevealChange(!show) : setOwn(!show));
  return (
    <div className="ht-control">
      <Icon name={icon} />
      <input
        id={id}
        type={show ? 'text' : 'password'}
        className="ht-input ht-input--trail"
        aria-invalid={invalid || undefined}
        aria-describedby={invalid && id ? id + '-err' : undefined}
        {...rest}
      />
      <button type="button" className="ht-iconbtn" onClick={toggle} aria-pressed={show} aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
        <Icon name={show ? 'eyeoff' : 'eye'} />
      </button>
    </div>
  );
};

/* ---------- Password strength ---------- */
export const scorePassword = (v: string): 0 | 1 | 2 | 3 | 4 => {
  if (!v) return 0;
  if (v.length < 8) return 1;
  let s = 1;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
  if (/\d/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v) || v.length >= 12) s++;
  return Math.min(s, 4) as 1 | 2 | 3 | 4;
};
const STRENGTH = ['Tối thiểu 8 ký tự; nên có chữ hoa, số và ký tự đặc biệt.', 'Độ mạnh: Yếu', 'Độ mạnh: Trung bình', 'Độ mạnh: Khá', 'Độ mạnh: Mạnh'];
export const StrengthMeter: React.FC<{ value: string; showLabel?: boolean }> = ({ value, showLabel = true }) => {
  const level = scorePassword(value);
  return (
    <>
      <div className="ht-strength" data-level={level} aria-hidden="true"><span /><span /><span /><span /></div>
      {showLabel && <span className="ht-strength-label">{STRENGTH[level]}</span>}
    </>
  );
};

/* ---------- Button content while busy ---------- */
export const Busy: React.FC<{ busy: boolean; label: string; children: React.ReactNode }> = ({ busy, label, children }) =>
  busy ? <><i className="ht-spinner" /><span>{label}</span></> : <>{children}</>;

/* ---------- Callout ---------- */
const CALLOUT_ICON: Record<string, IconName> = { info: 'info', danger: 'alert', success: 'check', demo: 'warn' };
export const Callout: React.FC<{ tone: 'info' | 'danger' | 'success' | 'demo'; title?: React.ReactNode; children?: React.ReactNode; icon?: IconName; style?: React.CSSProperties }> = ({ tone, title, children, icon, style }) => (
  <div className={`ht-callout ht-callout--${tone}`} role={tone === 'danger' ? 'alert' : tone === 'success' ? 'status' : undefined} style={style}>
    <Icon name={icon ?? CALLOUT_ICON[tone]} />
    <span>{title && <span className="ht-callout__title">{title}</span>}{children}</span>
  </div>
);

/* ---------- Badge ---------- */
export type Tone = 'success' | 'info' | 'warning' | 'danger' | 'neutral' | 'brand' | 'demo' | 'purple';
export const Badge: React.FC<{ tone: Tone; plain?: boolean; children: React.ReactNode; style?: React.CSSProperties }> = ({ tone, plain, children, style }) => (
  <span className={`ht-badge ht-badge--${tone}${plain ? ' ht-badge--plain' : ''}`} style={style}>{children}</span>
);

/* ---------- Loading ---------- */
export const Loading: React.FC<{ label?: string }> = ({ label = 'Đang tải…' }) => (
  <div className="ht-loading" role="status"><i className="ht-spinner" />{label}</div>
);

/* ---------- Page header ---------- */
export const PageHeader: React.FC<{ title: React.ReactNode; sub?: React.ReactNode; actions?: React.ReactNode; crumbs?: React.ReactNode; badge?: React.ReactNode }> = ({ title, sub, actions, crumbs, badge }) => (
  <>
    {crumbs && <div className="ht-crumbs">{crumbs}</div>}
    <div className="ht-pagehead">
      <div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <h1 className="ht-page-title">{title}</h1>{badge}
        </div>
        {sub && <p className="ht-page-sub">{sub}</p>}
      </div>
      {actions && <div className="ht-actions">{actions}</div>}
    </div>
  </>
);

/* ---------- Stat card ---------- */
interface StatProps {
  icon: IconName;
  tone: 'brand' | 'info' | 'gold' | 'warning' | 'danger';
  value: React.ReactNode;
  unit?: string;
  label: string;
  meta?: string;
  metaTone?: 'up' | 'danger';
  alert?: boolean;
  onClick?: () => void;
}
export const StatCard: React.FC<StatProps> = ({ icon, tone, value, unit, label, meta, metaTone, alert, onClick }) => {
  const inner = (
    <>
      <div className="ht-stat__top">
        <span className={`ht-stat__icon ht-tone-${tone}`}><Icon name={icon} /></span>
        {meta && <span className={`ht-stat__meta${metaTone ? ' ht-stat__meta--' + metaTone : ''}`}>{meta}</span>}
      </div>
      <div>
        <div className={`ht-stat__value${alert ? ' ht-stat__value--danger' : ''}`}>{value}{unit && <small>{unit}</small>}</div>
        <div className="ht-stat__label">{label}</div>
      </div>
    </>
  );
  const cls = `ht-stat${alert ? ' ht-stat--alert' : ''}`;
  return onClick
    ? <button type="button" className={cls} onClick={onClick} style={{ textAlign: 'left', cursor: 'pointer', font: 'inherit' }}>{inner}</button>
    : <div className={cls}>{inner}</div>;
};

/* ---------- Panel ---------- */
export const Panel: React.FC<{ title?: React.ReactNode; sub?: React.ReactNode; right?: React.ReactNode; children?: React.ReactNode; foot?: React.ReactNode; as?: 'h2' | 'h3'; id?: string; headStyle?: React.CSSProperties }> = ({ title, sub, right, children, foot, as = 'h2', id, headStyle }) => {
  const H = as;
  return (
    <section className="ht-panel" id={id}>
      {(title || right) && (
        <div className="ht-panel__head" style={headStyle}>
          {title ? <div><H>{title}</H>{sub && <p>{sub}</p>}</div> : null}
          {right}
        </div>
      )}
      {children}
      {foot && <div className="ht-panel__foot">{foot}</div>}
    </section>
  );
};

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

/* ---------- Dialog ---------- */
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
}
export const Dialog: React.FC<DialogProps> = ({ open, onClose, icon, tone, title, sub, children, confirmLabel, busyLabel = 'Đang xử lý…', onConfirm, busy, disabled, danger, width }) => {
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
      <div className="ht-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={boxRef} style={width ? { maxWidth: width } : undefined}>
        <div className="ht-dialog__head">
          <span className={`ht-dialog__icon ht-tone-${tone}`}><Icon name={icon} /></span>
          <div><h2 id={titleId}>{title}</h2>{sub && <p>{sub}</p>}</div>
        </div>
        {children && <div className="ht-dialog__body">{children}</div>}
        <div className="ht-dialog__foot">
          <button type="button" className="ht-btn ht-btn--secondary" onClick={onClose} disabled={busy}>Hủy</button>
          <button type="button" className={`ht-btn ${danger ? 'ht-btn--danger' : 'ht-btn--primary'}`} onClick={onConfirm} disabled={busy || disabled} aria-busy={busy || undefined}>
            <Busy busy={!!busy} label={busyLabel}>{confirmLabel}</Busy>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------- Reason textarea with n/min counter ---------- */
export const ReasonField: React.FC<{ id: string; label: string; value: string; onChange: (v: string) => void; min?: number; error?: string; placeholder?: string; minHeight?: number }> = ({ id, label, value, onChange, min = 10, error, placeholder, minHeight }) => {
  const n = value.trim().length;
  return (
    <div>
      <div className="ht-field__top" style={{ marginBottom: 6 }}>
        <label className="ht-label" htmlFor={id}>{label}<span className="ht-req">*</span></label>
        <span className="ht-counter" data-ok={n >= min}>{n}/{min}</span>
      </div>
      <textarea id={id} className="ht-textarea" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        aria-invalid={!!error || undefined} aria-describedby={error ? id + '-err' : undefined} style={minHeight ? { minHeight } : undefined} />
      {error && <div className="ht-error" id={id + '-err'} style={{ marginTop: 6 }}><Icon name="alert" /><span>{error}</span></div>}
    </div>
  );
};

/* ---------- Rules checklist ---------- */
export const Rules: React.FC<{ items: { ok: boolean; label: React.ReactNode }[]; style?: React.CSSProperties }> = ({ items, style }) => (
  <ul className="ht-rules" style={style}>
    {items.map((r, i) => (
      <li key={i} data-ok={r.ok}><span className="ht-rule-dot"><Icon name="check" /></span>{r.label}</li>
    ))}
  </ul>
);

/* ---------- Timeline ---------- */
export interface TimelineItem { tone?: 'danger' | 'warning' | 'success' | 'info'; what: React.ReactNode; when: string }
export const Timeline: React.FC<{ items: TimelineItem[] }> = ({ items }) => (
  <ul className="ht-timeline">
    {items.map((t, i) => (
      <li key={i}><i className={`dot${t.tone ? ' dot--' + t.tone : ''}`} /><div className="what">{t.what}</div><div className="when">{t.when}</div></li>
    ))}
  </ul>
);

/* ---------- Toast ---------- */
const ToastCtx = createContext<(msg: string) => void>(() => {});
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<number>();
  const show = useCallback((m: string) => {
    setMsg(m);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg && <div className="ht-toast" role="status"><Icon name="check" /><span>{msg}</span></div>}
    </ToastCtx.Provider>
  );
};
export const useToast = () => useContext(ToastCtx);

/* ---------- Brand ---------- */
export const BrandMark: React.FC = () => <span className="ht-brand__mark">H<b>T</b></span>;
export const DemoClock: React.FC = () => (
  <span className="ht-clock"><Icon name="clock" /><span>Đồng hồ demo ·</span><strong>03/10/2026 10:30</strong></span>
);
