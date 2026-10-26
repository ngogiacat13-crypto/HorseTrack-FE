import { be, beData } from '../../api/beClient';

export interface Supplier { id: number; name: string; phone: string; email: string; address: string; active: boolean }
export interface SupplierDraft { name: string; phone: string; email: string; address: string; active: boolean }

interface BeSupplier { supplierId: number; supplierName: string; contactPhone?: string | null; contactEmail?: string | null; address?: string | null; isActive?: boolean | null }

const PHONE = /^[0-9+\-\s]{8,20}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const map = (s: BeSupplier): Supplier => ({
  id: s.supplierId, name: s.supplierName, phone: s.contactPhone ?? '', email: s.contactEmail ?? '', address: s.address ?? '', active: s.isActive !== false,
});

export const emptySupplier: SupplierDraft = { name: '', phone: '', email: '', address: '', active: true };
export const toSupplierDraft = (s: Supplier): SupplierDraft => ({ name: s.name, phone: s.phone, email: s.email, address: s.address, active: s.active });

const toBody = (d: SupplierDraft) => {
  const name = d.name.trim();
  const phone = d.phone.trim();
  const email = d.email.trim();
  if (name.length < 3 || name.length > 150) throw new Error('Tên nhà cung cấp từ 3 đến 150 ký tự.');
  if (phone && !PHONE.test(phone)) throw new Error('Số điện thoại 8–20 ký tự, chỉ gồm số, dấu +, - hoặc khoảng trắng.');
  if (email && (!EMAIL.test(email) || email.length > 100)) throw new Error('Email không đúng định dạng.');
  if (d.address.length > 255) throw new Error('Địa chỉ tối đa 255 ký tự.');
  return { supplierName: name, contactPhone: phone || undefined, contactEmail: email || undefined, address: d.address.trim() || undefined, isActive: d.active };
};

export const suppliersApi = {
  async list(activeOnly = false) {
    return (await beData<BeSupplier[]>(be.get('/inventory/suppliers', { params: { activeOnly } }))).map(map);
  },
  async save(id: number | null, d: SupplierDraft) {
    const body = toBody(d);
    return map(await beData<BeSupplier>(id ? be.put(`/inventory/suppliers/${id}`, body) : be.post('/inventory/suppliers', body)));
  },
};
