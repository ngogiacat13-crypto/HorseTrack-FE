import React, { useState } from 'react';
import { warehouseApi } from '../../../api/warehouseApi';
import { useFetch } from '../../../hooks/useFetch';
import { Badge, PageHeader, Panel } from '../../../components/ui/Ht';
import { LoadState } from '../../../components/trainer/TrainerParts';
import { CountSheet } from './CountSheet';

/* 1.5 Kiểm kê định kỳ — đối chiếu tồn hệ thống với thực tế, lưu biên bản chênh lệch và lý do */
export const WarehouseStockCheck: React.FC = () => {
  const { data, loading, error, reload } = useFetch(() => warehouseApi.getChecks());
  const [open, setOpen] = useState<string | null>(null);
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  return (
    <div className="ht ht-page">
      <PageHeader title="Kiểm kê tháng" sub="Mỗi chênh lệch được ghi thành giao dịch điều chỉnh trong nhật ký kho, kèm lý do." />
      <div className="ht-cols" style={{ gridTemplateColumns: 'minmax(0,1fr) 360px' }}>
        <div><CountSheet key={data.checks.length} items={data.items} onDone={reload} /></div>
        <div>
          <Panel as="h3" title="Biên bản đã lưu">
            <div className="ht-panel__body" style={{ display: 'grid', gap: 10 }}>
              {data.checks.map((c) => {
                const diffs = c.lines.filter((l) => l.counted !== l.system);
                return (
                  <div key={c.id} className="ht-quote">
                    <button type="button" className="ht-more" onClick={() => setOpen(open === c.id ? null : c.id)} aria-expanded={open === c.id}>
                      <span className="ht-mono">{c.id}</span>
                    </button>
                    <span style={{ float: 'right' }}><Badge tone={diffs.length ? 'warning' : 'success'} plain>{diffs.length ? `${diffs.length} chênh lệch` : 'Khớp'}</Badge></span>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.at} · {c.by} · {c.lines.length} mặt hàng{c.note && ` · ${c.note}`}</div>
                    {open === c.id && (
                      <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13 }}>
                        {c.lines.map((l) => <li key={l.itemId}>{l.item}: {l.system} → <b>{l.counted}</b> {l.unit}{l.reason && ` · ${l.reason}`}</li>)}
                      </ul>
                    )}
                  </div>
                );
              })}
              {data.checks.length === 0 && <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>Chưa có biên bản.</p>}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};
