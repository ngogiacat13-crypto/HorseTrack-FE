import React, { useMemo, useState } from 'react';
import { type ApiError } from '../../../api/http';
import { nutritionStockApi, type NutritionStockRequest, type NutritionStockTab } from '../../../api/warehouseApi/nutritionApi';
import { useFetch } from '../../../hooks/useFetch';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Callout, PageHeader, Panel, Tabs, useToast } from '../../../components/ui/Ht';
import { LoadState } from '../../../components/trainer/TrainerParts';

type UiTab = 'pending' | 'issued' | 'cancelled';
const STATUS_TONE: Record<string, 'info' | 'success' | 'neutral' | 'danger' | 'warning'> = {
  PENDING: 'info', ISSUED: 'success', CANCELLED: 'neutral',
};

const dmy = (iso?: string | null) => {
  if (!iso) return '—';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
};

const hm = (iso?: string | null) => {
  if (!iso) return '';
  const m = String(iso).match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : '';
};

export const WarehouseNutrition: React.FC = () => {
  const toast = useToast();
  const [tab, setTab] = useState<UiTab>('pending');
  const [date, setDate] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, loading, error, reload } = useFetch(
    () => nutritionStockApi.list('all', date || undefined),
    [date],
  );

  const grouped = useMemo(() => {
    const all = data ?? [];
    return {
      pending: all.filter((r) => r.status === 'PENDING'),
      issued: all.filter((r) => r.status === 'ISSUED'),
      cancelled: all.filter((r) => r.status === 'CANCELLED'),
    };
  }, [data]);

  const rows = grouped[tab];

  const issue = async (row: NutritionStockRequest) => {
    if (!row.canIssue) {
      toast('Chưa đủ hàng khả dụng hoặc chưa tới ngày cấp.');
      return;
    }
    const key = `${row.planId}-${row.date}`;
    setBusyId(key);
    try {
      await nutritionStockApi.issue(row.planId, row.date);
      toast(`Đã cấp thức ăn ngày ${dmy(row.date)} · thực đơn #${row.planId}.`);
      reload();
    } catch (e) {
      toast((e as ApiError).message ?? 'Cấp phát thất bại.');
    } finally {
      setBusyId(null);
    }
  };

  if (!data && loading) return <LoadState loading error={error} onRetry={reload} />;

  return (
    <div className="ht ht-page">
      <PageHeader
        title="Thực đơn dinh dưỡng"
        sub="Phiếu cấp thức ăn theo thực đơn dinh dưỡng. Sau khi cấp, mã phu nhận việc cho ăn."
        actions={
          <label className="ht-field" style={{ margin: 0, minWidth: 160 }}>
            <span className="ht-label">Lọc ngày</span>
            <input
              type="date"
              className="ht-input ht-mono"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label="Lọc theo ngày cấp"
            />
          </label>
        }
      />

      <Tabs<UiTab> value={tab} onChange={setTab} items={[
        { value: 'pending', label: 'Chờ cấp phát', count: grouped.pending.length },
        { value: 'issued', label: 'Đã cấp phát', count: grouped.issued.length },
        { value: 'cancelled', label: 'Đã hủy / đổi', count: grouped.cancelled.length },
      ]} />

      {error && <Callout tone="danger" style={{ marginBottom: 16 }}>{error}</Callout>}

      <Panel>
        <div style={{ overflowX: 'auto' }}>
          <table className="ht-table" data-testid="warehouse-nutrition-table">
            <thead>
              <tr>
                <th>Ngày cấp</th>
                <th>Ngựa · chuồng</th>
                <th>Thực đơn</th>
                <th>Người lập</th>
                <th>Món cần cấp</th>
                <th>Trạng thái</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const key = `${r.planId}-${r.date}`;
                const can = r.canIssue === true;
                const short = (r.lines ?? []).some((l) => l.availableStock < l.quantity);
                return (
                  <tr key={key}>
                    <td className="mono">
                      {dmy(r.date)}
                      {r.requestedAt && <span className="sub">gửi {dmy(r.requestedAt)} {hm(r.requestedAt)}</span>}
                    </td>
                    <td>
                      <span className="strong">{r.horseName ?? '—'}</span>
                      <span className="sub">{[r.stallCode, r.barnZone].filter(Boolean).join(' · ') || '—'}</span>
                    </td>
                    <td>
                      <span className="ht-mono">#{r.planId}</span>
                      <span className="sub">{r.planType === 'MEDICAL' ? 'Khẩu phần y tế' : 'Khẩu phần thường'}{r.planStatus ? ` · ${r.planStatus}` : ''}</span>
                    </td>
                    <td>{r.createdByName ?? '—'}</td>
                    <td style={{ fontSize: 13 }}>
                      {(r.lines ?? []).map((l) => (
                        <div key={l.requisitionId}>
                          <span className="ht-mono" style={{ color: 'var(--muted)', fontSize: 11 }}>{l.requisitionCode}</span>{' '}
                          {l.itemName} × {l.quantity} {l.unit}
                          <span className="sub" style={{ color: l.availableStock < l.quantity ? 'var(--danger-ink)' : undefined }}>
                            · khả dụng {l.availableStock}
                          </span>
                          {l.note && <span className="sub"> · {l.note}</span>}
                        </div>
                      ))}
                      {!r.lines?.length && '—'}
                    </td>
                    <td>
                      <Badge tone={STATUS_TONE[r.status] ?? 'neutral'}>{r.status}</Badge>
                      {short && tab === 'pending' && <span className="sub" style={{ color: 'var(--danger-ink)' }}>Thiếu tồn</span>}
                    </td>
                    <td className="num">
                      {tab === 'pending' && (
                        <button
                          type="button"
                          className="ht-btn ht-btn--primary ht-btn--sm"
                          data-testid={`nutrition-issue-${r.planId}-${r.date}`}
                          disabled={!can || busyId === key}
                          title={can ? `Cấp phát ngày ${r.date}` : 'canIssue=false — chưa đủ hàng hoặc chưa tới ngày'}
                          onClick={() => issue(r)}
                        >
                          <Icon name="check" />{busyId === key ? 'Đang cấp…' : 'Cấp phát'}
                        </button>
                      )}
                      {tab === 'issued' && (
                        <span className="sub">
                          {r.issuedByName ?? '—'}
                          {r.issuedAt ? ` · ${dmy(r.issuedAt)} ${hm(r.issuedAt)}` : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && rows.length === 0 && <div className="ht-empty">Không có phiếu ở mục này.</div>}
        </div>
      </Panel>
    </div>
  );
};

export type { NutritionStockTab };
