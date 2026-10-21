import React, { useState } from 'react';
import { FeedRequest, vetApi } from '../../../api/vetApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Callout, Dialog, ReasonField } from '../../../components/ui/Ht';

export const FeedDecisionDialog: React.FC<{ request: FeedRequest; approve: boolean; onClose: () => void; onDone: () => void }> = ({ request, approve, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const [note, setNote] = useState('');
  const confirm = async () => {
    if (await run(() => vetApi.decideFeed(request, approve, note, actor), approve ? 'Đã duyệt và thêm vào khẩu phần y tế.' : 'Đã từ chối yêu cầu.')) onDone();
  };
  return (
    <Dialog open onClose={onClose} icon={approve ? 'check' : 'x'} tone={approve ? 'brand' : 'danger'} danger={!approve} busy={busy}
      title={`${approve ? 'Duyệt' : 'Từ chối'} thức ăn đặc biệt`} sub={`${request.item} · ${request.horse}`}
      confirmLabel={approve ? 'Duyệt và thêm vào khẩu phần' : 'Từ chối'} onConfirm={confirm}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      {approve
        ? <div className="ht-field" style={{ margin: 0 }}><label className="ht-label" htmlFor="fd-note">Ghi chú (không bắt buộc)</label><input id="fd-note" className="ht-input" value={note} onChange={(e) => setNote(e.target.value)} /></div>
        : <ReasonField id="fd-note" label="Lý do từ chối" value={note} onChange={setNote} />}
    </Dialog>
  );
};
