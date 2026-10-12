import React from 'react';
import { Icon } from '../Icon';

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
