import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SESSION_LABEL, TrainingSession, Vaccination } from '../../../api/trainerApi';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Panel, Timeline } from '../../../components/ui/Ht';
import { TODAY, WEEK } from './constants';

export const PausedBanners: React.FC<{ sessions: TrainingSession[] }> = ({ sessions }) => (
  <>
    {sessions.map((s) => (
      <div key={s.id} className="ht-banner" role="alert">
        <Icon name="alarm" />
        <div><b>{s.id} · {s.horseName} tạm dừng lúc <span className="ht-mono">{s.pausedAt}</span> — chờ bạn quyết định.</b><p>{s.pausedReason}</p></div>
        <Link className="ht-more" to={`/trainer/sessions/${s.id}`}>Xử lý ngay <Icon name="arrow" /></Link>
      </div>
    ))}
  </>
);

export const WeekStrip: React.FC<{ sessions: TrainingSession[]; day: string; onDay: (d: string) => void }> = ({ sessions, day, onDay }) => (
  <div className="ht-week" role="group" aria-label="Chọn ngày">
    {WEEK.map(([dow, date]) => {
      const list = sessions.filter((s) => s.date === date);
      const alert = list.some((s) => s.status === 'PAUSED_PENDING_TRAINER');
      return (
        <button key={date} type="button" className="ht-day" aria-pressed={day === date} onClick={() => onDay(date)}>
          <small>{dow}{date === TODAY ? ' · hôm nay' : ''}</small>
          <b>{date.slice(0, 5)}</b>
          <span className={alert ? 'ht-day__alert' : undefined}>{list.length ? `${list.length} phiên${alert ? ' · 1 chờ xử lý' : ''}` : 'Trống'}</span>
        </button>
      );
    })}
  </div>
);

const STOPPABLE = ['SCHEDULED', 'IN_PROGRESS', 'RESUMED'];

export const DaySessions: React.FC<{ day: string; sessions: TrainingSession[]; onEvaluate: (s: TrainingSession) => void; onStop: (s: TrainingSession) => void }> = ({ day, sessions, onEvaluate, onStop }) => {
  const navigate = useNavigate();
  const action = (s: TrainingSession) => {
    if (s.status === 'PAUSED_PENDING_TRAINER') return <Link className="ht-btn ht-btn--danger ht-btn--sm" to={`/trainer/sessions/${s.id}`}>Xử lý</Link>;
    if (s.status === 'COMPLETED' && !s.evaluation) return <button type="button" className="ht-btn ht-btn--primary ht-btn--sm" onClick={() => onEvaluate(s)}>Đánh giá</button>;
    if (s.evaluation) return <span className="ht-score-chip" title={s.evaluation.comment}>{s.evaluation.score}/10</span>;
    if (STOPPABLE.includes(s.status)) return <button type="button" className="ht-btn ht-btn--danger ht-btn--sm" onClick={() => onStop(s)}><Icon name="alarm" />Dừng &amp; gửi bác sĩ</button>;
    if (s.status === 'STOPPED' || s.status === 'WAITING_VET') return <Link className="ht-more" to={`/trainer/sessions/${s.id}`}>Xem <Icon name="arrow" /></Link>;
    return <span style={{ color: 'var(--muted)', fontSize: 13 }}>—</span>;
  };
  return (
    <Panel title={`Phiên tập ngày ${day}`} sub={`${sessions.length} phiên`}>
      <table className="ht-table">
        <thead><tr><th>Giờ</th><th>Phiên · ngựa</th><th>Giáo án</th><th>Mã phu</th><th>Trạng thái</th><th style={{ textAlign: 'right' }}>Phong độ / thao tác</th></tr></thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id} className={s.status === 'PAUSED_PENDING_TRAINER' || s.status === 'STOPPED' || s.status === 'WAITING_VET' ? 'is-danger' : undefined}
              data-href tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate(`/trainer/sessions/${s.id}`)} onDoubleClick={() => navigate(`/trainer/sessions/${s.id}`)}>
              <td className="mono">{s.time}</td>
              <td><span className="strong">{s.horseName}</span><span className="sub mono">{s.id}</span></td>
              <td>{s.label}<span className="sub">{s.track}</span></td>
              <td>{s.groom}</td>
              <td><Badge tone={SESSION_LABEL[s.status][1]}>{SESSION_LABEL[s.status][0]}</Badge></td>
              <td style={{ textAlign: 'right' }}>{action(s)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {sessions.length === 0 && <div className="ht-empty">Chưa có phiên tập trong ngày này.</div>}
    </Panel>
  );
};

export const EvaluateQueue: React.FC<{ sessions: TrainingSession[]; onEvaluate: (s: TrainingSession) => void }> = ({ sessions, onEvaluate }) => (
  <Panel as="h3" title="Chờ đánh giá phong độ" right={<span className="ht-count" style={{ margin: 0 }}>{sessions.length}</span>}>
    <ul className="ht-list">
      {sessions.map((s) => (
        <li key={s.id} className="ht-list-row">
          <div className="r1"><span className="r2">{s.horseName} · <span className="ht-mono" style={{ fontWeight: 400 }}>{s.id}</span></span><button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" onClick={() => onEvaluate(s)}>Chấm điểm</button></div>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{s.label} · <span className="ht-mono">{s.date.slice(0, 5)} {s.time}</span> · {s.groom}</span>
        </li>
      ))}
      {sessions.length === 0 && <li className="ht-empty" style={{ padding: 16 }}>Đã chấm hết.</li>}
    </ul>
  </Panel>
);

export const VaccinesSoon: React.FC<{ vaccinations: Vaccination[] }> = ({ vaccinations }) => (
  <Panel as="h3" title="Lịch tiêm 7 ngày tới" right={<span className="ht-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>tránh xếp tập nặng</span>}>
    <div className="ht-panel__body">
      <Timeline items={vaccinations.map((v) => ({ tone: v.status === 'POSTPONED' ? 'warning' : 'info', what: <><b>{v.horse}</b> · {v.type}</>, when: v.due }))} />
    </div>
  </Panel>
);
