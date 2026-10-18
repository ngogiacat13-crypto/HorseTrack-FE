import React from 'react';
import { Link } from 'react-router-dom';
import { ownerApi } from '../../../api/ownerApi';
import { useActor } from '../../../auth/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { PATH, toPath } from '../../../routers/routerPath';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Callout, money, PageHeader } from '../../../components/ui/Ht';
import { HorseBadges, LoadState } from '../../../components/trainer/TrainerParts';
import { ProtocolBadge } from '../../../components/vet/VetParts';

/* 1.1 Danh sách ngựa của tôi — chỉ ngựa có liên kết sở hữu với tài khoản (BR_09). */
export const OwnerHorses: React.FC = () => {
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => ownerApi.getMyHorses(actor), [actor]);
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  const late = data.openInvoices.filter((x) => x.due.group === 'OVERDUE' || x.due.group === 'SUSPENDED');
  const suspended = data.openInvoices.find((x) => x.due.group === 'SUSPENDED');

  return (
    <div className="ht ht-page">
      <PageHeader title="Ngựa của tôi" sub={`${data.horses.length} ngựa thuộc sở hữu của ${actor.name}`} />

      {suspended && (
        <div className="ht-banner" role="alert">
          <Icon name="lock" />
          <div><b>Dịch vụ đang bị đình chỉ — hóa đơn <span className="ht-mono">{suspended.invoice.id}</span> quá hạn {suspended.due.overdueDays} ngày (BR_13).</b>
            <p>Thanh toán đủ nợ, phí phạt và phí kích hoạt lại; Quản lý CLB xác nhận rồi mới mở lại dịch vụ (BR_14).</p></div>
          <Link className="ht-more" to={toPath(PATH.owner.invoice, { id: suspended.invoice.id })}>Xem hóa đơn <Icon name="arrow" /></Link>
        </div>
      )}
      {data.waitingProposals.length > 0 && (
        <Callout tone="info" icon="trend" title={`${data.waitingProposals.length} đề xuất thi đấu chờ bạn xác nhận`} style={{ marginBottom: 16 }}>
          {data.waitingProposals.map((p) => p.horseName).join(', ')} đã có kết quả khám ĐẠT. <Link to={PATH.owner.races}>Xem và trả lời →</Link>
        </Callout>
      )}
      {!suspended && late.length > 0 && (
        <Callout tone="danger" icon="alarm" title={`${late.length} hóa đơn quá hạn`} style={{ marginBottom: 16 }}>
          Tổng phải trả {money(late.reduce((s, x) => s + x.due.total, 0))}. Quá 10 ngày áp dụng phí phạt; đạt 25 ngày có thể bị đình chỉ dịch vụ. <Link to={PATH.owner.invoices}>Thanh toán →</Link>
        </Callout>
      )}

      <div className="ht-owner-horses">
        {data.horses.map(({ horse: h, plan, protocol, stats }) => (
          <Link key={h.id} className="ht-horse-card" to={toPath(PATH.owner.horse, { id: h.id })}>
            <div className="ht-horse-card__head">
              <span className="ht-horse-card__avatar">{h.name.charAt(0)}</span>
              <div><b>{h.name}</b><small>{h.breed} · {h.sex === '♂' ? 'Đực' : 'Cái'} · {h.age} tuổi · chuồng {h.stall}</small></div>
            </div>
            <HorseBadges horse={h} compact />
            <dl className="ht-kv">
              <dt>Huấn luyện</dt><dd>{h.trainingLocked ? <Badge tone="danger" plain>Tạm khóa bởi bác sĩ</Badge> : plan ? <>{plan.name} · GĐ {plan.currentPhase}/{plan.phases.length}</> : 'Chưa có giáo án'}</dd>
              <dt>Điều trị</dt><dd>{protocol ? <ProtocolBadge state={protocol.state} /> : 'Không có'}</dd>
              <dt>Thành tích</dt><dd>{stats.starts ? <>{stats.starts} lần đua · {stats.wins} thắng · {stats.top3} top 3</> : 'Chưa thi đấu'}</dd>
            </dl>
            <span className="ht-more">Xem hồ sơ <Icon name="arrow" /></span>
          </Link>
        ))}
        {data.horses.length === 0 && <div className="ht-empty">Bạn chưa có ngựa nào được duyệt.</div>}
      </div>
    </div>
  );
};
