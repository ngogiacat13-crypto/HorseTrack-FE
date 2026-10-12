import React, { useState } from 'react';
import { ManagedUser, managerApi } from '../../../api/managerApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Icon } from '../../../components/ui/Icon';
import { Callout, Dialog, ReasonField } from '../../../components/ui/Ht';
import { ROLE_LABEL } from '../../../components/layout/nav';

type Role = ManagedUser['role'];
const ROLES = Object.keys(ROLE_LABEL) as Role[];

/** Reason box shared by the user dialogs (min 10 characters). */
const useReason = () => {
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const check = () => { if (reason.trim().length < 10) { setErr('Lý do phải có ít nhất 10 ký tự.'); return false; } return true; };
  const onChange = (v: string) => { setReason(v); if (v.trim().length >= 10) setErr(''); };
  return { reason, err, check, onChange };
};

/* 5.2 — change role after the BR_06 conflict check; a failing check blocks the change. */
export const RoleDialog: React.FC<{ user: ManagedUser; onClose: () => void; onDone: (patch: Partial<ManagedUser>) => void }> = ({ user, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const r = useReason();
  const [newRole, setNewRole] = useState<Role>(user.role === 'Groom' ? 'HeadTrainer' : 'Groom');
  const checks = managerApi.checkRoleChange(user, newRole);
  const blocked = checks.some((c) => c.level === 'fail');
  const confirm = async () => {
    if (!r.check()) return;
    if (await run(() => managerApi.changeRole(user, newRole, r.reason, actor), `Đã đổi vai trò ${user.fullName} → ${ROLE_LABEL[newRole]} · ghi Audit Log.`)) onDone({ role: newRole, openTasks: 0 });
  };
  return (
    <Dialog open onClose={onClose} icon="usercog" tone="brand" width={560} busy={busy} busyLabel="Đang lưu…"
      title={`Đổi vai trò · ${user.fullName}`} sub={<>Hiện tại: <b>{ROLE_LABEL[user.role]}</b> · <span className="ht-mono">{user.username}</span></>}
      confirmLabel="Áp dụng vai trò" onConfirm={confirm} disabled={blocked}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      <div className="ht-label" style={{ marginBottom: 8 }}>Vai trò mới</div>
      <div className="ht-roles">
        {ROLES.map((x) => (
          <label key={x} className="ht-role">
            <input type="radio" name="role" value={x} checked={newRole === x} disabled={x === user.role} onChange={() => setNewRole(x)} />
            {ROLE_LABEL[x]}{x === user.role && ' · hiện tại'}
          </label>
        ))}
      </div>
      <div className="ht-label" style={{ margin: '16px 0 8px' }}>Kiểm tra xung đột · BR_06</div>
      <ul className="ht-checks">
        {checks.map((c, i) => (
          <li key={i} className="ht-checkrow" data-state={c.level} style={{ padding: '10px 12px' }}>
            <span className="ht-checkrow__icon"><Icon name={c.level === 'pass' ? 'check' : c.level === 'warn' ? 'warn' : 'x'} /></span>
            <div><small style={{ margin: 0, color: 'var(--foreground)' }}>{c.text}</small></div><span />
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 16 }}>
        <ReasonField id="role-reason" label="Lý do" value={r.reason} error={r.err} minHeight={64} placeholder="VD: Bổ nhiệm HLV phụ trách nhóm ngựa Khu B từ 05/10." onChange={r.onChange} />
      </div>
    </Dialog>
  );
};

/* 5.1 — lock / unlock an account with a reason. */
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
