import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DEMO_NOW } from '../../../api/http';
import { groomApi } from '../../../api/groomApi';
import { SESSION_LABEL, type TrainingSession } from '../../../api/trainerApi';
import { useActor } from '../../../auth/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { PATH, toPath } from '../../../routers/routerPath';
import { Icon } from '../../../components/ui/Icon';
import { Badge, PageHeader, Panel, Tabs } from '../../../components/ui/Ht';
import { LoadState } from '../../../components/trainer/TrainerParts';

type Tab = 'TODAY' | 'UPCOMING' | 'PAST';
const isOpen = (s: TrainingSession) => ['IN_PROGRESS', 'RESUMED', 'PAUSED_PENDING_TRAINER'].includes(s.status);
const key = (d: string) => d.split('/').reverse().join('');

/* 3. Phiên tập được giao — the trainer assigns, the Groom runs it on the track. */
export const GroomSessions: React.FC = () => {
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => groomApi.getMySessions(actor), [actor]);
  const [tab, setTab] = useState<Tab>('TODAY');
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const today = key(DEMO_NOW.date);
  const group = (s: TrainingSession): Tab => (key(s.date) === today ? 'TODAY' : key(s.date) > today ? 'UPCOMING' : 'PAST');
  const list = data.sessions.filter((s) => group(s) === tab).sort((a, b) => (tab === 'PAST' ? 0 : key(a.date).localeCompare(key(b.date)) || a.time.localeCompare(b.time)));
  const count = (t: Tab) => data.sessions.filter((s) => group(s) === t).length;
  const running = data.sessions.filter(isOpen).length;

  return (
    <div className="ht ht-page">
      <PageHeader title="Phiên tập được giao" sub={<>HLV trưởng phân công · bạn bắt đầu phiên, nhập chỉ số và theo dõi ngưỡng an toàn (BR_02)</>}
        actions={running > 0 ? <Badge tone="warning">{running} phiên đang mở</Badge> : undefined} />
      <Tabs<Tab> value={tab} onChange={setTab} items={[{ value: 'TODAY', label: 'Hôm nay', count: count('TODAY') }, { value: 'UPCOMING', label: 'Sắp tới', count: count('UPCOMING') }, { value: 'PAST', label: 'Đã qua', count: count('PAST') }]} />
      <Panel>
        <div style={{ overflowX: 'auto' }}>
          <table className="ht-table">
            <thead><tr><th>Mã phiên</th><th>Ngày · giờ</th><th>Ngựa</th><th>Nội dung</th><th>Đường chạy</th><th>Ngưỡng</th><th>Trạng thái</th><th /></tr></thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id}>
                  <td className="ht-mono">{s.id}</td>
                  <td><span className="ht-mono">{s.date}</span> · {s.time}</td>
                  <td><b>{s.horseName}</b></td>
                  <td>{s.label}</td>
                  <td>{s.track}</td>
                  <td className="ht-mono" style={{ fontSize: 12 }}>{s.thresholds.hr} bpm · {s.thresholds.speed} km/h</td>
                  <td><Badge tone={SESSION_LABEL[s.status][1]}>{SESSION_LABEL[s.status][0]}</Badge></td>
                  <td><Link className="ht-more" to={toPath(PATH.groom.session, { id: s.id })}>{s.status === 'SCHEDULED' && tab === 'TODAY' ? 'Bắt đầu' : isOpen(s) ? 'Tiếp tục' : 'Xem'} <Icon name="arrow" /></Link></td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={8} className="ht-empty">Không có phiên tập.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
};
