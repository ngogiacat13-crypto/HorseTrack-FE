import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useActor } from '../../auth/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { useAction } from '../../hooks/useAction';
import { Callout, Dialog, PageHeader, Panel, ReasonField, Segmented, Tabs } from '../../components/ui/Ht';
import { Icon } from '../../components/ui/Icon';
import { LoadState } from '../../components/trainer/TrainerParts';
import { criteriaText, fmtDate, fmtDateTime } from './logic';
import { Deadline, EntryBadge } from './parts';
import { tournamentApi } from './tournamentApi';
import type { RaceEntry } from './types';

type Tab = 'waiting' | 'done';

export const VetRaceEntryExams: React.FC = () => {
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => tournamentApi.vetQueue());
  const [tab, setTab] = useState<Tab>('waiting');
  const [examFor, setExamFor] = useState<RaceEntry | null>(null);
  const [pass, setPass] = useState(true);
  const [note, setNote] = useState('');
  const act = useAction();
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const tour = (id: string) => data.tournaments.find((t) => t.id === id);
  const waiting = data.entries.filter((e) => e.status === 'WAITING_VET_EXAM').sort((a, b) => (a.stageDeadline ?? '').localeCompare(b.stageDeadline ?? ''));
  const done = data.entries.filter((e) => e.vetResult).sort((a, b) => (b.vetResult?.at ?? '').localeCompare(a.vetResult?.at ?? ''));
  const list = tab === 'waiting' ? waiting : done;
  const examTour = examFor ? tour(examFor.tournamentId) : undefined;
  const open = (e: RaceEntry) => { act.setError(''); setPass(true); setNote(''); setExamFor(e); };
  const save = async () => {
    if (!examFor) return;
    if (await act.run(() => tournamentApi.vetExam(examFor, pass, note, actor), pass ? `${examFor.horseName} ĐẠT — đã phát hành hóa đơn lệ phí cho chủ ngựa.` : `${examFor.horseName} KHÔNG ĐẠT — suất được trả cho hàng chờ.`)) { setExamFor(null); reload(); }
  };

  return (
    <div className="ht ht-page">
      <PageHeader title="Khám trước thi đấu" sub="Khám trong 3 ngày sau khi HLV xác nhận, sắp xếp theo hạn gần nhất. ĐẠT → hệ thống phát hành hóa đơn lệ phí; KHÔNG ĐẠT hoặc quá hạn → mất suất." />
      <Tabs<Tab> value={tab} onChange={setTab} items={[{ value: 'waiting', label: 'Chờ khám', count: waiting.length }, { value: 'done', label: 'Đã có kết quả', count: done.length }]} />
      <Panel>
        <div style={{ overflowX: 'auto' }}>
          <table className="ht-table" data-testid="vet-entry-table">
            <thead><tr><th>Đề xuất</th><th>Ngựa</th><th>Giải · ngày · cự ly</th><th>{tab === 'waiting' ? 'Hạn khám' : 'Kết quả'}</th><th /></tr></thead>
            <tbody>
              {list.map((e) => {
                const t = tour(e.tournamentId);
                return (
                  <tr key={e.id} data-testid={`vet-entry-${e.id}`}>
                    <td className="id">{e.id}<span className="sub">HLV {e.trainerDecision?.by ?? '—'}</span></td>
                    <td className="strong"><Link to={`/vet/horses/${e.horseId}`}>{e.horseName}</Link><span className="sub">Chủ: {e.owner}</span></td>
                    <td>{t?.name}<span className="sub mono">{fmtDate(t?.raceDate)} · {t?.distanceM} m · {t?.location}</span></td>
                    <td>{tab === 'waiting'
                      ? <Deadline entry={e} testId={`vet-entry-deadline-${e.id}`} />
                      : <><b style={{ color: e.vetResult?.pass ? 'var(--success-ink)' : 'var(--danger-ink)' }}>{e.vetResult?.pass ? 'ĐẠT' : 'KHÔNG ĐẠT'}</b><span className="sub">{e.vetResult?.note}</span><span className="sub">{fmtDateTime(e.vetResult?.at)} · <EntryBadge status={e.status} /></span></>}</td>
                    <td className="num">{tab === 'waiting' && <button type="button" className="ht-btn ht-btn--primary ht-btn--sm" data-testid={`vet-exam-${e.id}`} onClick={() => open(e)}><Icon name="clip" />Ghi kết quả khám</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {list.length === 0 && <div className="ht-empty">{tab === 'waiting' ? 'Không có ngựa nào chờ khám.' : 'Chưa có kết quả.'}</div>}
        </div>
      </Panel>
      <Dialog open={!!examFor} onClose={() => setExamFor(null)} busy={act.busy} icon="clip" tone="brand" width={600} testId="vet-exam-dialog"
        title={`Kết quả khám trước thi đấu · ${examFor?.horseName ?? ''}`}
        sub={examTour ? `${examTour.name} · ${fmtDate(examTour.raceDate)} · ${examTour.distanceM} m · ${criteriaText(examTour)}` : undefined}
        confirmLabel="Lưu kết quả" onConfirm={save}>
        {act.error && <Callout tone="danger" style={{ marginBottom: 14 }}>{act.error}</Callout>}
        <div style={{ display: 'grid', gap: 14 }}>
          <Segmented<'pass' | 'fail'> label="Kết luận" value={pass ? 'pass' : 'fail'} onChange={(v) => setPass(v === 'pass')} items={[{ value: 'pass', label: 'ĐẠT' }, { value: 'fail', label: 'KHÔNG ĐẠT' }]} />
          <ReasonField id="vet-exam-note" label={pass ? 'Nhận xét khám lâm sàng' : 'Lý do không đạt'} value={note} onChange={setNote}
            placeholder={pass ? 'VD: Tim phổi bình thường, dáng đi đều, không đau khi sờ nắn chi.' : 'VD: Còn viêm móng chân sau trái.'} />
        </div>
      </Dialog>
    </div>
  );
};
