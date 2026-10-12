import React from 'react';
import { GRACE_DAYS as GRACE, Invoice, SUSPEND_AT } from '../../../api/managerApi';

/** BR_12/BR_13 — three-segment bar: grace (10 days) → penalty → suspension (from day 25). */
export const OverdueMeter: React.FC<{ inv: Invoice }> = ({ inv }) => {
  if (inv.status === 'PAID' || inv.status === 'ACTIVE') return <span className="ht-od__label">—</span>;
  if (inv.status === 'REACTIVATION_PENDING') return <span className="ht-od__label" style={{ color: 'var(--info-ink)' }}>Đã tất toán {inv.paidRef?.split(' · ')[1]}</span>;
  if (inv.status === 'UNPAID') return <span className="ht-od__label">Còn {inv.dueInDays} ngày đến hạn</span>;
  const d = inv.overdueDays;
  const a = (Math.min(d, GRACE) / GRACE) * 100;
  const b = (Math.max(0, Math.min(d - GRACE, SUSPEND_AT - GRACE)) / (SUSPEND_AT - GRACE)) * 100;
  const c = (Math.max(0, Math.min(d - SUSPEND_AT, 5)) / 5) * 100;
  let txt: string, cls: string;
  if (inv.status === 'SUSPENDED') { txt = `${d} ngày · đình chỉ từ ${inv.suspendedSince}`; cls = 'danger'; }
  else if (d >= SUSPEND_AT) { txt = `${d} ngày · đủ mốc đình chỉ`; cls = 'danger'; }
  else if (d > GRACE) { txt = `${d} ngày · tính phạt · còn ${SUSPEND_AT - d} ngày`; cls = 'danger'; }
  else { txt = `${d} ngày · ân hạn còn ${GRACE - d} ngày`; cls = 'warning'; }
  return (
    <div className="ht-od">
      <div className="ht-od__track" aria-hidden="true"><span><i style={{ width: `${a}%` }} /></span><span><i style={{ width: `${b}%` }} /></span><span><i style={{ width: `${c}%` }} /></span></div>
      <span className={`ht-od__label ht-od__label--${cls}`}>{txt}</span>
    </div>
  );
};
