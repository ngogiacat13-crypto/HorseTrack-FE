import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { available, belowSafety, monthsLeft, StockItem, warehouseApi } from '../../../api/warehouseApi';
import { useFetch } from '../../../hooks/useFetch';
import { Icon } from '../../../components/ui/Icon';
import { PageHeader, StatCard } from '../../../components/ui/Ht';
import { LoadState } from '../../../components/trainer/TrainerParts';
import { InventoryTable } from './InventoryTable';
import { SafetyDialog, StockMoveDialog } from './StockDialogs';
import { useDebounce } from '../../../hooks/useDebounce';

export const WarehouseInventory: React.FC = () => {
  const { data, loading, error, reload } = useFetch(() => warehouseApi.getInventory());
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<'' | 'low' | 'held' | 'expiring'>('');
  const [q, setQ] = useState('');
  const query = useDebounce(q);
  const [moveFor, setMoveFor] = useState<StockItem | null>(null);
  const [safetyFor, setSafetyFor] = useState<StockItem | null>(null);

  const items = useMemo(() => data?.items ?? [], [data]);
  const expiring = (i: StockItem) => (i.lots ?? []).some((l) => l.qty > 0 && monthsLeft(l.expiry) <= 2);
  const list = useMemo(() => items.filter((i) =>
    (!category || i.category === category) &&
    (!status || (status === 'low' ? belowSafety(i) : status === 'held' ? i.held > 0 : expiring(i))) &&
    `${i.name} ${i.id} ${i.group} ${i.brand ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())), [items, category, status, query]);

  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  const low = items.filter(belowSafety);
  const categories = [...new Set(items.map((i) => i.category))];
  const incomingCount = new Set(Object.values(data.incoming).flat().map((x) => x.id)).size;

  return (
    <div className="ht ht-page">
      <PageHeader title="Danh sách tồn kho" sub="Tồn thực tế, lượng đã giữ cho phác đồ, số khả dụng và các lô hàng dự kiến về."
      />

      <div className="ht-stats">
        <StatCard icon="box" tone="brand" value={items.length} label="Mặt hàng đang theo dõi" />
        <StatCard icon="warn" tone="warning" value={low.length} label="Dưới ngưỡng an toàn" onClick={() => setStatus('low')} />
        <StatCard icon="clock" tone="danger" value={items.filter(expiring).length} label="Có lô hết hạn trong 2 tháng" onClick={() => setStatus('expiring')} />
        <StatCard icon="truck" tone="info" value={incomingCount} label="Lô hàng đang về" />
      </div>

      {low.length > 0 && (
        <div className="ht-banner ht-banner--warning" role="status">
          <Icon name="warn" />
          <div>
            <b>{low.length} mặt hàng dưới ngưỡng an toàn (BR_08): {low.slice(0, 4).map((i) => i.name).join(', ')}{low.length > 4 ? '…' : ''}</b>
            <p>{low.slice(0, 3).map((i) => `${i.name} khả dụng ${available(i)}/${i.safety} ${i.unit}`).join('; ')}. Lượng sắp về chưa cộng vào tồn và chưa dùng được.</p>
          </div>
          <Link className="ht-more" to="/warehouse/shipments">Tạo đơn nhập <Icon name="arrow" /></Link>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <select className="ht-select" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Danh mục">
          <option value="">Danh mục: Tất cả</option>{categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="ht-select" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Trạng thái">
          <option value="">Trạng thái: Tất cả</option><option value="low">Dưới ngưỡng</option><option value="held">Đang giữ cho phác đồ</option><option value="expiring">Lô sắp hết hạn</option>
        </select>
        <div className="ht-search-input" style={{ flex: 1, minWidth: 220 }}><Icon name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên, mã vật tư, nhóm…" aria-label="Tìm vật tư" /></div>
      </div>

      <InventoryTable items={list} incoming={data.incoming} onMove={setMoveFor} onSafety={setSafetyFor} />

      {moveFor && <StockMoveDialog item={moveFor} onClose={() => setMoveFor(null)} onDone={() => { setMoveFor(null); reload(); }} />}
      {safetyFor && <SafetyDialog item={safetyFor} onClose={() => setSafetyFor(null)} onDone={() => { setSafetyFor(null); reload(); }} />}
    </div>
  );
};
