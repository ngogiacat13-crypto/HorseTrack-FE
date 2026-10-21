import React, { useState } from 'react';
import { DEMO_NOW } from '../../../api/http';
import { groomApi } from '../../../api/groomApi';
import { available, type StockItem } from '../../../api/warehouseApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Icon } from '../../../components/ui/Icon';
import { Callout, ReasonField } from '../../../components/ui/Ht';

export const RequestForm: React.FC<{ items: StockItem[]; onDone: () => void }> = ({ items, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction(onDone);
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState('1');
  const [reason, setReason] = useState('');
  const [neededBy, setNeededBy] = useState(DEMO_NOW.date);
  const item = items.find((i) => i.id === itemId);
  const groups = [...new Set(items.map((i) => i.category))];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await run(() => groomApi.createRequisition({ itemId, qty: Number(qty), reason, neededBy }, actor), 'Đã gửi yêu cầu cho Quản lý kho.')) { setItemId(''); setQty('1'); setReason(''); }
  };

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
      {error && <Callout tone="danger">{error}</Callout>}
      <div className="ht-field" style={{ margin: 0 }}>
        <label className="ht-label" htmlFor="rq-item">Vật tư<span className="ht-req">*</span></label>
        <select id="rq-item" className="ht-input" value={itemId} onChange={(e) => setItemId(e.target.value)}>
          <option value="">— Chọn vật tư —</option>
          {groups.map((g) => <optgroup key={g} label={g}>{items.filter((i) => i.category === g).map((i) => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}</optgroup>)}
        </select>
        {item && <small style={{ color: 'var(--muted)' }}>Kho hiện còn khả dụng: <b className="ht-mono">{available(item)}</b> {item.unit}</small>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="ht-field" style={{ margin: 0 }}>
          <label className="ht-label" htmlFor="rq-qty">Số lượng{item ? ` (${item.unit})` : ''}<span className="ht-req">*</span></label>
          <input id="rq-qty" className="ht-input" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} />
        </div>
        <div className="ht-field" style={{ margin: 0 }}>
          <label className="ht-label" htmlFor="rq-date">Cần trước ngày<span className="ht-req">*</span></label>
          <input id="rq-date" className="ht-input ht-mono" value={neededBy} onChange={(e) => setNeededBy(e.target.value)} placeholder="dd/mm/yyyy" />
        </div>
      </div>
      <ReasonField id="rq-reason" label="Lý do" value={reason} onChange={setReason} placeholder="VD: Mùn cưa lót chuồng Khu A sắp hết, cần thay cho 5 chuồng." minHeight={64} />
      <button type="submit" className="ht-btn ht-btn--primary" disabled={busy}><Icon name="send" size={16} />{busy ? 'Đang gửi…' : 'Gửi Quản lý kho'}</button>
    </form>
  );
};
