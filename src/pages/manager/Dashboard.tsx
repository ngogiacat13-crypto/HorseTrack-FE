import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { managerApi } from '../../api/managerApi';
import { useActor } from '../../auth/AuthContext';
import { Icon } from '../../components/ui/Icon';
import { Badge, Loading, PageHeader, Panel, StatCard, Timeline, money, useToast } from '../../components/ui/Ht';

type Dash = Awaited<ReturnType<typeof managerApi.getDashboard>>;

const REG_BADGE = (status: string, issue?: string) =>
  status === 'Approved' ? <Badge tone="success">Đã duyệt</Badge>
  : status === 'Rejected' ? <Badge tone="danger">Đã từ chối</Badge>
  : issue && issue.startsWith('Thiếu') ? <Badge tone="warning">Thiếu giấy tờ</Badge>
  : <Badge tone="info">Chờ duyệt</Badge>;

export const ManagerDashboard: React.FC = () => {
  const [d, setD] = useState<Dash | null>(null);
  const navigate = useNavigate();
  const toast = useToast();
  const actor = useActor();

  useEffect(() => { managerApi.getDashboard().then(setD); }, []);
  if (!d) return <div className="ht ht-page"><Loading /></div>;

  const max = Math.max(...d.vetCost.map((c) => c.value));
  const total = d.vetCost.reduce((s, c) => s + c.value, 0);
  const last = d.vetCost[d.vetCost.length - 1], prev = d.vetCost[d.vetCost.length - 2];
  const delta = Math.round(((last.value - prev.value) / prev.value) * 100);
  const vn = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 1 });

  return (
    <div className="ht ht-page">
      <PageHeader
        title="Bảng điều khiển"
        sub={<>Chào buổi sáng, {actor.name} · {d.greeting.weekday}, <span className="ht-mono">{d.greeting.date}</span></>}
        actions={<>
          <select className="ht-select" aria-label="Khoảng thời gian"><option>Hôm nay</option><option>7 ngày</option><option>Tháng này</option></select>
          <button className="ht-btn ht-btn--secondary" onClick={() => toast('Đang xuất báo cáo tổng quan (PDF)…')}><Icon name="download" />Xuất báo cáo</button>
        </>}
      />

      <div className="ht-banner" role="alert">
        <Icon name="alarm" />
        <div>
          <b>Phiên tập <span className="ht-mono">{d.autoStop.session}</span> ({d.autoStop.horse}) đã tự dừng lúc <span className="ht-mono">{d.autoStop.at}</span> — nhịp tim {d.autoStop.hr} bpm, ngưỡng {d.autoStop.limit} (BR_02).</b>
          <p>HLV trưởng {d.autoStop.decidedBy} đã dừng phiên và gửi ca khám <span className="ht-mono">{d.autoStop.caseId}</span> cho Bác sĩ lúc <span className="ht-mono">{d.autoStop.decidedAt}</span>. Bạn chỉ theo dõi.</p>
        </div>
        <Link className="ht-more" to="/manager/audit-logs">Xem nhật ký <Icon name="arrow" /></Link>
      </div>

      <div className="ht-stats">
        <StatCard icon="pulse" tone="brand" value={d.kpi.horses} label="Ngựa đang quản lý" meta={d.kpi.horsesTrend} metaTone="up" />
        <StatCard icon="clip" tone="info" value={d.kpi.pendingRegs} label="Hồ sơ ngựa chờ duyệt" meta={`cũ nhất ${d.kpi.oldestPendingDays} ngày`} onClick={() => navigate('/manager/registrations')} />
        <StatCard icon="heart" tone="gold" value={d.kpi.medicalWatch} label="Ca y tế cần theo dõi" meta="1 thiếu thuốc" onClick={() => navigate('/manager/medical-monitoring')} />
        <StatCard icon="alarm" tone="danger" value={d.kpi.lateTasks} label="Việc trễ SLA > 45 phút" meta={`+${d.kpi.lateTasksToday} hôm nay`} metaTone="danger" alert />
        <StatCard icon="truck" tone="warning" value={d.kpi.delayedShipments} label="Lô hàng kho bị trễ" meta={`ETA ${d.kpi.delayedEta}`} onClick={() => navigate('/manager/medical-monitoring')} />
      </div>

      <div className="ht-cols">
        <div>
          <Panel title="Đăng ký ngựa gần đây" sub={`${d.kpi.pendingRegs} hồ sơ đang chờ bạn duyệt`} right={<Link className="ht-more" to="/manager/registrations">Hàng đợi duyệt <Icon name="arrow" /></Link>}>
            <table className="ht-table">
              <thead><tr><th>Mã hồ sơ</th><th>Ngựa</th><th>Chủ ngựa</th><th>Ngày gửi</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {d.recentRegistrations.map((r) => (
                  <tr key={r.id} data-href tabIndex={0} onClick={() => navigate(`/manager/registrations/${r.id}`)} onKeyDown={(e) => e.key === 'Enter' && navigate(`/manager/registrations/${r.id}`)}>
                    <td className="id">{r.id}</td><td className="strong">{r.horse.name}</td><td>{r.owner.fullName}</td>
                    <td className="mono">{r.submittedAt.slice(0, 10)}</td><td>{REG_BADGE(r.status, r.firstIssue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel title="Phiên tập hôm nay" sub="Chỉ xem · quyết định thuộc HLV trưởng">
            <table className="ht-table">
              <thead><tr><th>Giờ</th><th>Ngựa</th><th>Kế hoạch</th><th>HLV</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {d.sessions.map((s) => (
                  <tr key={s.time} className={s.tone === 'danger' ? 'is-danger' : undefined}>
                    <td className="mono">{s.time}</td><td className="strong">{s.horse}</td><td>{s.plan}</td><td>{s.trainer}</td>
                    <td><Badge tone={s.tone}>{s.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel
            title="Chi phí thú y theo tháng"
            sub={<>6 tháng gần nhất · triệu ₫ · {last.month} tạm tính đến <span className="ht-mono">{d.greeting.date.slice(0, 5)}</span></>}
            right={<div style={{ textAlign: 'right' }}>
              <div style={{ font: '700 22px/28px var(--font-sans)' }}>{money(Math.round(total * 1_000_000))}</div>
              <div style={{ fontSize: 12, color: delta > 0 ? 'var(--danger-ink)' : 'var(--success-ink)', fontWeight: 600 }}>{last.month} {delta > 0 ? '+' : ''}{delta}% so với {prev.month}</div>
            </div>}
          >
            <div className="ht-panel__body">
              <div className="ht-bars" role="img" aria-label={'Chi phí thú y (triệu đồng): ' + d.vetCost.map((c) => `${c.month} ${vn(c.value)}`).join('; ')}>
                {d.vetCost.map((c, i) => (
                  <div key={c.month} className={`ht-bar${i === d.vetCost.length - 1 ? ' ht-bar--now' : i === d.vetCost.length - 2 ? ' ht-bar--prev' : ''}`}>
                    <span>{vn(c.value)}</span><i style={{ height: `${(c.value / max) * 100}%` }} />
                  </div>
                ))}
              </div>
              <div className="ht-bars-x">{d.vetCost.map((c, i) => i === d.vetCost.length - 1 ? <b key={c.month}>{c.month}</b> : <span key={c.month}>{c.month}</span>)}</div>
            </div>
          </Panel>
        </div>

        <div>
          <Panel as="h3" title="Y tế cần theo dõi" right={<Link className="ht-more" to="/manager/medical-monitoring">Xem <Icon name="arrow" /></Link>}>
            <ul className="ht-list">
              {d.medicalWatch.map((p) => (
                <li key={p.id} className={`ht-list-row${p.tone === 'danger' ? ' ht-list-row--danger' : ''}`}>
                  <div className="r1"><span className="ht-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{p.id} · {p.horse}</span><Badge tone={p.tone}>{p.tone === 'danger' ? 'Thuốc về trễ' : p.label}</Badge></div>
                  <div className="r2">{p.tone === 'danger' ? 'Bông gạc thiếu 12 cuộn' : `${p.diagnosis} · 1 giai đoạn`}</div>
                  <div className="r3">
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{p.tone === 'danger' ? <>Cần <span className="ht-mono">08/10</span> · ETA <span className="ht-mono">10/10</span></> : p.note}</span>
                    {p.tone === 'danger' && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger-ink)' }}>Chờ BS đánh giá lại</span>}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel as="h3" title="Hóa đơn quá hạn" right={<span className="ht-count ht-count--danger" style={{ margin: 0 }}>{d.overdueInvoices.length}</span>}
            foot={<><span>+{d.overdueInvoices.filter((i) => i.overdueDays <= 10).length} hóa đơn trong ân hạn</span><Link className="ht-more" to="/manager/invoices">Tất cả <Icon name="arrow" /></Link></>}>
            <ul className="ht-list">
              {d.overdueInvoices.filter((i) => i.overdueDays > 10).map((i) => (
                <li key={i.id} className="ht-list-row">
                  <div className="r1">
                    <span className="ht-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{i.id}</span>
                    {i.status === 'SUSPENDED' ? <Badge tone="danger" plain>Đình chỉ</Badge>
                      : i.overdueDays >= 25 ? <Badge tone="danger" plain>Đủ mốc đình chỉ</Badge>
                      : <Badge tone="warning" plain>Còn {25 - i.overdueDays} ngày</Badge>}
                  </div>
                  <div className="r2">{i.horse} · {i.owner}</div>
                  <div className="r3"><span className="late">Quá hạn {i.overdueDays} ngày</span><span className="money">{money(i.amount)}</span></div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel as="h3" title="Công việc trễ SLA" right={<Badge tone="neutral" plain style={{ fontFamily: 'var(--font-mono)' }}>BR_05</Badge>}
            foot={<span>+{d.moreLateTasks} việc khác</span>}>
            <ul className="ht-list">
              {d.lateTasks.map((t) => (
                <li key={t.title} className="ht-list-row">
                  <div className="r1"><span className="r2">{t.title}</span><span className="late">{t.late}</span></div>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t.groom} · hạn <span className="ht-mono">{t.due}</span>{t.doneAt && <> · xong <span className="ht-mono">{t.doneAt}</span></>}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel as="h3" title="Nhật ký hệ thống" right={<Link className="ht-more" to="/manager/audit-logs">Mở <Icon name="arrow" /></Link>}>
            <div className="ht-panel__body">
              <Timeline items={d.log.map((l) => ({ tone: l.tone, what: <><b>{l.who}</b> {l.text}</>, when: l.at }))} />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};
