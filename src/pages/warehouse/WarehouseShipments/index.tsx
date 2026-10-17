import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { OPEN_SHIPMENT, ShipmentOrder, warehouseApi } from '../../../api/warehouseApi';
import { useActor } from '../../../auth/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { useAction } from '../../../hooks/useAction';
import { Icon } from '../../../components/ui/Icon';
import { Callout, PageHeader, Panel, Tabs, useToast } from '../../../components/ui/Ht';
import { LoadState } from '../../../components/trainer/TrainerParts';
import { ShipmentAction, ShipmentDetail, ShipmentTable } from './ShipmentPanels';
import { CreateShipmentDialog, ReasonDialog, ReceiveDialog } from './ShipmentDialogs';

type Tab = 'open' | 'received' | 'cancelled';

/* 3.1 Tạo đơn nhập · 3.2 Theo dõi lô hàng · 3.3 Nhận hàng & nhập kho · 3.4 Thông báo hàng về (bác sĩ / Mã phu) */
export const WarehouseShipments: React.FC = () => {
  const actor = useActor();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const { data, loading, error, reload } = useFetch(() => warehouseApi.getShipments());
  const transit = useAction(reload);
  const [tab, setTab] = useState<Tab>('open');
  const [sel, setSel] = useState<string | null>(null);
  const [action, setAction] = useState<ShipmentAction | null>(null);
  const [createOpen, setCreateOpen] = useState(!!params.get('for'));

  const shipments = useMemo(() => data?.shipments ?? [], [data]);
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  const inTab = (s: ShipmentOrder) => (tab === 'open' ? OPEN_SHIPMENT.includes(s.status) : tab === 'received' ? s.status === 'RECEIVED' : s.status === 'CANCELLED');
  const list = shipments.filter(inTab);
  const current = shipments.find((s) => s.id === sel && inTab(s)) ?? list[0];
  const count = (t: Tab) => shipments.filter((s) => (t === 'open' ? OPEN_SHIPMENT.includes(s.status) : t === 'received' ? s.status === 'RECEIVED' : s.status === 'CANCELLED')).length;
  const close = () => { setAction(null); reload(); };

  const onAction = (a: ShipmentAction) => {
    if (a === 'transit' && current) transit.run(() => warehouseApi.markInTransit(current, actor), `${current.id}: đang giao.`);
    else setAction(a);
  };

  return (
    <div className="ht ht-page">
      <PageHeader title="Đơn nhập hàng" sub="Theo dõi Đã đặt → Đang giao → Bị trễ → Đã nhận / Đã hủy. Chỉ hàng đã nhận thực tế mới được cộng vào tồn."
        actions={<button type="button" className="ht-btn ht-btn--primary" onClick={() => setCreateOpen(true)}><Icon name="truck" />Tạo đơn nhập</button>} />

      {data.needs.length > 0 && (
        <div className="ht-banner ht-banner--warning" role="status">
          <Icon name="warn" />
          <div><b>{data.needs.length} nhu cầu đang thiếu chưa có đơn nhập</b><p>{data.needs.slice(0, 3).map((n) => n.label).join(' · ')}</p></div>
          <button type="button" className="ht-more" onClick={() => setCreateOpen(true)}>Tạo đơn <Icon name="arrow" /></button>
        </div>
      )}

      {transit.error && <Callout tone="danger" style={{ marginBottom: 16 }}>{transit.error}</Callout>}
      <Tabs<Tab> value={tab} onChange={setTab} items={[
        { value: 'open', label: 'Đang theo dõi', count: count('open') },
        { value: 'received', label: 'Đã nhận', count: count('received') },
        { value: 'cancelled', label: 'Đã hủy', count: count('cancelled') },
      ]} />

      <div className="ht-cols" style={{ gridTemplateColumns: 'minmax(0,1fr) 400px' }}>
        <div><ShipmentTable shipments={list} selectedId={current?.id} onSelect={setSel} /></div>
        <div>{current ? <ShipmentDetail shipment={current} onAction={onAction} /> : <Panel><div className="ht-empty">Chọn một đơn để xem chi tiết.</div></Panel>}</div>
      </div>

      {createOpen && <CreateShipmentDialog items={data.items} needs={data.needs} initialRef={params.get('for') ?? undefined}
        onClose={() => { setCreateOpen(false); setParams({}, { replace: true }); }}
        onDone={(s) => { setCreateOpen(false); setParams({}, { replace: true }); setTab('open'); setSel(s.id); reload(); }} />}
      {current && action === 'receive' && <ReceiveDialog shipment={current} items={data.items} onClose={() => setAction(null)}
        onDone={(n) => { if (n.length) toast(`Đã nhập kho ${current.id} · đã báo: ${n.join(', ')}.`); close(); }} />}
      {current && (action === 'eta' || action === 'cancel') && <ReasonDialog shipment={current} kind={action} onClose={() => setAction(null)}
        onDone={(w) => { if (w.length) toast(`Hàng trễ mốc cần thuốc — đã cảnh báo bác sĩ (${w.join(', ')}).`); close(); }} />}
    </div>
  );
};
