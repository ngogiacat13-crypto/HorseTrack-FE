export type MealType = 'MORNING' | 'NOON' | 'EVENING';
export const MEALS: [MealType, string][] = [['MORNING', 'Sáng'], ['NOON', 'Trưa'], ['EVENING', 'Chiều']];
export const toMealType = (m: string): MealType => { const v = m.toUpperCase(); return v === 'AFTERNOON' ? 'NOON' : (v as MealType); };

export interface DraftLine { key: string; mealType: MealType; itemId: string; quantity: string }
export interface PlanDraft { startDate: string; endDate: string; notes: string; lines: DraftLine[] }


export const todayIso = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const plusDaysIso = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); return todayIso(d); };
export const dmy = (iso?: string | null) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—');

let seq = 0;
export const newLine = (mealType: MealType = 'MORNING'): DraftLine => ({ key: `l${(seq += 1)}`, mealType, itemId: '', quantity: '' });

export const editBlock = (role: string, locked: boolean): string | null => {
  if (role === 'ClubManager') return 'Club Manager chỉ xem thực đơn — HLV lên thực đơn khi ngựa khỏe, bác sĩ khi ngựa bị khóa y tế (BR_03).';
  if (role === 'Veterinarian') return locked ? null : 'Ngựa đang khỏe — thực đơn do HLV lên. Bác sĩ chỉ định khẩu phần khi ngựa bị khóa y tế (BR_03).';
  if (role === 'HeadTrainer') return locked ? 'Ngựa đang bị khóa y tế — chỉ Bác sĩ thú y được chỉnh thực đơn (BR_03).' : null;
  return 'Bạn chỉ được xem thực đơn.';
};

export const startMin = (keptStart?: string | null, today = todayIso()) => (keptStart && keptStart.slice(0, 10) < today ? keptStart.slice(0, 10) : today);

export const validateDraft = (d: PlanDraft, keptStart?: string | null) => {
  if (!d.startDate || !d.endDate) throw new Error('Chọn ngày bắt đầu và ngày kết thúc.');
  if (d.startDate < todayIso() && d.startDate !== keptStart?.slice(0, 10)) throw new Error(`Ngày bắt đầu không được ở quá khứ (hôm nay là ${dmy(todayIso())}).`);
  if (d.endDate < d.startDate) throw new Error('Ngày kết thúc không được trước ngày bắt đầu.');
  if (!d.lines.length) throw new Error('Thêm ít nhất 1 món vào thực đơn.');
  d.lines.forEach((l, i) => {
    if (!l.itemId) throw new Error(`Dòng ${i + 1}: chọn thức ăn.`);
    const q = Number(l.quantity.replace(',', '.'));
    if (!Number.isFinite(q) || q <= 0) throw new Error(`Dòng ${i + 1}: định lượng phải lớn hơn 0.`);
    l.quantity = String(q);
  });
  const seen = new Set<string>();
  d.lines.forEach((l) => {
    const k = `${l.mealType}-${l.itemId}`;
    if (seen.has(k)) throw new Error('Một món bị lặp trong cùng bữa — gộp định lượng vào 1 dòng.');
    seen.add(k);
  });
};

export const isCurrent = (p: { status: string; startDate: string; endDate: string }, today = todayIso()) =>
  p.status === 'ACTIVE' && p.startDate.slice(0, 10) <= today && p.endDate.slice(0, 10) >= today;

export const isUpcoming = (p: { status: string; startDate: string }, today = todayIso()) => p.status === 'ACTIVE' && p.startDate.slice(0, 10) > today;
