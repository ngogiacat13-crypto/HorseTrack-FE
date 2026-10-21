import React, { useEffect, useState } from 'react';
import { ManagedUser, managerApi, type GroomAssignment, type AssignedHorse, type AssignedStall } from '../../../api/managerApi';
import { useAuth } from '../../../auth/AuthContext';
import { Callout, Loading, PageHeader, Tabs } from '../../../components/ui/Ht';
import { USE_BACKEND } from '../../../api/beClient';
import { Icon } from '../../../components/ui/Icon';
import { UserAction, UserTable } from './UserTable';
import { RbacMatrix } from './RbacMatrix';
import { GroomAssignmentDialog, LockUserDialog } from './UserDialogs';
import { CreateStaffDialog } from './CreateStaffDialog';

export const ManagerUsers: React.FC = () => {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<ManagedUser[] | null>(null);
  const [assignmentData, setAssignmentData] = useState<{ grooms: GroomAssignment[]; stalls: AssignedStall[]; horses: AssignedHorse[] } | null>(null);
  const [tab, setTab] = useState<'users' | 'rbac'>('users');
  const [dlg, setDlg] = useState<null | { kind: UserAction; user: ManagedUser }>(null);
  const [creating, setCreating] = useState(false);

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
            Đang hiển thị <strong>dữ liệu thật từ database (nhánh test)</strong> — {users.length} tài khoản trong hệ thống.
          </Callout>
        ) : (
          <Callout tone="demo" style={{ margin: '12px 0 16px' }}>
            Đang hiển thị <strong>dữ liệu mẫu (db.json)</strong> — Backend hiện tại chưa có API người dùng hoặc bạn chưa đăng nhập bằng tài khoản Quản lý CLB.
          </Callout>
        )
      )}

      {tab === 'users' ? <UserTable users={users} meId={me?.userId} onAction={(kind, user) => setDlg({ kind, user })} /> : <RbacMatrix />}

      {creating && <CreateStaffDialog onClose={() => setCreating(false)} onDone={(u) => { setUsers((xs) => [u, ...xs!]); setCreating(false); setTab('users'); }} />}
      {dlg?.kind === 'assign' && <GroomAssignmentDialog user={dlg.user} data={assignmentData} onClose={() => setDlg(null)} onDone={() => { setDlg(null); managerApi.getGroomAssignments().then(setAssignmentData); }} />}
      {dlg && (dlg.kind === 'lock' || dlg.kind === 'unlock') && <LockUserDialog user={dlg.user} lock={dlg.kind === 'lock'} onClose={() => setDlg(null)} onDone={applied} />}
    </div>
  );
};
