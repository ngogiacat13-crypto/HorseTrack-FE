import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Protocol } from '../../../api/vetApi';
import { needs, warehouseApi } from '../../../api/warehouseApi';
import { useFetch } from '../../../hooks/useFetch';
import { PageHeader, Panel, Tabs } from '../../../components/ui/Ht';
import { LoadState } from '../../../components/trainer/TrainerParts';
import { ProtocolBadge } from '../../../components/vet/VetParts';

type Tab = 'check' | 'dispense' | 'waiting' | 'done' | 'changed';
const GROUP: Record<Tab, Protocol['state'][]> = {
  check: ['WAITING_STOCK_CHECK'],
  dispense: ['READY_FOR_DISPENSING'],
  waiting: ['STOCK_SHORTAGE', 'STOCK_AVAILABLE', 'WAITING_RESTOCK', 'REQUIRES_VET_REVIEW'],
  done: ['IN_TREATMENT'],
  changed: ['SUPERSEDED', 'CANCELLED'],
};
const NEXT: Partial<Record<Protocol['state'], string>> = {
  WAITING_STOCK_CHECK: 'Kiểm tồn & phản hồi bác sĩ',
  READY_FOR_DISPENSING: 'Chuẩn bị & cấp phát',
  STOCK_SHORTAGE: 'Chờ bác sĩ: đổi thuốc hoặc chờ hàng',
  STOCK_AVAILABLE: 'Đã giữ hàng — chờ bác sĩ xác nhận',
  WAITING_RESTOCK: 'Chờ hàng về — theo dõi đơn nhập',
  REQUIRES_VET_REVIEW: 'Chờ bác sĩ đánh giá lại',
  IN_TREATMENT: 'Đã cấp phát',
};
const cancelReason = (p: Protocol) => p.note.match(/Hủy:s*(.+)$/)?.[1] ?? p.note;
const nextStep = (p: Protocol) => p.state === 'SUPERSEDED' ? `Đã thay bằng ${p.supersededBy ?? 'phiên bản mới'} — không cấp theo bản này` : p.state === 'CANCELLED' ? `Bác sĩ hủy: ${cancelReason(p)}` : NEXT[p.state];

export const WarehouseMedical: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useFetch(() => warehouseApi.getRequests());
  const [tab, setTab] = useState<Tab>('check');
  const protocols = useMemo(() => data?.protocols ?? [], [data]);
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  const list = protocols.filter((p) => GROUP[tab].includes(p.state)).sort((a, b) => a.requiredBy.split('/').reverse().join('').localeCompare(b.requiredBy.split('/').reverse().join('')));
  const count = (t: Tab) => protocols.filter((p) => GROUP[t].includes(p.state)).length;

  return (
    <div className="ht ht-page">
      <PageHeader title="Yêu cầu thuốc theo phác đồ" sub="Bác sĩ gửi từ phác đồ dự thảo. Kho kiểm tồn, giữ hàng, báo thiếu kèm ETA và cấp phát khi bác sĩ đã xác nhận — kho không đổi thuốc (BR_07)." />
      <Tabs<Tab> value={tab} onChange={setTab} items={[
        { value: 'check', label: 'Chờ kiểm tồn', count: count('check') },
        { value: 'dispense', label: 'Chờ cấp phát', count: count('dispense') },
        { value: 'waiting', label: 'Chờ bác sĩ / chờ hàng', count: count('waiting') },
        { value: 'done', label: 'Đã cấp phát', count: count('done') },
        { value: 'changed', label: 'Bác sĩ đã đổi / hủy', count: count('changed') },
      ]} />
      <Panel>
        <div style={{ overflowX: 'auto' }}>
          <table className="ht-table">
            <thead><tr><th>Phác đồ</th><th>Ngựa · chẩn đoán</th><th>Thuốc / vật tư</th><th>Cần thuốc</th><th>Trạng thái</th><th>Việc của kho</th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} style={{ cursor: 'pointer' }} tabIndex={0} onClick={() => navigate(`/warehouse/medical/${p.id}`)} onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/warehouse/medical/${p.id}`); }}>
                  <td className="id">{p.id}{p.version > 1 && <span className="sub" data-testid={`replaces-${p.id}`}>v{p.version}{p.replaces ? ` · thay ${p.replaces}` : ''}</span>}<span className="sub">BS {p.vet}</span></td>
                  <td><span className="strong">{p.horse}</span><span className="sub">{p.diagnosis}</span></td>
                  <td style={{ fontSize: 13 }}>{needs(p).map((n) => `${n.name} × ${n.need} ${n.unit}`).join(', ')}</td>
                  <td className="mono">{p.requiredBy}</td>
                  <td><ProtocolBadge state={p.state} delayed={p.delayed} /></td>
                  <td style={{ fontSize: 13, fontWeight: tab === 'check' || tab === 'dispense' ? 600 : 400 }}>{nextStep(p)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <div className="ht-empty">Không có yêu cầu ở mục này.</div>}
        </div>
      </Panel>
    </div>
  );
};
