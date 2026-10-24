import React from 'react';
import { Link } from 'react-router-dom';
import { dateKey, isOpenProtocol, ITEM_ADDABLE, phaseRequiredBy, Protocol, stockShort, VetCase, VetHorse } from '../../../api/vetApi';
import { Icon } from '../../../components/ui/Icon';
import { Callout, money, Panel } from '../../../components/ui/Ht';
import { HorseBadges } from '../../../components/trainer/TrainerParts';
import type { ProtocolAction } from './ActionDialog';

interface Props { protocol: Protocol; horse: VetHorse; vetCase: VetCase | null; onAction: (a: ProtocolAction) => void; onNewVersion: () => void; onAddItems: () => void }

export const DecisionPanel: React.FC<Props> = ({ protocol: p, horse, vetCase, onAction, onNewVersion, onAddItems }) => {
  const short = stockShort(p);
  const stockComplete = !!p.stock && short.length === 0;
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
          {p.state === 'REQUIRES_VET_REVIEW' && btn('ht-btn--secondary', 'clock', 'Tiếp tục chờ hàng', () => onAction('wait'))}
          {stockComplete && btn('ht-btn--secondary', 'check', 'Hàng đã đủ — xác nhận', () => onAction('confirm'))}
        </>}

        {p.state === 'WAITING_RESTOCK' && <>
          <Callout tone={etaLate ? 'danger' : 'info'} icon="truck">Chờ hàng về <b>{p.wait?.eta}</b>{etaLate && ` — sau mốc cần thuốc ${p.requiredBy}`}. Khi kho nhập hàng, bạn rà soát lại rồi xác nhận.</Callout>
          {stockComplete
            ? btn('ht-btn--primary', 'check', 'Hàng đã về — rà soát & xác nhận', () => onAction('confirm'))
            : btn('ht-btn--secondary', 'refresh', 'Đổi thuốc — tạo phiên bản mới', onNewVersion)}
        </>}

        {p.state === 'STOCK_AVAILABLE' && <>
          <Callout tone="success" icon="check">Kho xác nhận đủ hàng và đã giữ số lượng cần thiết. Xem lại tình trạng ngựa rồi tự xác nhận — không cần Quản lý CLB duyệt.</Callout>
          {btn('ht-btn--primary', 'check', 'Xác nhận phác đồ', () => onAction('confirm'))}
        </>}

        {p.state === 'READY_FOR_DISPENSING' && <Callout tone="success" icon="box">Đã xác nhận. Quản lý kho chuẩn bị và cấp phát theo phác đồ này; trạng thái chuyển “Đang điều trị” khi cấp xong.</Callout>}

        {p.state === 'IN_TREATMENT' && <>
          {btn('ht-btn--secondary', 'pulse', 'Ghi tiến triển', () => onAction('progress'))}
          {btn('ht-btn--primary', 'check', 'Kết thúc điều trị', () => onAction('complete'))}
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
