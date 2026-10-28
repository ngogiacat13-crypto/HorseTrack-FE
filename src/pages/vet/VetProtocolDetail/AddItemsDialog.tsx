import React, { useMemo, useState } from 'react';
import { DEMO_NOW } from '../../../api/http';
import { dateKey, vetApi, withAddedItems, type ItemAddition, type Protocol } from '../../../api/vetApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { useFetch } from '../../../hooks/useFetch';
import { Icon } from '../../../components/ui/Icon';
import { Callout, Dialog, ReasonField, money } from '../../../components/ui/Ht';
import { MedicinePicker } from '../../../components/vet/MedicinePicker';

const requiredByFrom = (current: string) =>
  /^\d{2}\/\d{2}\/\d{4}$/.test(current) && dateKey(current) >= dateKey(DEMO_NOW.date) ? current : DEMO_NOW.date;

export const AddItemsDialog: React.FC<{ protocol: Protocol; onClose: () => void; onDone: (newId: string) => void }> = ({ protocol: p, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, setError, run } = useAction();
  const { data: catalog, loading } = useFetch(() => vetApi.getPrescribableItems(), []);
  const [phaseNo, setPhaseNo] = useState(p.phases[0]?.no ?? 1);
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState('1');
  const [adds, setAdds] = useState<ItemAddition[]>([]);
  const [reason, setReason] = useState('');
  const treating = p.state === 'IN_TREATMENT';
  const items = useMemo(() => catalog ?? [], [catalog]);
  const phaseName = (no: number) => p.phases.find((ph) => ph.no === no)?.name ?? `Giai đoạn ${no}`;
  const addedCost = adds.reduce((s, a) => s + a.qty * a.unitPrice, 0);

  const withSelected = (xs: ItemAddition[]): ItemAddition[] | null => {
    const item = items.find((i) => i.id === itemId);
    const n = Number(qty);
    if (!item) { setError('Chọn thuốc / vật tư cần thêm.'); return null; }
    if (!Number.isInteger(n) || n < 1) { setError('Số lượng phải là số nguyên ≥ 1.'); return null; }
    setError('');
    const same = xs.find((a) => a.phaseNo === phaseNo && a.itemId === item.id);
    return same ? xs.map((a) => (a === same ? { ...a, qty: a.qty + n } : a)) : [...xs, { phaseNo, itemId: item.id, name: item.name, unit: item.unit, unitPrice: item.unitPrice, qty: n }];
  };

  const addLine = () => {
    const next = withSelected(adds);
    if (!next) return;
    setAdds(next);
    setItemId('');
    setQty('1');
  };

  const submit = async () => {
    const lines = itemId ? withSelected(adds) : adds;
    if (!lines) return;
    if (!lines.length) return setError('Thêm ít nhất 1 thuốc / vật tư vào danh sách.');
    if (lines !== adds) { setAdds(lines); setItemId(''); setQty('1'); }
    if (treating) {
      if (await run(() => vetApi.addItemsDuringTreatment(p, lines, reason, actor), `Đã gửi ${lines.length} thuốc cho kho duyệt. Kho giữ hàng nếu đủ, hoặc ghi thiếu để đặt hàng.`)) onDone(p.id);
      return;
    }
    const out: { id?: string } = {};
    const ok = await run(async () => {
      const created = await vetApi.createProtocol({
        horseId: p.horseId, caseId: p.caseId, diagnosis: p.diagnosis, requiredBy: requiredByFrom(p.requiredBy),
        phases: withAddedItems(p.phases, lines), replaces: p.id,
      }, true, actor);
      out.id = created.id;
    }, `Đã thêm ${lines.length} thuốc / vật tư — tạo phiên bản mới và gửi kho kiểm tồn.`);
    if (ok && out.id) onDone(out.id);
  };

  return (
    <Dialog open onClose={onClose} icon="box" tone="brand" width={760} busy={busy} busyLabel="Đang gửi…" testId="add-items-dialog"
      title={`${treating ? 'Bổ sung thuốc khi điều trị' : 'Thêm vật tư / thuốc'} · ${p.id}`} sub={treating ? `${p.horse} · đang điều trị` : `${p.horse} · phiên bản ${p.version} → ${p.version + 1}`}
      confirmLabel={treating ? 'Bổ sung thuốc' : 'Thêm và gửi kho kiểm tồn'} onConfirm={submit} disabled={(!adds.length && !itemId) || (treating && reason.trim().length < 5)}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      <Callout tone="info" style={{ marginBottom: 14 }}>
        {treating
          ? <>Thuốc được gửi cho <b>nhân viên kho duyệt</b>, không tự nhận vào kho. Đủ hàng thì kho giữ và lập hóa đơn; thiếu thì kho ghi thiếu và đặt hàng. Chỉ thêm vào giai đoạn chưa kết thúc.</>
          : <>Thuốc đang có được giữ nguyên, phần thêm được cộng vào giai đoạn đã chọn. Hệ thống tạo <b>phiên bản {p.version + 1}</b>, trả lại hàng kho đã giữ cho bản cũ và gửi kho kiểm tồn lại toàn bộ.</>}
      </Callout>
      {treating && (
        <div style={{ marginBottom: 14 }}>
          <ReasonField id="add-item-reason" label="Lý do bổ sung" value={reason} onChange={setReason} min={5} minHeight={60} placeholder="VD: Vết thương chậm lành, cần thêm thuốc kháng viêm" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: p.phases.length > 1 ? 'minmax(0, 1fr) minmax(0, 1.6fr)' : 'minmax(0, 1fr)', gap: 10, alignItems: 'end' }}>
        {p.phases.length > 1 && (
          <div className="ht-field" style={{ margin: 0 }}>
            <label className="ht-label" htmlFor="add-phase">Giai đoạn</label>
            <select id="add-phase" data-testid="add-item-phase" className="ht-select" style={{ height: 44, width: '100%', fontSize: 14 }} value={phaseNo} onChange={(e) => setPhaseNo(Number(e.target.value))}>
              {p.phases.map((ph) => <option key={ph.no} value={ph.no}>{ph.no}. {ph.name}</option>)}
            </select>
          </div>
        )}
        <div className="ht-field" style={{ margin: 0 }}>
          <label className="ht-label" htmlFor="add-item">Thuốc / vật tư</label>
          <MedicinePicker id="add-item" testId="add-item-select" items={items} value={itemId} onChange={setItemId} disabled={loading} showStock
            placeholder={loading ? 'Đang tải danh mục…' : '— Chọn thuốc / vật tư từ danh mục kho —'} style={{ height: 44, width: '100%', fontSize: 14 }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '140px auto', justifyContent: 'start', gap: 10, alignItems: 'end', marginTop: 10 }}>
        <div className="ht-field" style={{ margin: 0 }}>
          <label className="ht-label" htmlFor="add-qty">Số lượng</label>
          <input id="add-qty" data-testid="add-item-qty" className="ht-input" type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
        </div>
        <button type="button" className="ht-btn ht-btn--secondary" data-testid="add-item-line" onClick={addLine} disabled={!itemId} style={{ height: 44 }}><Icon name="check" size={15} />Thêm vào danh sách</button>
      </div>

      <table className="ht-table" style={{ marginTop: 16 }} data-testid="add-item-list">
        <thead><tr><th>Giai đoạn</th><th>Thuốc / vật tư</th><th style={{ textAlign: 'right' }}>Số lượng</th><th style={{ textAlign: 'right' }}>Thành tiền</th><th aria-label="Bỏ" /></tr></thead>
        <tbody>
          {adds.map((a) => (
            <tr key={`${a.phaseNo}-${a.itemId}`}>
              <td>{a.phaseNo}. {phaseName(a.phaseNo)}</td>
              <td><span className="strong">{a.name}</span>{p.phases.find((ph) => ph.no === a.phaseNo)?.items.some((it) => it.itemId === a.itemId) && <span className="sub">đã có trong giai đoạn — cộng thêm số lượng</span>}</td>
              <td style={{ textAlign: 'right' }}>{a.qty} {a.unit}</td>
              <td style={{ textAlign: 'right' }}>{money(a.qty * a.unitPrice)}</td>
              <td style={{ textAlign: 'right' }}><button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" aria-label={`Bỏ ${a.name}`} onClick={() => setAdds((xs) => xs.filter((x) => x !== a))}><Icon name="x" size={14} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {!adds.length && <div className="ht-empty">Chưa thêm thuốc / vật tư nào.</div>}
      {adds.length > 0 && <p style={{ margin: '12px 0 0', textAlign: 'right' }}>Chi phí thêm: <b>{money(addedCost)}</b> · tổng mới khoảng <b>{money(p.cost + addedCost)}</b></p>}
    </Dialog>
  );
};
