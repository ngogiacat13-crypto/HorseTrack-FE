import React from 'react';
import { Link } from 'react-router-dom';
import { GRACE_DAYS, SUSPEND_AT } from '../../../api/managerApi';
import { Icon } from '../../../components/ui/Icon';
import { Badge, money, Panel, Timeline } from '../../../components/ui/Ht';
import type { Dash } from './types';

export const MedicalWatch: React.FC<{ d: Dash }> = ({ d }) => (
  <Panel as="h3" title="Y tế cần theo dõi" right={<Link className="ht-more" to="/manager/medical-monitoring">Xem <Icon name="arrow" /></Link>}>
    <ul className="ht-list">
      {d.medicalWatch.map((p) => (
        <li key={p.id} className={`ht-list-row${p.tone === 'danger' ? ' ht-list-row--danger' : ''}`}>
          <div className="r1"><span className="ht-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{p.id} · {p.horse}</span><Badge tone={p.tone}>{p.tone === 'danger' ? 'Thuốc về trễ' : p.label}</Badge></div>
          <div className="r2">{p.tone === 'danger' ? 'Bông gạc thiếu 12 cuộn' : `${p.diagnosis} · 1 giai đoạn`}</div>
          <div className="r3">
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{p.tone === 'danger' ? <>Cần <span className="ht-mono">08/10</span> · ETA <span className="ht-mono">10/10</span></> : p.note}</span>
            {p.tone === 'danger' && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger-ink)' }}>Chờ BS đánh giá lại</span>}
          </div>
        </li>
      ))}
    </ul>
  </Panel>
);

export const OverdueInvoices: React.FC<{ d: Dash }> = ({ d }) => (
  <Panel as="h3" title="Hóa đơn quá hạn" right={<span className="ht-count ht-count--danger" style={{ margin: 0 }}>{d.overdueInvoices.length}</span>}
    foot={<><span>+{d.overdueInvoices.filter((i) => i.overdueDays <= GRACE_DAYS).length} hóa đơn trong ân hạn</span><Link className="ht-more" to="/manager/invoices">Tất cả <Icon name="arrow" /></Link></>}>
    <ul className="ht-list">
      {d.overdueInvoices.filter((i) => i.overdueDays > GRACE_DAYS).map((i) => (
        <li key={i.id} className="ht-list-row">
          <div className="r1">
            <span className="ht-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{i.id}</span>
            {i.status === 'SUSPENDED' ? <Badge tone="danger" plain>Đình chỉ</Badge>
              : i.overdueDays >= SUSPEND_AT ? <Badge tone="danger" plain>Đủ mốc đình chỉ</Badge>
              : <Badge tone="warning" plain>Còn {SUSPEND_AT - i.overdueDays} ngày</Badge>}
          </div>
          <div className="r2">{i.horse} · {i.owner}</div>
          <div className="r3"><span className="late">Quá hạn {i.overdueDays} ngày</span><span className="money">{money(i.amount)}</span></div>
        </li>
      ))}
    </ul>
  </Panel>
);

export const LateTasks: React.FC<{ d: Dash }> = ({ d }) => (
  <Panel as="h3" title="Công việc trễ SLA" right={<Badge tone="neutral" plain style={{ fontFamily: 'var(--font-mono)' }}>BR_05</Badge>} foot={<span>+{d.moreLateTasks} việc khác</span>}>
    <ul className="ht-list">
      {d.lateTasks.map((t) => (
        <li key={t.title} className="ht-list-row">
          <div className="r1"><span className="r2">{t.title}</span><span className="late">{t.late}</span></div>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t.groom} · hạn <span className="ht-mono">{t.due}</span>{t.doneAt && <> · xong <span className="ht-mono">{t.doneAt}</span></>}</span>
        </li>
      ))}
    </ul>
  </Panel>
);

export const SystemLog: React.FC<{ d: Dash }> = ({ d }) => (
  <Panel as="h3" title="Nhật ký hệ thống" right={<Link className="ht-more" to="/manager/audit-logs">Mở <Icon name="arrow" /></Link>}>
    <div className="ht-panel__body">
      <Timeline items={d.log.map((l) => ({ tone: l.tone, what: <><b>{l.who}</b> {l.text}</>, when: l.at }))} />
    </div>
  </Panel>
);
