import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PROPOSAL_LABEL, ProposalStatus, RaceProposal, trainerApi } from '../../api/trainerApi';
import type { ApiError } from '../../api/http';
import { useActor } from '../../auth/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { Icon } from '../../components/ui/Icon';
import { Badge, Callout, Dialog, PageHeader, Panel, ReasonField, StatCard, Tabs, Timeline, useToast } from '../../components/ui/Ht';
import { LoadState } from '../../components/trainer/TrainerParts';

type Tab = 'proposals' | 'tournaments';

/* BR_04 pipeline shown as 5 steps. */
const STEPS = ['Đề xuất', 'Khám trước thi đấu', 'Chủ ngựa đồng ý', 'Gửi ban tổ chức', 'Kết quả'] as const;
const stepOf = (s: ProposalStatus): { at: number; failed: boolean } => ({
  PROPOSED: { at: 0, failed: false }, WAITING_VET_EXAM: { at: 1, failed: false }, VET_FAILED: { at: 1, failed: true },
  WAITING_OWNER: { at: 2, failed: false }, OWNER_DECLINED: { at: 2, failed: true }, READY_TO_SUBMIT: { at: 3, failed: false },
  SUBMITTED: { at: 4, failed: false }, REJECTED_BY_ORGANIZER: { at: 3, failed: true }, RESULT_RECORDED: { at: 5, failed: false },
}[s]);

