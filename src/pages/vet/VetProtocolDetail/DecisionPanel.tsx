import React from 'react';
import { Link } from 'react-router-dom';
import { dateKey, isOpenProtocol, ITEM_ADDABLE, phaseRequiredBy, Protocol, stockShort, vetApi, VetCase, VetHorse } from '../../../api/vetApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Icon } from '../../../components/ui/Icon';
import { Callout, money, Panel } from '../../../components/ui/Ht';
import { HorseBadges } from '../../../components/trainer/TrainerParts';
import type { ProtocolAction } from './ActionDialog';
import { currentPhaseOf, phaseIsPaid, phaseProgressOf } from '../../../features/protocol-phases/phaseState';

interface Props { protocol: Protocol; horse: VetHorse; vetCase: VetCase | null; onAction: (a: ProtocolAction) => void; onNewVersion: () => void; onAddItems: () => void; onReload: () => void }

export const DecisionPanel: React.FC<Props> = ({ protocol: p, horse, vetCase, onAction, onNewVersion, onAddItems, onReload }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const short = stockShort(p);
  const phaseProgress = phaseProgressOf(p);
  const currentPhase = currentPhaseOf(p);
  const currentPhaseState = currentPhase ? phaseProgress.find((item) => item.phaseNo === currentPhase.phaseNo) : undefined;
  const phaseReady = !!currentPhase && phaseIsPaid(p, currentPhase.phaseNo) && (p.dispensedPhases ?? []).includes(currentPhase.phaseNo);
  const requiredBy = phaseRequiredBy(p, short.map((l) => l.itemId));
  const etaLate = p.wait && dateKey(p.wait.eta) > dateKey(requiredBy);
  const btn = (cls: string, icon: React.ComponentProps<typeof Icon>['name'], label: string, onClick: () => void) => (
    <button type="button" className={`ht-btn ${cls} ht-btn--block`} onClick={onClick}><Icon name={icon} />{label}</button>
  );

  return (
    <Panel as="h3" title="Quyết định của bác sĩ">
      <div className="ht-panel__body" style={{ display: 'grid', gap: 10 }}>
        <dl className="ht-kv" style={{ gridTemplateColumns: '100px 1fr' }}>
          <dt>Ngựa</dt><dd><Link to={`/vet/horses/${horse.id}`}>{horse.name}</Link> <HorseBadges horse={horse} compact /></dd>
          <dt>Chẩn đoán</dt><dd>{vetCase?.exam?.diagnosis ?? p.diagnosis}</dd>
          <dt>Cần thuốc</dt><dd className="ht-mono">{p.requiredBy}</dd>
          <dt>Tổng chi phí</dt><dd><b>{money(p.cost)}</b></dd>
        </dl>

        {p.state === 'DRAFT' && <>
          {btn('ht-btn--primary', 'send', 'Gửi kiểm tra tồn kho', () => onAction('send'))}
          <button type="button" className="ht-btn ht-btn--ghost ht-btn--block" onClick={() => onAction('cancel')}>Hủy bản nháp</button>
        </>}

        {p.state === 'WAITING_STOCK_CHECK' && <Callout tone="info" icon="clock">Đang chờ Quản lý kho đối chiếu tồn. Bạn sẽ nhận thông báo khi có phản hồi.</Callout>}

        {(p.state === 'STOCK_SHORTAGE' || p.state === 'REQUIRES_VET_REVIEW') && <>
          <Callout tone="danger" icon="warn" title={p.state === 'STOCK_SHORTAGE' ? 'Kho báo thiếu vật tư' : 'Cần đánh giá lại'}>
            {short.map((l) => <div key={l.itemId}>{l.name}: thiếu {l.short} {l.unit}{l.eta ? ` · về ${l.eta}` : ' · chưa có ETA'}</div>)}
          </Callout>
          {btn('ht-btn--primary', 'refresh', 'Đổi thuốc — tạo phiên bản mới', onNewVersion)}
          <button type="button" className="ht-btn ht-btn--secondary ht-btn--block" data-testid="protocol-wait-btn" onClick={() => onAction('wait')}>
            <Icon name="clock" />{p.state === 'STOCK_SHORTAGE' ? 'Chờ nhập hàng' : 'Tiếp tục chờ hàng'}
          </button>
        </>}

        {p.state === 'WAITING_RESTOCK' && <>
          <Callout tone={etaLate ? 'danger' : 'info'} icon="truck">Chờ hàng về <b>{p.wait?.eta}</b>{etaLate && ` — sau mốc cần thuốc ${p.requiredBy}`}. Khi kho nhập đủ, phác đồ chuyển sang đủ hàng và nút xác nhận mới hiện.</Callout>
          {btn('ht-btn--secondary', 'refresh', 'Đổi thuốc — tạo phiên bản mới', onNewVersion)}
        </>}

        {p.state === 'STOCK_AVAILABLE' && <>
          <Callout tone="success" icon="check">Kho xác nhận đủ hàng và đã giữ số lượng cần thiết. Xem lại tình trạng ngựa rồi tự xác nhận — không cần Quản lý CLB duyệt.</Callout>
          {btn('ht-btn--primary', 'check', 'Xác nhận phác đồ', () => onAction('confirm'))}
        </>}

        {p.state === 'READY_FOR_DISPENSING' && <Callout tone="success" icon="box">Đã xác nhận. Kho cấp phát xong thì phác đồ chuyển “Chờ thanh toán”. Chủ ngựa trả giai đoạn 1 xong mới sang “Đang điều trị”.</Callout>}
        {p.state === 'ON_HOLD_PAYMENT' && <Callout tone="demo" icon="warn">Đã cấp thuốc và bác sĩ đã xác nhận. Phác đồ đang chờ chủ ngựa thanh toán giai đoạn 1 — chưa bắt đầu điều trị.</Callout>}

        {p.state === 'IN_TREATMENT' && <>
          {btn('ht-btn--secondary', 'pulse', 'Ghi tiến triển', () => onAction('progress'))}
          <button type="button" className="ht-btn ht-btn--secondary ht-btn--block" data-testid="add-items-btn" onClick={onAddItems}><Icon name="box" />Bổ sung thuốc</button>
          {currentPhase && currentPhaseState?.status === 'IN_PROGRESS' && phaseReady && <>
            <button type="button" className="ht-btn ht-btn--secondary ht-btn--block" data-testid="protocol-phase-done" disabled={busy} onClick={() => onAction('continue-phase')}>
              <Icon name="check" />Hoàn thành GĐ {currentPhase.phaseNo} và tiếp tục
            </button>
            <button type="button" className="ht-btn ht-btn--ghost ht-btn--block" data-testid="protocol-phase-stop" disabled={busy} onClick={() => onAction('stop-phase')}>
              <Icon name="ban" />Ngưng sau GĐ {currentPhase.phaseNo}
            </button>
          </>}
          {currentPhase && currentPhaseState?.status !== 'IN_PROGRESS'
            ? <>
              <button type="button" className="ht-btn ht-btn--primary ht-btn--block" data-testid="protocol-phase-start" disabled={busy || !phaseReady} onClick={() => { void run(() => vetApi.startPhase(p, currentPhase.phaseNo, actor), `Đã bắt đầu giai đoạn ${currentPhase.phaseNo}.`).then((ok) => { if (ok) onReload(); }); }}>
                <Icon name="arrow" />Bắt đầu giai đoạn {currentPhase.phaseNo}
              </button>
              <Callout tone={phaseReady ? 'info' : 'danger'}>{phaseReady ? `Đã đủ điều kiện bắt đầu GĐ ${currentPhase.phaseNo}.` : `Chưa thể bắt đầu GĐ ${currentPhase.phaseNo}: cần chủ ngựa thanh toán và kho cấp thuốc.`}</Callout>
            </>
            : currentPhase
            ? <Callout tone="info">Đã bắt đầu GĐ {currentPhase.phaseNo}. Bác sĩ cần quyết định tiếp tục hoặc ngưng và ghi lý do khi kết thúc.</Callout>
            : btn('ht-btn--primary', 'check', 'Kết thúc điều trị', () => onAction('complete'))}
          {error && <Callout tone="danger">{error}</Callout>}
        </>}

        {p.state !== 'DRAFT' && ITEM_ADDABLE.includes(p.state) && (
          <>
            <button type="button" className="ht-btn ht-btn--secondary ht-btn--block" data-testid="add-items-btn" onClick={onAddItems}><Icon name="box" />Thêm vật tư / thuốc</button>
            <button type="button" className="ht-btn ht-btn--ghost ht-btn--block" data-testid="cancel-protocol-btn" onClick={() => onAction('cancel')} style={{ color: 'var(--danger-ink)' }}><Icon name="ban" />Hủy phác đồ</button>
          </>
        )}

        {!isOpenProtocol(p) && p.state !== 'SUPERSEDED' && <Callout tone="info">Phác đồ đã đóng.</Callout>}
      </div>
    </Panel>
  );
};
