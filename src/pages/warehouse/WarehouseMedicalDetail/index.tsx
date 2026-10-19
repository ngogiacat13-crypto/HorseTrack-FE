import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { warehouseApi } from '../../../api/warehouseApi';
import { useFetch } from '../../../hooks/useFetch';
import { Icon } from '../../../components/ui/Icon';
import { BackButton, Badge, Callout, PageHeader, Panel, Timeline } from '../../../components/ui/Ht';
import { LoadState } from '../../../components/trainer/TrainerParts';
import { ProtocolBadge, ProtocolPath } from '../../../components/vet/VetParts';
import { StockCheckForm } from './StockCheckForm';
import { DispenseForm } from './DispenseForm';

/** What the warehouse sees while the protocol is in the vet's hands. */
const WAIT_TEXT: Record<string, string> = {
  STOCK_SHORTAGE: 'Đã báo thiếu. Bác sĩ đang quyết định đổi thuốc hoặc chờ hàng — kho không tự đổi thuốc.',
  STOCK_AVAILABLE: 'Đã giữ đủ hàng. Chờ bác sĩ xác nhận phác đồ rồi mới cấp phát.',
  WAITING_RESTOCK: 'Bác sĩ chọn chờ hàng. Khi nhận lô hàng ở trang Đơn nhập, hệ thống tự giữ hàng và báo bác sĩ rà soát lại.',
  REQUIRES_VET_REVIEW: 'Chờ bác sĩ đánh giá lại (hàng trễ hoặc hàng vừa về). Chưa được cấp phát.',
  IN_TREATMENT: 'Đã cấp phát — đang điều trị.',
};

/* Chi tiết yêu cầu thuốc: 2.2–2.3 kiểm tồn & phản hồi · 2.4 cấp phát · trạng thái chờ bác sĩ / chờ hàng */
export const WarehouseMedicalDetail: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const { data, loading, error, reload } = useFetch(() => warehouseApi.getRequest(id), [id]);
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  const { protocol: p, horse, items, shipments, openShipments } = data;
  const related = shipments.filter((s) => s.forRef === p.id || (p.stock?.lines ?? []).some((l) => l.shipment === s.id));

  return (
    <div className="ht ht-page">
      <PageHeader
        crumbs={<BackButton fallback="/warehouse/medical" />}
        title={<>Phác đồ <span className="ht-mono">{p.id}</span> <span style={{ color: 'var(--muted)', fontWeight: 500 }}>/ {horse.name}</span></>}
        badge={<ProtocolBadge state={p.state} delayed={p.delayed} />}
        sub={<>{p.diagnosis} · BS {p.vet} · chuồng <b>{horse.stall}</b> · cần thuốc từ <b className="ht-mono">{p.requiredBy}</b></>}
      />
      <div style={{ marginBottom: 20 }}><ProtocolPath protocol={p} /></div>

      <div className="ht-cols">
        <div>
          {p.state === 'WAITING_STOCK_CHECK' && <StockCheckForm protocol={p} items={items} openShipments={openShipments} onDone={reload} />}
          {p.state === 'READY_FOR_DISPENSING' && <DispenseForm protocol={p} items={items} onDone={reload} />}
          {WAIT_TEXT[p.state] && <Callout tone={p.state === 'IN_TREATMENT' ? 'success' : 'info'} icon="info">{WAIT_TEXT[p.state]}</Callout>}

          {p.stock && p.state !== 'WAITING_STOCK_CHECK' && (
            <Panel title="Phản hồi kho đã gửi" sub={`${p.stock.at} · ${p.stock.by}`}>
              <table className="ht-table">
                <thead><tr><th>Vật tư</th><th className="num">Cần</th><th className="num">Đã giữ</th><th>Lô</th><th>Thiếu · ETA</th></tr></thead>
                <tbody>
                  {p.stock.lines.map((l) => (
                    <tr key={l.itemId}>
                      <td className="strong">{l.name}</td><td className="num">{l.need} {l.unit}</td><td className="num">{l.held}</td>
                      <td className="mono" style={{ fontSize: 12 }}>{l.lot ? `${l.lot} · ${l.expiry}` : '—'}</td>
                      <td>{l.short > 0 ? <Badge tone="danger">Thiếu {l.short} · {l.eta ? `ETA ${l.eta.slice(0, 5)}${l.shipment ? ` (${l.shipment})` : ''}` : 'ETA chưa xác định'}</Badge> : <Badge tone="success">Đủ</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          )}
        </div>

        <div>
          <Panel as="h3" title="Phác đồ (chỉ xem)">
            <div className="ht-panel__body" style={{ display: 'grid', gap: 8 }}>
              {p.phases.map((ph) => (
                <div key={ph.no} style={{ fontSize: 13, padding: '8px 10px', background: 'var(--bg)', borderRadius: 8 }}>
                  <b>GĐ {ph.no} · {ph.name}</b> <span style={{ color: 'var(--muted)' }}>từ {ph.startDate.slice(0, 5)} · {ph.days} ngày</span>
                  {ph.items.map((it) => <div key={it.itemId}>{it.name} × {it.qty} {it.unit}</div>)}
                </div>
              ))}
              <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>Kho không sửa thuốc hay liều — mọi thay đổi do bác sĩ tạo phiên bản mới (BR_07).</p>
            </div>
          </Panel>
          {related.length > 0 && (
            <Panel as="h3" title="Lô hàng liên quan" right={<Link className="ht-more" to="/warehouse/shipments">Đơn nhập <Icon name="arrow" /></Link>}>
              <div className="ht-panel__body" style={{ display: 'grid', gap: 8, fontSize: 13 }}>
                {related.map((s) => <div key={s.id}><b className="ht-mono">{s.id}</b> · {s.item}<div style={{ color: s.status === 'DELAYED' ? 'var(--danger-ink)' : 'var(--muted)' }}>ETA {s.eta} · {s.status}</div></div>)}
              </div>
            </Panel>
          )}
          <Panel as="h3" title="Lịch sử phác đồ">
            <div className="ht-panel__body"><Timeline items={p.log.map((l) => ({ tone: l.tone, what: <><b>{l.who}</b> {l.text}</>, when: l.at }))} /></div>
          </Panel>
        </div>
      </div>
    </div>
  );
};
