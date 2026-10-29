import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { warehouseApi } from '../../../api/warehouseApi';
import type { Protocol } from '../../../api/vetApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { useFetch } from '../../../hooks/useFetch';
import { Icon } from '../../../components/ui/Icon';
import { BackButton, Badge, Callout, PageHeader, Panel, Timeline } from '../../../components/ui/Ht';
import { LoadState } from '../../../components/trainer/TrainerParts';
import { ProtocolBadge, ProtocolPath } from '../../../components/vet/VetParts';
import { CHANGE_LABEL, protocolChanges, stockLines } from '../../../api/vetApi';
import { StockCheckForm } from './StockCheckForm';
import { DispenseForm } from './DispenseForm';
import { DispensingHistory } from '../../../features/dispensing-history';

const WAIT_TEXT: Record<string, string> = {
  STOCK_SHORTAGE: 'Đã báo thiếu. Bác sĩ đang quyết định đổi thuốc hoặc chờ hàng — kho không tự đổi thuốc.',
  STOCK_AVAILABLE: 'Đã giữ đủ hàng. Chờ bác sĩ xác nhận phác đồ rồi mới cấp phát.',
  WAITING_RESTOCK: 'Bác sĩ chọn chờ hàng. Khi nhận lô hàng ở trang Đơn nhập, hệ thống tự giữ hàng và báo bác sĩ rà soát lại.',
  REQUIRES_VET_REVIEW: 'Chờ bác sĩ đánh giá lại (hàng trễ hoặc hàng vừa về). Chưa được cấp phát.',
  IN_TREATMENT: 'Đã cấp phát — đang điều trị.',
  ON_HOLD_PAYMENT: 'Đã cấp phát — chờ chủ ngựa thanh toán. Chưa chuyển sang điều trị.',
  COMPLETED: 'Đã cấp phát — điều trị hoàn tất.',
};

