import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PLAN_LABEL, PlanStatus, trainerApi } from '../../api/trainerApi';
import { useActor } from '../../auth/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { Icon } from '../../components/ui/Icon';
import { Badge, PageHeader, Panel, StatCard, Tabs } from '../../components/ui/Ht';
import { LoadState, PhaseBar } from '../../components/trainer/TrainerParts';

type Filter = 'running' | 'paused' | 'history';
const MATCH: Record<Filter, PlanStatus[]> = { running: ['ACTIVE'], paused: ['PAUSED'], history: ['COMPLETED', 'REPLACED'] };

/* 1.2 Giáo án huấn luyện — danh sách */
export const TrainerPlans: React.FC = () => {
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => trainerApi.getPlans(actor), [actor]);
  const [filter, setFilter] = useState<Filter>('running');
  const plans = useMemo(() => data?.plans ?? [], [data]);
  const list = useMemo(() => plans.filter((p) => MATCH[filter].includes(p.status)), [plans, filter]);

  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const withPlan = new Set(plans.filter((p) => p.status === 'ACTIVE' || p.status === 'PAUSED').map((p) => p.horseId));
  const noPlan = data.horses.filter((h) => !withPlan.has(h.id));
  const count = (f: Filter) => plans.filter((p) => MATCH[f].includes(p.status)).length;

  return (
    <div className="ht ht-page">
      <PageHeader
        title="Giáo án huấn luyện"
        sub="Kế hoạch nhiều giai đoạn cho từng ngựa: cường độ, quãng đường, số buổi và ngưỡng nhịp tim."
        actions={<Link className="ht-btn ht-btn--primary" to="/trainer/plans/new"><Icon name="calendar" />Tạo giáo án</Link>}
      />

      <div className="ht-stats">
        <StatCard icon="pulse" tone="brand" value={count('running')} label="Giáo án đang chạy" />
        <StatCard icon="alarm" tone="warning" value={count('paused')} label="Đang tạm dừng" meta="khóa y tế / chờ BS" />
        <StatCard icon="calendar" tone="info" value={noPlan.length} label="Ngựa chưa có giáo án" />
      </div>

      <Tabs<Filter> value={filter} onChange={setFilter} items={[
        { value: 'running', label: 'Đang chạy', count: count('running') },
        { value: 'paused', label: 'Tạm dừng', count: count('paused') },
        { value: 'history', label: 'Lịch sử', count: count('history') },
      ]} />

      <div className="ht-cols">
        <div>
          <Panel>
            <table className="ht-table">
              <thead><tr><th>Mã</th><th>Ngựa</th><th>Loại · mục tiêu</th><th>Tiến độ</th><th>Giai đoạn hiện tại</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {list.map((p) => {
                  const ph = p.phases.find((x) => x.no === p.currentPhase);
                  return (
                    <tr key={p.id}>
                      <td className="id">{p.id}</td>
                      <td><Link className="strong" to={`/trainer/horses/${p.horseId}`}>{p.horseName}</Link><span className="sub">từ <span className="ht-mono">{p.startDate}</span></span></td>
                      <td><span className="strong">{p.type}</span><span className="sub">{p.goal}</span></td>
                      <td style={{ minWidth: 140 }}><PhaseBar phases={p.phases} current={p.currentPhase} /><span className="sub">GĐ {p.currentPhase}/{p.phases.length} · tuần {p.week}</span></td>
                      <td>{ph ? <>{ph.name}<span className="sub">{ph.intensity} · {ph.distanceM} m · ≤ {ph.hrLimit} bpm</span></> : '—'}</td>
                      <td><Badge tone={PLAN_LABEL[p.status][1]}>{PLAN_LABEL[p.status][0]}</Badge>{p.pausedReason && <span className="sub" style={{ maxWidth: 220 }}>{p.pausedReason}</span>}</td>
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
    </div>
  );
};
