import React, { useState } from 'react';
import { CareTask, groomApi } from '../../../api/groomApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Callout, Dialog } from '../../../components/ui/Ht';
import { taskState } from './taskState';

export const CompleteTaskDialog: React.FC<{ task: CareTask; onClose: () => void; onDone: () => void }> = ({ task: t, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const [note, setNote] = useState('');
  const late = taskState(t) === 'late';
  const save = async () => {
    if (await run(() => groomApi.completeTask(t, { note, photo: null }, actor), late ? `Đã hoàn thành ${t.title} · trễ SLA, đã báo Quản lý CLB.` : `Đã hoàn thành ${t.title}.`)) onDone();
  };
  return (
    <Dialog open onClose={onClose} icon="check" tone="brand" busy={busy} busyLabel="Đang lưu…" width={520}
      title={`Hoàn thành · ${t.title}`} sub={`${t.horse ?? ''}${t.stall ? ` · ${t.stall}` : ''} · bắt đầu ${t.time} · SLA ${t.sla}`}
      confirmLabel="Xác nhận hoàn thành" onConfirm={save}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      {late && <Callout tone="demo" icon="alarm" style={{ marginBottom: 14 }}>Việc này đã quá SLA 45 phút — ghi lý do; hệ thống báo Quản lý CLB (BR_05).</Callout>}
      <div style={{ display: 'grid', gap: 14 }}>
        <div className="ht-field" style={{ margin: 0 }}>
          <label className="ht-label" htmlFor="tk-note">Ghi chú{late && <span className="ht-req">*</span>}</label>
          <textarea id="tk-note" className="ht-textarea" style={{ minHeight: 64 }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: Ngựa ăn hết khẩu phần, nước uống đầy đủ." />
        </div>
      </div>
    </Dialog>
  );
};
