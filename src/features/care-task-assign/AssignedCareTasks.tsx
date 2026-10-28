import React, { useState } from 'react';
import { USE_BACKEND } from '../../api/beClient';
import { useFetch } from '../../hooks/useFetch';
import { Badge, Panel } from '../../components/ui/Ht';
import { TASK_LABEL, careTaskApi, todayIso, type AssignedStatus } from './careTaskApi';

const STATUS: Record<AssignedStatus, [string, 'neutral' | 'info' | 'success' | 'danger']> = {
  TODO: ['Chưa làm', 'neutral'], IN_PROGRESS: ['Đang làm', 'info'], DONE: ['Hoàn thành', 'success'], SKIPPED: ['Bỏ qua', 'danger'],
};
const hhmm = (t?: string | null) => (t ? (t.includes('T') ? t.slice(11, 16) : t.slice(0, 5)) : '—');

export const AssignedCareTasks: React.FC<{ horseId?: string; refreshKey?: number }> = ({ horseId, refreshKey = 0 }) => {
  const [date, setDate] = useState(todayIso);
  const [status, setStatus] = useState('');
  const { data, loading, error } = useFetch(() => (USE_BACKEND ? careTaskApi.assigned(date, status) : Promise.resolve([])), [date, status, refreshKey]);
  if (!USE_BACKEND) return null;
  const rows = (data ?? []).filter((t) => !horseId || String(t.horseId) === horseId);

  return (
    <Panel title="Việc chăm sóc đã giao" sub={horseId ? 'Việc đã giao cho Mã phu với ngựa này' : 'Việc Mã phu nhận theo ngày'}
      right={
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="date" className="ht-input" data-testid="assigned-tasks-date" aria-label="Ngày" style={{ height: 36, width: 160 }} value={date} onChange={(e) => setDate(e.target.value || todayIso())} />
          <select className="ht-select" data-testid="assigned-tasks-status" aria-label="Trạng thái" style={{ height: 36 }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Mọi trạng thái</option>
            {(Object.keys(STATUS) as AssignedStatus[]).map((k) => <option key={k} value={k}>{STATUS[k][0]}</option>)}
          </select>
        </div>
      }>
      {error && <div className="ht-empty" style={{ color: 'var(--danger-ink)' }}>{error}</div>}
      {!error && (loading && !data ? <div className="ht-empty">Đang tải…</div> : rows.length === 0 ? <div className="ht-empty" data-testid="assigned-tasks-empty">Không có việc nào trong ngày này.</div> : (
        <table className="ht-table" data-testid="assigned-tasks-table">
          <thead><tr><th>Giờ</th><th>Công việc</th>{!horseId && <th>Ngựa</th>}<th>Mã phu</th><th>Trạng thái</th><th style={{ textAlign: 'right' }}>Hoàn thành lúc</th></tr></thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.taskId} className={t.overdue && t.status !== 'DONE' ? 'is-danger' : undefined}>
                <td className="mono">{hhmm(t.scheduledTime)}</td>
                <td><span className="strong">{t.title || TASK_LABEL[t.taskType] || t.taskType}</span>{t.instructions && <span className="sub">{t.instructions}</span>}</td>
                {!horseId && <td>{t.horseName ?? '—'}{t.stallCode && <span className="sub mono">{t.stallCode}</span>}</td>}
                <td>{t.groomName ?? '—'}</td>
                <td><Badge tone={STATUS[t.status]?.[1] ?? 'neutral'}>{STATUS[t.status]?.[0] ?? t.status}</Badge>{t.overdue && t.status !== 'DONE' && <span className="sub" style={{ color: 'var(--danger-ink)' }}>Quá hạn</span>}</td>
                <td className="mono" style={{ textAlign: 'right' }}>{hhmm(t.completedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}
    </Panel>
  );
};
