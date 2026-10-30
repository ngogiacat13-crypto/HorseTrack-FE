import React, { useState } from 'react';
import { useActor } from '../../auth/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { useAction } from '../../hooks/useAction';
import { Badge, Callout, Dialog, PageHeader, Panel, ReasonField, Tabs } from '../../components/ui/Ht';
import { LoadState } from '../../components/trainer/TrainerParts';
import { REJECT_CODE_LABEL } from './labels';
import { fmtDate, fmtDateTime } from './logic';
import { EntryBadge } from './parts';
import { tournamentApi } from './tournamentApi';
import type { RaceEntry } from './types';

type Tab = 'open' | 'done';

export const ManagerComplaints: React.FC = () => {
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => tournamentApi.complaints());
  const [tab, setTab] = useState<Tab>('open');
  const [deciding, setDeciding] = useState<{ entry: RaceEntry; accept: boolean } | null>(null);
  const [note, setNote] = useState('');
  const act = useAction();
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const open = data.entries.filter((e) => e.complaint?.status === 'OPEN');
  const done = data.entries.filter((e) => e.complaint && e.complaint.status !== 'OPEN');
  const list = tab === 'open' ? open : done;
  const tour = (id: string) => data.tournaments.find((t) => t.id === id);
  const start = (entry: RaceEntry, accept: boolean) => { act.setError(''); setNote(''); setDeciding({ entry, accept }); };
  const save = async () => {
    if (!deciding) return;
    const { entry, accept } = deciding;
    if (await act.run(() => tournamentApi.decideComplaint(entry, accept, note, actor), accept ? `Đã chấp nhận khiếu nại ${entry.id}.` : `Đã bác khiếu nại ${entry.id}.`)) { setDeciding(null); reload(); }
  };

  return (
    <div className="ht ht-page">
      <PageHeader title="Khiếu nại thi đấu" sub="Chủ ngựa khiếu nại khi HLV từ chối đề xuất. Quản lý CLB xem lý do của HLV và quyết định cuối cùng." />
      <Tabs<Tab> value={tab} onChange={setTab} items={[{ value: 'open', label: 'Chờ xử lý', count: open.length }, { value: 'done', label: 'Đã xử lý', count: done.length }]} />
      <Panel>
        <div style={{ overflowX: 'auto' }}>
          <table className="ht-table" data-testid="complaint-table">
            <thead><tr><th>Đề xuất</th><th>Giải</th><th>HLV từ chối</th><th>Khiếu nại của chủ ngựa</th><th>{tab === 'open' ? '' : 'Quyết định'}</th></tr></thead>
            <tbody>
              {list.map((e) => {
                const t = tour(e.tournamentId);
                return (
                  <tr key={e.id} data-testid={`complaint-row-${e.id}`}>
                    <td className="strong">{e.horseName}<span className="sub">{e.id} · {e.owner}</span></td>
                    <td>{t?.name}<span className="sub mono">{fmtDate(t?.raceDate)}</span></td>
                    <td>{e.trainerDecision?.reasonCode && <Badge tone="danger" plain>{REJECT_CODE_LABEL[e.trainerDecision.reasonCode]}</Badge>}<span className="sub">{e.trainerDecision?.note}</span><span className="sub">{e.trainerDecision?.by} · {fmtDateTime(e.trainerDecision?.at)}</span></td>
                    <td>{e.complaint?.reason}<span className="sub">{fmtDateTime(e.complaint?.at)}</span></td>
                    <td className="num">
                      {tab === 'open' ? (
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button type="button" className="ht-btn ht-btn--primary ht-btn--sm" data-testid={`complaint-accept-${e.id}`} onClick={() => start(e, true)}>Chấp nhận</button>
                          <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" data-testid={`complaint-reject-${e.id}`} onClick={() => start(e, false)}>Bác</button>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'left' }}>
                          <Badge tone={e.complaint?.status === 'ACCEPTED' ? 'success' : 'neutral'}>{e.complaint?.status === 'ACCEPTED' ? 'Chấp nhận' : 'Bác'}</Badge>
                          <span className="sub">{e.complaint?.decisionNote}</span>
                          <span className="sub"><EntryBadge status={e.status} /></span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {list.length === 0 && <div className="ht-empty" data-testid="complaint-empty">{tab === 'open' ? 'Không có khiếu nại chờ xử lý.' : 'Chưa xử lý khiếu nại nào.'}</div>}
        </div>
      </Panel>
      <Dialog open={!!deciding} onClose={() => setDeciding(null)} busy={act.busy} icon={deciding?.accept ? 'check' : 'x'} tone={deciding?.accept ? 'brand' : 'danger'} testId="complaint-decision-dialog"
        title={deciding?.accept ? `Chấp nhận khiếu nại ${deciding.entry.id}` : `Bác khiếu nại ${deciding?.entry.id ?? ''}`}
        sub={deciding?.accept ? 'Bỏ quyết định từ chối của HLV. Còn suất thì chuyển sang chờ bác sĩ khám, hết suất thì xếp hàng chờ theo thời điểm đề xuất ban đầu.' : 'Giữ quyết định từ chối của HLV.'}
        confirmLabel="Xác nhận" onConfirm={save}>
        {act.error && <Callout tone="danger" style={{ marginBottom: 14 }}>{act.error}</Callout>}
        <ReasonField id="complaint-note" label="Ghi chú quyết định" value={note} onChange={setNote} placeholder="VD: Đã xem kết quả tập 2 tuần gần nhất, ngựa đủ thể lực." />
      </Dialog>
    </div>
  );
};
