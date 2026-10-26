import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PLAN_LABEL, PlanStatus, phaseHr, phaseLoad, trainerApi, type TrainingPlan } from '../../../api/trainerApi';
import { useActor } from '../../../auth/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { Icon } from '../../../components/ui/Icon';
import { Badge, PageHeader, Panel, StatCard, Tabs } from '../../../components/ui/Ht';
import { LoadState, PhaseBar } from '../../../components/trainer/TrainerParts';
import { CancelPlanDialog, ResumePlanDialog } from './PlanActionDialogs';

type Filter = 'planned' | 'running' | 'paused' | 'history';
const MATCH: Record<Filter, PlanStatus[]> = { planned: ['PLANNED'], running: ['ACTIVE'], paused: ['PAUSED'], history: ['COMPLETED', 'REPLACED', 'CANCELLED'] };

export const TrainerPlans: React.FC = () => {
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => trainerApi.getPlans(actor), [actor]);
  const [filter, setFilter] = useState<Filter>('running');
  const [dialog, setDialog] = useState<{ kind: 'cancel' | 'resume'; plan: TrainingPlan } | null>(null);
  const plans = useMemo(() => data?.plans ?? [], [data]);
  const list = useMemo(() => plans.filter((p) => MATCH[filter].includes(p.status)), [plans, filter]);

  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const withPlan = new Set(plans.filter((p) => p.status === 'PLANNED' || p.status === 'ACTIVE' || p.status === 'PAUSED').map((p) => p.horseId));
  const pool = data.availableIds ? data.horses.filter((h) => data.availableIds!.includes(h.id)) : data.horses;
  const noPlan = pool.filter((h) => !withPlan.has(h.id));
  const count = (f: Filter) => plans.filter((p) => MATCH[f].includes(p.status)).length;

  return (
    <div className="ht ht-page">
      <PageHeader
        title="Giáo án huấn luyện"
        sub="Mỗi giáo án là một giai đoạn: cường độ, quãng đường, số buổi và ngưỡng nhịp tim."
        actions={<Link className="ht-btn ht-btn--primary" to="/trainer/plans/new"><Icon name="calendar" />Tạo giáo án</Link>}
      />

      <div className="ht-stats">
        <StatCard icon="pulse" tone="brand" value={count('running')} label="Giáo án đang chạy" />
        <StatCard icon="alarm" tone="warning" value={count('paused')} label="Đang tạm dừng" meta="khóa y tế / chờ BS" />
        <StatCard icon="calendar" tone="info" value={noPlan.length} label="Ngựa chưa có giáo án" />
      </div>

      <Tabs<Filter> value={filter} onChange={setFilter} items={[
        { value: 'planned', label: 'Chưa bắt đầu', count: count('planned') },
        { value: 'running', label: 'Đang chạy', count: count('running') },
        { value: 'paused', label: 'Tạm dừng', count: count('paused') },
        { value: 'history', label: 'Lịch sử', count: count('history') },
      ]} />

      <div className="ht-cols">
        <div>
          <Panel>
            <table className="ht-table">
              <thead><tr><th>Mã</th><th>Ngựa</th><th>Tên giáo án</th><th>Tiến độ</th><th>Giai đoạn hiện tại</th><th>Trạng thái</th><th aria-label="Thao tác" /></tr></thead>
              <tbody>
                {list.map((p) => {
                  const ph = p.phases.find((x) => x.no === p.currentPhase);
                  return (
                    <tr key={p.id}>
                      <td className="id">{p.id}</td>
                      <td><Link className="strong" to={`/trainer/horses/${p.horseId}`}>{p.horseName}</Link><span className="sub">từ <span className="ht-mono">{p.startDate}</span></span></td>
                      <td><span className="strong">{p.name}</span><span className="sub">{p.type} · {p.goal}</span></td>
                      <td style={{ minWidth: 140 }}><PhaseBar phases={p.phases} current={p.currentPhase} /><span className="sub">GĐ {p.currentPhase}/{p.phases.length} · tuần {p.week}</span></td>
                      <td>{ph ? <>{ph.name}<span className="sub">{phaseLoad(ph)} · {phaseHr(ph)}</span></> : '—'}</td>
                      <td><Badge tone={PLAN_LABEL[p.status][1]}>{PLAN_LABEL[p.status][0]}</Badge>{p.pausedReason && <span className="sub" style={{ maxWidth: 220 }}>{p.pausedReason}</span>}</td>
                      <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                        {p.status === 'PAUSED' && !/ca khám|khóa|bác sĩ|chờ bs|ca c-/i.test(p.pausedReason ?? '') && (
                          <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" data-testid={`resume-plan-${p.id}`} onClick={() => setDialog({ kind: 'resume', plan: p })}>
                            <Icon name="refresh" size={14} />Chạy lại
                          </button>
                        )}
                        {p.status === 'PAUSED' && /ca khám|khóa|bác sĩ|chờ bs|ca c-/i.test(p.pausedReason ?? '') && (
                          <span className="sub" data-testid={`plan-wait-vet-${p.id}`}>Chờ bác sĩ đóng ca</span>
                        )}
                        {p.status === 'PLANNED' && (
                          <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" data-testid={`cancel-plan-${p.id}`} onClick={() => setDialog({ kind: 'cancel', plan: p })} style={{ color: 'var(--danger-ink)' }}>
                            <Icon name="ban" size={14} />Hủy
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {list.length === 0 && <div className="ht-empty">Không có giáo án trong nhóm này.</div>}
          </Panel>
        </div>
        <div>
          <Panel as="h3" title="Ngựa chưa có giáo án">
            <ul className="ht-list">
              {noPlan.map((h) => (
                <li key={h.id} className={`ht-list-row${h.trainingLocked ? ' ht-list-row--danger' : ''}`}>
                  <div className="r1">
                    <span className="r2">{h.name}</span>
                    {h.trainingLocked
                      ? <Badge tone="danger" plain>Khóa tập</Badge>
                      : <Link className="ht-more" to={`/trainer/plans/new?horse=${h.id}`}>Lập giáo án <Icon name="arrow" /></Link>}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{h.breed} · {h.sex} {h.age} tuổi · chủ {h.owner}</span>
                </li>
              ))}
              {noPlan.length === 0 && <li className="ht-empty" style={{ padding: 16 }}>Ngựa nào cũng đã có giáo án.</li>}
            </ul>
          </Panel>
        </div>
      </div>

      {dialog?.kind === 'cancel' && <CancelPlanDialog plan={dialog.plan} onClose={() => setDialog(null)} onDone={() => { setDialog(null); reload(); }} />}
      {dialog?.kind === 'resume' && <ResumePlanDialog plan={dialog.plan} onClose={() => setDialog(null)} onDone={() => { setDialog(null); reload(); }} />}
    </div>
  );
};
