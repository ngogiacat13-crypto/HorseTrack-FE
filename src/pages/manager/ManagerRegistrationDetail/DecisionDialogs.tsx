import React, { useEffect, useState } from 'react';
import { USE_BACKEND } from '../../../api/beClient';
import { http } from '../../../api/http';
import { managerApi, Registration } from '../../../api/managerApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Callout, Dialog, ReasonField } from '../../../components/ui/Ht';

type Check = Registration['checklist'][number];
interface FreeStall { id: string; beId: number; zone: string; horseId: string | null; status: string }

/* 1.1 — approve: status APPROVED, horse added to the managed list, owner notified. */
export const ApproveDialog: React.FC<{ reg: Registration; checks: Check[]; onClose: () => void; onDone: (note: string) => void }> = ({ reg, checks, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const [note, setNote] = useState('');
  // backend: approving = giving the horse an empty stall
  const [stalls, setStalls] = useState<FreeStall[]>([]);
  const [stallId, setStallId] = useState('');
  useEffect(() => {
    if (!USE_BACKEND) return;
    http.get<FreeStall[]>('/stalls').then(({ data }) => setStalls(data.filter((s) => !s.horseId && s.status !== 'MAINTENANCE' && s.beId)));
  }, []);
  const confirm = async () => {
    const stall = stalls.find((s) => String(s.beId) === stallId);
    if (USE_BACKEND && !stall) { await run(() => Promise.reject(new Error('Chọn chuồng để cấp cho ngựa.')), ''); return; }
    const picked = stall ? { id: stall.beId, code: stall.id } : undefined;
    if (await run(() => managerApi.approveRegistration(reg, checks, note, actor, picked), `Đã phê duyệt ${reg.id} — ${reg.horse.name} được thêm vào danh sách quản lý.`)) onDone(note);
  };
  return (
    <Dialog open onClose={onClose} icon="check" tone="brand" title={`Phê duyệt ${reg.horse.name}?`}
      sub={<>Hồ sơ chuyển <span className="ht-mono">APPROVED</span>, ngựa được thêm vào danh sách quản lý và chủ ngựa nhận thông báo.</>}
      confirmLabel="Xác nhận phê duyệt" onConfirm={confirm} busy={busy}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      {USE_BACKEND && (
        <div style={{ marginBottom: 14 }}>
          <label className="ht-label" htmlFor="ap-stall" style={{ display: 'block', marginBottom: 6 }}>Cấp chuồng<span className="ht-req">*</span></label>
          <select id="ap-stall" className="ht-select" style={{ width: '100%' }} value={stallId} onChange={(e) => setStallId(e.target.value)}>
            <option value="">{stalls.length ? 'Chọn chuồng trống…' : 'Không còn chuồng trống'}</option>
            {stalls.map((s) => <option key={s.beId} value={s.beId}>{s.id} · {s.zone}</option>)}
          </select>
        </div>
      )}
      <label className="ht-label" htmlFor="ap-note" style={{ display: 'block', marginBottom: 6 }}>Ghi chú (không bắt buộc)</label>
      <textarea id="ap-note" className="ht-textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: Đã đối chiếu giấy tờ gốc với chủ ngựa." />
    </Dialog>
  );
};

/* 1.3 — reject with a reason (≥ 10 characters); failed checklist items can be added to it in one click. */
export const RejectDialog: React.FC<{ reg: Registration; checks: Check[]; onClose: () => void; onDone: (reason: string, allowResubmit: boolean) => void }> = ({ reg, checks, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const [reason, setReason] = useState('');
  const [reasonErr, setReasonErr] = useState('');
  const [allowResubmit, setAllowResubmit] = useState(true);
  const failed = checks.filter((c) => !c.passed);

  const confirm = async () => {
    if (reason.trim().length < 10) { setReasonErr('Lý do từ chối phải có ít nhất 10 ký tự.'); return; }
    if (await run(() => managerApi.rejectRegistration(reg, checks, reason.trim(), allowResubmit, actor), `Đã từ chối ${reg.id} và gửi lý do cho chủ ngựa.`)) onDone(reason.trim(), allowResubmit);
  };
  const update = (v: string) => { setReason(v); if (v.trim().length >= 10) setReasonErr(''); };

  return (
    <Dialog open onClose={onClose} icon="x" tone="danger" danger title={`Từ chối hồ sơ ${reg.id}`} sub={`Lý do được gửi nguyên văn cho ${reg.owner.fullName} và lưu vào nhật ký.`}
      confirmLabel="Xác nhận từ chối" onConfirm={confirm} busy={busy}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      <ReasonField id="rj-reason" label="Lý do từ chối" value={reason} placeholder="Tối thiểu 10 ký tự" error={reasonErr} onChange={update} />
      {failed.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {failed.map((c) => (
            <button key={c.key} type="button" className="ht-badge ht-badge--neutral ht-badge--plain" style={{ cursor: 'pointer', height: 26 }}
              onClick={() => update((reason ? reason + '\n' : '') + `${c.label}: ${c.detail}`)}>
              + {c.label}
            </button>
          ))}
        </div>
      )}
      <label className="ht-check" style={{ marginTop: 14 }}>
        <input type="checkbox" checked={allowResubmit} onChange={(e) => setAllowResubmit(e.target.checked)} /> Cho phép chủ ngựa sửa và nộp lại
      </label>
    </Dialog>
  );
};
