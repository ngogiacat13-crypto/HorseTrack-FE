import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ownerApi, type OwnerInvoice } from '../../api/ownerApi';
import { useActor } from '../../auth/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { useAction } from '../../hooks/useAction';
import { Callout, Dialog, PageHeader, Panel, ReasonField, money } from '../../components/ui/Ht';
import { Icon } from '../../components/ui/Icon';
import { LoadState } from '../../components/trainer/TrainerParts';
import { PATH } from '../../routers/routerPath';
import { REJECT_CODE_LABEL, STAGE_HINT } from './labels';
import { CANCELLABLE, fmtDate, fmtDateTime } from './logic';
import { Deadline, EntryBadge, EntryTimeline, TournamentFacts } from './parts';
import { DossierDialog } from './DossierDialog';
import { tournamentApi } from './tournamentApi';
import type { RaceEntry } from './types';

export const OwnerEntries: React.FC = () => {
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(async () => {
    const [entries, invoices] = await Promise.all([tournamentApi.myEntries(actor), ownerApi.getMyInvoices(actor)]);
    return { ...entries, invoices: invoices.invoices.map((item) => item.invoice) };
  }, [actor]);
  const [sel, setSel] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<RaceEntry | null>(null);
  const [complaining, setComplaining] = useState<RaceEntry | null>(null);
  const [dossierOf, setDossierOf] = useState<RaceEntry | null>(null);
  const [reason, setReason] = useState('');
  const act = useAction();
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const tour = (id: string) => data.tournaments.find((t) => t.id === id);
  const cur = data.entries.find((e) => e.id === sel) ?? data.entries[0];
  const t = cur ? tour(cur.tournamentId) : undefined;
  const invoiceById = new Map<string, OwnerInvoice>(data.invoices.map((invoice) => [invoice.id, invoice]));
  const entryInvoice = cur?.invoiceId ? invoiceById.get(cur.invoiceId) : undefined;
  const doCancel = async () => {
    if (!cancelling) return;
    if (await act.run(() => tournamentApi.cancel(cancelling, actor), `Đã hủy đề xuất ${cancelling.id} và trả suất.`)) { setCancelling(null); reload(); }
  };
  const doComplain = async () => {
    if (!complaining) return;
    if (await act.run(() => tournamentApi.complain(complaining, reason, actor), 'Đã gửi khiếu nại tới Quản lý CLB.')) { setComplaining(null); reload(); }
  };

  return (
    <div className="ht ht-page">
      <PageHeader title="Đề xuất của tôi" sub="Theo dõi từng bước giữ suất: HLV xác nhận (2 ngày) → bác sĩ khám (3 ngày) → nộp lệ phí (2 ngày). Hồ sơ gửi ban tổ chức và thi đấu diễn ra ngoài hệ thống." />
      <div className="ht-cols" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)' }}>
        <Panel title="Đề xuất" sub={`${data.entries.length} đề xuất`}>
          <div style={{ overflowX: 'auto' }}>
            <table className="ht-table" data-testid="owner-entry-table">
              <thead><tr><th>Mã</th><th>Ngựa · giải</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {data.entries.map((e) => (
                  <tr key={e.id} data-testid={`owner-entry-${e.id}`} onClick={() => setSel(e.id)} style={{ cursor: 'pointer', background: e.id === cur?.id ? 'var(--primary-soft)' : undefined }}>
                    <td className="id">{e.id}</td>
                    <td className="strong">{e.horseName}<span className="sub">{tour(e.tournamentId)?.name} · {fmtDate(tour(e.tournamentId)?.raceDate)}</span></td>
                    <td>
                      <EntryBadge status={e.status} statusLabel={e.statusLabel} />
                      {e.status === 'WAITLISTED' && e.queuePosition && <span className="sub">Vị trí chờ #{e.queuePosition}</span>}
                      {e.status === 'WAITING_TRAINER' && e.stageDeadline && <span className="sub">Giữ suất · hạn HLV <Deadline entry={e} testId={`owner-entry-deadline-${e.id}`} /></span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.entries.length === 0 && <div className="ht-empty">Chưa có đề xuất. Vào <Link to={PATH.owner.tournaments}>Giải đấu</Link> để chọn ngựa.</div>}
          </div>
        </Panel>
        {cur && (
          <div>
            <Panel title={<>{cur.horseName} · <span className="ht-mono">{cur.id}</span></>} right={<EntryBadge status={cur.status} statusLabel={cur.statusLabel} />} sub={`Đề xuất lúc ${fmtDateTime(cur.createdAt)}`}>
              <div className="ht-panel__body" style={{ display: 'grid', gap: 14 }} data-testid="owner-entry-detail">
                {cur.stageDeadline && (
                  <Callout tone="demo" icon="clock" title="Hạn bước hiện tại">
                    <Deadline entry={cur} testId="owner-entry-deadline" />
                    {STAGE_HINT[cur.status] && <div style={{ marginTop: 4 }}>{STAGE_HINT[cur.status]}</div>}
                  </Callout>
                )}
                {cur.status === 'INELIGIBLE' && <Callout tone="danger" title="Ngựa không còn đủ điều kiện" testId="owner-entry-ineligible">
                  {cur.closedReason && <div>{cur.closedReason}</div>}
                  {cur.closedAt && <small>Đã đóng lúc {fmtDateTime(cur.closedAt)}</small>}
                </Callout>}
                {entryInvoice?.status === 'REFUNDED' && <Callout tone="info" title="Đã hoàn lệ phí" testId="owner-entry-refund">
                  Hóa đơn <span className="ht-mono">{entryInvoice.id}</span> · {money(entryInvoice.amount)}
                </Callout>}
                {cur.status === 'WAITLISTED' && <Callout tone="info" testId="owner-entry-queue">Bạn đang ở vị trí <b>#{cur.queuePosition}</b> trong hàng chờ. {STAGE_HINT.WAITLISTED}</Callout>}
                {cur.status === 'TRAINER_REJECTED' && (
                  <Callout tone="danger" title={`HLV từ chối: ${cur.trainerDecision?.reasonCode ? REJECT_CODE_LABEL[cur.trainerDecision.reasonCode] : ''}`}>
                    {cur.trainerDecision?.note}
                    {cur.complaint && <div style={{ marginTop: 6 }}><b>Khiếu nại:</b> {cur.complaint.status === 'OPEN' ? 'đang chờ Quản lý CLB xử lý' : cur.complaint.status === 'ACCEPTED' ? 'được chấp nhận' : `bị bác — ${cur.complaint.decisionNote}`}</div>}
                  </Callout>
                )}
                {cur.vetResult && <Callout tone={cur.vetResult.pass ? 'success' : 'danger'} title={`Khám trước thi đấu: ${cur.vetResult.pass ? 'ĐẠT' : 'KHÔNG ĐẠT'}`}>{cur.vetResult.note} <small>· BS {cur.vetResult.by} · {fmtDateTime(cur.vetResult.at)}</small></Callout>}
                {cur.result && <Callout tone="success" title={`Kết quả: hạng ${cur.result.rank} · ${cur.result.finishTime}`} testId="owner-entry-result">{cur.result.prize ? `Tiền thưởng ${money(cur.result.prize)}.` : 'Không có tiền thưởng cho thứ hạng này.'}</Callout>}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {cur.status === 'WAITING_PAYMENT' && cur.invoiceId && <Link to={`/owner/invoices/${cur.invoiceId}`} className="ht-btn ht-btn--primary" data-testid="entry-pay-btn"><Icon name="card" size={16} />Nộp lệ phí {t ? money(t.entryFee) : ''}</Link>}
                  {['REGISTERED', 'RESULT_RECORDED'].includes(cur.status) && <button type="button" className="ht-btn ht-btn--secondary" data-testid="entry-dossier-btn" onClick={() => setDossierOf(cur)}><Icon name="file" size={16} />Xem hồ sơ đăng ký</button>}
                  {cur.status === 'TRAINER_REJECTED' && !cur.complaint && cur.canComplain !== false && <button type="button" className="ht-btn ht-btn--secondary" data-testid="entry-complain-btn" onClick={() => { act.setError(''); setReason(''); setComplaining(cur); }}><Icon name="alert" size={16} />Khiếu nại</button>}
                  {CANCELLABLE.includes(cur.status) && <button type="button" className="ht-btn ht-btn--secondary" data-testid="entry-cancel-btn" onClick={() => { act.setError(''); setCancelling(cur); }}><Icon name="x" size={16} />Hủy đề xuất</button>}
                </div>
                {t && <TournamentFacts t={t} />}
              </div>
            </Panel>
            <Panel as="h3" title="Diễn biến"><div className="ht-panel__body"><EntryTimeline entry={cur} /></div></Panel>
          </div>
        )}
      </div>
      <Dialog open={!!cancelling} onClose={() => setCancelling(null)} busy={act.busy} icon="x" tone="danger" danger testId="entry-cancel-dialog"
        title={`Hủy đề xuất ${cancelling?.id ?? ''}`} sub="Suất được trả cho người đầu hàng chờ. Đề xuất lại sau này sẽ xếp cuối hàng." confirmLabel="Hủy đề xuất" onConfirm={doCancel}>
        {act.error && <Callout tone="danger">{act.error}</Callout>}
      </Dialog>
      <Dialog open={!!complaining} onClose={() => setComplaining(null)} busy={act.busy} icon="alert" tone="brand" testId="entry-complaint-dialog"
        title={`Khiếu nại quyết định của HLV · ${complaining?.horseName ?? ''}`} sub="Quản lý CLB xem lý do của HLV và quyết định cuối cùng." confirmLabel="Gửi khiếu nại" onConfirm={doComplain}>
        {act.error && <Callout tone="danger" style={{ marginBottom: 14 }}>{act.error}</Callout>}
        <ReasonField id="entry-complaint-reason" label="Nội dung khiếu nại" value={reason} onChange={setReason} placeholder="VD: Ngựa đã về nhì ở cự ly này tháng trước, đề nghị xem lại." />
      </Dialog>
      {dossierOf && <DossierDialog entry={dossierOf} onClose={() => setDossierOf(null)} />}
    </div>
  );
};
