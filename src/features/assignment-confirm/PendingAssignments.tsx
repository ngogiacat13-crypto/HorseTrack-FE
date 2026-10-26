import React, { useState } from 'react';
import { assignmentApi, assignmentText, type AssignmentRequest } from '../../api/assignmentApi';
import { USE_BACKEND } from '../../api/beClient';
import { useFetch } from '../../hooks/useFetch';
import { useAction } from '../../hooks/useAction';
import { Callout, Dialog, Panel, ReasonField } from '../../components/ui/Ht';

export const PendingAssignments: React.FC = () => {
  const { data, error, reload } = useFetch(() => (USE_BACKEND ? assignmentApi.mine() : Promise.resolve([])), []);
  const { busy, error: actionError, run } = useAction();
  const [rejecting, setRejecting] = useState<AssignmentRequest | null>(null);
  const [reason, setReason] = useState('');
  const [reasonErr, setReasonErr] = useState('');
  if (!USE_BACKEND) return null;
  if (error) return <Callout tone="danger" testId="assignment-inbox-error" style={{ marginBottom: 16 }}>{error}</Callout>;
  if (!data?.length) return null;

  const accept = (r: AssignmentRequest) => {
    void run(() => assignmentApi.accept(r.requestId), 'Đã xác nhận phân công.').then((ok) => { if (ok) reload(); });
  };
  const reject = async () => {
    if (!rejecting) return;
    if (reason.trim().length < 10) { setReasonErr('Lý do phải có ít nhất 10 ký tự.'); return; }
    const ok = await run(() => assignmentApi.reject(rejecting.requestId, reason.trim()), 'Đã từ chối phân công.');
    if (ok) { setRejecting(null); setReason(''); reload(); }
  };

  return (
    <Panel title="Phân công chờ xác nhận" sub="Phân công chỉ có hiệu lực sau khi bạn xác nhận. Từ chối thì phải ghi lý do.">
      <div className="ht-panel__body" data-testid="assignment-inbox" style={{ display: 'grid', gap: 10 }}>
        {actionError && <Callout tone="danger">{actionError}</Callout>}
        {data.map((r) => (
          <div key={r.requestId} style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <span>{assignmentText(r)}</span>
            <span style={{ display: 'inline-flex', gap: 8 }}>
              <button type="button" className="ht-btn ht-btn--primary ht-btn--sm" data-testid={`assignment-accept-${r.requestId}`} disabled={busy} onClick={() => accept(r)}>Xác nhận</button>
              <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" data-testid={`assignment-reject-${r.requestId}`} disabled={busy} onClick={() => { setRejecting(r); setReason(''); setReasonErr(''); }}>Từ chối</button>
            </span>
          </div>
        ))}
      </div>
      {rejecting && (
        <Dialog open testId="assignment-reject-dialog" onClose={() => setRejecting(null)} icon="x" tone="danger" danger busy={busy} busyLabel="Đang gửi…"
          title="Từ chối phân công" sub={assignmentText(rejecting)} confirmLabel="Từ chối" onConfirm={() => { void reject(); }}>
          <ReasonField id="assignment-reject-reason" label="Lý do từ chối" value={reason} error={reasonErr} minHeight={72}
            placeholder="VD: Đang phụ trách quá nhiều ngựa trong tuần này." onChange={(v) => { setReason(v); if (v.trim().length >= 10) setReasonErr(''); }} />
        </Dialog>
      )}
    </Panel>
  );
};
