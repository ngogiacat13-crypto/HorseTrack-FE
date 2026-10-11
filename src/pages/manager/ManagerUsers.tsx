import React, { useEffect, useMemo, useState } from 'react';
import { ManagedUser, managerApi } from '../../api/managerApi';
import { Icon } from '../../components/ui/Icon';
import { Badge, Callout, Dialog, Loading, PageHeader, Panel, ReasonField, Tabs, useToast } from '../../components/ui/Ht';
import { ROLE_LABEL } from '../../components/layout/nav';

type Role = ManagedUser['role'];
const ROLES = Object.keys(ROLE_LABEL) as Role[];

/* Spec §4 role × function matrix. 'y' = có quyền, 'n' = không, other text = qualifier. */
const RBAC: [string, ...string[]][] = [
  ['Đăng nhập · đổi mật khẩu', 'y', 'y', 'y', 'y', 'y', 'y'],
  ['Duyệt hồ sơ ngựa mới', 'y', 'n', 'n', 'n', 'n', 'Gửi hồ sơ'],
  ['Người dùng · RBAC · Audit Log', 'y', 'n', 'n', 'n', 'n', 'n'],
  ['Lập giáo án · phân công lịch tập', 'n', 'y', 'n', 'n', 'n', 'n'],
  ['Nhập chỉ số phiên tập', 'n', 'Xem', 'Xem', 'n', 'y', 'n'],
  ['Quyết định tiếp tục phiên tập', 'n', 'y', 'n', 'n', 'n', 'n'],
  ['Tạo · xác nhận phác đồ', 'Xem', 'Xem', 'y', 'n', 'Xem', 'Xem'],
  ['Kiểm tồn · giữ · cấp phát vật tư', 'Xem', 'n', 'Yêu cầu', 'y', 'n', 'n'],
  ['Khóa / mở khóa huấn luyện y tế', 'n', 'n', 'y', 'n', 'n', 'Xem'],
  ['Đề xuất thi đấu', 'Xem', 'y', 'Khám', 'n', 'n', 'Xác nhận'],
  ['Xem hóa đơn', 'y', 'n', 'n', 'n', 'n', 'y'],
  ['Thanh toán VNPay', 'n', 'n', 'n', 'n', 'n', 'y'],
  ['Đình chỉ · kích hoạt lại dịch vụ', 'y', 'n', 'n', 'n', 'n', 'n'],
];
const RBAC_COLS: Role[] = ['ClubManager', 'HeadTrainer', 'Veterinarian', 'WarehouseManager', 'Groom', 'HorseOwner'];

const initials = (n: string) => n.trim().split(/\s+/).slice(-2).map((p) => p[0]).join('').toUpperCase();

