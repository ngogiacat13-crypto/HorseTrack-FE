import React from 'react';
import { Link } from 'react-router-dom';
import { Horse, horseInitials, TrainingPlan, TrainingSession } from '../../../api/trainerApi';
import { Badge, Callout, Panel } from '../../../components/ui/Ht';
import { HorseBadges } from '../../../components/trainer/TrainerParts';

/** The decision already taken on this session (read-only). */
export const DecisionRecord: React.FC<{ decision: NonNullable<TrainingSession['decision']> }> = ({ decision: d }) => (
  <Panel title="Quyết định đã ghi nhận" right={<Badge tone={d.type === 'STOP_VET' ? 'danger' : 'info'}>{d.type === 'STOP_VET' ? 'Dừng & gửi BS' : 'Điều chỉnh & tiếp tục'}</Badge>}>
    <div className="ht-panel__body">
      <dl className="ht-kv">
        <dt>Người quyết định</dt><dd>{d.by} · <span className="ht-mono">{d.at}</span></dd>
        {d.caseId && <><dt>Ca khám</dt><dd className="ht-mono">#{d.caseId} · đã gửi BS</dd></>}
        {d.adjustment && <><dt>Điều chỉnh</dt><dd>{d.adjustment.intensity} · {d.adjustment.distanceM} m · ngưỡng {d.adjustment.hrLimit} bpm</dd></>}
        <dt>Ghi chú</dt><dd>{d.note}</dd>
      </dl>
    </div>
  </Panel>
);

/** Horse card, alerts sent, and the demo-threshold note. */
export const SessionSide: React.FC<{ session: TrainingSession; horse: Horse; plan: TrainingPlan; previousMax: number | null }> = ({ session: s, horse, plan, previousMax }) => (
  <>
    <Panel as="h3">
      <div className="ht-panel__body" style={{ paddingTop: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <i className="ht-avatar ht-avatar--xl">{horseInitials(horse.name)}</i>
          <div><Link className="strong" style={{ fontWeight: 600 }} to={`/trainer/horses/${horse.id}`}>{horse.name}</Link><div style={{ fontSize: 13, color: 'var(--muted)' }}>{horse.breed} · {horse.sex} {horse.age} tuổi</div></div>
        </div>
        <HorseBadges horse={horse} />
        <hr className="ht-divider" />
        <dl className="ht-kv">
          <dt>Chủ ngựa</dt><dd>{horse.owner}</dd>
          <dt>Giáo án</dt><dd>{plan.name} · P{s.phaseNo} <span className="ht-mono" style={{ color: 'var(--muted)' }}>{plan.id}</span></dd>
          <dt>Phiên trước</dt><dd className="ht-mono">{previousMax ? `Max ${previousMax} bpm` : '—'}</dd>
        </dl>
      </div>
    </Panel>

    {s.alerts && (
      <Panel as="h3" title="Cảnh báo đã gửi">
        <ul className="ht-list">
          {s.alerts.map((al) => (
            <li key={al.to} className="ht-list-row">
              <div className="r1"><span className="r2">{al.to}</span>{al.seen ? <Badge tone="success" plain>Đã xem</Badge> : <span className="ht-mono" style={{ fontSize: 12 }}>{al.at}</span>}</div>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{al.role} · {al.channel} · <span className="ht-mono">{al.at}</span></span>
            </li>
          ))}
        </ul>
      </Panel>
    )}

    <Callout tone="demo" title="Ngưỡng an toàn · DEMO ONLY">
      Giá trị {s.thresholds.hr} bpm / {s.thresholds.speed} km/h chỉ để trình diễn. Ngưỡng sản xuất cần được Bác sĩ thú y xác nhận.
    </Callout>
  </>
);
