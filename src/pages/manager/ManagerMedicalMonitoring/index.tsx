import React, { useEffect, useState } from 'react';
import { managerApi, ProtocolWatch, Shipment } from '../../../api/managerApi';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Callout, Loading, PageHeader, Panel, Segmented, StatCard, Timeline, money, useToast } from '../../../components/ui/Ht';

/* Read-only watch of treatment protocols (BR_07). Replaces the old protocol approval queue. */
export const ManagerMedicalMonitoring: React.FC = () => {
  const toast = useToast();
  const [data, setData] = useState<{ protocols: ProtocolWatch[]; shipments: Shipment[]; monthCost: number } | null>(null);
  const [sel, setSel] = useState('PD-0011');
  const [filter, setFilter] = useState<'open' | 'all'>('open');

  useEffect(() => { managerApi.getMedicalMonitoring().then(setData); }, []);
  if (!data) return <div className="ht ht-page"><Loading /></div>;

  const rows = data.protocols.filter((p) => filter === 'all' || p.open);
  const d = data.protocols.find((p) => p.id === sel) ?? data.protocols[0];
  const openCount = data.protocols.filter((p) => p.open).length;
  const reviewCount = data.protocols.filter((p) => p.state === 'REQUIRES_VET_REVIEW').length;
  const stockCount = data.protocols.filter((p) => p.state === 'WAITING_STOCK_CHECK').length;

  return (
    <div className="ht ht-page">
      <PageHeader
        title="Theo dõi y tế"
        sub="Tình trạng phác đồ, vật tư và lô thuốc trễ. Quyết định chuyên môn thuộc Bác sĩ thú y."
        actions={<button className="ht-btn ht-btn--secondary" onClick={() => toast('Đang xuất chi phí y tế tháng 10 (Excel)…')}><Icon name="download" />Xuất chi phí y tế</button>}
      />

      <div className="ht-banner ht-banner--info">
        <Icon name="info" />
        <div><b>Chế độ chỉ xem (BR_07).</b><p>Bác sĩ lập và xác nhận phác đồ; Quản lý kho xác nhận tồn và cấp phát. Quản lý CLB không duyệt phác đồ.</p></div>
      </div>

      <div className="ht-stats">
        <StatCard icon="heart" tone="brand" value={openCount} label="Phác đồ đang mở" />
        <StatCard icon="alarm" tone="danger" value={reviewCount} label="Cần bác sĩ đánh giá lại" meta="DELAYED_MEDICINE" metaTone="danger" alert={reviewCount > 0} />
        <StatCard icon="box" tone="info" value={stockCount} label="Chờ kho kiểm tồn" />
        <StatCard icon="receipt" tone="gold" value={data.monthCost.toLocaleString('vi-VN')} unit="tr ₫" label="Chi phí thú y tháng này" meta="T10 tạm tính" />
      </div>

      <div className="ht-cols" style={{ gridTemplateColumns: 'minmax(0,1fr) 380px' }}>
        <div>
          <Panel title="Phác đồ điều trị" headStyle={{ paddingBottom: 16 }}
            right={<Segmented label="Lọc" value={filter} onChange={setFilter} items={[{ value: 'open', label: 'Đang mở' }, { value: 'all', label: 'Tất cả' }]} />}>
            <table className="ht-table">
              <thead><tr><th>Mã</th><th>Ngựa · chẩn đoán</th><th>Bác sĩ</th><th>Trạng thái</th><th className="num">Chi phí</th></tr></thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} data-href tabIndex={0} className={p.id === d.id ? 'is-selected' : undefined}
                    onClick={() => setSel(p.id)} onKeyDown={(e) => e.key === 'Enter' && setSel(p.id)}>
                    <td className="id">{p.id}</td>
                    <td>
                      <span className="strong">{p.horse}</span>
                      {p.trainingLocked && <> <Badge tone="danger" plain style={{ height: 18, fontSize: 10, letterSpacing: '.06em' }}>KHÓA TẬP</Badge></>}
                      <span className="sub">{p.diagnosis}</span>
                    </td>
                    <td>{p.vet}</td>
                    <td><Badge tone={p.tone}>{p.label}</Badge><span className="sub mono">{p.state}</span></td>
                    <td className="num">{money(p.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        <div>
          <Panel as="h3" title={<>{d.horse} · <span className="ht-mono" style={{ fontWeight: 500 }}>{d.id}</span></>} sub={d.diagnosis}
            right={<Badge tone={d.tone}>{d.label}</Badge>} headStyle={{ alignItems: 'flex-start' }}>
            <div className="ht-panel__body" style={{ display: 'grid', gap: 16 }}>
              <div className="ht-pipe" aria-label="Tiến trình trạng thái">
                {d.path.map((s, i) => {
                  const last = i === d.path.length - 1;
                  const attr = last ? (d.alertState === s ? { 'data-alert': 'true' } : { 'data-on': 'true' }) : { 'data-done': 'true' };
                  return <span key={s} {...attr}>{s}</span>;
                })}
              </div>
              <Callout tone={d.tone === 'danger' ? 'danger' : 'info'} icon={d.tone === 'danger' ? 'alarm' : 'info'}>{d.note}</Callout>
              <div>
                <div className="ht-overline" style={{ marginBottom: 8 }}>Vật tư</div>
                {d.materials.map((m) => (
                  <div key={m.item} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <span>{m.item}</span><Badge tone={m.tone} plain>{m.status}</Badge>
                  </div>
                ))}
              </div>
              <div>
                <div className="ht-overline" style={{ marginBottom: 10 }}>Diễn biến</div>
                <Timeline items={d.log.map((l) => ({ tone: l.tone, what: <><b>{l.who}</b> {l.text}</>, when: l.at }))} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--muted)', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <span>Phụ trách: <b style={{ color: 'var(--foreground)' }}>BS {d.vet}</b></span>
              </div>
            </div>
          </Panel>

          <Panel as="h3" title="Lô hàng y tế" right={<span className="ht-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>Kho · chỉ xem</span>}>
            <ul className="ht-list">
              {data.shipments.filter((s) => s.status === 'ORDERED' || s.status === 'IN_TRANSIT' || s.status === 'DELAYED').map((s) => (
                <li key={s.id} className={`ht-list-row${s.status === 'DELAYED' ? ' ht-list-row--danger' : ''}`}>
                  <div className="r1"><span className="ht-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{s.id}</span>
                    {s.status === 'DELAYED' ? <Badge tone="danger">Bị trễ</Badge> : s.status === 'ORDERED' ? <Badge tone="neutral">Đã đặt</Badge> : <Badge tone="info">Đang giao</Badge>}</div>
                  <div className="r2">{s.item}</div>
                  <div className="r3">
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>ETA {s.etaOld && <><s className="ht-mono">{s.etaOld.slice(0, 5)}</s> → </>}
                      <b className="ht-mono" style={s.status === 'DELAYED' ? { color: 'var(--danger-ink)' } : undefined}>{s.eta.slice(0, 5)}</b></span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>cho <span className="ht-mono">{s.forRef}</span></span>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
};
