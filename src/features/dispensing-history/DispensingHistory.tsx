import React from 'react';
import { USE_BACKEND, be, beData } from '../../api/beClient';
import { useFetch } from '../../hooks/useFetch';
import { Panel } from '../../components/ui/Ht';

interface BeRecord { txCode: string; itemName: string; unit: string; quantity: number; lotNo?: string | null; expiryDate?: string | null; issuedAt: string; issuedByName?: string | null; note?: string | null }
export interface DispenseRecord { code: string; item: string; qty: string; lot: string; at: string; by: string }

const pad = (n: number) => String(n).padStart(2, '0');
const stamp = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const dmy = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/');

export const loadDispensing = async (protocolBeId: number): Promise<DispenseRecord[]> => {
  const rows = await beData<BeRecord[]>(be.get(`/inventory/protocols/${protocolBeId}/dispensing`));
  return rows.map((r) => ({
    code: r.txCode, item: r.itemName, qty: `${Number(r.quantity)} ${r.unit}`,
    lot: r.lotNo ? `${r.lotNo}${r.expiryDate ? ` · HSD ${dmy(r.expiryDate)}` : ''}` : 'Không ghi lô',
    at: stamp(r.issuedAt), by: r.issuedByName ?? 'Kho',
  }));
};

export const DispensingHistory: React.FC<{ protocolBeId?: number }> = ({ protocolBeId }) => {
  const { data, error } = useFetch(() => (protocolBeId ? loadDispensing(protocolBeId) : Promise.resolve([])), [protocolBeId]);
  if (!USE_BACKEND || !protocolBeId || (data && data.length === 0 && !error)) return null;
  return (
    <Panel title="Lịch sử cấp phát" sub="Kho xuất thuốc theo phác đồ — thời điểm, người cấp, số lô">
      {error && <div className="ht-empty">{error}</div>}
      {data && data.length > 0 && (
        <table className="ht-table" data-testid="dispensing-history">
          <thead><tr><th>Thời điểm</th><th>Thuốc / vật tư</th><th className="num">Số lượng</th><th>Lô · hạn dùng</th><th>Người cấp</th></tr></thead>
          <tbody>
            {data.map((r) => (
              <tr key={`${r.code}-${r.item}-${r.lot}`}>
                <td className="mono" style={{ whiteSpace: 'nowrap' }}>{r.at}</td>
                <td className="strong">{r.item}</td>
                <td className="num">{r.qty}</td>
                <td className="mono" style={{ fontSize: 12 }}>{r.lot}</td>
                <td>{r.by}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
};
