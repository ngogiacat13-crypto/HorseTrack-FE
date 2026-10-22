import React, { useEffect, useState } from 'react';
import { managerApi } from '../../../api/managerApi';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Callout, Loading, PageHeader, Panel, StatCard, money, useToast } from '../../../components/ui/Ht';
import { USE_BACKEND } from '../../../api/beClient';

type Report = Awaited<ReturnType<typeof managerApi.getFinanceReport>>;
const vn = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 1 });

export const ManagerFinanceReport: React.FC = () => {
  const toast = useToast();
  const [r, setR] = useState<Report | null>(null);
  useEffect(() => { managerApi.getFinanceReport().then(setR); }, []);
  if (!r) return <div className="ht ht-page"><Loading /></div>;

  const max = Math.max(1, ...r.months.map((m) => m.billed));
  const agingTotal = r.aging.reduce((s, a) => s + a.amount, 0) || 1;
  const serviceTotal = r.byService.reduce((s, a) => s + a.amount, 0) || 1;

  return (
    <div className="ht ht-page">
      <PageHeader
        title="Báo cáo tài chính"
        sub="Doanh thu, tình trạng thu tiền và nợ quá hạn. Chỉ tính giao dịch VNPay đã được máy chủ xác minh."
        actions={USE_BACKEND ? undefined : <>
          <select className="ht-select" aria-label="Kỳ báo cáo"><option>Quý 3/2026 (T7–T9)</option><option>Tháng 09/2026</option><option>Năm 2026</option></select>
          <button className="ht-btn ht-btn--secondary" onClick={() => toast(`Đang xuất báo cáo ${r.period} (PDF)…`)}><Icon name="file" />PDF</button>
          <button className="ht-btn ht-btn--primary" onClick={() => toast(`Đang xuất báo cáo ${r.period} (Excel)…`)}><Icon name="download" />Xuất Excel</button>
        </>}
      />

      <div className="ht-stats">
        <StatCard icon="card" tone="brand" value={vn(r.collected)} unit="tr ₫" label="Đã thu" meta={r.period} />
        <StatCard icon="receipt" tone="gold" value={vn(r.billed)} unit="tr ₫" label="Tổng phát hành" meta={`${r.billedCount} hóa đơn`} />
        <StatCard icon="alarm" tone="danger" value={vn(r.overdue)} unit="tr ₫" label="Nợ quá hạn hiện tại" meta={`${r.overdueCount} hóa đơn`} metaTone="danger" alert />
        <StatCard icon="trend" tone="info" value={vn(r.rate)} unit="%" label="Tỷ lệ thu trên phát hành" meta={r.rateDelta === null ? undefined : `${r.rateDelta} điểm so với Q2`} metaTone={(r.rateDelta ?? 0) < 0 ? 'danger' : 'up'} />
      </div>

      <div className="ht-cols" style={{ gridTemplateColumns: 'minmax(0,1fr) 420px' }}>
        <div>
          <Panel title="Phát hành và đã thu theo tháng" sub="Triệu ₫ · quý đang xem tô đậm"
            right={<div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)' }}>
              <span><i style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, marginRight: 6, background: 'var(--primary-soft)', border: '1px solid var(--primary-light)' }} />Phát hành</span>
              <span><i style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, marginRight: 6, background: 'var(--primary)' }} />Đã thu</span>
            </div>}>
            <div className="ht-panel__body">
              <div role="img" aria-label={'Phát hành / đã thu (triệu đồng): ' + r.months.map((m) => `${m.m} ${vn(m.billed)}/${vn(m.collected)}`).join('; ')}
                style={{ display: 'grid', gridTemplateColumns: `repeat(${r.months.length}, 1fr)`, gap: 16, alignItems: 'end', height: 200, borderBottom: '1px solid var(--border)' }}>
                {r.months.map((m) => (
                  <div key={m.m} style={{ display: 'flex', gap: 4, alignItems: 'flex-end', justifyContent: 'center', height: '100%' }} title={`${m.m}: phát hành ${vn(m.billed)} · đã thu ${vn(m.collected)}`}>
                    <i style={{ display: 'block', width: 22, height: `${(m.billed / max) * 100}%`, borderRadius: '4px 4px 0 0', background: 'var(--primary-soft)', border: '1px solid var(--primary-light)', borderBottom: 0 }} />
                    <i style={{ display: 'block', width: 22, height: `${(m.collected / max) * 100}%`, borderRadius: '4px 4px 0 0', background: m.q ? 'var(--primary)' : 'var(--primary-light)' }} />
                  </div>
                ))}
              </div>
              <div className="ht-bars-x" style={{ gridTemplateColumns: `repeat(${r.months.length}, 1fr)`, display: 'grid' }}>
                {r.months.map((m) => (m.q ? <b key={m.m}>{m.m}</b> : <span key={m.m}>{m.m}</span>))}
              </div>
            </div>
          </Panel>

          <Panel title="Tuổi nợ" sub="Theo mốc BR_12 (ân hạn 10 ngày) và BR_13 (đình chỉ từ ngày 25)">
            <table className="ht-table">
              <thead><tr><th>Nhóm</th><th>Hóa đơn</th><th className="num">Số hóa đơn</th><th className="num">Số tiền</th><th className="num">Tỷ trọng</th></tr></thead>
              <tbody>
                {r.aging.map((a) => (
                  <tr key={a.bucket} className={a.suspended ? 'is-danger' : undefined}>
                    <td><Badge tone={a.tone} plain={a.suspended}>{a.bucket}</Badge></td>
                    <td className="id">{a.ids}</td>
                    <td className="num">{a.count}</td>
                    <td className="num">{money(a.amount)}</td>
                    <td className="num">{Math.round((a.amount / agingTotal) * 100)}%</td>
                  </tr>
                ))}
                <tr>
                  <td className="strong">Tổng</td><td />
                  <td className="num strong">{r.aging.reduce((s, a) => s + a.count, 0)}</td>
                  <td className="num strong">{money(agingTotal)}</td>
                  <td className="num strong">100%</td>
                </tr>
              </tbody>
            </table>
          </Panel>
        </div>

        <div>
          <Panel as="h3" title="Phát hành theo dịch vụ" sub={r.period}>
            <div className="ht-panel__body">
              {r.byService.map((s) => (
                <div key={s.name} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 120px', gap: 12, alignItems: 'center', padding: '8px 0', fontSize: 13 }}>
                  <span>{s.name}</span>
                  <span style={{ height: 10, borderRadius: 5, background: 'var(--bg)', overflow: 'hidden' }}>
                    <i style={{ display: 'block', height: '100%', width: `${(s.amount / serviceTotal) * 100}%`, background: 'var(--accent)', borderRadius: 5 }} />
                  </span>
                  <span style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{money(s.amount)}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel as="h3" title="Nợ theo chủ ngựa">
            <table className="ht-table">
              <thead><tr><th>Chủ ngựa</th><th className="num">Còn nợ</th></tr></thead>
              <tbody>
                {r.byOwner.map((o) => (
                  <tr key={o.owner}>
                    <td><span className="strong">{o.owner}</span>{o.suspended && <> <Badge tone="danger" plain style={{ height: 18, fontSize: 11 }}>Đình chỉ</Badge></>}<span className="sub">{o.ids}</span></td>
                    <td className="num strong">{money(o.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          {!USE_BACKEND && <Callout tone="demo" title="Chưa có công thức phí phạt">
            BR_12 và BR_14 chưa có số liệu; báo cáo hiện không cộng phí phạt và phí kích hoạt lại.
          </Callout>}
        </div>
      </div>
    </div>
  );
};
