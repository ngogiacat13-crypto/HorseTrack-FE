import React, { useState } from 'react';
import { AssignedHorse, AssignedStall, GroomAssignment, ManagedUser, managerApi } from '../../../api/managerApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Callout, Dialog, ReasonField } from '../../../components/ui/Ht';
import { ROLE_LABEL } from '../../../components/layout/nav';
import { USE_BACKEND } from '../../../api/beClient';
import { TrainerHorsesDialog } from './TrainerHorsesDialog';

const useReason = () => {
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const check = () => { if (reason.trim().length < 10) { setErr('Lý do phải có ít nhất 10 ký tự.'); return false; } return true; };
  const onChange = (v: string) => { setReason(v); if (v.trim().length >= 10) setErr(''); };
  return { reason, err, check, onChange };
};

export const AssignmentDialog: React.FC<{ user: ManagedUser; data: { grooms: GroomAssignment[]; stalls: AssignedStall[]; horses: AssignedHorse[] }; onClose: () => void; onDone: () => void }> = ({ user, data, onClose, onDone }) => (
  user.role === 'HeadTrainer'
    ? <TrainerHorsesDialog user={user} stalls={data.stalls} horses={data.horses} onClose={onClose} onDone={onDone} />
    : <GroomZoneDialog user={user} data={data} onClose={onClose} onDone={onDone} />
);

const GroomZoneDialog: React.FC<{ user: ManagedUser; data: { grooms: GroomAssignment[]; stalls: AssignedStall[]; horses: AssignedHorse[] }; onClose: () => void; onDone: () => void }> = ({ user, data, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const current = data.grooms.find((g) => g.id === user.id || g.name === user.fullName);
  const currentZone = current?.zones[0] ?? '';
  const occupied = new Set(data.grooms.filter((g) => g.id !== user.id && g.role === 'Groom').flatMap((g) => g.zones));
  const [zone, setZone] = useState(currentZone);
  const save = async () => {
    const done = USE_BACKEND
      ? `Đã gửi yêu cầu. ${user.fullName} cần xác nhận trước khi khu có hiệu lực.`
      : zone ? `Đã cập nhật khu cho ${user.fullName}: ${zone}.` : `Đã bỏ phân công khu của ${user.fullName}.`;
    if (await run(() => managerApi.assignGroom(user, zone ? [zone] : [], actor), done)) onDone();
  };
  return (
    <Dialog open onClose={onClose} icon="stable" tone="brand" width={700} busy={busy} busyLabel="Đang lưu…" testId="groom-zone-dialog" title={`Phân công chăm sóc · ${user.fullName}`} sub="Chọn một khu làm việc; người chăm phụ trách mọi chuồng trong khu đó." confirmLabel="Lưu phân công" onConfirm={save}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      <div className="ht-label" style={{ marginBottom: 8 }}>Khu chăm sóc</div>
      <div className="ht-roles">{['Khu A', 'Khu B', 'Khu C'].map((z) => {
        const disabled = occupied.has(z) && z !== currentZone;
        return <label key={z} className="ht-role" style={disabled ? { opacity: 0.5 } : undefined}><input type="radio" name={`zone-${user.id}`} data-testid={`groom-zone-${z}`} checked={zone === z} disabled={disabled} onChange={() => setZone(z)} />{z}{disabled && <small className="sub"> · đã có người chăm</small>}</label>;
      })}
        {currentZone && <label className="ht-role"><input type="radio" name={`zone-${user.id}`} data-testid="groom-zone-none" checked={zone === ''} onChange={() => setZone('')} />Bỏ phân công</label>}
      </div>
      {current?.pendingNote && <Callout tone="demo" testId="groom-zone-pending" style={{ marginTop: 16 }}>{current.pendingNote} Khu hiện tại chưa đổi.</Callout>}
      <Callout tone="info" style={{ marginTop: 16 }}>Mỗi người chăm phụ trách đúng một khu và mọi chuồng trong khu đó; mỗi khu chỉ có một người chăm. Chỉ đổi hoặc bỏ khu được khi người chăm không còn việc chăm sóc / buổi tập chưa thực hiện ở khu hiện tại.{USE_BACKEND ? ' Khu chỉ đổi sau khi người chăm xác nhận.' : ''}</Callout>
    </Dialog>
  );
};

export const LockUserDialog: React.FC<{ user: ManagedUser; lock: boolean; onClose: () => void; onDone: (patch: Partial<ManagedUser>) => void }> = ({ user, lock, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const r = useReason();
  const confirm = async () => {
    if (!r.check()) return;
    const ok = lock
      ? await run(() => managerApi.lockUser(user, r.reason, actor), `Đã khóa tài khoản ${user.username}.`)
      : await run(() => managerApi.unlockUser(user, r.reason, actor), `Đã mở khóa tài khoản ${user.username}.`);
    if (ok) onDone(lock ? { status: 'LOCKED', lockReason: r.reason.trim() } : { status: 'ACTIVE' });
  };
  return (
    <Dialog open onClose={onClose} icon={lock ? 'lock' : 'unlock'} tone={lock ? 'danger' : 'brand'} danger={lock} busy={busy} busyLabel="Đang lưu…"
      title={lock ? `Khóa tài khoản ${user.fullName}?` : `Mở khóa ${user.fullName}?`}
      sub={lock ? 'Người dùng bị đăng xuất ngay, nhận email thông báo kèm lý do, và không thể đăng nhập cho đến khi được mở khóa.' : `Bị khóa vì: ${user.lockReason}. Người dùng đăng nhập lại được với vai trò ${ROLE_LABEL[user.role]}.`}
      confirmLabel={lock ? 'Khóa tài khoản' : 'Mở khóa'} onConfirm={confirm}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      {lock && user.openTasks ? <Callout tone="demo" style={{ marginBottom: 14 }}>{user.openTasks} công việc đang mở của người này cần được giao lại.</Callout> : null}
      <ReasonField id="lock-reason" label={lock ? 'Lý do khóa' : 'Lý do mở khóa'} value={r.reason} error={r.err} minHeight={72}
        placeholder={lock ? 'VD: Nghỉ việc từ 05/10/2026.' : ''} onChange={r.onChange} />
    </Dialog>
  );
};
