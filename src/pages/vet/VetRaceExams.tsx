import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ApiError } from '../../api/http';
import { PROPOSAL_LABEL, RaceProposal } from '../../api/trainerApi';
import { blockingWindows, drugWindows, vetApi } from '../../api/vetApi';
import { useActor } from '../../auth/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { Icon } from '../../components/ui/Icon';
import { Badge, Callout, Dialog, PageHeader, Panel, ReasonField, Segmented, Tabs, useToast } from '../../components/ui/Ht';
import { HorseBadges, LoadState } from '../../components/trainer/TrainerParts';

type Tab = 'waiting' | 'done';

/* 5.1 Nhận yêu cầu khám · 5.2 Khám lâm sàng · 5.3 Ghi kết quả ĐẠT/KHÔNG ĐẠT · 5.4 Gửi kết quả cho HLV và chủ ngựa (BR_04) */
export const VetRaceExams: React.FC = () => {
  const actor = useActor();
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => vetApi.getRaceExams());
  const [tab, setTab] = useState<Tab>('waiting');
  const [examFor, setExamFor] = useState<RaceProposal | null>(null);
  const [f, setF] = useState({ pass: true, note: '', conditions: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const proposals = useMemo(() => data?.proposals ?? [], [data]);
  const waiting = proposals.filter((p) => p.status === 'WAITING_VET_EXAM');
  const done = proposals.filter((p) => p.vetResult);
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const tour = (id: string) => data.tournaments.find((t) => t.id === id);
  const horseOf = (id: string) => data.horses.find((h) => h.id === id);
  const examHorse = examFor ? horseOf(examFor.horseId) : undefined;
  const blocked = examHorse && (examHorse.trainingLocked || examHorse.health === 'INJURED' || examHorse.health === 'QUARANTINE');
  const list = tab === 'waiting' ? waiting : done;
  /** Drugs still detectable on race day (reference detection times). */
  const risky = (p: RaceProposal) => blockingWindows(drugWindows(data.protocols, data.inventory, p.horseId), tour(p.tournamentId)?.date ?? '');
  const examRisk = examFor ? risky(examFor) : [];

  const open = (p: RaceProposal) => {
    const h = horseOf(p.horseId);
    setExamFor(p);
    setF({ pass: !(h && (h.trainingLocked || h.health === 'INJURED' || h.health === 'QUARANTINE')), note: '', conditions: '' });
    setErr('');
  };
  const save = async () => {
    if (!examFor) return;
    setBusy(true);
    try {
      await vetApi.recordRaceExam(examFor, f, actor);
      toast(`${examFor.id}: ${f.pass ? 'ĐẠT — đã gửi chủ ngựa xác nhận' : 'KHÔNG ĐẠT — quy trình dừng'}. HLV và chủ ngựa được thông báo.`);
      setExamFor(null);
      reload();
    } catch (e) {
      setErr((e as ApiError).message ?? 'Lưu thất bại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ht ht-page">
      <PageHeader title="Khám trước thi đấu" sub="Yêu cầu phát sinh từ đề xuất của HLV trưởng. ĐẠT → chủ ngựa xác nhận; KHÔNG ĐẠT → dừng quy trình đăng ký nội bộ (BR_04)." />
      <Tabs<Tab> value={tab} onChange={setTab} items={[{ value: 'waiting', label: 'Chờ khám', count: waiting.length }, { value: 'done', label: 'Đã có kết quả', count: done.length }]} />
      <Panel>
        <div style={{ overflowX: 'auto' }}>
          <table className="ht-table">
            <thead><tr><th>Đề xuất</th><th>Ngựa</th><th>Giải · ngày · cự ly</th><th>HLV đề xuất</th><th>{tab === 'waiting' ? 'Tình trạng' : 'Kết quả'}</th><th /></tr></thead>
            <tbody>
              {list.map((p) => {
                const t = tour(p.tournamentId);
                const h = horseOf(p.horseId);
                return (
                  <tr key={p.id}>
                    <td className="id">{p.id}<span className="sub">{p.createdAt}</span></td>
                    <td className="strong"><Link to={`/vet/horses/${p.horseId}`}>{p.horseName}</Link><span className="sub">Chủ: {p.owner}</span></td>
                    <td>{t?.name}<span className="sub mono">{t?.date} · {t?.distance} · {t?.venue}</span></td>
                    <td>{p.createdBy}</td>
                    <td>{tab === 'waiting'
                      ? <>{h && <HorseBadges horse={h} compact />}{risky(p).length > 0 && <span className="sub"><Badge tone="warning" plain>Còn thuốc trong thời gian phát hiện</Badge></span>}</>
                      : <><b style={{ color: p.vetResult?.pass ? 'var(--success-ink)' : 'var(--danger-ink)' }}>{p.vetResult?.pass ? 'ĐẠT' : 'KHÔNG ĐẠT'}</b><span className="sub">{p.vetResult?.note}</span><span className="sub"><Badge tone={PROPOSAL_LABEL[p.status][1]} plain>{PROPOSAL_LABEL[p.status][0]}</Badge></span></>}</td>
                    <td className="num">{tab === 'waiting' && <button type="button" className="ht-btn ht-btn--primary ht-btn--sm" onClick={() => open(p)}><Icon name="clip" />Ghi kết quả khám</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {list.length === 0 && <div className="ht-empty">{tab === 'waiting' ? 'Không có yêu cầu khám nào đang chờ.' : 'Chưa có kết quả.'}</div>}
        </div>
      </Panel>

      <Dialog open={!!examFor} onClose={() => setExamFor(null)} icon="clip" tone="brand" width={600} busy={busy} busyLabel="Đang gửi…"
        title={`Kết quả khám trước thi đấu · ${examFor?.horseName ?? ''}`}
        sub={examFor ? `${examFor.id} · ${tour(examFor.tournamentId)?.name} · ${tour(examFor.tournamentId)?.date} · điều kiện: ${tour(examFor.tournamentId)?.conditions ?? '—'}` : undefined}
        confirmLabel="Lưu & gửi cho HLV và chủ ngựa" onConfirm={save}>
        {err && <Callout tone="danger" style={{ marginBottom: 14 }}>{err}</Callout>}
        {blocked && <Callout tone="danger" icon="lock" style={{ marginBottom: 14 }}>{examHorse?.name} đang {examHorse?.trainingLocked ? 'bị khóa huấn luyện' : examHorse?.health === 'INJURED' ? 'chấn thương' : 'cách ly'} — chỉ có thể kết luận KHÔNG ĐẠT.</Callout>}
        {examRisk.length > 0 && (
          <Callout tone="demo" icon="warn" title="Thuốc có thể còn bị phát hiện vào ngày đua" style={{ marginBottom: 14 }}>
            {examRisk.map((w) => <div key={w.protocolId + w.drug}>{w.drug} ({w.protocolId}) — liều cuối {w.lastDose}, hết thời gian phát hiện tham khảo từ <b>{w.clearFrom}</b> (~{Math.round(w.hours / 24)} ngày).</div>)}
            <div style={{ marginTop: 6 }}>Đối chiếu quy định của giải trước khi kết luận ĐẠT; ghi điều kiện theo dõi nếu cần.</div>
          </Callout>
        )}
        <div style={{ display: 'grid', gap: 14 }}>
          <Segmented<'pass' | 'fail'> label="Kết luận" value={f.pass ? 'pass' : 'fail'} onChange={(v) => setF({ ...f, pass: v === 'pass' })}
            items={[{ value: 'pass', label: 'ĐẠT' }, { value: 'fail', label: 'KHÔNG ĐẠT' }]} />
          <ReasonField id="rx-note" label={f.pass ? 'Nhận xét khám lâm sàng & thể trạng' : 'Lý do không đạt'} value={f.note} onChange={(v) => setF({ ...f, note: v })}
            placeholder={f.pass ? 'VD: Tim phổi bình thường, dáng đi đều, không đau khi sờ nắn chi.' : 'VD: Còn viêm móng chân sau trái, chưa đủ điều kiện chạy 1200 m.'} />
          {f.pass && (
            <div className="ht-field" style={{ margin: 0 }}>
              <label className="ht-label" htmlFor="rx-cond">Điều kiện cần theo dõi (không bắt buộc)</label>
              <input id="rx-cond" className="ht-input" value={f.conditions} onChange={(e) => setF({ ...f, conditions: e.target.value })} placeholder="VD: Đo nhịp tim nghỉ trước giờ đua." />
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
};
