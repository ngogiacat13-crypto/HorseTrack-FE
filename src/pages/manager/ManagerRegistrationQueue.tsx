import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { managerApi, Registration, RegStatus } from '../../api/managerApi';
import { Icon } from '../../components/ui/Icon';
import { Badge, Loading, PageHeader, Panel, Tabs } from '../../components/ui/Ht';

type Filter = 'Pending' | 'Approved' | 'Rejected' | 'All';
const BADGE: Record<RegStatus, JSX.Element> = {
  Pending: <Badge tone="info">Chờ duyệt</Badge>,
  Approved: <Badge tone="success">Đã duyệt</Badge>,
  Rejected: <Badge tone="danger">Đã từ chối</Badge>,
};

export const ManagerRegistrationQueue: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Registration[] | null>(null);
  const [filter, setFilter] = useState<Filter>('Pending');
  const [q, setQ] = useState('');
  const [oldestFirst, setOldestFirst] = useState(true);

  useEffect(() => { managerApi.getRegistrations().then(setItems); }, []);

  const list = useMemo(() => {
    if (!items) return [];
    const s = q.trim().toLowerCase();
    const out = items.filter((r) => (filter === 'All' || r.status === filter) &&
      (r.id + r.horse.name + r.owner.fullName + r.horse.code).toLowerCase().includes(s));
    const key = (r: Registration) => r.submittedAt.slice(6, 10) + r.submittedAt.slice(3, 5) + r.submittedAt.slice(0, 2) + r.submittedAt.slice(11);
    return out.sort((a, b) => (oldestFirst ? 1 : -1) * key(a).localeCompare(key(b)));
  }, [items, filter, q, oldestFirst]);

  if (!items) return <div className="ht ht-page"><Loading /></div>;
  const count = (s: RegStatus) => items.filter((r) => r.status === s).length;
  const open = (id: string) => navigate(`/manager/registrations/${id}`);

  return (
    <div className="ht ht-page">
      <PageHeader title="Đăng ký ngựa" sub="Kiểm tra giấy tờ, microchip và danh tính trước khi đưa ngựa vào danh sách quản lý." />

      <Tabs<Filter> value={filter} onChange={setFilter} items={[
        { value: 'Pending', label: 'Chờ duyệt', count: count('Pending') },
        { value: 'Approved', label: 'Đã duyệt', count: count('Approved') },
        { value: 'Rejected', label: 'Đã từ chối', count: count('Rejected') },
        { value: 'All', label: 'Tất cả', count: items.length },
      ]} />

      <Panel
        headStyle={{ paddingBottom: 16 }}
        right={<>
          <div className="ht-search-input" style={{ maxWidth: 360 }}>
            <Icon name="search" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mã hồ sơ, tên ngựa, chủ ngựa, microchip…" aria-label="Tìm hồ sơ" />
          </div>
          <select className="ht-select" aria-label="Sắp xếp" value={oldestFirst ? 'old' : 'new'} onChange={(e) => setOldestFirst(e.target.value === 'old')}>
            <option value="old">Cũ nhất trước</option><option value="new">Mới nhất trước</option>
          </select>
        </>}
        foot={<><span>Hiển thị {list.length} / {items.length} hồ sơ</span><span>Thứ tự xử lý: hồ sơ gửi sớm nhất trước</span></>}
      >
        <table className="ht-table">
          <thead><tr><th>Mã hồ sơ</th><th>Ngựa</th><th>Chủ ngựa</th><th>Ngày gửi</th><th>Kiểm tra</th><th>Trạng thái</th><th /></tr></thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id} data-href tabIndex={0} onClick={() => open(r.id)} onKeyDown={(e) => e.key === 'Enter' && open(r.id)}>
                <td className="id">{r.id}</td>
                <td><span className="strong">{r.horse.name}</span><span className="sub">{r.horse.breed} · {r.horse.sex} {r.horse.age} tuổi · <span className="ht-mono">{r.horse.code}</span></span></td>
                <td>{r.owner.fullName}<span className="sub">{r.owner.email}</span></td>
                <td>
                  <span className="mono">{r.submittedAt.slice(0, 10)}</span>
                  {r.status === 'Pending'
                    ? <span className="sub" style={r.waitingDays >= 4 ? { color: 'var(--danger-ink)', fontWeight: 600 } : undefined}>chờ {r.waitingDays} ngày</span>
                    : <span className="sub">{r.decidedNote}</span>}
                </td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: r.passed === 4 ? 'var(--success-ink)' : 'var(--warning-ink)' }}>
                    <Icon name={r.passed === 4 ? 'check' : 'warn'} />{r.passed}/4 mục
                  </span>
                  {r.firstIssue && <span className="sub">{r.firstIssue}</span>}
                </td>
                <td>{BADGE[r.status]}</td>
                <td style={{ textAlign: 'right' }}>
                  <button type="button" className={`ht-btn ${r.status === 'Pending' ? 'ht-btn--primary' : 'ht-btn--secondary'} ht-btn--sm`}
                    onClick={(e) => { e.stopPropagation(); open(r.id); }}>
                    {r.status === 'Pending' ? 'Xét duyệt' : 'Xem'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <div className="ht-empty">Không có hồ sơ phù hợp.</div>}
      </Panel>
    </div>
  );
};
