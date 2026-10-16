import React, { useMemo, useState } from 'react';
import { StockTx, TX_LABEL, TxType, warehouseApi } from '../../../api/warehouseApi';
import { useFetch } from '../../../hooks/useFetch';
import { Icon } from '../../../components/ui/Icon';
import { Badge, DataTable, PageHeader, Panel, type Column } from '../../../components/ui/Ht';
import { LoadState } from '../../../components/trainer/TrainerParts';
import { useDebounce } from '../../../hooks/useDebounce';

const qtyColor = (t: StockTx) => (t.type === 'HOLD' || t.type === 'RELEASE' ? 'var(--muted)' : t.qty < 0 ? 'var(--danger-ink)' : 'var(--success-ink)');

/* Render props: each column draws its own cell. */
const COLUMNS: Column<StockTx>[] = [
  { header: 'Mã', render: (t) => t.id, className: 'id' },
  { header: 'Thời điểm', render: (t) => t.at, className: 'mono' },
  { header: 'Loại', render: (t) => <Badge tone={TX_LABEL[t.type][1]} plain>{TX_LABEL[t.type][0]}</Badge> },
  { header: 'Vật tư', render: (t) => <><span className="strong">{t.item}</span>{t.lot && <span className="sub mono">lô {t.lot}</span>}</> },
  { header: 'Số lượng', headClassName: 'num', className: 'num', render: (t) => <span style={{ fontWeight: 600, color: qtyColor(t) }}>{t.qty > 0 && t.type !== 'HOLD' ? '+' : ''}{t.qty}</span> },
  { header: 'Tồn sau', headClassName: 'num', className: 'num', render: (t) => t.balance },
  { header: 'Chứng từ', render: (t) => t.ref ?? '—', className: 'mono' },
  { header: 'Người thực hiện · ghi chú', render: (t) => <span style={{ fontSize: 13 }}>{t.by}<span className="sub">{t.note}</span></span> },
];

/* 4.4 Nhật ký kho — nhập, cấp phát, giữ tồn, điều chỉnh kiểm kê (không phải "nhật ký chăm sóc") */
export const WarehouseLog: React.FC = () => {
  const { data, loading, error, reload } = useFetch(() => warehouseApi.getLog());
  const [type, setType] = useState<'' | TxType>('');
  const [q, setQ] = useState('');
  const query = useDebounce(q); // filter after the user pauses typing
  const list = useMemo(() => (data ?? []).filter((t) => (!type || t.type === type) && `${t.item} ${t.itemId} ${t.ref ?? ''} ${t.by} ${t.note}`.toLowerCase().includes(query.trim().toLowerCase())), [data, type, query]);
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  return (
    <div className="ht ht-page">
      <PageHeader title="Nhật ký kho" sub="Mọi giao dịch kho: nhập hàng, cấp phát, giữ tồn cho phác đồ và điều chỉnh kiểm kê." />
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <select className="ht-select" value={type} onChange={(e) => setType(e.target.value as TxType | '')} aria-label="Loại giao dịch">
          <option value="">Loại: Tất cả</option>{(Object.keys(TX_LABEL) as TxType[]).map((t) => <option key={t} value={t}>{TX_LABEL[t][0]}</option>)}
        </select>
        <div className="ht-search-input" style={{ flex: 1, minWidth: 220 }}><Icon name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm vật tư, chứng từ (PD-, RQ-, SHIP-, KK-), người thực hiện…" aria-label="Tìm giao dịch" /></div>
      </div>
      <Panel>
        <DataTable rows={list} columns={COLUMNS} rowKey={(t) => t.id} empty="Không có giao dịch phù hợp." />
      </Panel>
    </div>
  );
};
