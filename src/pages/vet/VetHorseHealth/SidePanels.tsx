import React from 'react';
import { Link } from 'react-router-dom';
import { HEALTH_LABEL } from '../../../api/trainerApi';
import { Protocol, VetHorse } from '../../../api/vetApi';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Panel, Timeline } from '../../../components/ui/Ht';
import { ProtocolBadge } from '../../../components/vet/VetParts';

const muted: React.CSSProperties = { margin: 0, fontSize: 13, color: 'var(--muted)' };

/** Health + training lock at a glance. */
export const StatusPanel: React.FC<{ horse: VetHorse; onEdit: () => void }> = ({ horse, onEdit }) => (
  <Panel as="h3" title="Trạng thái hiện tại" right={<button type="button" className="ht-more" onClick={onEdit}>Cập nhật <Icon name="arrow" size={14} /></button>}>
    <div className="ht-panel__body">
      <dl className="ht-kv" style={{ gridTemplateColumns: '100px 1fr' }}>
        <dt>Sức khỏe</dt><dd><Badge tone={HEALTH_LABEL[horse.health][1]}>{HEALTH_LABEL[horse.health][0]}</Badge></dd>
        <dt>Huấn luyện</dt><dd>{horse.trainingLocked ? <Badge tone="danger" plain><Icon name="lock" size={12} />&nbsp;KHÓA TẬP</Badge> : 'Được tập'}</dd>
        {horse.lock && <><dt>Lý do</dt><dd>{horse.lock.reason}</dd><dt>Khóa bởi</dt><dd>{horse.lock.by}</dd><dt>Ngày khóa</dt><dd className="ht-mono">{horse.lock.at}</dd></>}
      </dl>
    </div>
  </Panel>
);

/** The protocol in force for this horse, phase by phase. */
export const ActiveProtocolPanel: React.FC<{ protocol?: Protocol }> = ({ protocol }) => (
  <Panel as="h3" title="Phác đồ đang áp dụng" right={protocol && <span className="ht-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{protocol.id}</span>}>
    <div className="ht-panel__body" style={{ display: 'grid', gap: 8 }}>
      {protocol ? (
        <>
          <ProtocolBadge state={protocol.state} delayed={protocol.delayed} />
          {protocol.phases.map((ph) => (
            <div key={ph.no} className="ht-row-between" style={{ fontSize: 13, padding: '8px 10px', background: 'var(--bg)', borderRadius: 8 }}>
              <span><b>GĐ {ph.no}</b> · <span className="ht-mono">{ph.startDate.slice(0, 5)}</span> · {ph.name}</span><span style={{ color: 'var(--muted)' }}>{ph.days} ngày</span>
            </div>
          ))}
          <Link className="ht-more" to={`/vet/protocols/${protocol.id}`}>Xem phác đồ <Icon name="arrow" /></Link>
        </>
      ) : <p style={muted}>Không có phác đồ đang mở.</p>}
    </div>
  </Panel>
);

/** 1.4 — medical history timeline. */
export const HistoryPanel: React.FC<{ horse: VetHorse }> = ({ horse }) => (
  <Panel as="h3" title="Lịch sử y tế">
    <div className="ht-panel__body">
      {horse.medicalHistory.length ? <Timeline items={horse.medicalHistory.map((m) => ({ tone: m.tone, what: m.title, when: m.date }))} />
        : <p style={muted}>Chưa có ghi nhận.</p>}
    </div>
  </Panel>
);
