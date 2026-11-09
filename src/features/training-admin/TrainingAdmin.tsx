import React, { useMemo, useState } from 'react';
import { TRACK_LABEL, TRACK_TYPES, trackLabel, type TrackType } from '../../api/trainerApi';
import { useActor } from '../../auth/AuthContext';
import { useAction } from '../../hooks/useAction';
import { useFetch } from '../../hooks/useFetch';
import { Icon } from '../../components/ui/Icon';
import { Badge, Callout, Dialog, PageHeader, Panel, ReasonField, Tabs } from '../../components/ui/Ht';
import { LoadState } from '../../components/trainer/TrainerParts';
import { type AdminPlan, type AdminSession, trainingAdminApi } from './trainingAdminApi';

type Tab = 'open' | 'all';
type Pending = { kind: 'cancel'; plan: AdminPlan } | { kind: 'close'; plan: AdminPlan; session: AdminSession } | { kind: 'track'; plan: AdminPlan };

export const TrainingAdmin: React.FC = () => {
  const { data, loading, error, reload } = useFetch(() => trainingAdminApi.plans());
  const [tab, setTab] = useState<Tab>('open');
  const [expanded, setExpanded] = useState('');
  const [sessionsKey, setSessionsKey] = useState(0);
  const [pending, setPending] = useState<Pending | null>(null);
  const plans = useMemo(() => data ?? [], [data]);
  const list = plans.filter((p) => tab === 'all' || p.open);
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const done = () => { setPending(null); setSessionsKey((k) => k + 1); reload(); };

  return (
    <div className="ht ht-page">
      <PageHeader title="Giáo án & buổi tập"
        sub="Gỡ kẹt khi HLV hoặc Mã phu bỏ dở: hủy cưỡng chế giáo án, đóng cưỡng chế buổi tập, gán loại đường cho giáo án cũ. Mọi thao tác cần lý do, được ghi nhật ký và báo cho HLV, Mã phu." />
      <Tabs<Tab> value={tab} onChange={setTab} items={[
        { value: 'open', label: 'Đang mở', count: plans.filter((p) => p.open).length },
        { value: 'all', label: 'Tất cả', count: plans.length },
      ]} />
      <Panel>
        <div style={{ overflowX: 'auto' }}>
          <table className="ht-table" data-testid="training-admin-table">
            <thead><tr><th>Giáo án</th><th>Ngựa</th><th>Loại · đường tập</th><th>Trạng thái</th><th aria-label="Thao tác" /></tr></thead>
            <tbody>
              {list.map((p) => (
                <React.Fragment key={p.id}>
                  <tr data-testid={`admin-plan-${p.id}`}>
                    <td><span className="strong">{p.name}</span><span className="sub ht-mono">{p.id} · {p.startDate}{p.endDate !== '—' ? ` → ${p.endDate}` : ''}</span></td>
                    <td className="strong">{p.horseName}</td>
                    <td>{p.type}<span className="sub" data-testid={`admin-plan-track-${p.id}`}>{p.track ? trackLabel(p.track) : 'Chưa có loại đường'}</span></td>
                    <td><Badge tone={p.tone}>{p.statusLabel}</Badge></td>
                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" data-testid={`admin-plan-sessions-${p.id}`} aria-expanded={expanded === p.id}
                        onClick={() => setExpanded(expanded === p.id ? '' : p.id)}>
                        <Icon name="calendar" size={14} />Buổi tập
                      </button>
                      {p.open && !p.track && (
                        <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" data-testid={`set-track-${p.id}`} onClick={() => setPending({ kind: 'track', plan: p })}>
                          Gán đường
                        </button>
                      )}
                      {p.canForceCancel && (
                        <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" data-testid={`force-cancel-${p.id}`} style={{ color: 'var(--danger-ink)' }} onClick={() => setPending({ kind: 'cancel', plan: p })}>
                          <Icon name="ban" size={14} />Hủy cưỡng chế
                        </button>
                      )}
                    </td>
                  </tr>
                  {expanded === p.id && (
                    <tr><td colSpan={5} style={{ background: 'var(--surface-2, transparent)' }}>
                      <PlanSessions key={`${p.id}-${sessionsKey}`} plan={p} onForceClose={(session) => setPending({ kind: 'close', plan: p, session })} />
                    </td></tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <div className="ht-empty">{tab === 'open' ? 'Không có giáo án nào đang mở.' : 'Chưa có giáo án.'}</div>}
        </div>
      </Panel>
      {pending?.kind === 'cancel' && <ReasonDialog title={`Hủy cưỡng chế · ${pending.plan.name}`} sub={`${pending.plan.horseName} · ${pending.plan.statusLabel}`} testId="force-cancel-dialog" reasonId="force-cancel-reason"
        note="Buổi chưa bắt đầu chuyển sang Đã hủy, buổi đã bắt đầu chuyển sang Đã dừng, giáo án chuyển sang Đã hủy. Không áp dụng khi còn buổi chờ bác sĩ."
        confirmLabel="Hủy cưỡng chế" ok={`Đã hủy cưỡng chế giáo án ${pending.plan.id}.`}
        action={(reason, actor) => trainingAdminApi.forceCancel(pending.plan, reason, actor)} onClose={() => setPending(null)} onDone={done} />}
      {pending?.kind === 'close' && <ReasonDialog title={`Đóng cưỡng chế buổi ${pending.session.id}`} sub={`${pending.plan.horseName} · ${pending.session.date} ${pending.session.time} · ${pending.session.groom}`} testId="force-close-dialog" reasonId="force-close-reason"
        note="Buổi chưa bắt đầu chuyển sang Đã hủy, buổi đang tập hoặc tạm dừng chuyển sang Đã dừng."
        confirmLabel="Đóng buổi tập" ok={`Đã đóng buổi ${pending.session.id}.`}
        action={(reason, actor) => trainingAdminApi.forceClose(pending.plan, pending.session, reason, actor)} onClose={() => setPending(null)} onDone={done} />}
      {pending?.kind === 'track' && <SetTrackDialog plan={pending.plan} onClose={() => setPending(null)} onDone={done} />}
    </div>
  );
};

const PlanSessions: React.FC<{ plan: AdminPlan; onForceClose: (s: AdminSession) => void }> = ({ plan, onForceClose }) => {
  const { data, loading, error, reload } = useFetch(() => trainingAdminApi.sessions(plan.id), [plan.id]);
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  if (!data.length) return <div className="ht-empty" data-testid={`admin-sessions-empty-${plan.id}`}>Giáo án chưa có buổi tập.</div>;
  return (
    <table className="ht-table" data-testid={`admin-sessions-${plan.id}`}>
      <thead><tr><th>Buổi</th><th>Ngày giờ</th><th>Mã phu</th><th>Trạng thái</th><th aria-label="Thao tác" /></tr></thead>
      <tbody>
        {data.map((s) => (
          <tr key={s.id} data-testid={`admin-session-${s.id}`}>
            <td className="id">{s.id}</td>
            <td className="ht-mono">{s.date} {s.time}</td>
            <td>{s.groom}</td>
            <td><Badge tone={s.tone} plain>{s.statusLabel}</Badge></td>
            <td style={{ textAlign: 'right' }}>
              {s.canForceClose && (
                <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" data-testid={`force-close-${s.id}`} style={{ color: 'var(--danger-ink)' }} onClick={() => onForceClose(s)}>
                  <Icon name="x" size={14} />Đóng cưỡng chế
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const ReasonDialog: React.FC<{
  title: string; sub: string; testId: string; reasonId: string; note: string; confirmLabel: string; ok: string;
  action: (reason: string, actor: ReturnType<typeof useActor>) => Promise<unknown>; onClose: () => void; onDone: () => void;
}> = ({ title, sub, testId, reasonId, note, confirmLabel, ok, action, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const [reason, setReason] = useState('');
  const confirm = async () => { if (await run(() => action(reason, actor), ok)) onDone(); };
  return (
    <Dialog open onClose={onClose} icon="ban" tone="danger" danger busy={busy} busyLabel="Đang xử lý…" testId={testId}
      title={title} sub={sub} disabled={reason.trim().length < 5} confirmLabel={confirmLabel} onConfirm={confirm}>
      {error && <Callout tone="danger" testId={`${testId}-error`} style={{ marginBottom: 14 }}>{error}</Callout>}
      <Callout tone="info" style={{ marginBottom: 14 }}>{note} HLV và Mã phu nhận thông báo.</Callout>
      <ReasonField id={reasonId} label="Lý do (5–500 ký tự)" value={reason} onChange={setReason} min={5} minHeight={72} placeholder="VD: Mã phu nghỉ phép, buổi tập bị bỏ dở từ hôm qua" />
    </Dialog>
  );
};

const SetTrackDialog: React.FC<{ plan: AdminPlan; onClose: () => void; onDone: () => void }> = ({ plan, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const [track, setTrack] = useState<TrackType | ''>('');
  const confirm = async () => { if (track && await run(() => trainingAdminApi.setTrack(plan, track, actor), `Đã gán ${TRACK_LABEL[track]} cho giáo án ${plan.id}.`)) onDone(); };
  return (
    <Dialog open onClose={onClose} icon="calendar" tone="brand" busy={busy} busyLabel="Đang lưu…" testId="set-track-dialog"
      title={`Gán loại đường · ${plan.name}`} sub={`${plan.horseName} · giáo án lập trước khi có loại đường`} disabled={!track} confirmLabel="Gán đường" onConfirm={confirm}>
      {error && <Callout tone="danger" testId="set-track-dialog-error" style={{ marginBottom: 14 }}>{error}</Callout>}
      <div className="ht-field" style={{ marginBottom: 0 }}>
        <label className="ht-label" htmlFor="set-track">Loại đường tập<span className="ht-req">*</span></label>
        <select id="set-track" data-testid="set-track-select" className="ht-select" style={{ height: 44 }} value={track} onChange={(e) => setTrack(e.target.value as TrackType | '')}>
          <option value="">— Chọn đường —</option>
          {TRACK_TYPES.map((t) => <option key={t} value={t}>{TRACK_LABEL[t]}</option>)}
        </select>
        <span className="ht-hint">Báo lỗi nếu buổi chưa kết thúc của giáo án trùng giờ với ngựa khác trên đường đó.</span>
      </div>
    </Dialog>
  );
};
