import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { horseInitials, raceBlock, trainerApi, trainingBlock } from '../../../api/trainerApi';
import { useActor } from '../../../auth/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { Icon } from '../../../components/ui/Icon';
import { PageHeader, Tabs } from '../../../components/ui/Ht';
import { HorseBadges, LoadState } from '../../../components/trainer/TrainerParts';
import { HealthTab, OverviewTab, RacesTab, TrainingTab } from './RecordTabs';

type Tab = 'overview' | 'health' | 'training' | 'races';
const sortKey = (s: { date: string; time: string }) => s.date.split('/').reverse().join('') + s.time;

/* 1.5 lịch sử huấn luyện · 4.1 hồ sơ sức khỏe (chỉ xem) · 4.2 khóa tập · 4.3 lịch tiêm */
export const TrainerHorseRecord: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => trainerApi.getHorse(id, actor), [id, actor]);
  const [tab, setTab] = useState<Tab>('overview');

  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  const { horse, plans, sessions, vaccinations, proposals, tournaments } = data;
  const plan = plans.find((p) => p.status === 'ACTIVE' || p.status === 'PAUSED');
  const history = [...sessions].sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
  const scored = history.filter((s) => s.evaluation);
  const avg = scored.length ? (scored.reduce((s, x) => s + (x.evaluation?.score ?? 0), 0) / scored.length).toFixed(1) : '—';
  const block = trainingBlock(horse);
  const raceNo = raceBlock(horse);

  return (
    <div className="ht ht-page">
      <PageHeader
        crumbs={<><Link className="ht-back" to="/trainer"><Icon name="back" size={14} />Tổng quan đàn ngựa</Link><Icon name="chev" size={14} /><b>{horse.name}</b></>}
        title={<span style={{ display: 'inline-flex', gap: 12, alignItems: 'center' }}><i className="ht-avatar ht-avatar--xl">{horseInitials(horse.name)}</i>{horse.name}</span>}
        badge={<HorseBadges horse={horse} />}
        sub={<><span className="ht-mono">{horse.microchip}</span> · {horse.breed} · {horse.sex} {horse.age} tuổi · Chuồng <b>{horse.stall}</b> · Chủ: <b>{horse.owner}</b></>}
        actions={<>
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

      <Tabs<Tab> value={tab} onChange={setTab} items={[
        { value: 'overview', label: 'Tổng quan' },
        { value: 'health', label: 'Sức khỏe' },
        { value: 'training', label: 'Huấn luyện', count: sessions.length },
        { value: 'races', label: 'Thi đấu', count: proposals.length },
      ]} />

      {tab === 'overview' && <OverviewTab horse={horse} plan={plan} recent={history.slice(0, 4)} avg={avg} vaccinations={vaccinations} block={block} />}
      {tab === 'health' && <HealthTab horse={horse} />}
      {tab === 'training' && <TrainingTab history={history} plans={plans} scored={scored.length} avg={avg} />}
      {tab === 'races' && <RacesTab proposals={proposals} tournaments={tournaments} />}
    </div>
  );
};
