import React from 'react';
import type { Horse } from '../../../api/trainerApi';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Busy, Callout, Panel } from '../../../components/ui/Ht';
import type { PhaseDraft, PlanType } from './templates';

/** Totals + submit button. The submit button belongs to the page form (type="submit"). */
export const PlanSummary: React.FC<{ horse?: Horse; type: PlanType; startDate: string; phases: PhaseDraft[]; busy: boolean; disabled: boolean; block: string | null }> = ({ horse, type, startDate, phases, busy, disabled, block }) => {
  const totalWeeks = phases.reduce((s, p) => s + (p.weeks || 0), 0);
  const totalSessions = phases.reduce((s, p) => s + (p.weeks || 0) * (p.sessionsPerWeek || 0), 0);
  return (
    <>
      <Panel as="h3" title="Tóm tắt giáo án">
        <div className="ht-panel__body">
          <dl className="ht-kv">
            <dt>Ngựa</dt><dd>{horse ? horse.name : '—'}</dd>
            <dt>Loại</dt><dd>{type}</dd>
            <dt>Bắt đầu</dt><dd className="ht-mono">{startDate.split('-').reverse().join('/')}</dd>
            <dt>Số giai đoạn</dt><dd>{phases.length}</dd>
            <dt>Tổng thời gian</dt><dd>{totalWeeks} tuần</dd>
            <dt>Tổng số buổi</dt><dd>{totalSessions} buổi</dd>
          </dl>
          <hr className="ht-divider" />
          {phases.map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13, padding: '4px 0' }}>
              <span>GĐ {i + 1} · {p.name || <i>chưa đặt tên</i>}</span>
              <Badge tone={p.intensity === 'Cao' ? 'danger' : p.intensity === 'Vừa' ? 'warning' : 'success'} plain>{p.intensity}</Badge>
            </div>
          ))}
          <button type="submit" className="ht-btn ht-btn--primary ht-btn--block" style={{ marginTop: 16 }} disabled={busy || disabled} aria-busy={busy || undefined}>
            <Busy busy={busy} label="Đang lưu…"><Icon name="check" />Lưu giáo án</Busy>
          </button>
          {block && <p className="ht-error" style={{ marginTop: 10 }}><Icon name="lock" /><span>{block}</span></p>}
        </div>
      </Panel>
      <Callout tone="info">Sau khi lưu, vào <b>Lịch tập</b> để phân công phiên cho Mã phu theo giai đoạn hiện tại.</Callout>
    </>
  );
};
