import React, { useState } from 'react';
import { RaceProposal, Tournament, trainerApi } from '../../../api/trainerApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Callout, Dialog, ReasonField } from '../../../components/ui/Ht';
import type { ProposalDialog } from './ProposalDetail';

interface Props { kind: ProposalDialog; proposal: RaceProposal; tournament?: Tournament; onClose: () => void; onDone: () => void }

/* Manual organizer steps (no integration yet): mark submitted, organizer rejected, record the result. Mounted only while open. */
export const OrganizerDialog: React.FC<Props> = ({ kind, proposal: p, tournament: t, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const [reason, setReason] = useState('');
  const [result, setResult] = useState({ rank: '', time: '', note: '' });
  const go = async (fn: () => Promise<unknown>, msg: string) => { if (await run(fn, msg)) onDone(); };

  if (kind === 'submit') return (
    <Dialog open onClose={onClose} icon="send" tone="brand" busy={busy}
      title={`Đã gửi hồ sơ ${p.horseName} cho ban tổ chức?`} sub={`${t?.name} · hạn ${t?.deadline}`}
      confirmLabel="Xác nhận đã gửi" onConfirm={() => go(() => trainerApi.markSubmitted(p, actor), `${p.id}: đã đánh dấu gửi ban tổ chức.`)}>
      <p style={{ margin: 0, fontSize: 14 }}>Chỉ xác nhận khi bạn đã thực sự nộp hồ sơ cho ban tổ chức. Trạng thái chuyển <span className="ht-mono">SUBMITTED</span>.</p>
      {error && <Callout tone="danger" style={{ marginTop: 12 }}>{error}</Callout>}
    </Dialog>
  );

  if (kind === 'reject') return (
    <Dialog open onClose={onClose} icon="x" tone="danger" danger busy={busy} title="Ban tổ chức từ chối hồ sơ" sub={`${p.id} · ${p.horseName}`}
      confirmLabel="Ghi nhận từ chối" onConfirm={() => go(() => trainerApi.markOrganizerRejected(p, reason, actor), `${p.id}: đã ghi nhận ban tổ chức từ chối.`)}>
      <ReasonField id="org-reason" label="Lý do ban tổ chức đưa ra" value={reason} onChange={setReason} error={error || undefined} placeholder="VD: Hồ sơ khám quá 30 ngày." />
    </Dialog>
  );

  return (
    <Dialog open onClose={onClose} icon="trend" tone="brand" busy={busy} title={`Kết quả thi đấu · ${p.horseName}`} sub={t?.name}
      confirmLabel="Lưu kết quả" onConfirm={() => go(() => trainerApi.recordResult(p, { rank: Number(result.rank), time: result.time.trim(), note: result.note }, actor), `${p.id}: đã lưu kết quả.`)}>
      <div className="ht-grid-2">
        <div className="ht-field"><label className="ht-label" htmlFor="rs-rank">Thứ hạng<span className="ht-req">*</span></label><input id="rs-rank" type="number" min={1} className="ht-input" value={result.rank} onChange={(e) => setResult({ ...result, rank: e.target.value })} /></div>
        <div className="ht-field"><label className="ht-label" htmlFor="rs-time">Thời gian<span className="ht-req">*</span></label><input id="rs-time" className="ht-input" style={{ fontFamily: 'var(--font-mono)' }} value={result.time} placeholder="1:38.42" onChange={(e) => setResult({ ...result, time: e.target.value })} /></div>
      </div>
      <label className="ht-label" htmlFor="rs-note" style={{ display: 'block', marginBottom: 6 }}>Ghi chú</label>
      <textarea id="rs-note" className="ht-textarea" style={{ minHeight: 64 }} value={result.note} onChange={(e) => setResult({ ...result, note: e.target.value })} />
      {error && <Callout tone="danger" style={{ marginTop: 12 }}>{error}</Callout>}
    </Dialog>
  );
};
