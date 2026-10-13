import React from 'react';
import { Link } from 'react-router-dom';
import { ownerApi, PAYMENT_LABEL } from '../../../api/ownerApi';
import { useActor } from '../../../auth/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { PATH, toPath } from '../../../routers/routerPath';
import { Badge, money, PageHeader, Panel, StatCard } from '../../../components/ui/Ht';
import { LoadState } from '../../../components/trainer/TrainerParts';

/* 2.4 Lịch sử thanh toán — tổng đã thanh toán, số còn nợ, chi tiết giao dịch. */
export const OwnerPayments: React.FC = () => {
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => ownerApi.getPaymentHistory(actor), [actor]);
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  const failed = data.payments.filter((p) => p.status === 'FAILED').length;

  return (
    <div className="ht ht-page">
      <PageHeader title="Lịch sử thanh toán" sub="Mọi giao dịch VNPay của bạn — chỉ giao dịch “Đã xác minh” được tính là đã thanh toán" />
      <div className="ht-stats">
        <StatCard icon="check" tone="brand" value={money(data.paid)} label="Tổng đã thanh toán" meta={`${data.payments.filter((p) => p.status === 'VERIFIED').length} giao dịch đã xác minh`} />
        <StatCard icon="receipt" tone="danger" value={money(data.owed)} label="Còn nợ (gồm phạt)" alert={data.owed > 0} />
        <StatCard icon="clock" tone="warning" value={data.payments.filter((p) => p.status === 'PENDING_VERIFY').length} label="Chờ xác minh" />
        <StatCard icon="x" tone="info" value={failed} label="Giao dịch thất bại" />
      </div>
      <Panel title="Giao dịch">
        <div style={{ overflowX: 'auto' }}>
          <table className="ht-table">
            <thead><tr><th>Mã giao dịch</th><th>Hóa đơn</th><th>Ngựa</th><th>Thời gian</th><th>Mã ngân hàng</th><th style={{ textAlign: 'right' }}>Số tiền</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {data.payments.map((p) => (
                <tr key={p.id}>
                  <td className="ht-mono">{p.id}</td>
                  <td><Link className="ht-mono" to={toPath(PATH.owner.invoice, { id: p.invoiceId })}>{p.invoiceId}</Link></td>
                  <td>{p.horse}</td>
                  <td className="ht-mono">{p.createdAt}{p.verifiedAt && <div style={{ fontSize: 12, color: 'var(--muted)' }}>xác minh {p.verifiedAt}</div>}</td>
                  <td className="ht-mono">{p.bankRef ?? '—'}</td>
                  <td className="ht-mono" style={{ textAlign: 'right' }}>{money(p.amount)}</td>
                  <td><Badge tone={PAYMENT_LABEL[p.status][1]}>{PAYMENT_LABEL[p.status][0]}</Badge>{p.note && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.note}</div>}</td>
                </tr>
              ))}
              {data.payments.length === 0 && <tr><td colSpan={7} className="ht-empty">Chưa có giao dịch.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
};
