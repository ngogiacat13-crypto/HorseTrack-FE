import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useActor } from '../../auth/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { useAction } from '../../hooks/useAction';
import { BackButton, Callout, Dialog, PageHeader, Panel, money } from '../../components/ui/Ht';
import { Icon } from '../../components/ui/Icon';
import { LoadState } from '../../components/trainer/TrainerParts';
import { HOLDING, fmtDateTime, holdingCount, prizeFor, waitlist } from './logic';
import { Deadline, EntryBadge, TournamentBadge, TournamentFacts } from './parts';
import { TournamentForm } from './TournamentForm';
import { tournamentApi } from './tournamentApi';
import type { RaceEntry } from './types';

const EntryRows: React.FC<{ rows: RaceEntry[]; queue?: boolean; empty: string; testId: string }> = ({ rows, queue, empty, testId }) => (
  <div style={{ overflowX: 'auto' }}>
    <table className="ht-table" data-testid={testId}>
      <thead><tr>{queue && <th>#</th>}<th>Mã</th><th>Ngựa · chủ</th><th>Đề xuất lúc</th><th>Trạng thái</th><th>Hạn bước hiện tại</th></tr></thead>
      <tbody>
        {rows.map((e) => (
          <tr key={e.id} data-testid={`entry-row-${e.id}`}>
            {queue && <td className="ht-mono">{e.queuePosition ?? '—'}</td>}
            <td className="id">{e.id}</td>
            <td className="strong">{e.horseName}<span className="sub">{e.owner}</span></td>
            <td className="ht-mono">{fmtDateTime(e.createdAt)}</td>
            <td><EntryBadge status={e.status} />{e.result && <span className="sub">Hạng {e.result.rank} · {e.result.finishTime}{e.result.prize ? ` · ${money(e.result.prize)}` : ''}</span>}</td>
            <td><Deadline entry={e} /></td>
          </tr>
        ))}
      </tbody>
    </table>
    {rows.length === 0 && <div className="ht-empty">{empty}</div>}
  </div>
);

export const ManagerTournamentDetail: React.FC = () => {
  const { id = '' } = useParams();
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => tournamentApi.managerTournament(id), [id]);
  const [editing, setEditing] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [results, setResults] = useState<Record<string, { rank: string; finishTime: string }>>({});
  const act = useAction();
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const { tournament: t, entries } = data;
  const held = entries.filter((e) => HOLDING.includes(e.status)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const queue = waitlist(entries);
  const closed = entries.filter((e) => !HOLDING.includes(e.status) && e.status !== 'WAITLISTED').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const registered = entries.filter((e) => e.status === 'REGISTERED');
  const canResult = t.canRecordResults === true;

  const openResults = () => {
    act.setError('');
    setResults(Object.fromEntries(registered.map((e) => [e.id, { rank: '', finishTime: '' }])));
    setResultsOpen(true);
  };
  const saveResults = async () => {
    const rows = registered.map((e) => ({ entryId: e.id, rank: Number(results[e.id]?.rank), finishTime: (results[e.id]?.finishTime ?? '').trim() }));
    if (await act.run(() => tournamentApi.recordResults(t, rows, actor), `Đã lưu kết quả ${t.name} và gửi thông báo tiền thưởng cho chủ ngựa.`)) { setResultsOpen(false); reload(); }
  };

  return (
    <div className="ht ht-page">
      <PageHeader crumbs={<BackButton fallback="/manager/tournaments" />} title={t.name} badge={<TournamentBadge status={t.status} raceEnded={t.raceEnded} />}
        sub={`${t.id} · ${holdingCount(entries)}/${t.slots} suất đang giữ · ${queue.length} trong hàng chờ`}
        actions={<div style={{ display: 'flex', gap: 8 }}>
          {t.status === 'DRAFT' && <button type="button" className="ht-btn ht-btn--secondary" data-testid="tournament-detail-edit" onClick={() => setEditing(true)}>Sửa giải</button>}
          {canResult && <button type="button" className="ht-btn ht-btn--primary" data-testid="tournament-results-btn" onClick={openResults}><Icon name="check" size={16} />Nhập kết quả</button>}
        </div>} />
      {t.raceEnded && registered.length === 0 && <Callout tone="info" style={{ marginBottom: 16 }}>Giải đã diễn ra nhưng không có ngựa nào đã đăng ký để nhập kết quả.</Callout>}
      <div className="ht-cols" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.6fr)' }}>
        <Panel title="Thông tin giải"><div className="ht-panel__body"><TournamentFacts t={t} /></div></Panel>
        <div>
          <Panel title="Suất đang giữ" sub="Theo thứ tự đề xuất. Quá hạn ở bước nào thì mất suất, người đầu hàng chờ được lên.">
            <EntryRows rows={held} empty="Chưa có ngựa giữ suất." testId="held-table" />
          </Panel>
          <Panel as="h3" title="Hàng chờ" sub="Đề xuất lại sau khi mất suất sẽ xếp cuối hàng.">
            <EntryRows rows={queue} queue empty="Không có ai đang chờ." testId="waitlist-table" />
          </Panel>
          <Panel as="h3" title="Đã dừng">
            <EntryRows rows={closed} empty="—" testId="closed-table" />
          </Panel>
        </div>
      </div>
      {editing && <TournamentForm tournament={t} onClose={() => setEditing(false)} onDone={() => { setEditing(false); reload(); }} />}
      <Dialog open={resultsOpen} onClose={() => setResultsOpen(false)} busy={act.busy} icon="trend" tone="brand" width={640} testId="tournament-results-dialog"
        title={`Nhập kết quả · ${t.name}`} sub="Tiền thưởng tính theo bảng giải thưởng của giải. Lưu xong giải chuyển sang Đã kết thúc." confirmLabel="Lưu kết quả" onConfirm={saveResults}>
        {act.error && <Callout tone="danger" style={{ marginBottom: 14 }}>{act.error}</Callout>}
        <table className="ht-table">
          <thead><tr><th>Ngựa</th><th>Hạng</th><th>Thời gian (m:ss.cc)</th><th>Thưởng</th></tr></thead>
          <tbody>
            {registered.map((e) => {
              const r = results[e.id] ?? { rank: '', finishTime: '' };
              const set = (patch: Partial<typeof r>) => setResults((x) => ({ ...x, [e.id]: { ...r, ...patch } }));
              return (
                <tr key={e.id}>
                  <td className="strong">{e.horseName}<span className="sub">{e.owner}</span></td>
                  <td><input aria-label={`Hạng ${e.horseName}`} data-testid={`result-rank-${e.id}`} type="number" min={1} className="ht-input" style={{ width: 80 }} value={r.rank} onChange={(ev) => set({ rank: ev.target.value })} /></td>
                  <td><input aria-label={`Thời gian ${e.horseName}`} data-testid={`result-time-${e.id}`} className="ht-input" style={{ width: 120 }} placeholder="1:12.55" value={r.finishTime} onChange={(ev) => set({ finishTime: ev.target.value })} /></td>
                  <td className="ht-mono">{r.rank ? money(prizeFor(Number(r.rank), t.prizes)) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Dialog>
    </div>
  );
};
