import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ownerApi, PAYMENT_LABEL, type InvoiceDue, type OwnerInvoice, type Payment } from '../../../api/ownerApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { PATH, toPath } from '../../../routers/routerPath';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Callout, money, Panel } from '../../../components/ui/Ht';

/* 2.3 / 2.6 Thanh toán: debt + penalty (BR_12) + reactivation fee (BR_14), then the VNPay sandbox. */
export const PayPanel: React.FC<{ invoice: OwnerInvoice; due: InvoiceDue; payments: Payment[]; onChange: () => void }> = ({ invoice: i, due, payments, onChange }) => {
  const actor = useActor();
  const navigate = useNavigate();
  const act = useAction(onChange);
  const waiting = payments.find((p) => p.status === 'PENDING_VERIFY' || p.status === 'PROCESSING');
  const verified = payments.find((p) => p.status === 'VERIFIED');

  const pay = async () => {
    let id = '';
    if (await act.run(async () => { id = (await ownerApi.startPayment(i.id, actor)).id; })) navigate(toPath(PATH.vnpay, { id }));
  };

  return (
    <Panel as="h3" title="Thanh toán hóa đơn">
      <div className="ht-panel__body" style={{ display: 'grid', gap: 14 }}>
        {act.error && <Callout tone="danger">{act.error}</Callout>}
        <div>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{due.group === 'PAID' ? 'Đã thanh toán' : 'Số tiền phải trả'}</span>
          <div className="ht-amount">{money(due.group === 'PAID' ? verified?.amount ?? i.amount : due.total)}</div>
        </div>
        <dl className="ht-sum">
          <dt>Giá trị dịch vụ</dt><dd>{money(i.amount)}</dd>
          {due.group !== 'PAID' && <>
            <dt>Phí phạt quá hạn (BR_12)</dt><dd style={{ color: due.penalty ? 'var(--danger)' : undefined }}>{due.penalty ? money(due.penalty) : due.overdueDays > 0 ? 'Trong ân hạn' : '—'}</dd>
            {due.reactivationFee > 0 && <><dt>Phí kích hoạt lại (BR_14)</dt><dd>{money(due.reactivationFee)}</dd></>}
            <dt className="is-total">Tổng</dt><dd className="is-total">{money(due.total)}</dd>
          </>}
        </dl>

        {due.group !== 'PAID' && !waiting && (
          <button type="button" className="ht-btn ht-btn--primary" disabled={act.busy} onClick={pay}><Icon name="card" size={16} />{act.busy ? 'Đang tạo giao dịch…' : 'Thanh toán qua VNPay'}</button>
        )}
        {waiting && (
          <Callout tone="demo" icon="clock" title={`Giao dịch ${waiting.id} · ${PAYMENT_LABEL[waiting.status][0]}`}>
            Cổng VNPay đã trả kết quả nhưng hóa đơn <b>chưa</b> được ghi nhận thanh toán — chờ máy chủ xác minh (IPN / đối soát).
            <div style={{ marginTop: 10 }}>
              <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" disabled={act.busy || waiting.status !== 'PENDING_VERIFY'}
                onClick={() => act.run(() => ownerApi.serverVerify(waiting), 'Máy chủ đã xác minh giao dịch.')}>
                <Icon name="refresh" size={14} />Mô phỏng IPN từ máy chủ (demo)
              </button>
            </div>
          </Callout>
        )}
        {i.status === 'REACTIVATION_PENDING' && <Callout tone="info" title="Đã tất toán — chờ kích hoạt lại">Quản lý CLB kiểm tra điều kiện và mở lại dịch vụ (BR_14). Thanh toán không tự động khôi phục dịch vụ.</Callout>}
        <small style={{ color: 'var(--muted)' }}>Chỉ giao dịch được máy chủ xác minh đúng tham chiếu, nội dung và số tiền mới được ghi nhận. Trang kết quả của VNPay không phải xác nhận đã thanh toán.</small>

        {payments.length > 0 && (
          <div style={{ display: 'grid', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <b style={{ fontSize: 13 }}>Giao dịch của hóa đơn</b>
            {payments.map((p) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13 }}>
                <span><span className="ht-mono">{p.id}</span> · {money(p.amount)}<br /><small style={{ color: 'var(--muted)' }}>{p.createdAt}{p.note ? ` · ${p.note}` : ''}</small></span>
                <Badge tone={PAYMENT_LABEL[p.status][1]} plain>{PAYMENT_LABEL[p.status][0]}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
};
