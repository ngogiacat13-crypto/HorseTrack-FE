import React, { useEffect, useState } from 'react';
import { USE_BACKEND } from '../../api/beClient';
import { useAction } from '../../hooks/useAction';
import { Icon } from '../../components/ui/Icon';
import { Callout, Dialog } from '../../components/ui/Ht';
import { ITEM_CATEGORIES, emptyItem, itemsApi, type ItemDraft } from './itemsApi';

const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12, alignItems: 'end' };
const selectStyle: React.CSSProperties = { height: 44, width: '100%', fontSize: 14 };

const Text: React.FC<{ id: string; label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string; placeholder?: string }> = ({ id, label, value, onChange, required, type, placeholder }) => (
  <div className="ht-field" style={{ margin: 0 }}>
    <label className="ht-label" htmlFor={id}>{label}{required && <span className="ht-req">*</span>}</label>
    <input id={id} data-testid={id} className="ht-input" type={type} min={type === 'number' ? 0 : undefined} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
  </div>
);

export const ItemFormDialog: React.FC<{ beId: number | null; title: string; onClose: () => void; onDone: () => void }> = ({ beId, title, onClose, onDone }) => {
  const { busy, error, run } = useAction();
  const [d, setD] = useState<ItemDraft | null>(beId ? null : emptyItem);
  const [loadError, setLoadError] = useState('');
  useEffect(() => {
    if (beId) itemsApi.get(beId).then(setD).catch((e: Error) => setLoadError(e.message));
  }, [beId]);
  const set = <K extends keyof ItemDraft>(k: K, v: ItemDraft[K]) => setD((x) => (x ? { ...x, [k]: v } : x));
  const save = async () => {
    if (!d) return;
    if (await run(() => itemsApi.save(beId, d), beId ? `Đã cập nhật ${d.name.trim()}.` : `Đã thêm ${d.name.trim()} vào danh mục kho.`)) onDone();
  };

  return (
    <Dialog open onClose={onClose} icon="box" tone="brand" width={680} busy={busy} busyLabel="Đang lưu…" testId="item-form-dialog"
      title={title} sub="Tồn kho không sửa ở đây — chỉ thay đổi qua nhập / xuất / điều chỉnh." confirmLabel={beId ? 'Lưu thay đổi' : 'Thêm vật tư'} onConfirm={save}>
      {(error || loadError) && <Callout tone="danger" style={{ marginBottom: 14 }}>{error || loadError}</Callout>}
      {!d && !loadError && <div className="ht-empty">Đang tải…</div>}
      {d && (
        <div style={{ display: 'grid', gap: 12 }}>
          <Text id="item-name" label="Tên vật tư" required value={d.name} onChange={(v) => set('name', v)} placeholder="VD: Phenylbutazone 1g" />
          <div style={grid}>
            <div className="ht-field" style={{ margin: 0 }}>
              <label className="ht-label" htmlFor="item-category">Nhóm vật tư<span className="ht-req">*</span></label>
              <select id="item-category" data-testid="item-category" className="ht-select" style={selectStyle} value={d.category} onChange={(e) => set('category', e.target.value)}>
                {[...new Set([...ITEM_CATEGORIES, d.category])].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Text id="item-group" label="Nhóm phụ" value={d.group} onChange={(v) => set('group', v)} placeholder="VD: Kháng viêm" />
            <Text id="item-unit" label="Đơn vị tính" required value={d.unit} onChange={(v) => set('unit', v)} placeholder="VD: lọ, gói, kg" />
            <Text id="item-price" label="Đơn giá (đ)" required type="number" value={d.unitPrice} onChange={(v) => set('unitPrice', v)} />
            <Text id="item-safety" label="Ngưỡng an toàn" required type="number" value={d.safety} onChange={(v) => set('safety', v)} />
            <Text id="item-brand" label="Nhãn hiệu" value={d.brand} onChange={(v) => set('brand', v)} />
            <Text id="item-route" label="Đường dùng" value={d.route} onChange={(v) => set('route', v)} placeholder="VD: Tiêm bắp, Uống" />
            <Text id="item-withdrawal" label="Ngưng thuốc trước thi đấu (giờ)" type="number" value={d.withdrawalHours} onChange={(v) => set('withdrawalHours', v)} />
          </div>
          <Text id="item-dose" label="Liều tham khảo" value={d.doseRef} onChange={(v) => set('doseRef', v)} placeholder="VD: 4.4 mg/kg/ngày" />
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
              <input type="checkbox" data-testid="item-rx" checked={d.rx} onChange={(e) => set('rx', e.target.checked)} />Cần kê đơn
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
              <input type="checkbox" data-testid="item-controlled" checked={d.controlled} onChange={(e) => set('controlled', e.target.checked)} />Thuốc kiểm soát đặc biệt
            </label>
          </div>
          <div className="ht-field" style={{ margin: 0 }}>
            <label className="ht-label" htmlFor="item-note">Ghi chú</label>
            <textarea id="item-note" data-testid="item-note" className="ht-input" style={{ height: 64, padding: '10px 14px' }} value={d.note} onChange={(e) => set('note', e.target.value)} />
          </div>
        </div>
      )}
    </Dialog>
  );
};

export const NewItemButton: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [open, setOpen] = useState(false);
  if (!USE_BACKEND) return null;
  return (
    <>
      <button type="button" className="ht-btn ht-btn--secondary" data-testid="new-item-btn" onClick={() => setOpen(true)}><Icon name="box" />Thêm vật tư</button>
      {open && <ItemFormDialog beId={null} title="Thêm vật tư vào danh mục" onClose={() => setOpen(false)} onDone={() => { setOpen(false); onDone(); }} />}
    </>
  );
};
