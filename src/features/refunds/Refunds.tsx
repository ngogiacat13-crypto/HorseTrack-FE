import React, { useMemo, useState } from 'react';
import { USE_BACKEND } from '../../api/beClient';
import { useActor } from '../../auth/AuthContext';
import { useAction } from '../../hooks/useAction';
import { useFetch } from '../../hooks/useFetch';
import { Icon } from '../../components/ui/Icon';
import { Badge, Callout, Dialog, money, PageHeader, Panel, Tabs } from '../../components/ui/Ht';
import { LoadState } from '../../components/trainer/TrainerParts';
import { type Refund, type RefundStatus, refundsApi } from './refundsApi';

type Tab = RefundStatus | 'ALL';

export const Refunds: React.FC = () => {
  const { data, loading, error, reload } = useFetch(() => refundsApi.list());
  const [tab, setTab] = useState<Tab>('PENDING');
  const [confirming, setConfirming] = useState<Refund | null>(null);
  const all = useMemo(() => data ?? [], [data]);
  const list = useMemo(() => {
    const rows = all.filter((r) => tab === 'ALL' || r.status === tab);
    return [...rows].sort((a, b) => (tab === 'PENDING' ? a.requestedKey.localeCompare(b.requestedKey) : b.requestedKey.localeCompare(a.requestedKey)));
  }, [all, tab]);
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const pendingTotal = all.filter((r) => r.status === 'PENDING').reduce((s, r) => s + r.amount, 0);

  return (
    <div className="ht ht-page">
      <PageHeader title="Hoàn tiền"
        sub="Khoản chờ hoàn được tạo tự động khi hủy giai đoạn phác đồ đã trả, ngựa bị khóa khi đã đóng lệ phí giải, hoặc lệ phí giải được thanh toán sau khi đề xuất đã đóng. Chuyển tiền cho chủ ngựa ngoài hệ thống rồi ghi mã giao dịch để xác nhận." />
      {!USE_BACKEND && <Callout tone="info" style={{ marginBottom: 16 }}>Đang dùng dữ liệu mẫu. Khi chạy với server, danh sách lấy từ hệ thống hóa đơn.</Callout>}
      {pendingTotal > 0 && <Callout tone="demo" icon="warn" testId="refunds-pending-total" style={{ marginBottom: 16 }}>Còn {all.filter((r) => r.status === 'PENDING').length} khoản chờ hoàn, tổng <b>{money(pendingTotal)}</b>.</Callout>}
      <Tabs<Tab> value={tab} onChange={setTab} items={[
        { value: 'PENDING', label: 'Chờ hoàn', count: all.filter((r) => r.status === 'PENDING').length },
        { value: 'DONE', label: 'Đã hoàn', count: all.filter((r) => r.status === 'DONE').length },
        { value: 'ALL', label: 'Tất cả', count: all.length },
      ]} />
      <Panel>
        <div style={{ overflowX: 'auto' }}>
          <table className="ht-table" data-testid="refunds-table">
            <thead><tr><th>Hóa đơn</th><th>Ngựa</th><th>Chủ ngựa</th><th style={{ textAlign: 'right' }}>Số tiền</th><th>Lý do</th><th>Trạng thái</th><th aria-label="Thao tác" /></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} data-testid={`refund-row-${r.id}`}>
                  <td className="id">{r.invoiceCode}<span className="sub">{r.requestedAt}</span></td>
                  <td className="strong">{r.horseName}</td>
                  <td>{r.ownerName}<span className="sub">{[r.ownerPhone, r.ownerEmail].filter(Boolean).join(' · ') || '—'}</span></td>
                  <td className="num ht-mono">{money(r.amount)}</td>
                  <td style={{ maxWidth: 280 }}>{r.reason || '—'}</td>
                  <td>
                    <Badge tone={r.status === 'PENDING' ? 'warning' : 'success'}>{r.statusLabel}</Badge>
                    {r.status === 'DONE' && <span className="sub" data-testid={`refund-done-${r.id}`}>{r.transactionRef} · {r.transferredOn} · {r.transferredBy}{r.confirmedBy ? ` · xác nhận bởi ${r.confirmedBy}` : ''}</span>}
                  </td>
                  <td className="num">
                    {r.canConfirm && (
                      <button type="button" className="ht-btn ht-btn--primary ht-btn--sm" data-testid={`refund-confirm-${r.id}`} onClick={() => setConfirming(r)}>
                        <Icon name="check" size={14} />Xác nhận đã hoàn
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <div className="ht-empty" data-testid="refunds-empty">{tab === 'PENDING' ? 'Không có khoản nào chờ hoàn.' : 'Chưa có khoản hoàn nào.'}</div>}
        </div>
      </Panel>
      {confirming && <ConfirmRefundDialog refund={confirming} onClose={() => setConfirming(null)} onDone={() => { setConfirming(null); reload(); }} />}
    </div>
  );
};

const ConfirmRefundDialog: React.FC<{ refund: Refund; onClose: () => void; onDone: () => void }> = ({ refund, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const [f, setF] = useState({ transactionRef: '', transferredOn: refundsApi.todayIso(), transferredBy: actor.name, note: '' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    if (await run(() => refundsApi.confirm(refund, f, actor), `Đã xác nhận hoàn ${money(refund.amount)} cho ${refund.ownerName}. Chủ ngựa được thông báo.`)) onDone();
  };
  return (
    <Dialog open onClose={onClose} icon="card" tone="brand" width={560} busy={busy} busyLabel="Đang lưu…" testId="refund-confirm-dialog"
      title={`Xác nhận đã hoàn · ${refund.invoiceCode}`} sub={`${refund.ownerName} · ${refund.horseName} · ${money(refund.amount)}`}
      disabled={!f.transactionRef.trim() || !f.transferredBy.trim() || !f.transferredOn} confirmLabel="Xác nhận đã chuyển tiền" onConfirm={save}>
      {error && <Callout tone="danger" testId="refund-confirm-error" style={{ marginBottom: 14 }}>{error}</Callout>}
      <Callout tone="info" style={{ marginBottom: 14 }}>Hóa đơn chuyển sang “Đã hoàn tiền” và chủ ngựa nhận thông báo kèm email. Không xác nhận lại được.</Callout>
      <div className="ht-grid-2">
        <div className="ht-field">
          <label className="ht-label" htmlFor="refund-ref">Mã giao dịch<span className="ht-req">*</span></label>
          <input id="refund-ref" data-testid="refund-ref-input" className="ht-input" maxLength={100} value={f.transactionRef} onChange={set('transactionRef')} placeholder="VD: FT2611090001" />
        </div>
        <div className="ht-field">
          <label className="ht-label" htmlFor="refund-date">Ngày chuyển<span className="ht-req">*</span></label>
          <input id="refund-date" data-testid="refund-date-input" type="date" className="ht-input" max={refundsApi.todayIso()} value={f.transferredOn} onChange={set('transferredOn')} />
        </div>
      </div>
      <div className="ht-field">
        <label className="ht-label" htmlFor="refund-by">Người chuyển<span className="ht-req">*</span></label>
        <input id="refund-by" data-testid="refund-by-input" className="ht-input" maxLength={150} value={f.transferredBy} onChange={set('transferredBy')} placeholder="VD: Kế toán CLB" />
      </div>
      <div className="ht-field" style={{ marginBottom: 0 }}>
        <label className="ht-label" htmlFor="refund-note">Ghi chú</label>
        <textarea id="refund-note" data-testid="refund-note-input" className="ht-textarea" maxLength={500} value={f.note} onChange={set('note')} />
      </div>
    </Dialog>
  );
};
