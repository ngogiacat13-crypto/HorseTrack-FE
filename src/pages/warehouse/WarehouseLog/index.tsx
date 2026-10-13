import React, { useMemo, useState } from 'react';
import { TX_LABEL, TxType, warehouseApi } from '../../../api/warehouseApi';
import { useFetch } from '../../../hooks/useFetch';
import { Icon } from '../../../components/ui/Icon';
import { Badge, PageHeader, Panel } from '../../../components/ui/Ht';
import { LoadState } from '../../../components/trainer/TrainerParts';

/* 4.4 Nhật ký kho — nhập, cấp phát, giữ tồn, điều chỉnh kiểm kê (không phải "nhật ký chăm sóc") */
export const WarehouseLog: React.FC = () => {
  const { data, loading, error, reload } = useFetch(() => warehouseApi.getLog());
  const [type, setType] = useState<'' | TxType>('');
  const [q, setQ] = useState('');
  const list = useMemo(() => (data ?? []).filter((t) => (!type || t.type === type) && `${t.item} ${t.itemId} ${t.ref ?? ''} ${t.by} ${t.note}`.toLowerCase().includes(q.trim().toLowerCase())), [data, type, q]);
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
        <div style={{ overflowX: 'auto' }}>
          <table className="ht-table">
            <thead><tr><th>Mã</th><th>Thời điểm</th><th>Loại</th><th>Vật tư</th><th className="num">Số lượng</th><th className="num">Tồn sau</th><th>Chứng từ</th><th>Người thực hiện · ghi chú</th></tr></thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id}>
                  <td className="id">{t.id}</td>
                  <td className="mono">{t.at}</td>
                  <td><Badge tone={TX_LABEL[t.type][1]} plain>{TX_LABEL[t.type][0]}</Badge></td>
                  <td><span className="strong">{t.item}</span>{t.lot && <span className="sub mono">lô {t.lot}</span>}</td>
                  <td className="num" style={{ fontWeight: 600, color: t.type === 'HOLD' || t.type === 'RELEASE' ? 'var(--muted)' : t.qty < 0 ? 'var(--danger-ink)' : 'var(--success-ink)' }}>{t.qty > 0 && t.type !== 'HOLD' ? '+' : ''}{t.qty}</td>
                  <td className="num">{t.balance}</td>
                  <td className="mono">{t.ref ?? '—'}</td>
                  <td style={{ fontSize: 13 }}>{t.by}<span className="sub">{t.note}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <div className="ht-empty">Không có giao dịch phù hợp.</div>}
        </div>
      </Panel>
    </div>
  );
};
