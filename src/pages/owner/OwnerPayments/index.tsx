import React from 'react';
import { Link } from 'react-router-dom';
import { HISTORY_LABEL, ownerApi, type Payment } from '../../../api/ownerApi';
import { useActor } from '../../../auth/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { PATH, toPath } from '../../../routers/routerPath';
import { Icon } from '../../../components/ui/Icon';
import { Badge, CopyText, DataTable, money, PageHeader, Panel, StatCard, type Column } from '../../../components/ui/Ht';
import { Async } from '../../../components/ui/Async';

const sub: React.CSSProperties = { fontSize: 12, color: 'var(--muted)' };

/* Each column says how to draw its cell (render props); DataTable draws the table around them.
   The history only holds finished transactions, so the status is VERIFIED or FAILED. */
const COLUMNS: Column<Payment>[] = [
  { header: 'Mã giao dịch', render: (p) => p.id, className: 'ht-mono' },
  { header: 'Hóa đơn', render: (p) => <CopyText text={p.invoiceId} label="mã hóa đơn" /> },
  { header: 'Ngựa', render: (p) => p.horse },
  { header: 'Thời gian', render: (p) => <>{p.createdAt}{p.verifiedAt && <div style={sub}>xác minh {p.verifiedAt}</div>}</>, className: 'ht-mono' },
  { header: 'Mã ngân hàng', render: (p) => p.bankRef ?? '—', className: 'ht-mono' },
  { header: 'Số tiền', render: (p) => <span style={{ whiteSpace: 'nowrap' }}>{money(p.amount)}</span>, className: 'ht-mono', align: 'right' },
  {
    header: 'Trạng thái',
    render: (p) => {
      const [label, tone] = HISTORY_LABEL[p.status === 'VERIFIED' ? 'VERIFIED' : 'FAILED'];
      return <><Badge tone={tone}>{label}</Badge>{p.status === 'FAILED' && p.note && <div style={sub}>{p.note}</div>}</>;
    },
  },
  {
    header: 'Hành động',
    render: (p) => (
      <Link className="ht-btn ht-btn--secondary ht-btn--sm" style={{ whiteSpace: 'nowrap' }} to={toPath(PATH.owner.invoice, { id: p.invoiceId })}>
        <Icon name="receipt" size={14} />Xem chi tiết hóa đơn
      </Link>
    ),
  },
];

/* 2.4 Lịch sử thanh toán — tổng đã thanh toán, số còn nợ, các giao dịch đã hoàn tất (thành công / thất bại). */
export const OwnerPayments: React.FC = () => {
  const actor = useActor();
  const state = useFetch(() => ownerApi.getPaymentHistory(actor), [actor]);

  return (
    <Async state={state}>
      {(data) => {
        const ok = data.payments.filter((p) => p.status === 'VERIFIED').length;
        return (
          <div className="ht ht-page">
            <PageHeader title="Lịch sử thanh toán" sub="Các giao dịch VNPay đã hoàn tất — thanh toán thành công (máy chủ đã xác minh) hoặc thất bại" />
            <div className="ht-stats">
              <StatCard icon="check" tone="brand" value={money(data.paid)} label="Tổng đã thanh toán" meta={`${ok} giao dịch thành công`} />
              <StatCard icon="receipt" tone="danger" value={money(data.owed)} label="Còn nợ (gồm phạt)" alert={data.owed > 0} />
              <StatCard icon="card" tone="info" value={ok} label="Thanh toán thành công" />
              <StatCard icon="x" tone="warning" value={data.payments.length - ok} label="Giao dịch thất bại" />
            </div>
            <Panel title="Giao dịch">
              <DataTable rows={data.payments} columns={COLUMNS} rowKey={(p) => p.id} empty="Chưa có giao dịch hoàn tất." />
            </Panel>
          </div>
        );
      }}
    </Async>
  );
};
