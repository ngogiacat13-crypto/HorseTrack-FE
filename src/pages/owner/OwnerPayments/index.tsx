import React from 'react';
import { Link } from 'react-router-dom';
import { ownerApi, PAYMENT_LABEL, type Payment } from '../../../api/ownerApi';
import { useActor } from '../../../auth/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { PATH, toPath } from '../../../routers/routerPath';
import { Badge, DataTable, money, PageHeader, Panel, StatCard, type Column } from '../../../components/ui/Ht';
import { Async } from '../../../components/ui/Async';

const sub: React.CSSProperties = { fontSize: 12, color: 'var(--muted)' };

/* Each column says how to draw its cell (render props); DataTable draws the table around them. */
const COLUMNS: Column<Payment>[] = [
  { header: 'Mã giao dịch', render: (p) => p.id, className: 'ht-mono' },
  { header: 'Hóa đơn', render: (p) => <Link className="ht-mono" to={toPath(PATH.owner.invoice, { id: p.invoiceId })}>{p.invoiceId}</Link> },
  { header: 'Ngựa', render: (p) => p.horse },
  { header: 'Thời gian', render: (p) => <>{p.createdAt}{p.verifiedAt && <div style={sub}>xác minh {p.verifiedAt}</div>}</>, className: 'ht-mono' },
  { header: 'Mã ngân hàng', render: (p) => p.bankRef ?? '—', className: 'ht-mono' },
  { header: 'Số tiền', render: (p) => money(p.amount), className: 'ht-mono', align: 'right' },
  { header: 'Trạng thái', render: (p) => <><Badge tone={PAYMENT_LABEL[p.status][1]}>{PAYMENT_LABEL[p.status][0]}</Badge>{p.note && <div style={sub}>{p.note}</div>}</> },
];

/* 2.4 Lịch sử thanh toán — tổng đã thanh toán, số còn nợ, chi tiết giao dịch. */
export const OwnerPayments: React.FC = () => {
  const actor = useActor();
  const state = useFetch(() => ownerApi.getPaymentHistory(actor), [actor]);

  return (
    <Async state={state}>
      {(data) => (
        <div className="ht ht-page">
          <PageHeader title="Lịch sử thanh toán" sub="Mọi giao dịch VNPay của bạn — chỉ giao dịch “Đã xác minh” được tính là đã thanh toán" />
          <div className="ht-stats">
            <StatCard icon="check" tone="brand" value={money(data.paid)} label="Tổng đã thanh toán" meta={`${data.payments.filter((p) => p.status === 'VERIFIED').length} giao dịch đã xác minh`} />
            <StatCard icon="receipt" tone="danger" value={money(data.owed)} label="Còn nợ (gồm phạt)" alert={data.owed > 0} />
            <StatCard icon="clock" tone="warning" value={data.payments.filter((p) => p.status === 'PENDING_VERIFY').length} label="Chờ xác minh" />
            <StatCard icon="x" tone="info" value={data.payments.filter((p) => p.status === 'FAILED').length} label="Giao dịch thất bại" />
          </div>
          <Panel title="Giao dịch">
            <DataTable rows={data.payments} columns={COLUMNS} rowKey={(p) => p.id} empty="Chưa có giao dịch." />
          </Panel>
        </div>
      )}
    </Async>
  );
};
