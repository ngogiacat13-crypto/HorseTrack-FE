import React, { useState } from 'react';
import { ownerApi } from '../../../api/ownerApi';
import type { RaceProposal } from '../../../api/trainerApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Callout, Dialog, ReasonField } from '../../../components/ui/Ht';

/* 3.4 — agree (optional note) or decline (reason ≥ 10 chars). */
export const RespondDialog: React.FC<{ proposal: RaceProposal; agree: boolean; onClose: () => void; onDone: () => void }> = ({ proposal: p, agree, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const [note, setNote] = useState('');
  const save = async () => {
    if (await run(() => ownerApi.respondProposal(p, agree, note, actor), agree ? `Đã đồng ý cho ${p.horseName} tham gia — chờ CLB gửi hồ sơ cho BTC.` : `Đã từ chối đề xuất ${p.id}.`)) onDone();
  };
  return (
    <Dialog open onClose={onClose} busy={busy} icon={agree ? 'check' : 'x'} tone={agree ? 'brand' : 'danger'}
      title={agree ? `Đồng ý cho ${p.horseName} thi đấu` : `Từ chối đề xuất ${p.id}`}
      sub={agree ? 'Đề xuất chuyển sang READY_TO_SUBMIT. Việc gửi hồ sơ cho ban tổ chức do CLB thực hiện ngoài hệ thống — chưa có nghĩa BTC đã nhận.' : 'Đề xuất chuyển OWNER_DECLINED và dừng quy trình đăng ký giải này.'}
      confirmLabel={agree ? 'Xác nhận đồng ý' : 'Xác nhận từ chối'} onConfirm={save}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      {agree ? (
        <div className="ht-field" style={{ margin: 0 }}>
          <label className="ht-label" htmlFor="rs-note">Ghi chú cho HLV (không bắt buộc)</label>
          <textarea id="rs-note" className="ht-textarea" style={{ minHeight: 64 }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: Đồng ý, ưu tiên an toàn cho ngựa." />
        </div>
      ) : <ReasonField id="rs-reason" label="Lý do từ chối" value={note} onChange={setNote} placeholder="VD: Muốn ngựa nghỉ thêm 1 tháng trước mùa giải chính." minHeight={72} />}
    </Dialog>
  );
};
