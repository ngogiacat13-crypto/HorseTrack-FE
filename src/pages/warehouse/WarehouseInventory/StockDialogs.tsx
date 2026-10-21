import React, { useState } from 'react';
import { available, MoveKind, StockItem, tracksLots, warehouseApi } from '../../../api/warehouseApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Callout, Dialog, ReasonField, Segmented } from '../../../components/ui/Ht';

const KIND_LABEL: Record<MoveKind, string> = { RECEIVE: 'Nhập kho', ISSUE: 'Xuất kho', ADJUST: 'Điều chỉnh' };

export const StockMoveDialog: React.FC<{ item: StockItem; onClose: () => void; onDone: () => void }> = ({ item, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const [kind, setKind] = useState<MoveKind>('RECEIVE');
  const [qty, setQty] = useState('');
  const [lot, setLot] = useState('');
  const [expiry, setExpiry] = useState('');
  const [note, setNote] = useState('');
  const lots = tracksLots(item);
  const save = async () => {
    if (await run(() => warehouseApi.moveStock(item, { kind, qty: Number(qty), lot, expiry, note }, actor), `${KIND_LABEL[kind]} ${item.name} · đã ghi nhật ký kho.`)) onDone();
  };
  return (
    <Dialog open onClose={onClose} icon="box" tone="brand" width={560} busy={busy} busyLabel="Đang lưu…"
      title={`Cập nhật tồn · ${item.name}`} sub={`Tồn thực tế ${item.onHand} · đã giữ ${item.held} · khả dụng ${available(item)} ${item.unit}. Mọi thay đổi được ghi nhật ký kho.`}
      confirmLabel={KIND_LABEL[kind]} onConfirm={save}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      <div style={{ display: 'grid', gap: 14 }}>
        <Segmented<MoveKind> label="Loại giao dịch" value={kind} onChange={setKind}
          items={[{ value: 'RECEIVE', label: 'Nhập kho' }, { value: 'ISSUE', label: 'Xuất kho' }, { value: 'ADJUST', label: 'Điều chỉnh' }]} />
        <div className="ht-grid-2">
          <div className="ht-field" style={{ margin: 0 }}>
            <label className="ht-label" htmlFor="mv-qty">{kind === 'ADJUST' ? `Chênh lệch (${item.unit}, âm = giảm)` : `Số lượng (${item.unit})`}<span className="ht-req">*</span></label>
            <input id="mv-qty" className="ht-input" type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          {kind === 'RECEIVE' && lots && (
            <div className="ht-grid-2" style={{ gap: '0 10px' }}>
              <div className="ht-field" style={{ margin: 0 }}><label className="ht-label" htmlFor="mv-lot">Số lô<span className="ht-req">*</span></label><input id="mv-lot" className="ht-input ht-mono" value={lot} onChange={(e) => setLot(e.target.value)} /></div>
              <div className="ht-field" style={{ margin: 0 }}><label className="ht-label" htmlFor="mv-exp">Hạn dùng<span className="ht-req">*</span></label><input id="mv-exp" className="ht-input ht-mono" value={expiry} placeholder="mm/yyyy" onChange={(e) => setExpiry(e.target.value)} /></div>
            </div>
          )}
        </div>
        {kind === 'ISSUE' && <Callout tone="info">Xuất theo phác đồ hoặc yêu cầu của Mã phu nên làm ở trang tương ứng để liên kết chứng từ. Ở đây chỉ dùng cho xuất khác (hư hỏng, mẫu thử…).</Callout>}
        <ReasonField id="mv-note" label={kind === 'RECEIVE' ? 'Ghi chú / chứng từ' : 'Lý do'} min={kind === 'RECEIVE' ? 5 : 10} value={note} onChange={setNote}
          placeholder={kind === 'RECEIVE' ? 'VD: Hóa đơn NCC số 0457' : kind === 'ADJUST' ? 'VD: Kiểm tra phát hiện 2 lọ vỡ nắp' : 'VD: Hủy 1 chai do nhiễm bẩn'} minHeight={56} />
      </div>
    </Dialog>
  );
};

export const SafetyDialog: React.FC<{ item: StockItem; onClose: () => void; onDone: () => void }> = ({ item, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const [safety, setSafety] = useState(String(item.safety));
  const save = async () => { if (await run(() => warehouseApi.setSafety(item, Number(safety), actor), `Đã đặt ngưỡng an toàn ${item.name}: ${safety} ${item.unit}.`)) onDone(); };
  return (
    <Dialog open onClose={onClose} icon="warn" tone="brand" busy={busy} title={`Ngưỡng an toàn · ${item.name}`}
      sub={`Cảnh báo khi số khả dụng (hiện ${available(item)} ${item.unit}) xuống dưới ngưỡng. Cảnh báo không có nghĩa là từ chối yêu cầu y tế.`}
      confirmLabel="Lưu ngưỡng" onConfirm={save}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      <div className="ht-field" style={{ margin: 0 }}>
        <label className="ht-label" htmlFor="sf-qty">Tồn tối thiểu ({item.unit})</label>
        <input id="sf-qty" className="ht-input" type="number" min={0} value={safety} onChange={(e) => setSafety(e.target.value)} />
      </div>
    </Dialog>
  );
};
