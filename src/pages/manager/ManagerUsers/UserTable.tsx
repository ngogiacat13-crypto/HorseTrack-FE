import React, { useMemo, useState } from 'react';
import type { ManagedUser } from '../../../api/managerApi';
import { Icon } from '../../../components/ui/Icon';
import { Avatar, Badge, Panel } from '../../../components/ui/Ht';
import { ROLE_LABEL } from '../../../components/layout/nav';
import { useDebounce } from '../../../hooks/useDebounce';

type Role = ManagedUser['role'];
export type UserAction = 'role' | 'lock' | 'unlock' | 'assign';
const ROLES = Object.keys(ROLE_LABEL) as Role[];

export const UserTable: React.FC<{ users: ManagedUser[]; meId?: string; onAction: (kind: UserAction, u: ManagedUser) => void }> = ({ users, meId, onAction }) => {
  const [q, setQ] = useState('');
  const query = useDebounce(q);
  const [roleF, setRoleF] = useState('');
  const [stF, setStF] = useState('');
  const list = useMemo(() => users.filter((u) =>
    (u.fullName + u.username + u.email).toLowerCase().includes(query.trim().toLowerCase()) &&
    (!roleF || u.role === roleF) && (!stF || u.status === stF)), [users, query, roleF, stF]);

  return (
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
                  <Avatar name={u.fullName} src={u.avatarUrl} size={32} muted={u.status === 'LOCKED' && !u.avatarUrl} />
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
                  {u.id === meId ? <span style={{ fontSize: 12, color: 'var(--muted)' }}>Tài khoản của bạn</span> : <>
                    <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" disabled={u.status === 'LOCKED'} onClick={() => onAction('role', u)}><Icon name="usercog" />Đổi vai trò</button>
                    {u.status === 'ACTIVE'
                      ? <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" onClick={() => onAction('lock', u)}><Icon name="lock" />Khóa</button>
                      : <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" onClick={() => onAction('unlock', u)}><Icon name="unlock" />Mở khóa</button>}
                    {u.role === 'Groom' && u.status === 'ACTIVE' && <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" onClick={() => onAction('assign', u)}><Icon name="stable" />Phân công</button>}
                  </>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {list.length === 0 && <div className="ht-empty">Không có người dùng phù hợp.</div>}
    </Panel>
  );
};
