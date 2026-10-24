import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../../../components/ui/Icon';
import { Badge, money, Panel } from '../../../components/ui/Ht';
import type { Dash } from './types';

const regBadge = (status: string, issue?: string) =>
  status === 'Approved' ? <Badge tone="success">Đã duyệt</Badge>
  : status === 'Rejected' ? <Badge tone="danger">Đã từ chối</Badge>
  : issue && issue.startsWith('Thiếu') ? <Badge tone="warning">Thiếu giấy tờ</Badge>
  : <Badge tone="info">Chờ duyệt</Badge>;

export const RecentRegistrations: React.FC<{ d: Dash }> = ({ d }) => {
  const navigate = useNavigate();
  return (
    <Panel title="Đăng ký ngựa gần đây" sub={`${d.kpi.pendingRegs} hồ sơ đang chờ bạn duyệt`} right={<Link className="ht-more" to="/manager/registrations">Hàng đợi duyệt <Icon name="arrow" /></Link>}>
      <table className="ht-table">
        <thead><tr><th>Mã hồ sơ</th><th>Ngựa</th><th>Chủ ngựa</th><th>Ngày gửi</th><th>Trạng thái</th></tr></thead>
        <tbody>
          {d.recentRegistrations.map((r) => (
            <tr key={r.id} data-href tabIndex={0} onClick={() => navigate(`/manager/registrations/${r.id}`)} onKeyDown={(e) => e.key === 'Enter' && navigate(`/manager/registrations/${r.id}`)}>
              <td className="id">{r.id}</td><td className="strong">{r.horse.name}</td><td>{r.owner.fullName}</td>
              <td className="mono">{r.submittedAt.slice(0, 10)}</td><td>{regBadge(r.status, r.firstIssue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
};

export const TodaySessions: React.FC<{ d: Dash }> = ({ d }) => (
  <Panel title="Phiên tập hôm nay" sub="Chỉ xem · quyết định thuộc HLV trưởng">
    <table className="ht-table">
      <thead><tr><th>Giờ</th><th>Ngựa</th><th>Kế hoạch</th><th>HLV</th><th>Trạng thái</th></tr></thead>
      <tbody>
        {d.sessions.length === 0 && <tr><td colSpan={5} style={{ color: 'var(--muted)' }}>Hôm nay không có phiên tập.</td></tr>}
        {d.sessions.map((s) => (
          <tr key={s.id ?? s.time} className={s.tone === 'danger' ? 'is-danger' : undefined}>
            <td className="mono">{s.time}</td><td className="strong">{s.horse}</td><td>{s.plan}</td><td>{s.trainer}</td>
            <td><Badge tone={s.tone}>{s.status}</Badge></td>
          </tr>
        ))}
      </tbody>
    </table>
  </Panel>
);

export const VetCostChart: React.FC<{ d: Dash }> = ({ d }) => {
  const max = Math.max(...d.vetCost.map((c) => c.value));
  const total = d.vetCost.reduce((s, c) => s + c.value, 0);
  const last = d.vetCost[d.vetCost.length - 1], prev = d.vetCost[d.vetCost.length - 2];
  const delta = prev.value > 0 ? Math.round(((last.value - prev.value) / prev.value) * 100) : null;
  const vn = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 1 });
  return (
    <Panel title="Chi phí thú y theo tháng"
      sub={<>6 tháng gần nhất · triệu ₫ · {last.month} tạm tính đến <span className="ht-mono">{d.greeting.date.slice(0, 5)}</span></>}
      right={<div style={{ textAlign: 'right' }}>
        <div style={{ font: '700 22px/28px var(--font-sans)' }}>{money(Math.round(total * 1_000_000))}</div>
        {delta !== null && <div style={{ fontSize: 12, color: delta > 0 ? 'var(--danger-ink)' : 'var(--success-ink)', fontWeight: 600 }}>{last.month} {delta > 0 ? '+' : ''}{delta}% so với {prev.month}</div>}
      </div>}>
      <div className="ht-panel__body">
        <div className="ht-bars" role="img" aria-label={'Chi phí thú y (triệu đồng): ' + d.vetCost.map((c) => `${c.month} ${vn(c.value)}`).join('; ')}>
          {d.vetCost.map((c, i) => (
            <div key={c.month} className={`ht-bar${i === d.vetCost.length - 1 ? ' ht-bar--now' : i === d.vetCost.length - 2 ? ' ht-bar--prev' : ''}`}>
              <span>{vn(c.value)}</span><i style={{ height: `${max > 0 ? (c.value / max) * 100 : 0}%` }} />
            </div>
          ))}
        </div>
        <div className="ht-bars-x">{d.vetCost.map((c, i) => (i === d.vetCost.length - 1 ? <b key={c.month}>{c.month}</b> : <span key={c.month}>{c.month}</span>))}</div>
      </div>
    </Panel>
  );
};
