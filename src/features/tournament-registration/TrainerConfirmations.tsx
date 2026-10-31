import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useActor } from '../../auth/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { useAction } from '../../hooks/useAction';
import { Callout, Dialog, PageHeader, Panel, ReasonField, Tabs } from '../../components/ui/Ht';
import { Icon } from '../../components/ui/Icon';
import { LoadState } from '../../components/trainer/TrainerParts';
import { REJECT_CODE_LABEL } from './labels';
import { criteriaText, fmtDate } from './logic';
import { Deadline, EntryBadge } from './parts';
import { tournamentApi } from './tournamentApi';
import type { RaceEntry, RejectCode } from './types';

type Tab = 'waiting' | 'all';

export const TrainerConfirmations: React.FC = () => {
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => tournamentApi.trainerQueue(actor), [actor]);
  const [tab, setTab] = useState<Tab>('waiting');
  const [deciding, setDeciding] = useState<RaceEntry | null>(null);
  const [approve, setApprove] = useState(true);
  const [code, setCode] = useState<RejectCode | ''>('');
  const [note, setNote] = useState('');
  const act = useAction();
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const tour = (id: string) => data.tournaments.find((t) => t.id === id);
  const waiting = data.entries.filter((e) => e.status === 'WAITING_TRAINER').sort((a, b) => (a.stageDeadline ?? '').localeCompare(b.stageDeadline ?? ''));
  const list = tab === 'waiting' ? waiting : [...data.entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const decidingTour = deciding ? tour(deciding.tournamentId) : undefined;
  const open = (e: RaceEntry, ok: boolean) => { act.setError(''); setApprove(ok); setCode(''); setNote(''); setDeciding(e); };
  const save = async () => {
    if (!deciding) return;
    if (await act.run(() => tournamentApi.trainerDecide(deciding, approve, approve ? '' : code, note, actor), approve ? `Đã xác nhận ${deciding.horseName} — chuyển bác sĩ khám.` : `Đã từ chối ${deciding.id}. Chủ ngựa có thể khiếu nại lên Quản lý CLB.`)) { setDeciding(null); reload(); }
  };

  return (
    <div className="ht ht-page">
      <PageHeader title="Xác nhận thi đấu" sub="Chủ ngựa đề xuất, HLV chỉ xác nhận ngựa sẵn sàng hoặc từ chối kèm lý do trong 2 ngày. Quá hạn đề xuất mất suất. Từ chối có thể bị chủ ngựa khiếu nại." />
      <Tabs<Tab> value={tab} onChange={setTab} items={[{ value: 'waiting', label: 'Chờ xác nhận', count: waiting.length }, { value: 'all', label: 'Tất cả', count: data.entries.length }]} />
      <Panel>
        <div style={{ overflowX: 'auto' }}>
          <table className="ht-table" data-testid="trainer-entry-table">
            <thead><tr><th>Đề xuất</th><th>Ngựa</th><th>Giải</th><th>Trạng thái</th><th>Hạn xác nhận</th><th /></tr></thead>
            <tbody>
              {list.map((e) => {
                const t = tour(e.tournamentId);
                return (
                  <tr key={e.id} data-testid={`trainer-entry-${e.id}`}>
                    <td className="id">{e.id}</td>
                    <td className="strong"><Link to={`/trainer/horses/${e.horseId}`}>{e.horseName}</Link><span className="sub">Chủ: {e.owner}</span></td>
                    <td>{t?.name}<span className="sub mono">{fmtDate(t?.raceDate)} · {t?.distanceM} m</span></td>
                    <td><EntryBadge status={e.status} />{e.trainerDecision?.reasonCode && <span className="sub">{REJECT_CODE_LABEL[e.trainerDecision.reasonCode]}</span>}</td>
                    <td>{e.status === 'WAITING_TRAINER' ? <Deadline entry={e} /> : <span className="sub">—</span>}</td>
                    <td className="num">
                      {e.status === 'WAITING_TRAINER' && (
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button type="button" className="ht-btn ht-btn--primary ht-btn--sm" data-testid={`trainer-approve-${e.id}`} onClick={() => open(e, true)}><Icon name="check" />Sẵn sàng</button>
                          <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" data-testid={`trainer-reject-${e.id}`} onClick={() => open(e, false)}><Icon name="x" />Từ chối</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {list.length === 0 && <div className="ht-empty" data-testid="trainer-entry-empty">Không có đề xuất nào chờ xác nhận.</div>}
        </div>
      </Panel>
      <Dialog open={!!deciding} onClose={() => setDeciding(null)} busy={act.busy} icon={approve ? 'check' : 'x'} tone={approve ? 'brand' : 'danger'} testId="trainer-decision-dialog"
        title={`${approve ? 'Xác nhận sẵn sàng' : 'Từ chối đề xuất'} · ${deciding?.horseName ?? ''} · ${decidingTour?.name ?? ''}`}
        sub={decidingTour ? `${fmtDate(decidingTour.raceDate)} · ${decidingTour.distanceM} m · ${criteriaText(decidingTour)}` : undefined}
        confirmLabel={approve ? 'Xác nhận sẵn sàng' : 'Xác nhận từ chối'} onConfirm={save}>
        {act.error && <Callout tone="danger" style={{ marginBottom: 14 }}>{act.error}</Callout>}
        <div style={{ display: 'grid', gap: 14 }}>
          {!approve && (
            <>
              <div className="ht-field" style={{ margin: 0 }}>
                <label className="ht-label" htmlFor="trainer-reason-code">Lý do<span className="ht-req">*</span></label>
                <select id="trainer-reason-code" data-testid="trainer-reason-code" className="ht-select" value={code} onChange={(e) => setCode(e.target.value as RejectCode)}>
                  <option value="">— Chọn lý do —</option>
                  {(Object.keys(REJECT_CODE_LABEL) as RejectCode[]).map((c) => <option key={c} value={c}>{REJECT_CODE_LABEL[c]}</option>)}
                </select>
              </div>
              <ReasonField id="trainer-reason-note" label="Giải thích cho chủ ngựa" value={note} onChange={setNote} placeholder="VD: Ngựa mới chạy 2 tuần giáo án sức bền, chưa đủ cho cự ly 1600 m." />
            </>
          )}
          {approve && (
            <div className="ht-field" style={{ margin: 0 }}>
              <label className="ht-label" htmlFor="trainer-approve-note">Ghi chú (không bắt buộc)</label>
              <textarea id="trainer-approve-note" data-testid="trainer-approve-note" className="ht-textarea" style={{ minHeight: 56 }} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
};
