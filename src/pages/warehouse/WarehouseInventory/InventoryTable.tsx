import React from 'react';
import { available, belowSafety, StockItem } from '../../../api/warehouseApi';
import { Badge, Panel } from '../../../components/ui/Ht';

export type Incoming = Record<string, { qty: number; eta: string; id: string; delayed: boolean }[]>;

export const InventoryTable: React.FC<{ items: StockItem[]; incoming: Incoming; onMove: (i: StockItem) => void; onSafety: (i: StockItem) => void; onEdit?: (i: StockItem) => void }> = ({ items, incoming, onMove, onSafety, onEdit }) => (
  <Panel title="Tồn kho hiện tại" right={<span style={{ fontSize: 12, color: 'var(--muted)' }}>{items.length} mặt hàng · chỉ hàng đã nhận mới được sử dụng</span>}>
    <div style={{ overflowX: 'auto' }}>
      <table className="ht-table">
        <thead><tr><th>Mặt hàng</th><th>Nhóm</th><th className="num">Tồn thực tế</th><th className="num">Đã giữ</th><th className="num">Khả dụng</th><th className="num">Ngưỡng</th><th>Sắp về</th><th>Trạng thái</th><th /></tr></thead>
        <tbody>
          {items.map((i) => {
            const low = belowSafety(i);
            return (
              <tr key={i.id} className={low ? 'is-warn' : undefined}>
                <td><span className="strong">{i.name}</span><span className="sub mono">{i.id}{i.lots && i.lots.length > 1 ? ` · ${i.lots.length} lô` : ''}</span></td>
                <td style={{ fontSize: 13 }}>{i.group}<span className="sub">{i.category}</span></td>
                <td className="num"><b>{i.onHand}</b> <span style={{ color: 'var(--muted)' }}>{i.unit}</span></td>
                <td className="num" style={{ color: i.held ? 'var(--info-ink)' : 'var(--muted)' }}>{i.held || '—'}</td>
                <td className="num" style={{ color: low ? 'var(--warning-ink)' : undefined }}><b>{available(i)}</b></td>
                <td className="num">{i.safety}</td>
                <td style={{ fontSize: 13 }}>{(incoming[i.id] ?? []).map((x) => <div key={x.id}>{x.qty} {i.unit}<span className="sub mono" style={{ color: x.delayed ? 'var(--danger-ink)' : undefined }}>{x.id} · {x.eta.slice(0, 5)}{x.delayed ? ' · trễ' : ''}</span></div>)}{!incoming[i.id] && <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                <td>{low ? <Badge tone="warning">Dưới ngưỡng</Badge> : <Badge tone="success">Đủ tồn</Badge>}</td>
                <td className="num" style={{ whiteSpace: 'nowrap' }}>
                  <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" onClick={() => onMove(i)}>Cập nhật tồn</button>
                  <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" onClick={() => onSafety(i)}>Ngưỡng</button>
                  {onEdit && <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" data-testid={`edit-item-${i.id}`} onClick={() => onEdit(i)}>Sửa</button>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {items.length === 0 && <div className="ht-empty">Không có mặt hàng phù hợp.</div>}
    </div>
  </Panel>
);
