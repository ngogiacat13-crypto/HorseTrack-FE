import React from 'react';
import { Link } from 'react-router-dom';
import { dateKey, isOpenProtocol, ITEM_ADDABLE, phaseRequiredBy, Protocol, stockShort, vetApi, VetCase, VetHorse } from '../../../api/vetApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Icon } from '../../../components/ui/Icon';
import { Callout, money, Panel } from '../../../components/ui/Ht';
import { HorseBadges } from '../../../components/trainer/TrainerParts';
import type { ProtocolAction } from './ActionDialog';

interface Props { protocol: Protocol; horse: VetHorse; vetCase: VetCase | null; onAction: (a: ProtocolAction) => void; onNewVersion: () => void; onAddItems: () => void; onReload: () => void }

const finishedPhases = (p: Protocol) => new Set(p.progress.map((n) => Number(n.text.match(/Hoàn thành giai đoạn (\d+)/)?.[1])).filter((n) => n > 0));

export const DecisionPanel: React.FC<Props> = ({ protocol: p, horse, vetCase, onAction, onNewVersion, onAddItems, onReload }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const short = stockShort(p);
  const done = finishedPhases(p);
  const nextPhase = p.phases.find((ph) => !done.has(ph.no));
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

        {p.state === 'READY_FOR_DISPENSING' && <Callout tone="success" icon="box">Đã xác nhận. Quản lý kho chuẩn bị và cấp phát theo phác đồ này; trạng thái chuyển “Đang điều trị” khi cấp xong.</Callout>}

        {p.state === 'IN_TREATMENT' && <>
          {btn('ht-btn--secondary', 'pulse', 'Ghi tiến triển', () => onAction('progress'))}
          <button type="button" className="ht-btn ht-btn--secondary ht-btn--block" data-testid="add-items-btn" onClick={onAddItems}><Icon name="box" />Bổ sung thuốc</button>
          {nextPhase && (
            <button type="button" className="ht-btn ht-btn--secondary ht-btn--block" data-testid="protocol-phase-done" disabled={busy}
              onClick={() => { void run(() => vetApi.addProgress(p, `Hoàn thành giai đoạn ${nextPhase.no}: ${nextPhase.name}`, actor), `Đã hoàn thành giai đoạn ${nextPhase.no}.`).then((ok) => { if (ok) onReload(); }); }}>
              <Icon name="check" />Hoàn thành giai đoạn {nextPhase.no}
            </button>
          )}
          {nextPhase
            ? <Callout tone="info">Phải hoàn thành từng giai đoạn trước khi kết thúc. Còn giai đoạn {nextPhase.no} · {nextPhase.name}.</Callout>
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
