import React, { useState } from 'react';
import { VetCase, vetApi } from '../../../api/vetApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Callout, Dialog, ReasonField } from '../../../components/ui/Ht';

export const CloseCaseDialog: React.FC<{ vetCase: VetCase; onClose: () => void; onDone: () => void }> = ({ vetCase, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const [outcome, setOutcome] = useState('');
  const confirm = async () => { if (await run(() => vetApi.closeCase(vetCase, outcome, actor), `Đã đóng ca ${vetCase.id}.`)) onDone(); };
  return (
    <Dialog open onClose={onClose} icon="check" tone="brand" busy={busy} busyLabel="Đang đóng…"
      title={`Đóng ca ${vetCase.id}`} sub="Chỉ đóng khi phác đồ của ca đã hoàn tất hoặc ca không cần điều trị." confirmLabel="Đóng ca" onConfirm={confirm}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      <ReasonField id="cl-out" label="Kết luận" value={outcome} onChange={setOutcome} placeholder="VD: Hồi phục hoàn toàn, đủ điều kiện tập lại." />
    </Dialog>
  );
};