const SupplementReview: React.FC<{ protocol: Protocol; onDone: () => void }> = ({ protocol, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction(onDone);
  return (
    <Panel title="Thuốc bổ sung chờ duyệt" sub="Bác sĩ gửi yêu cầu khi đang điều trị. Kho quyết định giữ hàng hoặc ghi thiếu.">
      <div className="ht-panel__body" style={{ display: 'grid', gap: 10 }}>
        {error && <Callout tone="danger">{error}</Callout>}
        <button type="button" className="ht-btn ht-btn--primary" data-testid="warehouse-review-supplement" disabled={busy}
          onClick={() => { void run(() => warehouseApi.reviewSupplements(protocol, actor), 'Đã duyệt thuốc bổ sung. Nếu thiếu, hãy lập đơn nhập.'); }}>
          Duyệt thuốc bổ sung
        </button>
      </div>
    </Panel>
  );
};

export const WarehouseMedicalDetail: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const { data, loading, error, reload } = useFetch(() => warehouseApi.getRequest(id), [id]);
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  const { protocol: p, horse, items, shipments, openShipments, previous } = data;
  const changes = previous ? protocolChanges(previous, p) : [];
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
      {p.emergency && <Callout tone="success" icon="alarm">Phác đồ cấp cứu: không cần chờ thanh toán. Nếu còn báo thiếu, kho chỉ có thể cấp phần hàng đang có.</Callout>}

      <div className="ht-cols">
        <div>
          {p.state === 'WAITING_STOCK_CHECK' && <StockCheckForm protocol={p} items={items} openShipments={openShipments} onDone={reload} />}
          {(p.state === 'READY_FOR_DISPENSING' || (p.state === 'ON_HOLD_PAYMENT' && p.emergency) || (p.state === 'IN_TREATMENT' && (p.dispensedPhases?.length ?? 0) > 0 && p.phases.some((ph) => !p.dispensedPhases!.includes(ph.no)))) && <DispenseForm protocol={p} items={items} onDone={reload} />}
          {p.state === 'SUPERSEDED' && (
            <Callout tone="danger" icon="warn" title="Bác sĩ đã đổi phác đồ" testId="protocol-superseded">
              Bản này đã được thay bằng {p.supersededBy ? <Link to={`/warehouse/medical/${p.supersededBy}`} className="ht-mono">{p.supersededBy}</Link> : 'phiên bản mới'} — <b>không cấp phát theo bản này</b>. Hàng đã giữ cho bản này đã được trả lại kho.
            </Callout>
          )}
          {p.state === 'CANCELLED' && (
            <Callout tone="danger" icon="warn" title="Bác sĩ đã hủy phác đồ" testId="protocol-cancelled">
              {p.note.match(/Hủy:s*(.+)$/)?.[1] ?? p.note} — không cấp phát. Hàng đã giữ (nếu có) đã được trả lại kho.
            </Callout>
          )}
          {previous && (
            <Panel title={`Thay đổi so với ${previous.id} (v${previous.version})`} sub="Bác sĩ đổi phác đồ — kho kiểm tồn lại theo bản mới" >
              {changes.length ? (
                <table className="ht-table" data-testid="protocol-changes">
                  <thead><tr><th>Thuốc / vật tư</th><th className="num">Bản cũ</th><th className="num">Bản mới</th><th>Thay đổi</th></tr></thead>
                  <tbody>
                    {changes.map((c) => (
                      <tr key={c.name}>
                        <td className="strong">{c.name}</td>
                        <td className="num">{c.before ? `${c.before} ${c.unit}` : '—'}</td>
                        <td className="num">{c.after ? `${c.after} ${c.unit}` : '—'}</td>
                        <td><Badge tone={CHANGE_LABEL[c.kind][1] === 'warning' ? 'warning' : CHANGE_LABEL[c.kind][1] === 'danger' ? 'danger' : 'success'}>{CHANGE_LABEL[c.kind][0]}{c.kind === 'QTY' ? ` ${c.after > c.before ? '+' : ''}${c.after - c.before}` : ''}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <div className="ht-empty">Không đổi thuốc / số lượng (chỉ đổi giai đoạn hoặc ngày).</div>}
            </Panel>
          )}
          {WAIT_TEXT[p.state] && <Callout tone={['IN_TREATMENT', 'ON_HOLD_PAYMENT', 'COMPLETED'].includes(p.state) ? 'success' : 'info'} icon="info">
            {p.state === 'ON_HOLD_PAYMENT' && !p.emergency
              ? `Đã cấp phát — chờ chủ ngựa thanh toán giai đoạn ${p.awaitingPaymentPhaseNo ?? '?'}${p.awaitingPaymentPhaseName ? ` (${p.awaitingPaymentPhaseName})` : ''}${p.awaitingPaymentInvoiceCode ? ` · HĐ ${p.awaitingPaymentInvoiceCode}` : ''}. Chưa chuyển sang điều trị.`
              : WAIT_TEXT[p.state]}
          </Callout>}
          {p.state === 'IN_TREATMENT' && <SupplementReview protocol={p} onDone={reload} />}

          <DispensingHistory protocolBeId={(p as { beId?: number }).beId} />
          {p.stock && p.state !== 'WAITING_STOCK_CHECK' && (
            <Panel title="Phản hồi kho đã gửi" sub={`${p.stock.at} · ${p.stock.by}`}>
              <table className="ht-table">
                <thead><tr><th>Vật tư</th><th className="num">Cần</th><th className="num">Đã giữ</th><th>Lô</th><th>Thiếu · ETA</th></tr></thead>
                <tbody>
                  {stockLines(p).map((l) => (
                    <tr key={l.itemId}>
                      <td className="strong">{l.name}</td><td className="num">{l.need} {l.unit}</td><td className="num">{l.held}</td>
                      <td className="mono" style={{ fontSize: 12 }}>{l.lot ? `${l.lot} · ${l.expiry}` : '—'}</td>
                      <td>{l.issued ? <Badge tone="success">Đã cấp {l.need} {l.unit}</Badge> : l.short > 0 ? <Badge tone="danger">Thiếu {l.short} · {l.eta ? `ETA ${l.eta.slice(0, 5)}${l.shipment ? ` (${l.shipment})` : ''}` : 'ETA chưa xác định'}</Badge> : <Badge tone="success">Đủ</Badge>}</td>
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
