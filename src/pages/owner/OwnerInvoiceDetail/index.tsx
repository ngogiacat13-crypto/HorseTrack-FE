import React from 'react';
import { useParams } from 'react-router-dom';
import { invoiceLabel, ownerApi, PAYMENT_LABEL, POLICY } from '../../../api/ownerApi';
import { addDays, daysFromToday } from '../../../api/vetApi';
import { useActor } from '../../../auth/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { PATH } from '../../../routers/routerPath';
import { Icon } from '../../../components/ui/Icon';
import { BackButton, Badge, Callout, money, PageHeader, Panel } from '../../../components/ui/Ht';
import { LoadState } from '../../../components/trainer/TrainerParts';
import { PayPanel } from './PayPanel';
import { USE_BACKEND } from '../../../api/beClient';

const KIND: Record<string, string> = { TRAIN: 'Huấn luyện', STABLE: 'Lưu chuồng', MED: 'Y tế · thuốc', PENALTY: 'Phí phạt', REACTIVATION: 'Kích hoạt lại', RACE: 'Lệ phí giải đấu' };

export const OwnerInvoiceDetail: React.FC = () => {
  const { id = '' } = useParams();
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => ownerApi.getInvoice(id, actor), [id, actor]);
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  const { invoice: i, due, payments } = data;
  const [label, tone] = invoiceLabel(i);
  const last = payments[0];
  const suspended = i.status === 'SUSPENDED';
  const passed = (d: string) => daysFromToday(d) <= 0;
  const milestones = [
    { title: 'Phát hành', date: i.issuedAt, note: 'Hóa đơn được lập', tone: 'brand' },
    { title: 'Hạn thanh toán', date: i.dueDate, note: 'Kết thúc kỳ thanh toán', tone: 'brand' },
    { title: 'Bắt đầu quá hạn', date: addDays(i.dueDate, 1), note: `Ân hạn ${POLICY.graceDays} ngày`, tone: 'warning' },
    { title: 'Tính phí phạt', date: addDays(i.dueDate, POLICY.graceDays + 1), note: `${POLICY.penaltyRate * 100}% giá trị (BR_12)`, tone: 'danger' },
    { title: 'Mốc đình chỉ', date: addDays(i.dueDate, POLICY.suspendDays), note: `Quá hạn ${POLICY.suspendDays} ngày (BR_13)`, tone: 'danger' },
  ];

  return (
    <div className="ht ht-page">
      <PageHeader crumbs={<BackButton fallback={PATH.owner.invoices} />} title="Chi tiết hóa đơn" sub={`${i.horse} · ${i.service} tháng ${i.period}`} badge={<Badge tone={tone}>{label}</Badge>} />

      {suspended && (
        <div className="ht-banner" role="alert">
          <Icon name="lock" />
          <div><b>Hợp đồng đình chỉ — dịch vụ đang tạm dừng từ {i.suspendedSince}.</b>
            <p>Bạn vẫn xem và thanh toán được hóa đơn. Thanh toán không tự động khôi phục dịch vụ: cần tất toán đủ (đã xác minh) rồi Quản lý CLB mới kích hoạt lại (BR_14).</p></div>
        </div>
      )}

      <div className="ht-status-cards">
        <div className="ht-status-card"><span>Trạng thái hóa đơn</span><Badge tone={tone}>{label}</Badge>
          <span>{due.overdueDays > 0 ? `Quá hạn ${due.overdueDays} ngày (từ ${addDays(i.dueDate, 1)}).` : due.group === 'PAID' ? `Đã tất toán · ${i.paidRef ?? ''}` : `Hạn thanh toán ${i.dueDate}.`}</span></div>
        <div className="ht-status-card"><span>Trạng thái giao dịch</span>
          {last ? <Badge tone={PAYMENT_LABEL[last.status][1]}>{PAYMENT_LABEL[last.status][0]}</Badge> : <Badge tone="warning">Chưa thanh toán</Badge>}
          <span>{last ? `${last.id} · ${last.createdAt}` : 'Chưa có giao dịch cho hóa đơn này.'}</span></div>
        <div className="ht-status-card"><span>Trạng thái dịch vụ</span>
          <Badge tone={suspended ? 'danger' : i.status === 'REACTIVATION_PENDING' ? 'info' : 'success'}>{suspended ? 'Đình chỉ' : i.status === 'REACTIVATION_PENDING' ? 'Chờ kích hoạt lại' : 'Đang hoạt động'}</Badge>
          <span>{suspended ? `Đình chỉ từ ${i.suspendedSince}.` : i.status === 'REACTIVATION_PENDING' ? 'Đã tất toán, chờ Quản lý CLB xác nhận.' : 'Dịch vụ bình thường.'}</span></div>
      </div>

      <div className="ht-cols">
        <div>
          <Panel title="Thông tin hóa đơn" sub={`Dịch vụ thuộc ngựa của ${i.owner}`} right={<span className="ht-mono" style={{ fontSize: 18, fontWeight: 700 }}>#{i.id}</span>}>
            <div className="ht-panel__body" style={{ display: 'grid', gap: 16 }}>
              <div className="ht-grid-2" style={{ gap: 8 }}>
                <dl className="ht-kv"><dt>Ngựa</dt><dd>{i.horse}</dd><dt>Chủ ngựa</dt><dd>{i.owner}</dd><dt>Loại dịch vụ</dt><dd>{i.service}</dd></dl>
                <dl className="ht-kv"><dt>Ngày phát hành</dt><dd className="ht-mono">{i.issuedAt}</dd><dt>Hạn thanh toán</dt><dd className="ht-mono">{i.dueDate} 23:59</dd><dt>Kỳ thanh toán</dt><dd>Tháng {i.period}</dd></dl>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="ht-table">
                  <thead><tr><th>Nội dung dịch vụ</th><th>Loại</th><th>Kỳ</th><th style={{ textAlign: 'right' }}>Thành tiền</th></tr></thead>
                  <tbody>
                    {i.lines.map((l) => <tr key={l.label}><td>{l.label}</td><td>{KIND[l.kind]}</td><td className="ht-mono">{l.period}</td><td className="ht-mono" style={{ textAlign: 'right' }}>{money(l.amount)}</td></tr>)}
                    {due.penalty > 0 && <tr><td>Phí phạt quá hạn {due.overdueDays} ngày ({POLICY.penaltyRate * 100}%)</td><td>Phí phạt</td><td className="ht-mono">—</td><td className="ht-mono" style={{ textAlign: 'right', color: 'var(--danger)' }}>{money(due.penalty)}</td></tr>}
                    {due.reactivationFee > 0 && <tr><td>Phí kích hoạt lại dịch vụ</td><td>Kích hoạt lại</td><td className="ht-mono">—</td><td className="ht-mono" style={{ textAlign: 'right' }}>{money(due.reactivationFee)}</td></tr>}
                    <tr><td colSpan={3} style={{ fontWeight: 700 }}>Tổng cộng</td><td className="ht-mono" style={{ textAlign: 'right', fontWeight: 700 }}>{money(due.group === 'PAID' ? i.amount : due.total)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Panel>
          <Panel title="Các mốc thanh toán" sub={USE_BACKEND ? 'Theo giờ hệ thống · Asia/Ho_Chi_Minh' : 'Theo đồng hồ demo · Asia/Ho_Chi_Minh'}>
            <div className="ht-panel__body">
              <div className="ht-milestones">
                {milestones.map((m) => (
                  <div key={m.title} className="ht-milestone" data-on={due.group !== 'PAID' ? passed(m.date) : m.tone === 'brand'} data-tone={m.tone}>
                    <b>{m.title}</b><span className="ht-mono">{m.date}</span><span>{m.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
          {suspended && <Callout tone="demo" icon="info" title="Khôi phục dịch vụ">Sau khi giao dịch được xác minh, hóa đơn chuyển “Đã thanh toán · chờ kích hoạt lại”. Quản lý CLB kiểm tra đủ nợ, phạt và phí kích hoạt rồi mới mở lại dịch vụ.</Callout>}
        </div>
        <div>
          <PayPanel invoice={i} due={due} payments={payments} onChange={reload} />
          <Panel as="h3" title="Điều kiện ghi nhận và khôi phục">
            <div className="ht-panel__body">
              <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, display: 'grid', gap: 8 }}>
                <li>Giao dịch phải được máy chủ xác minh đúng tham chiếu, nội dung và số tiền.</li>
                <li>Quá {POLICY.graceDays} ngày tính phí phạt {POLICY.penaltyRate * 100}%; đạt {POLICY.suspendDays} ngày có thể bị đình chỉ.</li>
                <li>Dịch vụ bị đình chỉ: tất toán nợ + phạt + phí kích hoạt lại {money(POLICY.reactivationFee)}; Quản lý CLB xác nhận mở lại.</li>
              </ol>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};
