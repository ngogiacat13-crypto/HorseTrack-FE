import { be, beData } from '../../api/beClient';
import { invalidate } from '../../api/hybridAdapter';

export const ITEM_CATEGORIES = ['Thuốc', 'Vaccine', 'Vật tư y tế', 'Thức ăn', 'Thức ăn bổ sung', 'Vật tư chuồng trại', 'Dụng cụ', 'Khác'];

interface BeItemDetail {
  itemId: number; itemCode: string; itemName: string; category: string; itemGroup?: string | null; brand?: string | null; unit: string;
  unitPrice: number; minSafetyStock: number; route?: string | null; isControlled?: boolean; requiresPrescription?: boolean;
  withdrawalHours?: number | null; doseReference?: string | null; note?: string | null;
}

export interface ItemDraft {
  name: string; category: string; unit: string; unitPrice: string; safety: string; group: string; brand: string; route: string;
  controlled: boolean; rx: boolean; withdrawalHours: string; doseRef: string; note: string;
}

export const emptyItem: ItemDraft = {
  name: '', category: 'Thuốc', unit: '', unitPrice: '', safety: '0', group: '', brand: '', route: '',
  controlled: false, rx: false, withdrawalHours: '', doseRef: '', note: '',
};

const LABEL: Record<string, string> = {
  FEED: 'Thức ăn', SUPPLEMENT: 'Thức ăn bổ sung', MEDICINE: 'Thuốc', VACCINE: 'Vaccine', MEDICAL_SUPPLY: 'Vật tư y tế',
  STABLE_SUPPLY: 'Vật tư chuồng trại', EQUIPMENT: 'Dụng cụ', OTHER: 'Khác',
};

const toDraft = (i: BeItemDetail): ItemDraft => ({
  name: i.itemName, category: LABEL[i.category] ?? i.category, unit: i.unit, unitPrice: String(Number(i.unitPrice) || 0),
  safety: String(Number(i.minSafetyStock) || 0), group: i.itemGroup ?? '', brand: i.brand ?? '', route: i.route ?? '',
  controlled: !!i.isControlled, rx: !!i.requiresPrescription, withdrawalHours: i.withdrawalHours == null ? '' : String(i.withdrawalHours),
  doseRef: i.doseReference ?? '', note: i.note ?? '',
});

const toBody = (d: ItemDraft) => {
  const name = d.name.trim();
  const unit = d.unit.trim();
  const price = Number(d.unitPrice);
  const safety = Number(d.safety);
  const hours = d.withdrawalHours.trim() === '' ? undefined : Number(d.withdrawalHours);
  if (name.length < 2 || name.length > 100) throw new Error('Tên vật tư từ 2 đến 100 ký tự.');
  if (!d.category) throw new Error('Chọn nhóm vật tư.');
  if (!unit || unit.length > 20) throw new Error('Đơn vị tính bắt buộc, tối đa 20 ký tự.');
  if (d.unitPrice.trim() === '' || !Number.isFinite(price) || price < 0) throw new Error('Đơn giá là số ≥ 0.');
  if (!Number.isFinite(safety) || safety < 0) throw new Error('Ngưỡng an toàn là số ≥ 0.');
  if (hours !== undefined && (!Number.isInteger(hours) || hours < 0)) throw new Error('Thời gian ngưng thuốc là số giờ nguyên ≥ 0.');
  if (d.group.length > 50 || d.route.length > 50) throw new Error('Nhóm phụ và đường dùng tối đa 50 ký tự.');
  if (d.brand.length > 100) throw new Error('Nhãn hiệu tối đa 100 ký tự.');
  if (d.doseRef.length > 255) throw new Error('Liều tham khảo tối đa 255 ký tự.');
  if (d.note.length > 500) throw new Error('Ghi chú tối đa 500 ký tự.');
  return {
    itemName: name, category: d.category, unit, unitPrice: price, minSafetyStock: safety,
    itemGroup: d.group.trim() || undefined, brand: d.brand.trim() || undefined, route: d.route.trim() || undefined,
    isControlled: d.controlled, requiresPrescription: d.rx, withdrawalHours: hours,
    doseReference: d.doseRef.trim() || undefined, note: d.note.trim() || undefined,
  };
};

export const itemsApi = {
  async get(beId: number) {
    return toDraft(await beData<BeItemDetail>(be.get(`/inventory/items/${beId}`)));
  },
  async save(beId: number | null, d: ItemDraft) {
    const body = toBody(d);
    const r = await beData<BeItemDetail>(beId ? be.put(`/inventory/items/${beId}`, body) : be.post('/inventory/items', body));
    invalidate('inventory');
    return r.itemCode;
  },
};
