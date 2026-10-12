import React, { useEffect, useState } from 'react';
import { ManagedUser, managerApi } from '../../../api/managerApi';
import { useAuth } from '../../../auth/AuthContext';
import { Loading, PageHeader, Tabs } from '../../../components/ui/Ht';
import { UserAction, UserTable } from './UserTable';
import { RbacMatrix } from './RbacMatrix';
import { LockUserDialog, RoleDialog } from './UserDialogs';

/* 5.1 Quản lý người dùng · 5.2 Đổi vai trò (BR_06) · 5.3 Phân quyền RBAC — mọi thay đổi ghi Audit Log (BR_10) */
export const ManagerUsers: React.FC = () => {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<ManagedUser[] | null>(null);
  const [tab, setTab] = useState<'users' | 'rbac'>('users');
  const [dlg, setDlg] = useState<null | { kind: UserAction; user: ManagedUser }>(null);

  useEffect(() => { managerApi.getUsers().then(setUsers); }, []);
  if (!users) return <div className="ht ht-page"><Loading /></div>;

  // Update the row in place after a successful action, then close the dialog.
  const applied = (patch: Partial<ManagedUser>) => {
    if (dlg) setUsers((xs) => xs!.map((x) => (x.id === dlg.user.id ? { ...x, ...patch } : x)));
    setDlg(null);
  };

  return (
    <div className="ht ht-page">
      <PageHeader title="Người dùng & phân quyền" sub="Khóa, mở khóa, đổi vai trò. Mọi thay đổi được ghi Audit Log (BR_10)." />
      <Tabs value={tab} onChange={setTab} items={[{ value: 'users', label: 'Người dùng', count: users.length }, { value: 'rbac', label: 'Vai trò & quyền' }]} />

      {tab === 'users' ? <UserTable users={users} meId={me?.userId} onAction={(kind, user) => setDlg({ kind, user })} /> : <RbacMatrix />}

      {dlg?.kind === 'role' && <RoleDialog user={dlg.user} onClose={() => setDlg(null)} onDone={applied} />}
      {dlg && dlg.kind !== 'role' && <LockUserDialog user={dlg.user} lock={dlg.kind === 'lock'} onClose={() => setDlg(null)} onDone={applied} />}
    </div>
  );
};
