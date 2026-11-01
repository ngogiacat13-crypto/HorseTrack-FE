import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ProposalStatus, trainerApi } from '../../../api/trainerApi';
import { useActor } from '../../../auth/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { Icon } from '../../../components/ui/Icon';
import { Callout, PageHeader, StatCard, Tabs } from '../../../components/ui/Ht';
import { LoadState } from '../../../components/trainer/TrainerParts';
import { ProposalTable } from './ProposalTable';
import { ProposalDetail } from './ProposalDetail';
import { TournamentTable } from './TournamentTable';
import { PATH } from '../../../routers/routerPath';

type Tab = 'proposals' | 'tournaments';

export const TrainerRaces: React.FC = () => {
  const actor = useActor();
  const [params] = useSearchParams();
  const { data, loading, error, reload } = useFetch(() => trainerApi.getRaces(actor), [actor]);
  const [tab, setTab] = useState<Tab>('proposals');
  const [sel, setSel] = useState<string | null>(params.get('p'));

  const proposals = useMemo(() => [...(data?.proposals ?? [])].sort((a, b) => b.id.localeCompare(a.id)), [data]);
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const p = proposals.find((x) => x.id === sel) ?? proposals[0];
  const tournament = p ? data.tournaments.find((x) => x.id === p.tournamentId) : undefined;
  const n = (...st: ProposalStatus[]) => proposals.filter((x) => st.includes(x.status)).length;
  const results = proposals.filter((x) => x.result);

  return (
    <div className="ht ht-page">
      <PageHeader title="Giải đua & đề xuất thi đấu" sub="Chủ ngựa đề xuất → HLV xác nhận → Bác sĩ khám trước giải → Chủ ngựa đóng lệ phí → Quản lý CLB nhập kết quả."
        actions={<Link className="ht-btn ht-btn--primary" to={PATH.trainer.raceConfirmations} data-testid="races-go-confirm"><Icon name="check" />Xác nhận thi đấu</Link>} />

      <div className="ht-stats">
        <StatCard icon="users" tone="warning" value={n('WAITING_TRAINER')} label="Chờ HLV xác nhận" />
        <StatCard icon="heart" tone="info" value={n('WAITING_VET_EXAM')} label="Chờ Bác sĩ khám" />
        <StatCard icon="card" tone="brand" value={n('WAITING_PAYMENT', 'REGISTERED')} label="Chờ lệ phí / đã đăng ký" />
        <StatCard icon="trend" tone="gold" value={results.length} label="Kết quả đã ghi nhận" meta={results[0] ? `Hạng ${results[0].result?.rank} · ${results[0].horseName}` : undefined} />
      </div>

      <Tabs<Tab> value={tab} onChange={setTab} items={[
        { value: 'proposals', label: 'Đề xuất', count: proposals.length },
        { value: 'tournaments', label: 'Giải đấu', count: data.tournaments.length },
      ]} />

      {tab === 'proposals' ? (
        <div className="ht-cols" style={{ gridTemplateColumns: 'minmax(0,1fr) 400px' }}>
          <div><ProposalTable proposals={proposals} tournaments={data.tournaments} selectedId={p?.id} onSelect={setSel} /></div>
          {p && <div><ProposalDetail proposal={p} tournament={tournament} /></div>}
        </div>
      ) : <TournamentTable tournaments={data.tournaments} />}

      <div style={{ marginTop: 24 }}>
        <Callout tone="demo" title="Nhánh dừng của đề xuất">
          HLV từ chối → chủ ngựa có thể khiếu nại; Quản lý CLB chấp nhận thì đề xuất sang Bác sĩ khám. Bác sĩ đánh giá không đạt → hồ sơ dừng, chủ ngựa chọn ngựa khác để thi đấu.
        </Callout>
      </div>
    </div>
  );
};
