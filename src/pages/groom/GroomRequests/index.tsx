import React from 'react';
import { groomApi } from '../../../api/groomApi';
import { REQ_LABEL, type Requisition } from '../../../api/warehouseApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { useFetch } from '../../../hooks/useFetch';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Callout, PageHeader, Panel } from '../../../components/ui/Ht';
import { LoadState } from '../../../components/trainer/TrainerParts';
import { RequestForm } from './RequestForm';

export const GroomRequests: React.FC = () => {
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => groomApi.getRequisitions(actor), [actor]);
  const act = useAction(reload);
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  const toConfirm = data.requisitions.filter((r) => r.status === 'ISSUED').length;
  const note = (r: Requisition) =>
    r.status === 'REJECTED' ? `Từ chối: ${r.rejectReason ?? '—'}`
      : r.status === 'WAITING_RESTOCK' ? `Chờ hàng về${r.shipmentId ? ` · ${r.shipmentId}` : ''}`
        : r.issued ? `Đã cấp ${r.issued.qty} ${r.unit} lúc ${r.issued.at}` : '';

  return (
    <div className="ht ht-page">
      <PageHeader title="Yêu cầu vật tư" sub={`Gửi Quản lý kho · ${data.groom.zones.join(', ')}`}
        actions={toConfirm > 0 ? <Badge tone="success">{toConfirm} chờ xác nhận nhận hàng</Badge> : undefined} />
      {act.error && <Callout tone="danger" style={{ marginBottom: 16 }}>{act.error}</Callout>}
      <div className="ht-cols">
        <Panel title="Yêu cầu của tôi" sub={`${data.requisitions.length} yêu cầu`}>
          <div style={{ overflowX: 'auto' }}>
            <table className="ht-table">
              <thead><tr><th>Mã</th><th>Vật tư</th><th>SL</th><th>Cần trước</th><th>Trạng thái</th><th /></tr></thead>
              <tbody>
                {data.requisitions.map((r) => (
                  <tr key={r.id}>
                    <td className="ht-mono" style={{ whiteSpace: 'nowrap' }}>{r.id}</td>
                    <td><b>{r.item}</b><div style={{ fontSize: 12, color: 'var(--muted)' }}>{note(r) || r.reason}</div></td>
                    <td className="ht-mono" style={{ whiteSpace: 'nowrap' }}>{r.qty} {r.unit}</td>
                    <td className="ht-mono">{r.neededBy}</td>
                    <td><Badge tone={REQ_LABEL[r.status][1]}>{REQ_LABEL[r.status][0]}</Badge></td>
                    <td>{r.status === 'ISSUED' && (
                      <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" disabled={act.busy} onClick={() => act.run(() => groomApi.confirmReceived(r, actor), `Đã xác nhận nhận ${r.item}.`)}>
                        <Icon name="check" size={14} />Đã nhận
                      </button>
                    )}</td>
                  </tr>
                ))}
                {data.requisitions.length === 0 && <tr><td colSpan={6} className="ht-empty">Chưa có yêu cầu.</td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>
        <div>
          <Panel as="h3" title="Gửi yêu cầu mới">
            <div className="ht-panel__body"><RequestForm items={data.items} onDone={reload} /></div>
          </Panel>
          <Callout tone="info" title="Luồng xử lý">Mới gửi → Kho kiểm tồn → Sẵn sàng cấp / Chờ hàng về / Từ chối → Đã cấp phát → bạn xác nhận “Đã nhận” để đóng yêu cầu.</Callout>
        </div>
      </div>
    </div>
  );
};
