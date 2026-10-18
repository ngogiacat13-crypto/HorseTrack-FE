import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ProposalStatus, trainerApi } from '../../../api/trainerApi';
import { useActor } from '../../../auth/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { Icon } from '../../../components/ui/Icon';
import { Callout, PageHeader, StatCard, Tabs } from '../../../components/ui/Ht';
import { LoadState } from '../../../components/trainer/TrainerParts';
import { ProposalTable } from './ProposalTable';
import { ProposalDetail, ProposalDialog } from './ProposalDetail';
import { OrganizerDialog } from './OrganizerDialogs';
import { TournamentTable } from './TournamentTable';

type Tab = 'proposals' | 'tournaments';

/* 3.1 danh sách giải · 3.4 theo dõi đề xuất · 3.5 nhập kết quả */
export const TrainerRaces: React.FC = () => {
  const actor = useActor();
  const [params] = useSearchParams();
  const { data, loading, error, reload } = useFetch(() => trainerApi.getRaces(actor), [actor]);
  const [tab, setTab] = useState<Tab>('proposals');
  const [sel, setSel] = useState<string | null>(params.get('p'));
  const [dlg, setDlg] = useState<ProposalDialog | null>(null);

  const proposals = useMemo(() => [...(data?.proposals ?? [])].sort((a, b) => b.id.localeCompare(a.id)), [data]);
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const p = proposals.find((x) => x.id === sel) ?? proposals[0];
  const tournament = p ? data.tournaments.find((x) => x.id === p.tournamentId) : undefined;
  const n = (...st: ProposalStatus[]) => proposals.filter((x) => st.includes(x.status)).length;
  const results = proposals.filter((x) => x.result);

  return (
    <div className="ht ht-page">
      <PageHeader title="Giải đua & đề xuất thi đấu" sub="HLV đề xuất → Chủ ngựa đồng ý → Bác sĩ khám sức khỏe → gửi hồ sơ cho ban tổ chức (BR_04)."
        actions={<Link className="ht-btn ht-btn--primary" to="/trainer/races/new"><Icon name="send" />Tạo đề xuất</Link>} />

      <div className="ht-stats">
        <StatCard icon="heart" tone="info" value={n('WAITING_VET_EXAM')} label="Chờ Bác sĩ khám" />
        <StatCard icon="users" tone="warning" value={n('WAITING_OWNER')} label="Chờ chủ ngựa xác nhận" />
        <StatCard icon="send" tone="brand" value={n('READY_TO_SUBMIT', 'SUBMITTED')} label="Sẵn sàng / đã gửi BTC" />
        <StatCard icon="trend" tone="gold" value={results.length} label="Kết quả đã ghi nhận" meta={results[0] ? `Hạng ${results[0].result?.rank} · ${results[0].horseName}` : undefined} />
      </div>

      <Tabs<Tab> value={tab} onChange={setTab} items={[
        { value: 'proposals', label: 'Đề xuất', count: proposals.length },
        { value: 'tournaments', label: 'Giải đấu', count: data.tournaments.length },
      ]} />

      {tab === 'proposals' ? (
        <div className="ht-cols" style={{ gridTemplateColumns: 'minmax(0,1fr) 400px' }}>
          <div><ProposalTable proposals={proposals} tournaments={data.tournaments} selectedId={p?.id} onSelect={setSel} /></div>
          {p && <div><ProposalDetail proposal={p} tournament={tournament} onOpen={setDlg} /></div>}
        </div>
      ) : <TournamentTable tournaments={data.tournaments} />}

      <div style={{ marginTop: 24 }}>
        <Callout tone="demo" title="Gửi hồ sơ chính thức nằm ngoài hệ thống">
          CLB chưa tích hợp với ban tổ chức. “Đã gửi BTC”, “BTC từ chối” và kết quả thi đấu do HLV cập nhật thủ công sau khi làm việc với ban tổ chức (BR_04).
        </Callout>
      </div>

      {p && dlg && <OrganizerDialog kind={dlg} proposal={p} tournament={tournament} onClose={() => setDlg(null)} onDone={() => { setDlg(null); reload(); }} />}
    </div>
  );
};
