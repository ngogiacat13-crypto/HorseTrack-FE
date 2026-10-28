import React from 'react';
import { CareTask, lateBy } from '../../../api/groomApi';
import type { VetHorse } from '../../../api/vetApi';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Callout } from '../../../components/ui/Ht';
import { DEMO_NOW } from '../../../api/http';
import { taskState, toMin, type TaskState } from './taskState';

const CHIP: Record<TaskState, [string, 'danger' | 'warning' | 'neutral' | 'success' | 'info']> = { late: ['QUÁ HẠN', 'danger'], soon: ['SẮP HẠN', 'warning'], todo: ['CHỜ', 'neutral'], done: ['XONG', 'success'], upcoming: ['NGÀY SAU', 'info'] };

export const TaskCard: React.FC<{ task: CareTask; horse?: VetHorse; onDone: (t: CareTask) => void }> = ({ task: t, horse, onDone }) => {
  const state = taskState(t);
  const upcoming = state === 'upcoming';
  const late = lateBy(t);
  const start = toMin(t.time), end = toMin(t.sla), nowM = toMin(DEMO_NOW.time);
  const pct = Math.min(100, Math.max(0, ((nowM - start) / (end - start)) * 100));
  const diet = t.medicalDiet && horse?.medicalDiet
    ? `${horse.medicalDiet.noon || horse.medicalDiet.morning}${horse.medicalDiet.special ? ` · ${horse.medicalDiet.special}` : ''} (khẩu phần y tế)`
    : t.diet;
  return (
    <article className="ht-task" data-state={state} data-testid={`task-${t.id}`}>
      {upcoming
        ? <span className="ht-task__check" aria-hidden="true" style={{ opacity: 0.35, cursor: 'not-allowed' }} />
        : <button type="button" className="ht-task__check" role="checkbox" aria-checked={t.status === 'DONE'} aria-label={`Hoàn thành ${t.title} ${t.horse ?? ''}`} data-testid={`task-done-${t.id}`}
          onClick={() => t.status !== 'DONE' && onDone(t)}>{t.status === 'DONE' && <Icon name="check" size={14} />}</button>}
      <div>
        <h3 className="ht-task__title">{t.title} <span>— {t.horse ?? ''}{t.stall ? ` · ${t.stall}` : ''}</span></h3>
        <div className="ht-task__meta">
          <span><Icon name="calendar" size={13} /> <span className="ht-mono">{t.time}</span></span>
          {upcoming
            ? <span><Icon name="clock" size={13} /> Lịch ngày <span className="ht-mono">{t.date}</span> · chỉ xem trước, chưa hoàn thành được</span>
            : t.status === 'DONE'
            ? <span className={late ? 'is-late' : 'is-ok'}><Icon name="check" size={13} /> Hoàn thành lúc {t.doneAt}{late ? ` · trễ ${late} phút SLA` : ''}</span>
            : state === 'late' ? <span className="is-late"><Icon name="alarm" size={13} /> {late} phút quá hạn SLA ({t.sla})</span>
            : <span className={state === 'soon' ? 'is-soon' : undefined}><Icon name="clock" size={13} /> SLA {t.sla} · còn {end - nowM} phút</span>}
          {state === 'late' && <span><Icon name="check" size={13} /> Đã báo Quản lý CLB</span>}
        </div>
        {(diet || t.warning || t.instructions.length > 0 || t.note || state === 'soon') && (
          <div className="ht-task__body">
            {t.warning && <Callout tone="demo" icon="warn">{t.warning}</Callout>}
            {state === 'soon' && <div className="ht-sla" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>}
            {diet && <span><Icon name="heart" size={13} /> Khẩu phần: {diet}</span>}
            {t.status !== 'DONE' && t.instructions.map((x) => <span key={x} style={{ color: 'var(--muted)' }}>• {x}</span>)}
            {t.note && <span style={{ color: 'var(--muted)' }}><Icon name="file" size={13} /> Ghi chú: {t.note}</span>}
          </div>
        )}
      </div>
      <Badge tone={CHIP[state][1]}>{CHIP[state][0]}</Badge>
    </article>
  );
};
