import React, { useState } from 'react';
import { USE_BACKEND } from '../../api/beClient';
import { useAction } from '../../hooks/useAction';
import { useFetch } from '../../hooks/useFetch';
import { Icon } from '../../components/ui/Icon';
import { Badge, Callout, Dialog } from '../../components/ui/Ht';
import { emptySupplier, suppliersApi, toSupplierDraft, type Supplier, type SupplierDraft } from './suppliersApi';

const SupplierForm: React.FC<{ supplier: Supplier | null; onClose: () => void; onDone: () => void }> = ({ supplier, onClose, onDone }) => {
  const { busy, error, run } = useAction();
  const [d, setD] = useState<SupplierDraft>(supplier ? toSupplierDraft(supplier) : emptySupplier);
  const set = <K extends keyof SupplierDraft>(k: K, v: SupplierDraft[K]) => setD((x) => ({ ...x, [k]: v }));
  const save = async () => {
    if (await run(() => suppliersApi.save(supplier?.id ?? null, d), supplier ? `Đã cập nhật ${d.name.trim()}.` : `Đã thêm nhà cung cấp ${d.name.trim()}.`)) onDone();
  };
  const field = (k: 'name' | 'phone' | 'email' | 'address', label: string, required?: boolean, placeholder?: string) => (
    <div className="ht-field" style={{ margin: 0 }}>
      <label className="ht-label" htmlFor={`supplier-${k}`}>{label}{required && <span className="ht-req">*</span>}</label>
      <input id={`supplier-${k}`} data-testid={`supplier-${k}`} className="ht-input" value={d[k]} placeholder={placeholder} onChange={(e) => set(k, e.target.value)} />
    </div>
  );
  return (
    <Dialog open onClose={onClose} icon="truck" tone="brand" width={560} busy={busy} busyLabel="Đang lưu…" testId="supplier-form-dialog"
      title={supplier ? `Sửa nhà cung cấp · ${supplier.name}` : 'Thêm nhà cung cấp'} confirmLabel={supplier ? 'Lưu thay đổi' : 'Thêm'} onConfirm={save}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      <div style={{ display: 'grid', gap: 12 }}>
        {field('name', 'Tên nhà cung cấp', true, 'VD: Công ty Dược thú y Sài Gòn')}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12, alignItems: 'end' }}>
          {field('phone', 'Số điện thoại', false, 'VD: 0283 456 789')}
          {field('email', 'Email', false, 'VD: kinhdoanh@ncc.vn')}
        </div>
        {field('address', 'Địa chỉ')}
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
          <input type="checkbox" data-testid="supplier-active" checked={d.active} onChange={(e) => set('active', e.target.checked)} />Đang hợp tác (hiện khi tạo đơn nhập)
        </label>
      </div>
    </Dialog>
  );
};

const SuppliersDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { data, error, loading, reload } = useFetch(() => suppliersApi.list(), []);
  const [editing, setEditing] = useState<Supplier | null | 'new'>(null);
  return (
    <>
      <Dialog open onClose={onClose} icon="truck" tone="brand" width={820} testId="suppliers-dialog" title="Nhà cung cấp"
        sub="Danh sách dùng khi tạo đơn nhập hàng. Ngừng hợp tác thì không xóa, chỉ ẩn khỏi lựa chọn." confirmLabel="Đóng" onConfirm={onClose}>
        {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" data-testid="supplier-add-btn" onClick={() => setEditing('new')}><Icon name="truck" />Thêm nhà cung cấp</button>
        </div>
        {loading && !data && <div className="ht-empty">Đang tải…</div>}
        {data && data.length === 0 && <div className="ht-empty" data-testid="suppliers-empty">Chưa có nhà cung cấp.</div>}
        {data && data.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="ht-table" data-testid="suppliers-table">
              <thead><tr><th>Nhà cung cấp</th><th>Liên hệ</th><th>Địa chỉ</th><th>Trạng thái</th><th /></tr></thead>
              <tbody>
                {data.map((s) => (
                  <tr key={s.id}>
                    <td className="strong">{s.name}</td>
                    <td style={{ fontSize: 13 }}>{s.phone || '—'}<span className="sub">{s.email || '—'}</span></td>
                    <td style={{ fontSize: 13 }}>{s.address || '—'}</td>
                    <td>{s.active ? <Badge tone="success">Đang hợp tác</Badge> : <Badge tone="neutral">Ngừng</Badge>}</td>
                    <td className="num"><button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" data-testid={`supplier-edit-${s.id}`} onClick={() => setEditing(s)}>Sửa</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Dialog>
      {editing && <SupplierForm supplier={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); reload(); }} />}
    </>
  );
};

export const SuppliersButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  if (!USE_BACKEND) return null;
  return (
    <>
      <button type="button" className="ht-btn ht-btn--secondary" data-testid="suppliers-btn" onClick={() => setOpen(true)}><Icon name="users" />Nhà cung cấp</button>
      {open && <SuppliersDialog onClose={() => setOpen(false)} />}
    </>
  );
};
