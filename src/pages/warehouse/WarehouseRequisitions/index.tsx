import React, { useEffect, useMemo, useState } from 'react';
import { ReqStatus, Requisition, warehouseApi } from '../../../api/warehouseApi';
import { useActor } from '../../../auth/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { PageHeader, Panel, Tabs } from '../../../components/ui/Ht';
import { LoadState } from '../../../components/trainer/TrainerParts';
import { ReqAction, RequisitionDetail, RequisitionTable } from './RequisitionPanels';
import { RequisitionDialog } from './RequisitionDialogs';

type Tab = 'todo' | 'waiting' | 'done';
const GROUP: Record<Tab, ReqStatus[]> = {
  todo: ['SUBMITTED', 'CHECKING_STOCK', 'APPROVED_FOR_ISSUE'],
  waiting: ['WAITING_RESTOCK'],
  done: ['ISSUED', 'REJECTED', 'CLOSED'],
};

export const WarehouseRequisitions: React.FC = () => {
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => warehouseApi.getRequisitions());
  const [tab, setTab] = useState<Tab>('todo');
  const [sel, setSel] = useState<string | null>(null);
  const [action, setAction] = useState<ReqAction | null>(null);

  const rows = useMemo(() => data?.requisitions ?? [], [data]);
  const list = rows.filter((r) => GROUP[tab].includes(r.status));
  const current: Requisition | undefined = rows.find((r) => r.id === sel && GROUP[tab].includes(r.status)) ?? list[0];

  useEffect(() => {
    if (current?.status === 'SUBMITTED') warehouseApi.startCheck(current, actor).then(reload);
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  const count = (t: Tab) => rows.filter((r) => GROUP[t].includes(r.status)).length;

  return (
    <div className="ht ht-page">
      <PageHeader title="Yêu cầu cấp vật tư / thuốc" sub="Yêu cầu từ Mã phu hoặc Bác sĩ (tiêm phòng). Đủ thì cấp, thiếu thì chờ đơn nhập, từ chối phải có lý do." />
      <Tabs<Tab> value={tab} onChange={setTab} items={[
        { value: 'todo', label: 'Cần xử lý', count: count('todo') },
        { value: 'waiting', label: 'Chờ hàng về', count: count('waiting') },
        { value: 'done', label: 'Đã xử lý', count: count('done') },
      ]} />
      <div className="ht-cols" style={{ gridTemplateColumns: 'minmax(0,1fr) 400px' }}>
        <div><RequisitionTable rows={list} items={data.items} selectedId={current?.id} onSelect={setSel} /></div>
        <div>{current
          ? <RequisitionDetail req={current} item={data.items.find((i) => i.id === current.itemId)} openShipments={data.openShipments} onAction={setAction} />
          : <Panel><div className="ht-empty">Chọn một yêu cầu để xem chi tiết.</div></Panel>}</div>
      </div>
      {current && action && <RequisitionDialog req={current} kind={action} openShipments={data.openShipments} onClose={() => setAction(null)} onDone={() => { setAction(null); reload(); }} />}
    </div>
  );
};
