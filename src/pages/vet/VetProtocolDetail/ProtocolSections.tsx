import React from 'react';
import { Link } from 'react-router-dom';
import { isOpenProtocol, phaseRequiredBy, Protocol, protoCost, Shipment, stockLines, stockShort } from '../../../api/vetApi';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Callout, money, Panel, Timeline } from '../../../components/ui/Ht';
import { ProtocolBadge } from '../../../components/vet/VetParts';


export const ProtocolBanners: React.FC<{ protocol: Protocol }> = ({ protocol: p }) => (
  <>
    {p.state === 'SUPERSEDED' && (
      <div className="ht-banner ht-banner--info"><Icon name="info" /><div><b>Phác đồ này đã bị thay bằng <Link to={`/vet/protocols/${p.supersededBy}`} className="ht-mono">{p.supersededBy}</Link>.</b><p>Kho không cấp phát theo bản đã bị thay thế.</p></div></div>
    )}
    {(p.state === 'REQUIRES_VET_REVIEW' || (p.delayed && isOpenProtocol(p) && p.state !== 'READY_FOR_DISPENSING')) && (
      <div className="ht-banner" role="alert">
        <Icon name="truck" />
        <div>
          <b>{p.state === 'REQUIRES_VET_REVIEW' ? 'Cảnh báo lô hàng trễ — cần đánh giá lại ngựa (2.6).' : 'Đang chờ hàng về sau mốc cần thuốc.'}</b>
          <p>Cần thuốc từ <span className="ht-mono">{phaseRequiredBy(p, stockShort(p).map((l) => l.itemId))}</span>, hàng dự kiến về <span className="ht-mono">{p.wait?.eta ?? '—'}</span>. {p.state === 'REQUIRES_VET_REVIEW' ? 'Chọn: sửa phác đồ (phiên bản mới), hoặc tiếp tục chờ nếu vẫn an toàn.' : `BS đã đánh giá: ${p.wait?.note ?? ''}`}</p>
        </div>
      </div>
    )}
  </>
);

export const PhaseList: React.FC<{ protocol: Protocol }> = ({ protocol }) => (
  <>
    {protocol.phases.map((ph) => (
      <section key={ph.no} className="ht-proto-phase">
        <div className="ht-proto-phase__head">
          <span className="ht-phase__no">{String(ph.no).padStart(2, '0')}</span>
          <h3>Giai đoạn {ph.no} · {ph.name}</h3>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Bắt đầu <span className="ht-mono">{ph.startDate}</span> · {ph.days} ngày{ph.goal && ` · ${ph.goal}`}</span>
          <b className="ht-mono" style={{ fontSize: 14 }}>{money(protoCost([ph]))}</b>
        </div>
        {ph.items.length > 0 && (
          <div className="ht-proto-phase__body">
            <table className="ht-proto-items">
              <thead><tr><th>Thuốc / vật tư</th><th className="num">Số lượng</th><th className="num">Đơn giá</th><th className="num">Thành tiền</th></tr></thead>
              <tbody>{ph.items.map((it) => <tr key={it.itemId}><td><b>{it.name}</b></td><td className="num">{it.qty} {it.unit}</td><td className="num ht-mono">{money(it.unitPrice)}</td><td className="num"><b>{money(it.qty * it.unitPrice)}</b></td></tr>)}</tbody>
            </table>
          </div>
        )}
      </section>
    ))}
  </>
);

export const StockPanel: React.FC<{ protocol: Protocol; shipments: Shipment[] }> = ({ protocol: p, shipments }) => (
  <Panel title={<><Icon name="box" /> Phản hồi kho</>} sub={p.stock ? `Cập nhật ${p.stock.at} bởi ${p.stock.by} · so với ngày cần thuốc ${p.requiredBy}` : undefined}>
    {p.stock ? (
      <>
        <table className="ht-table">
          <thead><tr><th>Vật tư</th><th className="num">Cần</th><th className="num">Có thể cấp</th><th className="num">Đã giữ</th><th>Lô · hạn dùng</th><th>Trạng thái</th></tr></thead>
          <tbody>
                  {stockLines(p).map((l) => (
              <tr key={l.itemId}>
                <td className="strong">{l.name}</td><td className="num">{l.need} {l.unit}</td>
                <td className="num" style={{ color: l.short ? 'var(--danger-ink)' : undefined }}>{l.available}</td><td className="num">{l.held}</td>
                <td className="mono">{l.lot ? `${l.lot} · ${l.expiry}` : '—'}</td>
                <td>{l.short > 0 ? <Badge tone="danger">Thiếu {l.short}{l.eta && ` · ETA ${l.eta.slice(0, 5)}`}</Badge> : <Badge tone="success">Đủ</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {shipments.map((s) => <div key={s.id} style={{ padding: '10px 24px', fontSize: 13, borderTop: '1px solid var(--border)' }}><Icon name="truck" size={14} /> Lô <span className="ht-mono">{s.id}</span> · {s.item} · ETA {s.etaOld && <s>{s.etaOld}</s>} <b>{s.eta}</b> {s.status === 'DELAYED' && <Badge tone="danger" plain>Trễ</Badge>}</div>)}
      </>
    ) : <div className="ht-empty">{p.state === 'DRAFT' ? 'Chưa gửi kho.' : 'Kho đang kiểm tra tồn — chờ phản hồi.'}</div>}
  </Panel>
);

export const ProgressPanel: React.FC<{ protocol: Protocol; onAdd: () => void }> = ({ protocol: p, onAdd }) => {
  if (p.state !== 'IN_TREATMENT' && !p.progress.length && !p.outcome) return null;
  return (
    <Panel title="Theo dõi kết quả điều trị" right={p.state === 'IN_TREATMENT' && <button type="button" className="ht-more" onClick={onAdd}>Ghi tiến triển <Icon name="arrow" /></button>}>
      <div className="ht-panel__body">
        {p.outcome && <Callout tone="success" title="Kết quả" style={{ marginBottom: 12 }}>{p.outcome}</Callout>}
        {p.progress.length ? <Timeline items={p.progress.map((g) => ({ tone: 'info', what: <><b>{g.by}</b> — {g.text}</>, when: g.at }))} />
          : <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>Chưa có ghi nhận tiến triển.</p>}
      </div>
    </Panel>
  );
};

export const VersionsPanel: React.FC<{ current: string; versions: Protocol[] }> = ({ current, versions }) => {
  if (versions.length < 2) return null;
  return (
    <Panel as="h3" title="Các phiên bản">
      <div className="ht-panel__body" style={{ display: 'grid', gap: 8 }}>
        {versions.map((v) => (
          <Link key={v.id} to={`/vet/protocols/${v.id}`} className="ht-row-between" style={{ fontSize: 13, padding: '8px 10px', background: v.id === current ? 'var(--primary-soft)' : 'var(--bg)', borderRadius: 8, color: 'inherit', textDecoration: 'none' }}>
            <span><b className="ht-mono">{v.id}</b> · v{v.version}</span><ProtocolBadge state={v.state} />
          </Link>
        ))}
      </div>
    </Panel>
  );
};

export const LogPanel: React.FC<{ protocol: Protocol }> = ({ protocol }) => (
  <Panel as="h3" title="Lịch sử phác đồ">
    <div className="ht-panel__body">
      <Timeline items={protocol.log.map((l) => ({ tone: l.tone, what: <><b>{l.who}</b> {l.text}</>, when: l.at }))} />
    </div>
  </Panel>
);
