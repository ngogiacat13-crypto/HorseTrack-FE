import React from 'react';
import { Link } from 'react-router-dom';
import { HEALTH_LABEL, TrainingSession } from '../../../api/trainerApi';
import { CASE_LABEL, Protocol, PROTOCOL_LABEL, SEVERITY_LABEL, SOURCE_LABEL, VetCase, VetHorse } from '../../../api/vetApi';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Callout, Panel, useToast } from '../../../components/ui/Ht';
import { SeverityTag } from '../../../components/vet/VetParts';

interface Props {
  vetCase: VetCase; horse: VetHorse; session?: TrainingSession; protocol?: Protocol;
  onExam: () => void; onClose: () => void; onLock: () => void;
}

export const CaseDetail: React.FC<Props> = ({ vetCase: c, horse, session, protocol, onExam, onClose, onLock }) => {
  const toast = useToast();
  const maxHr = session?.readings.length ? Math.max(...session.readings.map((r) => r.hr)) : null;
  const maxSpeed = session?.readings.length ? Math.max(...session.readings.map((r) => r.speed)) : null;

  return (
    <Panel as="h3" title={<span className="ht-mono" style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400 }}>Ca khám #{c.id}</span>}
      right={<Badge tone={CASE_LABEL[c.status][1]}>{CASE_LABEL[c.status][0]}</Badge>}>
      <div className="ht-panel__body" style={{ display: 'grid', gap: 14 }}>
        <div>
          <Link to={`/vet/horses/${horse.id}`} style={{ font: '600 20px/28px var(--font-sans)', color: 'var(--foreground)' }}>{horse.name}</Link>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{horse.breed} · {horse.sex} {horse.age} tuổi · Chủ: {horse.owner}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <Badge tone={HEALTH_LABEL[horse.health][1]}>{HEALTH_LABEL[horse.health][0]}</Badge>
            {horse.trainingLocked ? <Badge tone="danger" plain><Icon name="lock" size={12} />&nbsp;KHÓA TẬP</Badge> : <Badge tone="neutral" plain>Chưa khóa tập</Badge>}
          </div>
        </div>
        <dl className="ht-kv" style={{ gridTemplateColumns: '90px 1fr' }}>
          <dt>Nguồn</dt><dd>{SOURCE_LABEL[c.source]}{c.sessionId && <> · phiên <span className="ht-mono">#{c.sessionId}</span></>}</dd>
          <dt>Mức độ</dt><dd><SeverityTag severity={c.severity} /></dd>
          <dt>Người gửi</dt><dd>{c.sender} · <span className="ht-mono">{c.at}</span></dd>
        </dl>
        <div className="ht-quote"><span className="ht-overline">Mô tả</span>{c.note}</div>
        {session && (
          <div className="ht-mini-metrics">
            <div className={maxHr && maxHr > session.thresholds.hr ? 'is-danger' : undefined}>Nhịp tim max<b>{maxHr ?? '—'}</b>ngưỡng {session.thresholds.hr}</div>
            <div>Tốc độ max<b>{maxSpeed ?? '—'} <small style={{ fontSize: 12, color: 'var(--muted)' }}>km/h</small></b>ngưỡng {session.thresholds.speed}</div>
          </div>
        )}
        {c.exam && (
          <div className="ht-quote">
            <span className="ht-overline">Kết quả khám · BS {c.exam.by} · {c.exam.at}</span>
            <b>{c.exam.diagnosis}</b> ({SEVERITY_LABEL[c.exam.severity][0]})<br />{c.exam.symptoms}<br /><i>Hướng xử lý:</i> {c.exam.plan}
          </div>
        )}
        {protocol && <Link className="ht-more" to={`/vet/protocols/${protocol.id}`}>Phác đồ <span className="ht-mono">{protocol.id}</span> · {PROTOCOL_LABEL[protocol.state][0]} <Icon name="arrow" /></Link>}
        {c.outcome && <Callout tone="success" title="Kết luận">{c.outcome}</Callout>}

        {c.status !== 'CLOSED' && (
          <div className="ht-actions-grid">
            {c.status === 'NEW'
              ? <button type="button" className="ht-btn ht-btn--secondary" onClick={onExam}><Icon name="clip" />Ghi nhận khám</button>
              : <button type="button" className="ht-btn ht-btn--secondary" onClick={onClose}><Icon name="check" />Đóng ca</button>}
            <button type="button" className="ht-btn ht-btn--danger" disabled={horse.trainingLocked} onClick={onLock}
              title={horse.trainingLocked ? 'Ngựa đã bị khóa huấn luyện' : undefined}><Icon name="lock" />{horse.trainingLocked ? 'Đã khóa' : 'Khóa huấn luyện'}</button>
            {protocol && protocol.state !== 'CANCELLED'
              ? <button data-testid="create-protocol-btn" type="button" className="ht-btn ht-btn--primary ht-btn--block" disabled title={`Ca này đã có phác đồ ${protocol.id}; chỉ tạo lại sau khi hủy phác đồ của ca.`}>{`Đã có phác đồ ${protocol.id}`}</button>
              : <Link className="ht-btn ht-btn--primary ht-btn--block" to={`/vet/protocols/new?horse=${horse.id}&case=${c.id}`} aria-disabled={!c.exam}
                  data-testid="create-protocol-btn"
                  onClick={(e) => { if (!c.exam) { e.preventDefault(); toast('Ghi nhận khám trước khi lập phác đồ.'); } }}><Icon name="file" />Tạo phác đồ điều trị</Link>}
          </div>
        )}
        <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}><Icon name="info" size={12} /> Khóa huấn luyện chặn mọi lịch tập của {horse.name} và tạm dừng giáo án đang chạy (BR_01).</p>
      </div>
    </Panel>
  );
};
