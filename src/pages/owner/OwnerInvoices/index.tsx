import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { invoiceLabel, ownerApi, POLICY, type InvoiceDue } from '../../../api/ownerApi';
import { useActor } from '../../../auth/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { PATH, toPath } from '../../../routers/routerPath';
import { Icon } from '../../../components/ui/Icon';
import { Badge, money, PageHeader, Panel, StatCard, Tabs } from '../../../components/ui/Ht';
import { LoadState } from '../../../components/trainer/TrainerParts';

type Tab = 'ALL' | Exclude<InvoiceDue['group'], 'PAID'>;

export const OwnerInvoices: React.FC = () => {
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => ownerApi.getOpenInvoices(actor), [actor]);
  const [tab, setTab] = useState<Tab>('ALL');
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const rows = data.invoices.filter((x) => tab === 'ALL' || x.due.group === tab);
  const count = (g: InvoiceDue['group']) => data.invoices.filter((x) => x.due.group === g).length;
  const owed = data.invoices.reduce((s, x) => s + x.due.total, 0);
  const late = data.invoices.filter((x) => x.due.group === 'OVERDUE' || x.due.group === 'SUSPENDED');
  const pending = data.payments.filter((p) => p.status === 'PENDING_VERIFY');

  return (
    <div className="ht ht-page">
      <PageHeader title="Hóa đơn" sub={`Dịch vụ huấn luyện, lưu chuồng và y tế cho ngựa của ${actor.name}`} />
      {late.map(({ invoice: i, due }) => (
        <div key={i.id} className="ht-banner" role="alert">
          <Icon name={due.group === 'SUSPENDED' ? 'lock' : 'alarm'} />
          <div>
            <b>{i.id} · {i.horse} — {due.group === 'SUSPENDED' ? 'dịch vụ đang bị đình chỉ' : `quá hạn ${due.overdueDays} ngày`}</b>
            <p>{due.group === 'SUSPENDED'
              ? `Cần tất toán nợ + phạt + phí kích hoạt lại ${money(POLICY.reactivationFee)} (BR_14); Quản lý CLB xác nhận rồi mới mở lại.`
              : due.penalty > 0 ? `Đã quá ${POLICY.graceDays} ngày ân hạn — phát sinh phí phạt ${money(due.penalty)} (BR_12). Đạt ${POLICY.suspendDays} ngày có thể bị đình chỉ dịch vụ (BR_13), còn ${Math.max(0, POLICY.suspendDays - due.overdueDays)} ngày.`
                : `Trong ${POLICY.graceDays} ngày ân hạn — chưa tính phí phạt.`}</p>
          </div>
          <Link className="ht-more" to={toPath(PATH.owner.invoice, { id: i.id })}>Thanh toán <Icon name="arrow" /></Link>
        </div>
      ))}

      <div className="ht-stats">
        <StatCard icon="receipt" tone="brand" value={money(owed)} label="Tổng phải trả" meta={`${data.invoices.length} hóa đơn cần thanh toán`} />
        <StatCard icon="alarm" tone="danger" value={late.length} label="Quá hạn / đình chỉ" alert={late.length > 0} />
        <StatCard icon="clock" tone="warning" value={pending.length} label="Giao dịch chờ xác minh" />
        <StatCard icon="file" tone="info" value={count('UNPAID')} label="Chưa thanh toán" />
      </div>

      <Tabs<Tab> value={tab} onChange={setTab} items={[
        { value: 'ALL', label: 'Tất cả', count: data.invoices.length }, { value: 'UNPAID', label: 'Chưa thanh toán', count: count('UNPAID') },
        { value: 'OVERDUE', label: 'Quá hạn', count: count('OVERDUE') }, { value: 'SUSPENDED', label: 'Đình chỉ', count: count('SUSPENDED') },
      ]} />
      <Panel>
        <div style={{ overflowX: 'auto' }}>
          <table className="ht-table">
            <thead><tr><th>Hóa đơn</th><th>Ngựa</th><th>Kỳ</th><th>Hạn thanh toán</th><th style={{ textAlign: 'right' }}>Số tiền</th><th style={{ textAlign: 'right' }}>Phải trả</th><th>Trạng thái</th><th /></tr></thead>
            <tbody>
              {rows.map(({ invoice: i, due }) => {
                const [label, tone] = invoiceLabel(i);
                return (
                  <tr key={i.id}>
                    <td className="ht-mono">{i.id}</td><td><b>{i.horse}</b><div style={{ fontSize: 12, color: 'var(--muted)' }}>{i.service}</div></td>
                    <td className="ht-mono">{i.period}</td>
                    <td className="ht-mono">{i.dueDate}{due.overdueDays > 0 && <div style={{ fontSize: 12, color: 'var(--danger)' }}>quá {due.overdueDays} ngày</div>}</td>
                    <td className="ht-mono" style={{ textAlign: 'right' }}>{money(i.amount)}</td>
                    <td className="ht-mono" style={{ textAlign: 'right', fontWeight: 600 }}>{money(due.total)}</td>
                    <td><Badge tone={tone}>{label}</Badge></td>
                    <td><Link className="ht-more" to={toPath(PATH.owner.invoice, { id: i.id })}>Thanh toán <Icon name="arrow" /></Link></td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={8} className="ht-empty">Không có hóa đơn cần thanh toán.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
};
