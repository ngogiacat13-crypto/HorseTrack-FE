import React from 'react';
import { TrainingSession } from '../../../api/trainerApi';
import { Icon } from '../../../components/ui/Icon';
import { Panel } from '../../../components/ui/Ht';
import { HrChart } from '../../../components/trainer/TrainerParts';

/** One read-only gauge: peak value against its threshold. */
const Gauge: React.FC<{ label: string; value: number | string; limit: number; pct: number; note: string }> = ({ label, value, limit, pct, note }) => (
  <div className={`ht-metric${pct >= 100 ? ' ht-metric--over' : ''}`}>
    <div className="ht-metric__top"><span>{label}</span><span>Ngưỡng <b className="ht-mono">{limit}</b></span></div>
    <div className="ht-metric__value">{value}<small>{note}</small></div>
    <div className="ht-metric__bar"><i style={{ width: `${Math.min(pct, 100)}%` }} /></div>
    <span className="ht-metric__pct">{pct}% ngưỡng</span>
  </div>
);

/* 2.2 — readings at the moment the session stopped + heart-rate chart with recovery. */
export const MetricsPanel: React.FC<{ session: TrainingSession }> = ({ session: s }) => {
  const peak = s.readings.length ? s.readings.reduce((m, r) => (r.hr > m.hr ? r : m), s.readings[0]) : null;
  const peakSpeed = s.readings.length ? Math.max(...s.readings.map((r) => r.speed)) : 0;
  return (
    <Panel title="Chỉ số tại thời điểm dừng" right={<span style={{ fontSize: 12, color: 'var(--muted)', display: 'inline-flex', gap: 6, alignItems: 'center' }}><Icon name="lock" size={12} />Chỉ đọc</span>}>
      <div className="ht-panel__body" style={{ display: 'grid', gap: 20 }}>
        <div className="ht-metrics">
          <Gauge label="Nhịp tim (bpm)" value={peak?.hr ?? '—'} limit={s.thresholds.hr} pct={peak ? Math.round((peak.hr / s.thresholds.hr) * 100) : 0} note={`max · lúc ${peak?.t ?? '—'}`} />
          <Gauge label="Tốc độ (km/h)" value={peakSpeed || '—'} limit={s.thresholds.speed} pct={Math.round((peakSpeed / s.thresholds.speed) * 100)} note="max" />
        </div>
        {s.readings.length > 0 ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 12, flexWrap: 'wrap' }}>
              <b style={{ fontSize: 14 }}>Diễn biến nhịp tim</b>
              <span className="ht-chart-legend">
                <span><i style={{ borderColor: 'var(--danger)' }} />Trong phiên</span>
                {s.recovery?.length ? <span><i style={{ borderColor: 'var(--primary-light)', borderTopStyle: 'dashed' }} />Hồi phục</span> : null}
                <span><i style={{ borderColor: 'var(--warning)', borderTopStyle: 'dashed' }} />Ngưỡng</span>
              </span>
            </div>
            <HrChart readings={s.readings} recovery={s.recovery} limit={s.thresholds.hr} />
          </div>
        ) : <p style={{ margin: 0, color: 'var(--muted)' }}>Phiên chưa có số liệu đo.</p>}
      </div>
    </Panel>
  );
};
