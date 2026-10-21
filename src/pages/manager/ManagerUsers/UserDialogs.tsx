import React, { useState } from 'react';
import { AssignedHorse, AssignedStall, GroomAssignment, ManagedUser, managerApi } from '../../../api/managerApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Callout, Dialog, ReasonField } from '../../../components/ui/Ht';
import { ROLE_LABEL } from '../../../components/layout/nav';

const useReason = () => {
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const check = () => { if (reason.trim().length < 10) { setErr('Lý do phải có ít nhất 10 ký tự.'); return false; } return true; };
  const onChange = (v: string) => { setReason(v); if (v.trim().length >= 10) setErr(''); };
  return { reason, err, check, onChange };
};

export const AssignmentDialog: React.FC<{ user: ManagedUser; data: { grooms: GroomAssignment[]; stalls: AssignedStall[]; horses: AssignedHorse[] }; onClose: () => void; onDone: () => void }> = ({ user, data, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const current = data.grooms.find((g) => g.id === user.id || g.name === user.fullName);
  const trainerZones = [...new Set(data.horses.filter((h) => h.trainerId === user.id).map((h) => data.stalls.find((s) => s.horseId === h.id)?.zone).filter((z): z is string => !!z))];
  const [zones, setZones] = useState<string[]>(current?.zones ?? trainerZones);
  const toggleZone = (zone: string) => {
    const adding = !zones.includes(zone);
    setZones((xs) => adding ? [...xs, zone] : xs.filter((x) => x !== zone));
  };
  const save = async () => {
    const ok = user.role === 'HeadTrainer'
      ? await run(() => managerApi.assignTrainer(user, zones, actor), `Đã cập nhật khu cho ${user.fullName}: ${zones.join(', ')}.`)
      : await run(() => managerApi.assignGroom(user, zones, actor), `Đã cập nhật khu cho ${user.fullName}: ${zones.join(', ')}.`);
    if (ok) onDone();
  };
  return (
    <Dialog open onClose={onClose} icon="stable" tone="brand" width={700} busy={busy} busyLabel="Đang lưu…" title={`Phân công ${user.role === 'HeadTrainer' ? 'huấn luyện' : 'chăm sóc'} · ${user.fullName}`} sub={user.role === 'HeadTrainer' ? 'Chọn những ngựa HLV trưởng phụ trách huấn luyện.' : 'Chọn khu làm việc và những ngựa người chăm được phụ trách trong các khu đó.'} confirmLabel="Lưu phân công" onConfirm={save}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      <div className="ht-label" style={{ marginBottom: 8 }}>{user.role === 'HeadTrainer' ? 'Khu phụ trách' : 'Khu chăm sóc'}</div>
      <div className="ht-roles">{['Khu A', 'Khu B', 'Khu C'].map((z) => <label key={z} className="ht-role"><input type="checkbox" checked={zones.includes(z)} onChange={() => toggleZone(z)} />{z}</label>)}</div>
      <Callout tone="info" style={{ marginTop: 16 }}>Ngựa đã được duyệt trong khu đã chọn sẽ tự động do HLV phụ trách. Groom sẽ tự động phụ trách các chuồng trong khu đó.</Callout>
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
      sub={lock ? 'Người dùng bị đăng xuất ngay và không thể đăng nhập cho đến khi được mở khóa.' : `Bị khóa vì: ${user.lockReason}. Người dùng đăng nhập lại được với vai trò ${ROLE_LABEL[user.role]}.`}
      confirmLabel={lock ? 'Khóa tài khoản' : 'Mở khóa'} onConfirm={confirm}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      {lock && user.openTasks ? <Callout tone="demo" style={{ marginBottom: 14 }}>{user.openTasks} công việc đang mở của người này cần được giao lại.</Callout> : null}
      <ReasonField id="lock-reason" label={lock ? 'Lý do khóa' : 'Lý do mở khóa'} value={r.reason} error={r.err} minHeight={72}
        placeholder={lock ? 'VD: Nghỉ việc từ 05/10/2026.' : ''} onChange={r.onChange} />
    </Dialog>
  );
};
