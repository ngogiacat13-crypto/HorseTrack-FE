import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { horseInitials } from '../../../api/trainerApi';
import { isOpenProtocol, vetApi } from '../../../api/vetApi';
import { useFetch } from '../../../hooks/useFetch';
import { Icon } from '../../../components/ui/Icon';
import { BackButton, PageHeader, Tabs } from '../../../components/ui/Ht';
import { HorseBadges, LoadState } from '../../../components/trainer/TrainerParts';
import { HealthStatusDialog, LockDialog, UnlockDialog } from '../../../components/vet/VetDialogs';
import { InjuryPanel } from './InjuryPanel';
import { DietPanel } from './DietPanel';
import { ActiveProtocolPanel, HistoryPanel, StatusPanel } from './SidePanels';
import { CasesTab, RacesTab, VaccinesTab } from './RecordTabs';

type Tab = 'health' | 'cases' | 'vaccines' | 'races';

export const VetHorseHealth: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const { data, loading, error, reload } = useFetch(() => vetApi.getHorseHealth(id), [id]);
  const [tab, setTab] = useState<Tab>('health');
  const [lockOpen, setLockOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);

  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  const { horse, cases, protocols, vaccinations, proposals, feedRequests } = data;
  const openCases = cases.filter((c) => c.status !== 'CLOSED');
  const activeProto = protocols.filter(isOpenProtocol).sort((a, b) => b.version - a.version)[0];
  const examined = openCases.find((c) => c.exam && !protocols.some((p) => p.caseId === c.id && isOpenProtocol(p)));

  return (
    <div className="ht ht-page">
      <PageHeader
        crumbs={<BackButton fallback="/vet" />}
        title={<span style={{ display: 'inline-flex', gap: 12, alignItems: 'center' }}><i className="ht-avatar ht-avatar--xl">{horseInitials(horse.name)}</i>{horse.name}</span>}
        badge={<HorseBadges horse={horse} />}
        sub={<>{horse.breed} · {horse.sex} {horse.age} tuổi · Chuồng <b>{horse.stall}</b> · Chủ: <b>{horse.owner}</b></>}
        actions={<>
          {horse.trainingLocked
            ? <button type="button" className="ht-btn ht-btn--secondary" onClick={() => setUnlockOpen(true)}><Icon name="unlock" />Mở khóa huấn luyện</button>
            : <button type="button" className="ht-btn ht-btn--danger" onClick={() => setLockOpen(true)}><Icon name="lock" />Khóa huấn luyện</button>}
          {examined
            ? <Link data-testid="create-protocol-btn" className="ht-btn ht-btn--primary" to={`/vet/protocols/new?horse=${horse.id}&case=${examined.id}`}><Icon name="file" />Tạo phác đồ</Link>
            : <button data-testid="create-protocol-btn" type="button" className="ht-btn ht-btn--primary" disabled
                title={openCases.some((c) => c.exam) ? 'Các ca đã khám đều đã có phác đồ mở' : 'Cần một ca khám đã ghi nhận'}>
                <Icon name="file" />{openCases.some((c) => c.exam) && activeProto ? `Đã có phác đồ ${activeProto.id}` : 'Tạo phác đồ'}
              </button>}
        </>}
      />

      {horse.lock && (
        <div className="ht-banner" role="alert">
          <Icon name="lock" />
          <div>
            <b>Ngựa đang bị khóa tập từ <span className="ht-mono">{horse.lock.at}</span> bởi BS {horse.lock.by} — lý do: {horse.lock.reason}.</b>
            <p>Mọi lịch huấn luyện bị chặn và chỉ Bác sĩ thú y được chỉnh khẩu phần (BR_01, BR_03). Điều kiện mở: {horse.lock.review}</p>
          </div>
        </div>
      )}

      <Tabs<Tab> value={tab} onChange={setTab} items={[
        { value: 'health', label: 'Sức khỏe' },
        { value: 'cases', label: 'Ca khám & phác đồ', count: cases.length },
        { value: 'vaccines', label: 'Tiêm phòng', count: vaccinations.filter((v) => v.status !== 'DONE').length },
        { value: 'races', label: 'Thi đấu', count: proposals.length },
      ]} />

      {tab === 'health' && (
        <div className="ht-cols">
          <div><InjuryPanel horse={horse} onChanged={reload} /></div>
          <div>
            <StatusPanel horse={horse} onEdit={() => setHealthOpen(true)} />
            <DietPanel horse={horse} pendingFeeds={feedRequests.filter((f) => f.status === 'PENDING')} onChanged={reload} />
            <ActiveProtocolPanel protocol={activeProto} />
            <HistoryPanel horse={horse} />
          </div>
        </div>
      )}
      {tab === 'cases' && <CasesTab cases={cases} protocols={protocols} />}
      {tab === 'vaccines' && <VaccinesTab vaccinations={vaccinations} />}
      {tab === 'races' && <RacesTab proposals={proposals} />}

      <LockDialog horse={lockOpen ? horse : null} onClose={() => setLockOpen(false)} onDone={() => { setLockOpen(false); reload(); }} />
      <UnlockDialog horse={unlockOpen ? horse : null} onClose={() => setUnlockOpen(false)} onDone={() => { setUnlockOpen(false); reload(); }} />
      <HealthStatusDialog horse={healthOpen ? horse : null} onClose={() => setHealthOpen(false)} onDone={() => { setHealthOpen(false); reload(); }} />
    </div>
  );
};
