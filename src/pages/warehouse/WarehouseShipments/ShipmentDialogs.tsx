import React, { useState } from 'react';
import { DEMO_NOW } from '../../../api/http';
import { addDays } from '../../../api/vetApi';
import { ShipmentOrder, StockItem, tracksLots, warehouseApi } from '../../../api/warehouseApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { useFetch } from '../../../hooks/useFetch';
import { USE_BACKEND } from '../../../api/beClient';
import { suppliersApi } from '../../../features/suppliers/suppliersApi';
import { Icon } from '../../../components/ui/Icon';
import { Callout, Dialog, ReasonField } from '../../../components/ui/Ht';
import { MedicinePicker } from '../../../components/vet/MedicinePicker';

const DEMO_SUPPLIERS = ['Công ty Dược thú y Sài Gòn', 'Công ty Vật tư Thú y Phương Nam', 'Cửa hàng Yên cương Phú Thọ', 'Đại lý Thức ăn Chăn nuôi Bình Dương'];

export interface Need { ref: string; label: string; itemId: string; qty: number; requiredBy: string }

export const CreateShipmentDialog: React.FC<{ items: StockItem[]; needs: Need[]; initialRef?: string; onClose: () => void; onDone: (s: ShipmentOrder) => void }> = ({ items, needs, initialRef, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const first = needs.filter((n) => n.ref === initialRef);
  const [forRef, setForRef] = useState(initialRef && first.length ? initialRef : '');
  const [supplier, setSupplier] = useState('');
  const [eta, setEta] = useState(addDays(DEMO_NOW.date, 5));
  const [lines, setLines] = useState<{ itemId: string; qty: string }[]>(first.map((n) => ({ itemId: n.itemId, qty: String(n.qty) })));
  const [adding, setAdding] = useState('');
  const { data: liveSuppliers } = useFetch(() => (USE_BACKEND ? suppliersApi.list(true) : Promise.resolve(null)), []);
  const supplierNames = liveSuppliers ? liveSuppliers.map((s) => s.name) : DEMO_SUPPLIERS;
  const inv = Object.fromEntries(items.map((i) => [i.id, i]));
  const refs = [...new Map(needs.map((n) => [n.ref, n])).values()];

  const link = (ref: string) => {
    setForRef(ref);
    const ns = needs.filter((n) => n.ref === ref);
    if (ns.length) setLines(ns.map((n) => ({ itemId: n.itemId, qty: String(n.qty) })));
  };
  const add = () => { if (adding && !lines.some((l) => l.itemId === adding)) setLines([...lines, { itemId: adding, qty: '1' }]); setAdding(''); };
  const save = async () => {
    let created: ShipmentOrder | null = null;
    const ok = await run(async () => {
      created = await warehouseApi.createShipment({ supplier, eta, forRef, requiredBy: needs.find((n) => n.ref === forRef)?.requiredBy, lines: lines.map((l) => ({ itemId: l.itemId, qty: Number(l.qty) })) }, actor);
    }, 'Đã tạo đơn nhập hàng.');
    if (ok && created) onDone(created);
  };

  return (
    <Dialog open onClose={onClose} icon="truck" tone="brand" width={680} busy={busy} busyLabel="Đang tạo…" title="Tạo đơn nhập hàng"
      sub="Hàng chỉ được cộng vào tồn khi bạn xác nhận đã nhận thực tế." confirmLabel="Tạo đơn" onConfirm={save}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      <div style={{ display: 'grid', gap: 14 }}>
        <div className="ht-field" style={{ margin: 0 }}>
          <label className="ht-label" htmlFor="sh-for">Liên kết nhu cầu đang thiếu</label>
          <select id="sh-for" className="ht-select" style={{ height: 40, width: '100%' }} value={forRef} onChange={(e) => link(e.target.value)}>
            <option value="">Bổ sung tồn (không liên kết)</option>
            {refs.map((n) => <option key={n.ref} value={n.ref}>{needs.filter((x) => x.ref === n.ref).map((x) => x.label).join(' · ')}</option>)}
          </select>
        </div>
        <div className="ht-grid-2">
          <div className="ht-field" style={{ margin: 0 }}><label className="ht-label" htmlFor="sh-sup">Nhà cung cấp<span className="ht-req">*</span></label>
            <input id="sh-sup" className="ht-input" list="sh-sups" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
            <datalist id="sh-sups">{supplierNames.map((n) => <option key={n} value={n} />)}</datalist>
          </div>
          <div className="ht-field" style={{ margin: 0 }}><label className="ht-label" htmlFor="sh-eta">Ngày dự kiến về<span className="ht-req">*</span></label>
            <input id="sh-eta" className="ht-input ht-mono" value={eta} onChange={(e) => setEta(e.target.value)} placeholder="dd/mm/yyyy" /></div>
        </div>
        <table className="ht-proto-items">
          <thead><tr><th>Mặt hàng</th><th className="num">Số lượng</th><th /></tr></thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={l.itemId}>
                <td><b>{inv[l.itemId]?.name}</b> <span style={{ color: 'var(--muted)', fontSize: 12 }}>{inv[l.itemId]?.id}</span></td>
                <td className="num"><input className="ht-input" type="number" min={1} value={l.qty} aria-label={`Số lượng ${inv[l.itemId]?.name}`}
                  onChange={(e) => setLines(lines.map((x, k) => (k === i ? { ...x, qty: e.target.value } : x)))} /> {inv[l.itemId]?.unit}</td>
                <td className="num"><button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" aria-label="Bỏ dòng" onClick={() => setLines(lines.filter((_, k) => k !== i))}><Icon name="x" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="ht-proto-add">
          <MedicinePicker items={items} value={adding} onChange={setAdding} label="Chọn mặt hàng" />
          <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" onClick={add} disabled={!adding}><Icon name="check" />Thêm</button>
        </div>
      </div>
    </Dialog>
  );
};

export const ReceiveDialog: React.FC<{ shipment: ShipmentOrder; items: StockItem[]; onClose: () => void; onDone: (notified: string[]) => void }> = ({ shipment: s, items, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const [rows, setRows] = useState(s.lines.map((l) => ({ itemId: l.itemId, received: String(l.qty), lot: '', expiry: '' })));
  const set = (i: number, patch: Partial<(typeof rows)[number]>) => setRows(rows.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  const save = async () => {
    let notified: string[] = [];
    const ok = await run(async () => { notified = (await warehouseApi.receive(s, rows.map((r) => ({ ...r, received: Number(r.received) })), actor)).notified; }, `Đã nhận ${s.id} và nhập kho.`);
    if (ok) onDone(notified);
  };
  return (
    <Dialog open onClose={onClose} icon="box" tone="brand" width={680} busy={busy} busyLabel="Đang nhập kho…" title={`Nhận hàng · ${s.id}`}
      sub="Đối chiếu hàng thực nhận. Nếu lô hàng phục vụ phác đồ, hệ thống giữ hàng và báo bác sĩ rà soát lại trước khi cấp phát." confirmLabel="Xác nhận nhập kho" onConfirm={save}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      <table className="ht-proto-items">
        <thead><tr><th>Mặt hàng</th><th className="num">Đặt</th><th className="num">Thực nhận</th><th>HSD (mm/yyyy)</th></tr></thead>
        <tbody>
          {s.lines.map((l, i) => {
            const lots = tracksLots(items.find((x) => x.id === l.itemId) ?? { category: '' });
            return (
              <tr key={l.itemId}>
                <td><b>{l.name}</b></td><td className="num">{l.qty} {l.unit}</td>
                <td className="num"><input className="ht-input" type="number" min={0} value={rows[i].received} onChange={(e) => set(i, { received: e.target.value })} aria-label={`Thực nhận ${l.name}`} /></td>
                <td>{lots ? <input className="ht-input ht-mono" style={{ width: 100, textAlign: 'left' }} value={rows[i].expiry} placeholder="mm/yyyy" onChange={(e) => set(i, { expiry: e.target.value })} aria-label={`Hạn dùng ${l.name}`} /> : <span style={{ color: 'var(--muted)' }}>—</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Dialog>
  );
};

export const ReasonDialog: React.FC<{ shipment: ShipmentOrder; kind: 'eta' | 'cancel'; onClose: () => void; onDone: (warned: string[]) => void }> = ({ shipment: s, kind, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const [eta, setEta] = useState(s.eta);
  const [reason, setReason] = useState('');
  const save = async () => {
    let warned: string[] = [];
    const ok = kind === 'eta'
      ? await run(async () => { warned = (await warehouseApi.updateEta(s, eta, reason, actor)).warned; }, `${s.id}: đã cập nhật ETA.`)
      : await run(() => warehouseApi.cancelShipment(s, reason, actor), `Đã hủy ${s.id}.`);
    if (ok) onDone(warned);
  };
  return (
    <Dialog open onClose={onClose} icon={kind === 'eta' ? 'clock' : 'x'} tone={kind === 'eta' ? 'brand' : 'danger'} danger={kind === 'cancel'} busy={busy}
      title={kind === 'eta' ? `Cập nhật ETA · ${s.id}` : `Hủy đơn ${s.id}?`}
      sub={kind === 'eta' ? `ETA hiện tại ${s.eta}${s.requiredBy ? ` · cần trước ${s.requiredBy}` : ''}. Kho chỉ cập nhật ngày giao — không tự đổi thuốc.` : 'Nhu cầu liên kết sẽ không còn ETA từ đơn này.'}
      confirmLabel={kind === 'eta' ? 'Lưu ETA' : 'Hủy đơn'} onConfirm={save}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      <div style={{ display: 'grid', gap: 12 }}>
        {kind === 'eta' && <div className="ht-field" style={{ margin: 0 }}><label className="ht-label" htmlFor="sh-neweta">ETA mới</label><input id="sh-neweta" className="ht-input ht-mono" value={eta} onChange={(e) => setEta(e.target.value)} placeholder="dd/mm/yyyy" /></div>}
        <ReasonField id="sh-reason" label={kind === 'eta' ? 'Lý do / nguồn thông tin' : 'Lý do hủy'} value={reason} onChange={setReason} placeholder={kind === 'eta' ? 'VD: Nhà cung cấp báo xe giao trễ 3 ngày' : 'VD: Nhà cung cấp hết hàng, đặt nơi khác'} minHeight={56} />
      </div>
    </Dialog>
  );
};
