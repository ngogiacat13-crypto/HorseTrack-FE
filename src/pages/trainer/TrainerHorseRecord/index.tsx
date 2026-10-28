import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { horseInitials, raceBlock, trainerApi, trainingBlock } from '../../../api/trainerApi';
import { useActor } from '../../../auth/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { Icon } from '../../../components/ui/Icon';
import { BackButton, PageHeader, Tabs } from '../../../components/ui/Ht';
import { HorseBadges, LoadState } from '../../../components/trainer/TrainerParts';
import { HealthTab, OverviewTab, RacesTab, TrainingTab } from './RecordTabs';
import { AssignCareTask, AssignedCareTasks } from '../../../features/care-task-assign';
import { USE_BACKEND } from '../../../api/beClient';

const sortKey = (s: { date: string; time: string }) => s.date.split('/').reverse().join('') + s.time;

export const TrainerHorseRecord: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => trainerApi.getHorse(id, actor), [id, actor]);
  const [careKey, setCareKey] = useState(0);

  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  const { horse, plans, sessions, vaccinations, proposals, tournaments } = data;
  const plan = plans.find((p) => p.status === 'PLANNED' || p.status === 'ACTIVE' || p.status === 'PAUSED');
  const history = [...sessions].sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
  const scored = history.filter((s) => s.evaluation);
  const avg = scored.length ? (scored.reduce((s, x) => s + (x.evaluation?.score ?? 0), 0) / scored.length).toFixed(1) : '—';
  const block = trainingBlock(horse);
  const raceNo = raceBlock(horse);

  return (
    <div className="ht ht-page">
      <PageHeader
        docTitle={horse.name}
        crumbs={<BackButton fallback="/trainer" />}
        title={<span style={{ display: 'inline-flex', gap: 12, alignItems: 'center' }}><i className="ht-avatar ht-avatar--xl">{horseInitials(horse.name)}</i>{horse.name}</span>}
        badge={<HorseBadges horse={horse} />}
        sub={<>{horse.breed} · {horse.sex} {horse.age} tuổi · Chuồng <b>{horse.stall}</b> · Chủ: <b>{horse.owner}</b></>}
        actions={<>
          <AssignCareTask horseId={horse.id} horseName={horse.name} disabledReason={horse.stall && horse.stall !== '—' ? undefined : 'Ngựa chưa được cấp chuồng'} onAssigned={() => setCareKey((k) => k + 1)} />
          {raceNo
            ? <button type="button" className="ht-btn ht-btn--secondary" disabled title={raceNo}><Icon name="send" />Đề xuất thi đấu</button>
            : <Link className="ht-btn ht-btn--secondary" to={`/trainer/races/new?horse=${horse.id}`}><Icon name="send" />Đề xuất thi đấu</Link>}
          {block
            ? <button type="button" className="ht-btn ht-btn--primary" disabled title={block}><Icon name="calendar" />Tạo giáo án</button>
            : <Link className="ht-btn ht-btn--primary" to={`/trainer/plans/new?horse=${horse.id}`}><Icon name="calendar" />Tạo giáo án</Link>}
        </>}
      />

      {horse.lock && (
        <div className="ht-banner" role="alert">
          <Icon name="lock" />
          <div>
            <b>Ngựa đang bị khóa huấn luyện từ <span className="ht-mono">{horse.lock.at}</span> bởi BS {horse.lock.by} — {horse.lock.reason}.</b>
            <p>Mọi lịch tập, giáo án và đề xuất thi đấu bị chặn. {horse.lock.review}. Chỉ Bác sĩ thú y được mở khóa (BR_01).</p>
          </div>
        </div>
      )}

      <Tabs.Group defaultValue="overview">
        <Tabs.List label="Hồ sơ ngựa">
          <Tabs.Tab value="overview">Tổng quan</Tabs.Tab>
          <Tabs.Tab value="health">Sức khỏe</Tabs.Tab>
          <Tabs.Tab value="training" count={sessions.length}>Huấn luyện</Tabs.Tab>
          <Tabs.Tab value="races" count={proposals.length}>Thi đấu</Tabs.Tab>
          {USE_BACKEND && <Tabs.Tab value="care">Việc chăm sóc</Tabs.Tab>}
        </Tabs.List>
        <Tabs.Panel value="overview"><OverviewTab horse={horse} plan={plan} recent={history.slice(0, 4)} avg={avg} vaccinations={vaccinations} block={block} /></Tabs.Panel>
        <Tabs.Panel value="health"><HealthTab horse={horse} /></Tabs.Panel>
        <Tabs.Panel value="training"><TrainingTab history={history} plans={plans} scored={scored.length} avg={avg} /></Tabs.Panel>
        <Tabs.Panel value="races"><RacesTab proposals={proposals} tournaments={tournaments} /></Tabs.Panel>
        {USE_BACKEND && <Tabs.Panel value="care"><AssignedCareTasks horseId={horse.id} refreshKey={careKey} /></Tabs.Panel>}
      </Tabs.Group>
    </div>
  );
};