export const ManagerUsers: React.FC = () => {
  const toast = useToast();
  const [users, setUsers] = useState<ManagedUser[] | null>(null);
  const [tab, setTab] = useState<'users' | 'rbac'>('users');
  const [q, setQ] = useState('');
  const [roleF, setRoleF] = useState('');
  const [stF, setStF] = useState('');
  const [dlg, setDlg] = useState<null | { kind: 'role' | 'lock' | 'unlock'; user: ManagedUser }>(null);
  const [newRole, setNewRole] = useState<Role>('Groom');
  const [reason, setReason] = useState('');
  const [reasonErr, setReasonErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { managerApi.getUsers().then(setUsers); }, []);

  const list = useMemo(() => (users ?? []).filter((u) =>
    (u.fullName + u.username + u.email).toLowerCase().includes(q.trim().toLowerCase()) &&
    (!roleF || u.role === roleF) && (!stF || u.status === stF)), [users, q, roleF, stF]);

  if (!users) return <div className="ht ht-page"><Loading /></div>;

  const open = (kind: 'role' | 'lock' | 'unlock', user: ManagedUser) => {
    setReason(''); setReasonErr('');
    if (kind === 'role') setNewRole(user.role === 'Groom' ? 'HeadTrainer' : 'Groom');
    setDlg({ kind, user });
  };
  const checks = dlg?.kind === 'role' ? managerApi.checkRoleChange(dlg.user, newRole) : [];
  const blocked = checks.some((c) => c.level === 'fail');

  const confirm = async () => {
    if (!dlg) return;
    if (reason.trim().length < 10) { setReasonErr('Lý do phải có ít nhất 10 ký tự.'); return; }
    setBusy(true);
    try {
      const u = dlg.user;
      if (dlg.kind === 'role') {
        await managerApi.changeRole(u.id, newRole, reason);
        setUsers((xs) => xs!.map((x) => (x.id === u.id ? { ...x, role: newRole, openTasks: 0 } : x)));
        toast(`Đã đổi vai trò ${u.fullName} → ${ROLE_LABEL[newRole]} · ghi Audit Log.`);
      } else if (dlg.kind === 'lock') {
        await managerApi.lockUser(u.id, reason);
        setUsers((xs) => xs!.map((x) => (x.id === u.id ? { ...x, status: 'LOCKED', lockReason: reason.trim() } : x)));
        toast(`Đã khóa tài khoản ${u.username}.`);
      } else {
        await managerApi.unlockUser(u.id, reason);
        setUsers((xs) => xs!.map((x) => (x.id === u.id ? { ...x, status: 'ACTIVE' } : x)));
        toast(`Đã mở khóa tài khoản ${u.username}.`);
      }
      setDlg(null);
    } finally { setBusy(false); }
  };

  return (
    <div className="ht ht-page">
      <PageHeader title="Người dùng & phân quyền" sub="Khóa, mở khóa, đổi vai trò. Mọi thay đổi được ghi Audit Log (BR_10)." />

      <Tabs value={tab} onChange={setTab} items={[{ value: 'users', label: 'Người dùng', count: users.length }, { value: 'rbac', label: 'Vai trò & quyền' }]} />

      {tab === 'users' ? (
        <Panel headStyle={{ paddingBottom: 16, justifyContent: 'flex-start', flexWrap: 'wrap' }} right={<>
          <div className="ht-search-input"><Icon name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên, tên đăng nhập, email…" aria-label="Tìm người dùng" /></div>
          <select className="ht-select" value={roleF} onChange={(e) => setRoleF(e.target.value)} aria-label="Lọc vai trò">
            <option value="">Tất cả vai trò</option>{ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
          <select className="ht-select" value={stF} onChange={(e) => setStF(e.target.value)} aria-label="Lọc trạng thái">
            <option value="">Mọi trạng thái</option><option value="ACTIVE">Hoạt động</option><option value="LOCKED">Bị khóa</option>
          </select>
        </>}>
          <table className="ht-table">
            <thead><tr><th>Người dùng</th><th>Tên đăng nhập</th><th>Vai trò</th><th>Đăng nhập gần nhất</th><th>Trạng thái</th><th style={{ textAlign: 'right' }}>Thao tác</th></tr></thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', whiteSpace: 'nowrap' }}>
                      <i className={`ht-avatar${u.status === 'LOCKED' ? ' ht-avatar--muted' : ''}`}>{initials(u.fullName)}</i>
                      <span><span className="strong">{u.fullName}</span><span className="sub">{u.email}</span></span>
                    </div>
                  </td>
                  <td className="mono">{u.username}</td>
                  <td><Badge tone="brand" plain>{ROLE_LABEL[u.role]}</Badge></td>
                  <td className="mono">{u.lastLogin}</td>
                  <td>
                    {u.status === 'ACTIVE' ? <Badge tone="success">Hoạt động</Badge> : <><Badge tone="neutral">Bị khóa</Badge><span className="sub">{u.lockReason}</span></>}
                    {u.serviceSuspended && <span className="sub" style={{ color: 'var(--danger-ink)', fontWeight: 600 }}>Dịch vụ đình chỉ (BR_13)</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                      {u.isSelf ? <span style={{ fontSize: 12, color: 'var(--muted)' }}>Tài khoản của bạn</span> : <>
                        <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" disabled={u.status === 'LOCKED'} onClick={() => open('role', u)}><Icon name="usercog" />Đổi vai trò</button>
                        {u.status === 'ACTIVE'
                          ? <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" onClick={() => open('lock', u)}><Icon name="lock" />Khóa</button>
                          : <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" onClick={() => open('unlock', u)}><Icon name="unlock" />Mở khóa</button>}
                      </>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <div className="ht-empty">Không có người dùng phù hợp.</div>}
        </Panel>
      ) : (
        <Panel title="Ma trận quyền theo vai trò" sub="Nguyên tắc quyền tối thiểu. “Xem” là quyền giám sát, không chỉnh sửa chuyên môn."
          foot={<><span>Bác sĩ thú y là người duy nhất mở khóa y tế (BR_01).</span><span>Nguồn: Đặc tả nghiệp vụ §4</span></>}>
          <table className="ht-table">
            <thead><tr><th>Chức năng</th>{RBAC_COLS.map((r) => <th key={r} style={{ textAlign: 'center' }}>{ROLE_LABEL[r]}</th>)}</tr></thead>
            <tbody>
              {RBAC.map(([fn, ...cells]) => (
                <tr key={fn}>
                  <td className="strong">{fn}</td>
                  {cells.map((c, i) => (
                    <td key={i} style={{ textAlign: 'center' }}>
                      {c === 'y' ? <span aria-label="Có quyền" style={{ color: 'var(--success-ink)' }}><Icon name="check" /></span>
                        : c === 'n' ? <span aria-label="Không" style={{ color: 'var(--subtle)' }}>—</span>
                        : <span style={{ color: 'var(--info-ink)', fontSize: 12, fontWeight: 600 }}>{c}</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      {dlg?.kind === 'role' && (
        <Dialog open onClose={() => setDlg(null)} icon="usercog" tone="brand" width={560} busy={busy} busyLabel="Đang lưu…"
          title={`Đổi vai trò · ${dlg.user.fullName}`}
          sub={<>Hiện tại: <b>{ROLE_LABEL[dlg.user.role]}</b> · <span className="ht-mono">{dlg.user.username}</span></>}
          confirmLabel="Áp dụng vai trò" onConfirm={confirm} disabled={blocked}>
          <div className="ht-label" style={{ marginBottom: 8 }}>Vai trò mới</div>
          <div className="ht-roles">
            {ROLES.map((r) => (
              <label key={r} className="ht-role">
                <input type="radio" name="role" value={r} checked={newRole === r} disabled={r === dlg.user.role} onChange={() => setNewRole(r)} />
                {ROLE_LABEL[r]}{r === dlg.user.role && ' · hiện tại'}
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
            <ReasonField id="role-reason" label="Lý do" value={reason} error={reasonErr} minHeight={64}
              placeholder="VD: Bổ nhiệm HLV phụ trách nhóm ngựa Khu B từ 05/10."
              onChange={(v) => { setReason(v); if (v.trim().length >= 10) setReasonErr(''); }} />
          </div>
        </Dialog>
      )}

      {dlg && dlg.kind !== 'role' && (
        <Dialog open onClose={() => setDlg(null)} icon={dlg.kind === 'lock' ? 'lock' : 'unlock'} tone={dlg.kind === 'lock' ? 'danger' : 'brand'}
          danger={dlg.kind === 'lock'} busy={busy} busyLabel="Đang lưu…"
          title={dlg.kind === 'lock' ? `Khóa tài khoản ${dlg.user.fullName}?` : `Mở khóa ${dlg.user.fullName}?`}
          sub={dlg.kind === 'lock'
            ? 'Người dùng bị đăng xuất ngay và không thể đăng nhập cho đến khi được mở khóa.'
            : `Bị khóa vì: ${dlg.user.lockReason}. Người dùng đăng nhập lại được với vai trò ${ROLE_LABEL[dlg.user.role]}.`}
          confirmLabel={dlg.kind === 'lock' ? 'Khóa tài khoản' : 'Mở khóa'} onConfirm={confirm}>
          {dlg.kind === 'lock' && dlg.user.openTasks ? (
            <Callout tone="demo" style={{ marginBottom: 14 }}>{dlg.user.openTasks} công việc đang mở của người này cần được giao lại.</Callout>
          ) : null}
          <ReasonField id="lock-reason" label={dlg.kind === 'lock' ? 'Lý do khóa' : 'Lý do mở khóa'} value={reason} error={reasonErr} minHeight={72}
            placeholder={dlg.kind === 'lock' ? 'VD: Nghỉ việc từ 05/10/2026.' : ''}
            onChange={(v) => { setReason(v); if (v.trim().length >= 10) setReasonErr(''); }} />
        </Dialog>
      )}
    </div>
  );
};
