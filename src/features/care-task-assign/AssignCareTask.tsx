import React, { useState } from 'react';
import { USE_BACKEND } from '../../api/beClient';
import { useAction } from '../../hooks/useAction';
import { useFetch } from '../../hooks/useFetch';
import { Icon } from '../../components/ui/Icon';
import { Callout, Dialog } from '../../components/ui/Ht';
import { TASK_TYPES, careTaskApi, emptyDraft, type CareTaskDraft } from './careTaskApi';

const selectStyle: React.CSSProperties = { height: 44, width: '100%', fontSize: 14 };

const AssignDialog: React.FC<{ horseId: string; horseName: string; onClose: () => void; onDone: () => void }> = ({ horseId, horseName, onClose, onDone }) => {
  const { busy, error, run } = useAction();
  const { data: grooms, loading, error: loadError } = useFetch(() => careTaskApi.zoneGrooms(horseId), [horseId]);
  const [d, setD] = useState<CareTaskDraft>(emptyDraft);
  const set = <K extends keyof CareTaskDraft>(k: K, v: CareTaskDraft[K]) => setD((x) => ({ ...x, [k]: v }));
  const confirm = async () => {
    const groom = grooms?.find((g) => String(g.id) === d.groomId);
    if (await run(() => careTaskApi.create(horseId, d), `Đã giao việc cho ${groom?.name ?? 'Mã phu'} · ${horseName}.`)) onDone();
  };

  return (
    <Dialog open onClose={onClose} icon="task" tone="brand" width={640} busy={busy} busyLabel="Đang giao việc…" testId="care-task-dialog"
      title={`Giao việc chăm sóc · ${horseName}`} sub="Mã phu nhận việc ở mục “Việc hôm nay”; email thông báo nếu việc quá hạn." confirmLabel="Giao việc" onConfirm={confirm}>
      {(error || loadError) && <Callout tone="danger" style={{ marginBottom: 14 }}>{error || loadError}</Callout>}
      {grooms && grooms.length === 0 && <Callout tone="danger" style={{ marginBottom: 14 }}>Khu chuồng của ngựa chưa có Mã phu phụ trách — nhờ Quản lý CLB phân khu trước.</Callout>}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12, alignItems: 'end' }}>
        <div className="ht-field" style={{ margin: 0 }}>
          <label className="ht-label" htmlFor="ct-groom">Mã phu<span className="ht-req">*</span></label>
          <select id="ct-groom" data-testid="care-task-groom" className="ht-select" style={selectStyle} value={d.groomId} onChange={(e) => set('groomId', e.target.value)} disabled={loading}>
            <option value="">{loading ? 'Đang tải…' : '— Chọn Mã phu —'}</option>
            {(grooms ?? []).map((g) => <option key={g.id} value={g.id}>{g.name}{g.zone ? ` · ${g.zone}` : ''}</option>)}
          </select>
        </div>
        <div className="ht-field" style={{ margin: 0 }}>
          <label className="ht-label" htmlFor="ct-type">Loại công việc<span className="ht-req">*</span></label>
          <select id="ct-type" data-testid="care-task-type" className="ht-select" style={selectStyle} value={d.taskType} onChange={(e) => set('taskType', e.target.value)}>
            {TASK_TYPES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="ht-field" style={{ margin: 0 }}>
          <label className="ht-label" htmlFor="ct-date">Ngày<span className="ht-req">*</span></label>
          <input id="ct-date" data-testid="care-task-date" type="date" className="ht-input" value={d.date} onChange={(e) => set('date', e.target.value)} />
        </div>
        <div className="ht-field" style={{ margin: 0 }}>
          <label className="ht-label" htmlFor="ct-time">Giờ<span className="ht-req">*</span></label>
          <input id="ct-time" data-testid="care-task-time" type="time" className="ht-input" value={d.time} onChange={(e) => set('time', e.target.value)} />
        </div>
      </div>
      <div className="ht-field" style={{ marginTop: 12 }}>
        <label className="ht-label" htmlFor="ct-title">Tiêu đề</label>
        <input id="ct-title" data-testid="care-task-title" className="ht-input" value={d.title} onChange={(e) => set('title', e.target.value)} placeholder="Để trống sẽ dùng tên loại công việc" />
      </div>
      <div className="ht-field" style={{ margin: 0 }}>
        <label className="ht-label" htmlFor="ct-note">Hướng dẫn</label>
        <textarea id="ct-note" data-testid="care-task-instructions" className="ht-input" style={{ height: 80, padding: '10px 14px' }} value={d.instructions} onChange={(e) => set('instructions', e.target.value)} placeholder="VD: Dắt đi bộ nhẹ 20 phút, tránh nền cứng" />
      </div>
    </Dialog>
  );
};

export const AssignCareTask: React.FC<{ horseId: string; horseName: string; disabledReason?: string; onAssigned?: () => void }> = ({ horseId, horseName, disabledReason, onAssigned }) => {
  const [open, setOpen] = useState(false);
  if (!USE_BACKEND) return null;
  return (
    <>
      <button type="button" className="ht-btn ht-btn--secondary" data-testid="care-task-btn" disabled={!!disabledReason} title={disabledReason} onClick={() => setOpen(true)}>
        <Icon name="task" />Giao việc chăm sóc
      </button>
      {open && <AssignDialog horseId={horseId} horseName={horseName} onClose={() => setOpen(false)} onDone={() => { setOpen(false); onAssigned?.(); }} />}
    </>
  );
};
