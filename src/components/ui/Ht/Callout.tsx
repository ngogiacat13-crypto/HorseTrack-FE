import React from 'react';
import { Icon, IconName } from '../Icon';

/* ---------- Callout ---------- */
const CALLOUT_ICON: Record<string, IconName> = { info: 'info', danger: 'alert', success: 'check', demo: 'warn' };
export const Callout: React.FC<{ tone: 'info' | 'danger' | 'success' | 'demo'; title?: React.ReactNode; children?: React.ReactNode; icon?: IconName; style?: React.CSSProperties }> = ({ tone, title, children, icon, style }) => (
  <div className={`ht-callout ht-callout--${tone}`} role={tone === 'danger' ? 'alert' : tone === 'success' ? 'status' : undefined} style={style}>
    <Icon name={icon ?? CALLOUT_ICON[tone]} />
    <span>{title && <span className="ht-callout__title">{title}</span>}{children}</span>
  </div>
);
