import React from 'react';
import { Icon, IconName } from '../Icon';

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