/* 3.1 danh sách giải · 3.4 theo dõi đề xuất · 3.5 nhập kết quả */
export const TrainerRaces: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const actor = useActor();
  const [params] = useSearchParams();
  const { data, loading, error, reload } = useFetch(() => trainerApi.getRaces(actor), [actor]);
  const [tab, setTab] = useState<Tab>('proposals');
  const [sel, setSel] = useState<string | null>(params.get('p'));
  const [dlg, setDlg] = useState<null | 'submit' | 'reject' | 'result'>(null);
  const [reason, setReason] = useState('');
  const [result, setResult] = useState({ rank: '', time: '', note: '' });
  const [dErr, setDErr] = useState('');
  const [busy, setBusy] = useState(false);

  const proposals = useMemo(() => [...(data?.proposals ?? [])].sort((a, b) => b.id.localeCompare(a.id)), [data]);
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const t = (id: string) => data.tournaments.find((x) => x.id === id);
  const p = proposals.find((x) => x.id === sel) ?? proposals[0];
  const n = (...st: ProposalStatus[]) => proposals.filter((x) => st.includes(x.status)).length;
  const results = proposals.filter((x) => x.result);

  const run = async (fn: () => Promise<RaceProposal>, msg: string) => {
    setBusy(true);
    setDErr('');
    try {
      await fn();
      toast(msg);
      setDlg(null);
      reload();
    } catch (e) {
      setDErr((e as ApiError).message ?? 'Cập nhật thất bại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ht ht-page">
      <PageHeader
        title="Giải đua & đề xuất thi đấu"
        sub="HLV đề xuất → Bác sĩ khám trước thi đấu → Chủ ngựa đồng ý → gửi hồ sơ cho ban tổ chức (BR_04)."
        actions={<Link className="ht-btn ht-btn--primary" to="/trainer/races/new"><Icon name="send" />Tạo đề xuất</Link>}
      />

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
          <div>
            <Panel>
              <table className="ht-table">
                <thead><tr><th>Mã</th><th>Ngựa · chủ</th><th>Giải · ngày</th><th>Trạng thái</th><th>Tạo</th></tr></thead>
                <tbody>
                  {proposals.map((x) => (
                    <tr key={x.id} data-href tabIndex={0} className={p?.id === x.id ? 'is-selected' : undefined}
                      onClick={() => setSel(x.id)} onKeyDown={(e) => e.key === 'Enter' && setSel(x.id)}>
                      <td className="id">{x.id}</td>
                      <td><span className="strong">{x.horseName}</span><span className="sub">{x.owner}</span></td>
                      <td>{t(x.tournamentId)?.name}<span className="sub mono">{t(x.tournamentId)?.date} · {t(x.tournamentId)?.distance}</span></td>
                      <td><Badge tone={PROPOSAL_LABEL[x.status][1]}>{PROPOSAL_LABEL[x.status][0]}</Badge>{x.result && <span className="sub">Hạng {x.result.rank} · <span className="ht-mono">{x.result.time}</span></span>}</td>
                      <td className="mono">{x.createdAt.slice(0, 5)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {proposals.length === 0 && <div className="ht-empty">Chưa có đề xuất.</div>}
            </Panel>
          </div>

          {p && (
            <div>
              <Panel as="h3" title={<>{p.horseName} · <span className="ht-mono" style={{ fontWeight: 500 }}>{p.id}</span></>} sub={t(p.tournamentId)?.name}
                right={<Badge tone={PROPOSAL_LABEL[p.status][1]}>{PROPOSAL_LABEL[p.status][0]}</Badge>} headStyle={{ alignItems: 'flex-start' }}>
                <div className="ht-panel__body" style={{ display: 'grid', gap: 16 }}>
                  <ol className="ht-stepper" style={{ flexWrap: 'wrap', rowGap: 8 }} aria-label="Tiến trình đề xuất">
                    {STEPS.map((label, i) => {
                      const st = stepOf(p.status);
                      const state = i < st.at ? 'done' : i === st.at && !st.failed && st.at < 5 ? 'current' : undefined;
                      const failedHere = st.failed && i === st.at;
                      return (
                        <li key={label} className="ht-step" data-state={state} style={failedHere ? { color: 'var(--danger-ink)' } : undefined}>
                          <span className="ht-step__dot" style={failedHere ? { background: 'var(--danger-ink)', borderColor: 'var(--danger-ink)', color: 'var(--on-primary)' } : undefined}>
                            {state === 'done' ? <Icon name="check" /> : failedHere ? <Icon name="x" /> : i + 1}
                          </span>{label}
                        </li>
                      );
                    })}
                  </ol>

                  <dl className="ht-kv">
                    <dt>Giải</dt><dd>{t(p.tournamentId)?.name}</dd>
                    <dt>Ngày · cự ly</dt><dd><span className="ht-mono">{t(p.tournamentId)?.date}</span> · {t(p.tournamentId)?.distance}</dd>
                    <dt>Địa điểm</dt><dd>{t(p.tournamentId)?.venue}</dd>
                    <dt>Chủ ngựa</dt><dd>{p.owner}</dd>
                    {p.vetResult && <><dt>Khám thi đấu</dt><dd><b style={{ color: p.vetResult.pass ? 'var(--success-ink)' : 'var(--danger-ink)' }}>{p.vetResult.pass ? 'ĐẠT' : 'KHÔNG ĐẠT'}</b> · BS {p.vetResult.by} · <span className="ht-mono">{p.vetResult.at}</span><br /><span style={{ color: 'var(--muted)' }}>{p.vetResult.note}</span></dd></>}
                    {p.ownerResponse && <><dt>Chủ ngựa</dt><dd><b style={{ color: p.ownerResponse.agree ? 'var(--success-ink)' : 'var(--danger-ink)' }}>{p.ownerResponse.agree ? 'Đồng ý' : 'Từ chối'}</b> · <span className="ht-mono">{p.ownerResponse.at}</span>{p.ownerResponse.reason && <><br /><span style={{ color: 'var(--muted)' }}>{p.ownerResponse.reason}</span></>}</dd></>}
                    {p.result && <><dt>Kết quả</dt><dd><b>Hạng {p.result.rank}</b> · <span className="ht-mono">{p.result.time}</span>{p.result.note && <><br /><span style={{ color: 'var(--muted)' }}>{p.result.note}</span></>}</dd></>}
                    {p.organizerReason && <><dt>BTC từ chối</dt><dd>{p.organizerReason}</dd></>}
                  </dl>

                  {p.status === 'READY_TO_SUBMIT' && (
                    <button type="button" className="ht-btn ht-btn--primary ht-btn--block" onClick={() => { setDErr(''); setDlg('submit'); }}><Icon name="send" />Đánh dấu đã gửi ban tổ chức</button>
                  )}
                  {p.status === 'SUBMITTED' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <button type="button" className="ht-btn ht-btn--secondary" style={{ color: 'var(--danger-ink)' }} onClick={() => { setReason(''); setDErr(''); setDlg('reject'); }}>BTC từ chối</button>
                      <button type="button" className="ht-btn ht-btn--primary" onClick={() => { setResult({ rank: '', time: '', note: '' }); setDErr(''); setDlg('result'); }}>Nhập kết quả</button>
                    </div>
                  )}
                  {(p.status === 'WAITING_VET_EXAM' || p.status === 'WAITING_OWNER') && (
                    <Callout tone="info">{p.status === 'WAITING_VET_EXAM' ? 'Đang chờ Bác sĩ thú y khám trước thi đấu.' : 'Bác sĩ đã xác nhận ĐẠT. Đang chờ chủ ngựa đồng ý.'} Bạn chỉ theo dõi ở bước này.</Callout>
                  )}

                  <div>
                    <div className="ht-overline" style={{ marginBottom: 10 }}>Lịch sử</div>
                    <Timeline items={p.history.map((h) => ({ tone: h.tone, what: <><b>{h.who}</b> {h.text}</>, when: h.at }))} />
                  </div>
                </div>
              </Panel>
            </div>
          )}
        </div>
      ) : (
        <Panel sub="Do Quản lý CLB nhập/cập nhật. HLV chọn giải để đề xuất ngựa.">
          <table className="ht-table">
            <thead><tr><th>Giải đấu</th><th>Ngày · cự ly</th><th>Địa điểm</th><th>Hạn đăng ký</th><th>Điều kiện</th><th /></tr></thead>
            <tbody>
              {data.tournaments.map((x) => (
                <tr key={x.id}>
                  <td><span className="strong">{x.name}</span><span className="sub">{x.organizer}</span></td>
                  <td><span className="mono">{x.date}</span><span className="sub">{x.distance}</span></td>
                  <td>{x.venue}</td>
                  <td className="mono">{x.finished ? <Badge tone="neutral">Đã diễn ra</Badge> : x.deadline}</td>
                  <td style={{ maxWidth: 240 }}>{x.conditions}<span className="sub">{x.source}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    {!x.finished && <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" onClick={() => navigate(`/trainer/races/new?t=${x.id}`)}>Đề xuất ngựa</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      <div style={{ marginTop: 24 }}>
        <Callout tone="demo" title="Gửi hồ sơ chính thức nằm ngoài hệ thống">
          CLB chưa tích hợp với ban tổ chức. “Đã gửi BTC”, “BTC từ chối” và kết quả thi đấu do HLV cập nhật thủ công sau khi làm việc với ban tổ chức (BR_04).
        </Callout>
      </div>

      {p && (
        <>
          <Dialog open={dlg === 'submit'} onClose={() => setDlg(null)} icon="send" tone="brand" busy={busy}
            title={`Đã gửi hồ sơ ${p.horseName} cho ban tổ chức?`} sub={`${t(p.tournamentId)?.name} · hạn ${t(p.tournamentId)?.deadline}`}
            confirmLabel="Xác nhận đã gửi" onConfirm={() => run(() => trainerApi.markSubmitted(p, actor), `${p.id}: đã đánh dấu gửi ban tổ chức.`)}>
            <p style={{ margin: 0, fontSize: 14 }}>Chỉ xác nhận khi bạn đã thực sự nộp hồ sơ cho ban tổ chức. Trạng thái chuyển <span className="ht-mono">SUBMITTED</span>.</p>
            {dErr && <Callout tone="danger" style={{ marginTop: 12 }}>{dErr}</Callout>}
          </Dialog>

          <Dialog open={dlg === 'reject'} onClose={() => setDlg(null)} icon="x" tone="danger" danger busy={busy}
            title="Ban tổ chức từ chối hồ sơ" sub={`${p.id} · ${p.horseName}`}
            confirmLabel="Ghi nhận từ chối" onConfirm={() => run(() => trainerApi.markOrganizerRejected(p, reason, actor), `${p.id}: đã ghi nhận ban tổ chức từ chối.`)}>
            <ReasonField id="org-reason" label="Lý do ban tổ chức đưa ra" value={reason} onChange={setReason} error={dErr} placeholder="VD: Hồ sơ khám quá 30 ngày." />
          </Dialog>

          <Dialog open={dlg === 'result'} onClose={() => setDlg(null)} icon="trend" tone="brand" busy={busy}
            title={`Kết quả thi đấu · ${p.horseName}`} sub={t(p.tournamentId)?.name}
            confirmLabel="Lưu kết quả" onConfirm={() => run(() => trainerApi.recordResult(p, { rank: Number(result.rank), time: result.time.trim(), note: result.note }, actor), `${p.id}: đã lưu kết quả.`)}>
            <div className="ht-grid-2">
              <div className="ht-field"><label className="ht-label" htmlFor="rs-rank">Thứ hạng<span className="ht-req">*</span></label><input id="rs-rank" type="number" min={1} className="ht-input" value={result.rank} onChange={(e) => setResult({ ...result, rank: e.target.value })} /></div>
              <div className="ht-field"><label className="ht-label" htmlFor="rs-time">Thời gian<span className="ht-req">*</span></label><input id="rs-time" className="ht-input" style={{ fontFamily: 'var(--font-mono)' }} value={result.time} placeholder="1:38.42" onChange={(e) => setResult({ ...result, time: e.target.value })} /></div>
            </div>
            <label className="ht-label" htmlFor="rs-note" style={{ display: 'block', marginBottom: 6 }}>Ghi chú</label>
            <textarea id="rs-note" className="ht-textarea" style={{ minHeight: 64 }} value={result.note} onChange={(e) => setResult({ ...result, note: e.target.value })} />
            {dErr && <Callout tone="danger" style={{ marginTop: 12 }}>{dErr}</Callout>}
          </Dialog>
        </>
      )}
    </div>
  );
};
