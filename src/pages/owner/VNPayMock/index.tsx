import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { DEMO_NOW } from '../../../api/http';
import { ownerApi, PAYMENT_LABEL } from '../../../api/ownerApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { useFetch } from '../../../hooks/useFetch';
import { PATH, toPath } from '../../../routers/routerPath';
import { Icon } from '../../../components/ui/Icon';
import { Badge, BrandMark, Callout, money } from '../../../components/ui/Ht';
import { LoadState } from '../../../components/trainer/TrainerParts';

/* 2.3 VNPay Sandbox — MOCK. "Thành công" only moves the transaction to "Chờ xác minh"; never to PAID. */
export const VNPayMock: React.FC = () => {
  const { id = '' } = useParams();
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => ownerApi.getPayment(id, actor), [id, actor]);
  const act = useAction(reload);
  if (!data) return <div className="ht ht-vnpay"><div className="ht-vnpay__card"><LoadState loading={loading} error={error} onRetry={reload} /></div></div>;
  const { payment: p, invoice: i } = data;
  const open = p.status === 'INIT' || p.status === 'PROCESSING';
  const back = toPath(PATH.owner.invoice, { id: i.id });
  const step = p.status === 'VERIFIED' ? 3 : p.status === 'PENDING_VERIFY' ? 2 : 1;

  return (
    <div className="ht ht-vnpay">
      <header className="ht-vnpay__top">
        <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center', fontWeight: 700 }}><BrandMark />HorseTrack</span>
        <Link className="ht-more" to={back}><Icon name="back" size={14} /> Quay lại</Link>
      </header>
      <main className="ht-vnpay__card">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div><h1 style={{ margin: 0, fontSize: 28 }}>Thanh toán VNPay MOCK</h1><span style={{ color: 'var(--muted)', fontSize: 13 }}>Mô phỏng kết quả · không tích hợp cổng thanh toán thật</span></div>
          <Badge tone="warning">MÔ PHỎNG</Badge>
        </div>
        <Callout tone="demo" icon="warn" title="Đây là trang thanh toán mô phỏng.">Kết quả “Thành công” chỉ chuyển giao dịch sang <b>Chờ xác minh</b>, KHÔNG phải đã thanh toán.</Callout>
        {act.error && <Callout tone="danger">{act.error}</Callout>}

        <div className="ht-vnpay__amount">
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>Số tiền giao dịch</span>
          <div className="ht-amount" style={{ fontSize: 44 }}>{money(p.amount)}</div>
          <Badge tone={PAYMENT_LABEL[p.status][1]}>{PAYMENT_LABEL[p.status][0]}</Badge>
        </div>

        <dl className="ht-kv" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '16px 0', gridTemplateColumns: '160px 1fr' }}>
          <dt>Mã giao dịch</dt><dd className="ht-mono">{p.id}</dd>
          <dt>Nội dung</dt><dd>Thanh toán hóa đơn {i.id} · {i.service} tháng {i.period}</dd>
          <dt>Chủ ngựa</dt><dd>{p.owner}</dd><dt>Ngựa</dt><dd>{p.horse}</dd>
          {p.breakdown && <><dt>Chi tiết</dt><dd>Dịch vụ {money(p.breakdown.base)}{p.breakdown.penalty ? ` + phạt ${money(p.breakdown.penalty)}` : ''}{p.breakdown.reactivationFee ? ` + kích hoạt lại ${money(p.breakdown.reactivationFee)}` : ''}</dd></>}
        </dl>

        {open ? (
          <div style={{ display: 'grid', gap: 8 }}>
            <b>Chọn kết quả mô phỏng</b>
            <div className="ht-vnpay__choices">
              <button type="button" className="ht-btn ht-btn--primary" disabled={act.busy} onClick={() => act.run(() => ownerApi.gatewayResult(p, 'SUCCESS', actor))}><Icon name="check" size={16} />Thành công</button>
              <button type="button" className="ht-btn ht-btn--secondary" disabled={act.busy} onClick={() => act.run(() => ownerApi.gatewayResult(p, 'FAILED', actor))}><Icon name="x" size={16} />Thất bại</button>
              <button type="button" className="ht-btn ht-btn--secondary" disabled={act.busy || p.status === 'PROCESSING'} onClick={() => act.run(() => ownerApi.gatewayResult(p, 'PROCESSING', actor))}><Icon name="clock" size={16} />Đang xử lý</button>
            </div>
            <small style={{ color: 'var(--muted)' }}>Cả ba lựa chọn đều là kết quả MOCK, không phát sinh thanh toán thực tế.</small>
          </div>
        ) : p.status === 'FAILED' ? (
          <Callout tone="danger" title="Giao dịch thất bại">Hóa đơn giữ nguyên trạng thái. Bạn có thể quay lại và tạo giao dịch mới.</Callout>
        ) : null}

        <div className="ht-report" style={{ background: 'var(--background)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><b>Trạng thái giao dịch</b><Badge tone={PAYMENT_LABEL[p.status][1]}>{PAYMENT_LABEL[p.status][0]}</Badge></div>
          <div className="ht-steps">
            <div data-done={step > 1} data-on={step === 1}><b>Khởi tạo</b><span>Giao dịch đã tạo</span></div><Icon name="arrow" size={14} />
            <div data-done={step > 2} data-on={step === 2}><b>Chờ xác minh</b><span>Chưa ghi nhận thanh toán</span></div><Icon name="arrow" size={14} />
            <div data-done={step === 3}><b>Đã xác minh thanh toán</b><span>Máy chủ đối soát tham chiếu và số tiền</span></div>
          </div>
          <small style={{ color: 'var(--muted)' }}>Bước xác minh do máy chủ thực hiện (IPN/đối soát) — trong demo dùng nút “Mô phỏng IPN từ máy chủ” ở trang hóa đơn.</small>
        </div>

        <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
          <b>Thanh toán không gỡ các trạng thái dừng</b>
          <span style={{ color: 'var(--muted)' }}>Khóa tập do Bác sĩ thú y là trạng thái riêng; thanh toán không gỡ khóa.</span>
          <span style={{ color: 'var(--muted)' }}>Hợp đồng đình chỉ: sau khi xác minh, Quản lý CLB mới kích hoạt lại (BR_14).</span>
        </div>
        {!open && <Link className="ht-btn ht-btn--primary" to={back} style={{ justifySelf: 'start' }}><Icon name="back" size={16} />Về hóa đơn {i.id}</Link>}
      </main>
      <footer className="ht-vnpay__foot"><span>HorseTrack · Chỉ dùng trong trình diễn</span><span className="ht-mono">{DEMO_NOW.date} · Asia/Ho_Chi_Minh</span></footer>
    </div>
  );
};
