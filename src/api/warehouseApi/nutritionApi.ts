import { be, beData, USE_BACKEND, type ApiResponse } from '../beClient';
import { invalidate } from '../hybridAdapter';

export type NutritionStockTab = 'pending' | 'issued' | 'cancelled' | 'all';

export interface NutritionStockLine {
  requisitionId: number;
  requisitionCode: string;
  itemId: number;
  itemCode: string;
  itemName: string;
  unit: string;
  quantity: number;
  availableStock: number;
  issuedQuantity?: number | null;
  status: string;
  note?: string | null;
}

export interface NutritionStockRequest {
  planId: number;
  planType?: string | null;
  planStatus?: string | null;
  horseId?: number | null;
  horseName?: string | null;
  stallCode?: string | null;
  barnZone?: string | null;
  date: string;
  createdByName?: string | null;
  status: 'PENDING' | 'ISSUED' | 'CANCELLED' | string;
  canIssue?: boolean | null;
  requestedAt?: string | null;
  issuedAt?: string | null;
  issuedByName?: string | null;
  lines: NutritionStockLine[];
}

const asDate = (v: unknown): string => {
  if (v == null) return '';
  if (typeof v === 'string') return v.length >= 10 ? v.slice(0, 10) : v;
  if (Array.isArray(v) && v.length >= 3) {
    const [y, m, d] = v;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return String(v);
};

const asDateTime = (v: unknown): string | null => {
  if (v == null) return null;
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && v.length >= 3) {
    const [y, m, d, h = 0, mi = 0] = v;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}:00`;
  }
  return String(v);
};

const mapLine = (l: Record<string, unknown>): NutritionStockLine => ({
  requisitionId: Number(l.requisitionId),
  requisitionCode: String(l.requisitionCode ?? ''),
  itemId: Number(l.itemId),
  itemCode: String(l.itemCode ?? ''),
  itemName: String(l.itemName ?? ''),
  unit: String(l.unit ?? ''),
  quantity: Number(l.quantity) || 0,
  availableStock: Number(l.availableStock) || 0,
  issuedQuantity: l.issuedQuantity == null ? null : Number(l.issuedQuantity),
  status: String(l.status ?? ''),
  note: (l.note as string | null) ?? null,
});

const mapRow = (r: Record<string, unknown>): NutritionStockRequest => ({
  planId: Number(r.planId),
  planType: (r.planType as string | null) ?? null,
  planStatus: (r.planStatus as string | null) ?? null,
  horseId: r.horseId == null ? null : Number(r.horseId),
  horseName: (r.horseName as string | null) ?? null,
  stallCode: (r.stallCode as string | null) ?? null,
  barnZone: (r.barnZone as string | null) ?? null,
  date: asDate(r.date),
  createdByName: (r.createdByName as string | null) ?? null,
  status: String(r.status ?? ''),
  canIssue: r.canIssue == null ? null : !!r.canIssue,
  requestedAt: asDateTime(r.requestedAt),
  issuedAt: asDateTime(r.issuedAt),
  issuedByName: (r.issuedByName as string | null) ?? null,
  lines: Array.isArray(r.lines) ? (r.lines as Record<string, unknown>[]).map(mapLine) : [],
});

export const nutritionStockApi = {
  async list(tab: NutritionStockTab = 'pending', date?: string): Promise<NutritionStockRequest[]> {
    if (!USE_BACKEND) return [];
    const rows = await beData(be.get<ApiResponse<Record<string, unknown>[]>>('/inventory/nutrition-requests', {
      params: { tab, ...(date ? { date } : {}) },
    }));
    return (rows ?? []).map(mapRow);
  },

  async issue(planId: number, date: string): Promise<NutritionStockRequest | null> {
    if (!USE_BACKEND) throw new Error('Chỉ dùng khi kết nối backend.');
    const day = asDate(date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error('Ngày cấp phải dạng yyyy-MM-dd.');
    const row = await beData(be.put<ApiResponse<Record<string, unknown> | null>>(
      `/inventory/nutrition-requests/${planId}/${day}/issue`,
    ));
    invalidate('inventory', 'stockTx', 'requisitions', 'tasks');
    return row ? mapRow(row) : null;
  },
};
