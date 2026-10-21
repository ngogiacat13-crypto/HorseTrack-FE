import React from 'react';
import { Invoice, InvoiceStatus, managerApi, SUSPEND_AT } from '../../../api/managerApi';
import { useActor } from '../../../auth/AuthContext';
import { Icon } from '../../../components/ui/Icon';
import { Badge, money, Panel, useToast } from '../../../components/ui/Ht';
import { OverdueMeter } from './OverdueMeter';

const BADGE: Record<InvoiceStatus, [React.ComponentProps<typeof Badge>['tone'], string]> = {
  SUSPENDED: ['danger', 'Đình chỉ'], OVERDUE: ['warning', 'Quá hạn'], REACTIVATION_PENDING: ['info', 'Chờ kích hoạt lại'],
  UNPAID: ['neutral', 'Chờ thanh toán'], PAID: ['success', 'Đã thanh toán'], ACTIVE: ['success', 'Đã kích hoạt lại'],
};

interface Props { invoices: Invoice[]; q: string; onSearch: (q: string) => void; onSuspend: (i: Invoice) => void; onReactivate: (i: Invoice) => void }

export const InvoiceTable: React.FC<Props> = ({ invoices, q, onSearch, onSuspend, onReactivate }) => {
  const toast = useToast();
  const actor = useActor();
  const remind = async (i: Invoice) => { await managerApi.sendReminder(i, actor); toast(`Đã gửi nhắc thanh toán ${i.id} cho ${i.owner}.`); };
  const actions = (i: Invoice) => (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
      {i.status === 'OVERDUE' && i.overdueDays >= SUSPEND_AT && <button type="button" className="ht-btn ht-btn--danger ht-btn--sm" onClick={() => onSuspend(i)}>Đình chỉ</button>}
      {i.status === 'OVERDUE' && i.overdueDays < SUSPEND_AT && <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" onClick={() => remind(i)}>Gửi nhắc</button>}
      {i.status === 'SUSPENDED' && <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" disabled title="Chưa tất toán nợ, phí phạt và phí kích hoạt (BR_14)">Kích hoạt lại</button>}
      {i.status === 'REACTIVATION_PENDING' && <button type="button" className="ht-btn ht-btn--primary ht-btn--sm" onClick={() => onReactivate(i)}>Kích hoạt lại</button>}
    </div>
  );

  return (
    <Panel
      headStyle={{ paddingBottom: 16 }}
      right={<>
        <div className="ht-search-input"><Icon name="search" /><input value={q} onChange={(e) => onSearch(e.target.value)} placeholder="Tìm mã hóa đơn, ngựa, chủ ngựa…" aria-label="Tìm hóa đơn" /></div>
        <div className="ht-od__legend" aria-hidden="true">
          <span><i style={{ background: 'var(--warning)' }} />Ân hạn 10 ngày</span>
          <span><i style={{ background: 'var(--danger)' }} />Tính phạt</span>
          <span><i style={{ background: 'var(--danger-ink)' }} />Từ ngày 25: đình chỉ</span>
        </div>
      </>}
      foot={<>
        <span>Tính theo đồng hồ demo <span className="ht-mono">03/10/2026</span> · quá hạn đếm từ ngày sau hạn thanh toán</span>
        <span>Phí phạt BR_12: <b style={{ color: 'var(--warning-ink)' }}>chờ cấu hình công thức</b></span>
      </>}
    >
      <table className="ht-table">
        <thead><tr><th>Mã HĐ</th><th>Ngựa · chủ ngựa</th><th>Kỳ</th><th>Hạn TT</th><th className="num">Số tiền</th><th>Quá hạn</th><th>Trạng thái</th><th style={{ textAlign: 'right' }}>Thao tác</th></tr></thead>
        <tbody>
          {invoices.map((i) => {
            const [tone, label] = BADGE[i.status];
            return (
              <tr key={i.id} className={i.status === 'SUSPENDED' ? 'is-danger' : undefined}>
                <td className="id">{i.id}</td>
                <td><span className="strong">{i.horse}</span><span className="sub">{i.owner}</span></td>
                <td className="mono">{i.period}</td>
                <td className="mono">{i.dueDate}</td>
                <td className="num strong">{money(i.amount)}</td>
                <td><OverdueMeter inv={i} /></td>
                <td><Badge tone={tone}>{label}</Badge>{i.paidRef && i.status === 'PAID' && <span className="sub mono">{i.paidRef}</span>}</td>
                <td>{actions(i)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {invoices.length === 0 && <div className="ht-empty">Không có hóa đơn phù hợp.</div>}
    </Panel>
  );
};
