import React from 'react';
import { Link } from 'react-router-dom';
import { SESSION_LABEL, TrainingSession } from '../../../api/trainerApi';
import { Badge } from '../../../components/ui/Ht';

export const SessionTable: React.FC<{ sessions: TrainingSession[] }> = ({ sessions }) => (
  <>
    <table className="ht-table">
      <thead><tr><th>Phiên</th><th>Ngày giờ</th><th>Nội dung</th><th>Max nhịp tim</th><th>Trạng thái</th><th>Phong độ</th></tr></thead>
      <tbody>
        {sessions.map((s) => {
          const max = s.readings.length ? Math.max(...s.readings.map((r) => r.hr)) : null;
          return (
            <tr key={s.id}>
              <td className="id"><Link to={`/trainer/sessions/${s.id}`}>{s.id}</Link></td>
              <td className="mono">{s.date.slice(0, 5)} {s.time}</td>
              <td>{s.label}<span className="sub">{s.track}</span></td>
              <td className="mono" style={max && max >= s.thresholds.hr ? { color: 'var(--danger-ink)', fontWeight: 600 } : undefined}>{max ? `${max} bpm` : '—'}</td>
              <td><Badge tone={SESSION_LABEL[s.status][1]}>{SESSION_LABEL[s.status][0]}</Badge></td>
              <td>{s.evaluation ? <span className="ht-score-chip">{s.evaluation.score}/10</span> : '—'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
    {sessions.length === 0 && <div className="ht-empty">Chưa có phiên tập.</div>}
  </>
);
