import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DEMO_NOW } from '../../../api/http';
import { CareTask, groomApi, TaskType } from '../../../api/groomApi';
import { useActor } from '../../../auth/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { Icon } from '../../../components/ui/Icon';
import { Badge, PageHeader, Tabs } from '../../../components/ui/Ht';
import { PATH, toPath } from '../../../routers/routerPath';
import { LoadState } from '../../../components/trainer/TrainerParts';
import { TaskCard } from './TaskCard';
import { taskState } from './taskState';

const WEEKDAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const weekday = (ddmmyyyy: string) => {
  const [d, m, y] = ddmmyyyy.split('/').map(Number);
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
};
import { CompleteTaskDialog } from './CompleteTaskDialog';

type Tab = 'ALL' | TaskType;
const TYPE_LABEL: Record<TaskType, string> = { FEED: 'Cho ăn', CLEAN: 'Dọn chuồng', GROOM: 'Chải lông', COOL: 'Chườm lạnh', OTHER: 'Khác' };

export const GroomTodayTasks: React.FC = () => {
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => groomApi.getToday(actor), [actor]);
  const [tab, setTab] = useState<Tab>('ALL');
  const [doneFor, setDoneFor] = useState<CareTask | null>(null);
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const { tasks, alerts, groom, horses } = data;
  const order = { late: 0, soon: 1, todo: 2, done: 3 } as const;
  const list = tasks.filter((t) => tab === 'ALL' || t.type === tab).sort((a, b) => order[taskState(a)] - order[taskState(b)] || a.time.localeCompare(b.time));
  const types = [...new Set(tasks.map((t) => t.type))];
  const done = tasks.filter((t) => t.status === 'DONE').length;
  const late = tasks.filter((t) => taskState(t) === 'late').length;

  return (
    <div className="ht ht-page">
      <PageHeader title="Công việc hôm nay" sub={<>{weekday(DEMO_NOW.date)}, <span className="ht-mono">{DEMO_NOW.date}</span> · {groom.zones.join(', ')}</>}
        actions={<span style={{ display: 'inline-flex', gap: 8 }}>
          <Badge tone="neutral">{tasks.length} việc</Badge><Badge tone="success">{done} xong</Badge>{late > 0 && <Badge tone="danger">{late} quá hạn</Badge>}
        </span>} />

      {alerts.map((s) => (
        <div key={s.id} className="ht-banner" role="alert">
          <Icon name="alarm" />
          <div>
            <b>Phiên tập <span className="ht-mono">#{s.id}</span> ({s.horseName}) {s.status === 'STOPPED' ? 'đã dừng' : 'đang tạm dừng'} lúc {s.pausedAt} — vượt ngưỡng an toàn.</b>
            <p>{s.status === 'STOPPED' ? 'Không nhập thêm chỉ số. Đưa ngựa về chuồng và chờ Bác sĩ.' : 'Không tự tiếp tục — chờ HLV trưởng quyết định. Đo nhịp tim hồi phục trong lúc chờ.'}</p>
          </div>
          <Link className="ht-more" to={toPath(PATH.groom.session, { id: s.id })}>Mở phiên <Icon name="arrow" /></Link>
        </div>
      ))}

      <Tabs<Tab> value={tab} onChange={setTab} items={[{ value: 'ALL', label: 'Tất cả', count: tasks.length }, ...types.map((t) => ({ value: t as Tab, label: TYPE_LABEL[t], count: tasks.filter((x) => x.type === t).length }))]} />

      <div className="ht-tasks">
        {list.map((t) => <TaskCard key={t.id} task={t} horse={horses.find((h) => h.id === t.horseId)} onDone={setDoneFor} />)}
        {list.length === 0 && <div className="ht-empty">Không có công việc.</div>}
      </div>

      <div className="ht-overline" style={{ textAlign: 'center', margin: '28px 0 12px' }}>Thao tác nhanh</div>
      <div className="ht-quick">
        <Link to={PATH.groom.incidents}><Icon name="alert" /><span><b>Báo cáo sự cố</b><small>Mất ăn, đau bụng, sốt, móng chân</small></span></Link>
        <Link to={PATH.groom.requests}><Icon name="box" /><span><b>Yêu cầu vật tư</b><small>Móng, lót chuồng, dụng cụ chăm sóc</small></span></Link>
        <Link to={PATH.groom.sessions}><Icon name="calendar" /><span><b>Phiên tập được giao</b><small>Bắt đầu và nhập chỉ số phiên hôm nay</small></span></Link>
      </div>

      {doneFor && <CompleteTaskDialog task={doneFor} onClose={() => setDoneFor(null)} onDone={() => { setDoneFor(null); reload(); }} />}
    </div>
  );
};
