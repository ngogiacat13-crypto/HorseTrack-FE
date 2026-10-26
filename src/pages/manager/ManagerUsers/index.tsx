import React, { useEffect, useState } from 'react';
import { ManagedUser, managerApi, type GroomAssignment, type AssignedHorse, type AssignedStall } from '../../../api/managerApi';
import { useActor, useAuth } from '../../../auth/AuthContext';
import { Callout, Loading, PageHeader, Tabs, useToast } from '../../../components/ui/Ht';
import type { ApiError } from '../../../api/http';
import { USE_BACKEND } from '../../../api/beClient';
import { Icon } from '../../../components/ui/Icon';
import { UserAction, UserTable } from './UserTable';
import { RbacMatrix } from './RbacMatrix';
import { AssignmentDialog, LockUserDialog } from './UserDialogs';
import { CreateStaffDialog } from './CreateStaffDialog';
import { OwnerServiceDialog } from '../../../features/owner-service/OwnerServiceDialog';

export const ManagerUsers: React.FC = () => {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<ManagedUser[] | null>(null);
  const [assignmentData, setAssignmentData] = useState<{ grooms: GroomAssignment[]; stalls: AssignedStall[]; horses: AssignedHorse[] } | null>(null);
  const [tab, setTab] = useState<'users' | 'rbac'>('users');
  const [dlg, setDlg] = useState<null | { kind: UserAction; user: ManagedUser }>(null);
  const [creating, setCreating] = useState(false);
  const actor = useActor();
  const toast = useToast();
  const resend = async (u: ManagedUser) => {
    try {
      toast(await managerApi.resendConfirmation(u, actor) || `Đã gửi lại mail xác nhận cho ${u.email}.`);
    } catch (e) {
      toast((e as ApiError).message ?? 'Không gửi lại được mail xác nhận.');
    }
  };

  useEffect(() => { Promise.all([managerApi.getUsers(), managerApi.getGroomAssignments()]).then(([us, assignments]) => { setUsers(us); setAssignmentData(assignments); }); }, []);
  if (!users || !assignmentData) return <div className="ht ht-page"><Loading /></div>;

  const applied = (patch: Partial<ManagedUser>) => {
    if (dlg) setUsers((xs) => xs!.map((x) => (x.id === dlg.user.id ? { ...x, ...patch } : x)));
    setDlg(null);
  };

  return (
    <div className="ht ht-page">
      <PageHeader title="Người dùng & phân quyền" sub="Tạo tài khoản nhân viên, khóa và mở khóa tài khoản. Mọi thay đổi được ghi Audit Log (BR_10)."
        actions={<button type="button" className="ht-btn ht-btn--primary" onClick={() => setCreating(true)}><Icon name="usercog" size={16} />Tạo tài khoản nhân viên</button>} />
      <Tabs value={tab} onChange={setTab} items={[{ value: 'users', label: 'Người dùng', count: users.length }, { value: 'rbac', label: 'Vai trò & quyền' }]} />

      {USE_BACKEND && (
        users.some((u) => u.beId !== undefined) ? (
          <Callout tone="success" style={{ margin: '12px 0 16px' }}>
            Đang hiển thị <strong>dữ liệu thật từ database</strong> — {users.length} tài khoản trong hệ thống.
          </Callout>
        ) : (
          <Callout tone="danger" style={{ margin: '12px 0 16px' }}>
            Không tải được danh sách người dùng từ server — kiểm tra kết nối hoặc đăng nhập lại bằng tài khoản Quản lý CLB.
          </Callout>
        )
      )}

      {tab === 'users' ? <UserTable users={users} meId={me?.userId} showService={USE_BACKEND} onAction={(kind, user) => (kind === 'resend' ? void resend(user) : setDlg({ kind, user }))} /> : <RbacMatrix />}

      {creating && <CreateStaffDialog onClose={() => setCreating(false)} onDone={(u) => { setUsers((xs) => [u, ...xs!]); setCreating(false); setTab('users'); }} />}
      {dlg?.kind === 'assign' && <AssignmentDialog user={dlg.user} data={assignmentData} onClose={() => setDlg(null)} onDone={() => { setDlg(null); managerApi.getGroomAssignments().then(setAssignmentData); }} />}
      {dlg?.kind === 'service' && dlg.user.beId && <OwnerServiceDialog ownerId={dlg.user.beId} ownerName={dlg.user.fullName} onClose={() => setDlg(null)} />}
      {dlg && (dlg.kind === 'lock' || dlg.kind === 'unlock') && <LockUserDialog user={dlg.user} lock={dlg.kind === 'lock'} onClose={() => setDlg(null)} onDone={applied} />}
    </div>
  );
};
