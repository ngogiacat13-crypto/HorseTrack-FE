import React from 'react';
import PropTypes from 'prop-types';
import { HEALTH_LABEL, Horse, PlanPhase, Reading } from '../../api/trainerApi';
import { Badge, Callout, Loading } from '../ui/Ht';
import { Icon } from '../ui/Icon';

/* Building blocks shared by the HeadTrainer pages. */

/** Health + lock + pending case + form badges for one horse. */
export const HorseBadges: React.FC<{ horse: Horse; compact?: boolean }> = ({ horse, compact }) => {
  const [label, tone] = HEALTH_LABEL[horse.health];
  return (
    <span className="ht-horse-card__badges">
      <Badge tone={tone}>{label}</Badge>
      {horse.trainingLocked && <Badge tone="danger" plain style={{ letterSpacing: '.06em' }}><Icon name="lock" size={12} />&nbsp;KHÓA TẬP</Badge>}
      {!compact && horse.pendingCase && <Badge tone="info" plain>Chờ khám #{horse.pendingCase}</Badge>}
      {!compact && horse.form === 'GOOD' && <Badge tone="brand" plain>Form tốt</Badge>}
    </span>
  );
};
// PropTypes (Slot 13) cannot express the TS Horse type exactly, so the shape is checked at runtime only.
Object.assign(HorseBadges, {
  propTypes: {
    horse: PropTypes.shape({ health: PropTypes.string.isRequired, trainingLocked: PropTypes.bool.isRequired }).isRequired,
    compact: PropTypes.bool,
  },
});

/** Phase progress: done phases, current phase, upcoming phases. */
export const PhaseBar: React.FC<{ phases: PlanPhase[]; current: number }> = ({ phases, current }) => (
  <div className="ht-phase-bar" aria-label={`Giai đoạn ${current}/${phases.length}`}>
    {phases.map((p) => (
      <span key={p.no} data-state={p.no < current ? 'done' : p.no === current ? 'current' : undefined} title={`GĐ ${p.no} · ${p.name}`} />
    ))}
  </div>
);
PhaseBar.propTypes = { phases: PropTypes.array.isRequired, current: PropTypes.number.isRequired };

/** Loading / error wrapper for useFetch results. */
export const LoadState: React.FC<{ loading: boolean; error: string | null; onRetry: () => void }> = ({ loading, error, onRetry }) => (
  <div className="ht ht-page">
    {error ? (
      <Callout tone="danger" title="Không tải được dữ liệu" style={{ maxWidth: 640 }}>
        {error}
        <br />
        <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" style={{ marginTop: 10 }} onClick={onRetry}>Thử lại</button>
      </Callout>
    ) : loading ? <Loading /> : null}
  </div>
);
LoadState.propTypes = { loading: PropTypes.bool.isRequired, error: PropTypes.string, onRetry: PropTypes.func.isRequired };

/** Heart-rate line chart (SVG): readings, recovery readings (dashed) and the threshold line. */
export const HrChart: React.FC<{ readings: Reading[]; recovery?: Reading[]; limit: number }> = ({ readings, recovery = [], limit }) => {
  const all = [...readings, ...recovery];
  const W = 640, H = 220, L = 40, R = 16, T = 12, B = 28;
  const lo = 100, hi = Math.max(210, Math.ceil(Math.max(...all.map((r) => r.hr), limit) / 10) * 10 + 10);
  const x = (i: number) => L + (i * (W - L - R)) / Math.max(all.length - 1, 1);
  const y = (v: number) => T + ((hi - v) * (H - T - B)) / (hi - lo);
  const pts = readings.map((r, i) => `${x(i)},${y(r.hr)}`).join(' ');
  const recPts = recovery.length ? [readings.length - 1, ...recovery.map((_, i) => readings.length + i)].map((i) => `${x(i)},${y(all[i].hr)}`).join(' ') : '';
  const ticks = [];
  for (let v = lo; v <= hi; v += 20) ticks.push(v);
  const label = `Nhịp tim: ${readings.map((r) => `${r.t} ${r.hr}`).join(', ')}${recovery.length ? `; hồi phục: ${recovery.map((r) => `${r.t} ${r.hr}`).join(', ')}` : ''}; ngưỡng ${limit} bpm`;
  return (
    <svg className="ht-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {ticks.map((v) => (
        <g key={v}>
          <line className="grid" x1={L} x2={W - R} y1={y(v)} y2={y(v)} />
          <text className="axis" x={L - 8} y={y(v) + 4} textAnchor="end">{v}</text>
        </g>
      ))}
      {all.map((r, i) => <text key={r.t + i} className="axis" x={x(i)} y={H - 8} textAnchor="middle">{r.t}</text>)}
      <polygon className="area" points={`${x(0)},${y(lo)} ${pts} ${x(readings.length - 1)},${y(lo)}`} />
      <line className="limit" x1={L} x2={W - R} y1={y(limit)} y2={y(limit)} />
      <polyline className="line" points={pts} />
      {readings.map((r, i) => <circle key={r.t} className="dot" cx={x(i)} cy={y(r.hr)} r={i === readings.length - 1 ? 6 : 3.5} />)}
      {recPts && <polyline className="rec" points={recPts} />}
      {recovery.map((r, i) => <circle key={r.t} className="rec-dot" cx={x(readings.length + i)} cy={y(r.hr)} r={4} />)}
    </svg>
  );
};
HrChart.propTypes = { readings: PropTypes.array.isRequired, recovery: PropTypes.array, limit: PropTypes.number.isRequired };
