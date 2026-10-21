import React, { useState } from 'react';
import { AssignedHorse, AssignedStall, GroomAssignment, ManagedUser, managerApi } from '../../../api/managerApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Icon } from '../../../components/ui/Icon';
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
  const [zones, setZones] = useState<string[]>(current?.zones ?? []);
  const [horseIds, setHorseIds] = useState<string[]>(() => user.role === 'HeadTrainer'
    ? data.horses.filter((h) => h.trainerId === user.id).map((h) => h.id)
    : data.horses.filter((h) => (current?.zones ?? []).includes(data.stalls.find((s) => s.horseId === h.id)?.zone ?? '')).map((h) => h.id));
  const available = user.role === 'HeadTrainer'
    ? data.horses
    : data.horses.filter((h) => zones.includes(data.stalls.find((s) => s.horseId === h.id)?.zone ?? ''));
  const toggle = (value: string, values: string[], setValues: React.Dispatch<React.SetStateAction<string[]>>) => setValues(values.includes(value) ? values.filter((x) => x !== value) : [...values, value]);
  const toggleZone = (zone: string) => {
    const adding = !zones.includes(zone);
    setZones((xs) => adding ? [...xs, zone] : xs.filter((x) => x !== zone));
    const ids = data.horses.filter((h) => data.stalls.find((s) => s.horseId === h.id)?.zone === zone).map((h) => h.id);
    setHorseIds((xs) => adding ? [...new Set([...xs, ...ids])] : xs.filter((id) => !ids.includes(id)));
  };
  const save = async () => {
    const ok = user.role === 'HeadTrainer'
      ? await run(() => managerApi.assignTrainer(user, horseIds, actor), `Đã phân công ${user.fullName}: ${horseIds.length} ngựa.`)
      : await run(() => managerApi.assignGroom(user, zones, horseIds, actor), `Đã phân công ${user.fullName}: ${zones.join(', ')} · ${horseIds.length} ngựa.`);
    if (ok) onDone();
  };
  return (
    <Dialog open onClose={onClose} icon="stable" tone="brand" width={700} busy={busy} busyLabel="Đang lưu…" title={`Phân công ${user.role === 'HeadTrainer' ? 'huấn luyện' : 'chăm sóc'} · ${user.fullName}`} sub={user.role === 'HeadTrainer' ? 'Chọn những ngựa HLV trưởng phụ trách huấn luyện.' : 'Chọn khu làm việc và những ngựa người chăm được phụ trách trong các khu đó.'} confirmLabel="Lưu phân công" onConfirm={save}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      {user.role === 'Groom' && <><div className="ht-label" style={{ marginBottom: 8 }}>Khu chăm sóc</div><div className="ht-roles">{['Khu A', 'Khu B', 'Khu C'].map((z) => <label key={z} className="ht-role"><input type="checkbox" checked={zones.includes(z)} onChange={() => toggleZone(z)} />{z}</label>)}</div></>}
      <div className="ht-label" style={{ margin: '16px 0 8px' }}>Ngựa được giao</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
        {available.map((h) => { const stall = data.stalls.find((s) => s.horseId === h.id); return <label key={h.id} className="ht-role" style={{ alignItems: 'flex-start' }}><input type="checkbox" checked={horseIds.includes(h.id)} onChange={() => toggle(h.id, horseIds, setHorseIds)} /><span><b>{h.name}</b><small className="sub">{stall?.id} · {stall?.zone} · Chủ: {h.owner}</small></span></label>; })}
      </div>
      {!available.length && <div className="ht-empty">Chưa có ngựa để phân công.</div>}
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
