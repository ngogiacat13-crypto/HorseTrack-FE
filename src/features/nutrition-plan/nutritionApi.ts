import { be, beData, type ApiResponse } from '../../api/beClient';
import { invalidate } from '../../api/hybridAdapter';
import { type MealType, type PlanDraft, validateDraft } from './logic';

export interface FeedItem { itemId: number; itemCode: string; itemName: string; unit: string; availableStock: number; itemGroup?: string | null }
export interface PlanLine { detailId?: number; inventoryItemId: number; itemCode?: string | null; itemName?: string | null; unit?: string | null; mealType: MealType; quantity: number }
export interface NutritionPlan {
  planId: number; horseId: number; horseName: string; createdByName?: string | null; createdDate?: string | null; startDate: string; endDate: string;
  planType: 'STANDARD' | 'MEDICAL' | string; status: 'ACTIVE' | 'CANCELLED' | string; notes?: string | null; specialInstructions?: string | null; details: PlanLine[];
}
export interface TodayLine { mealType: MealType; inventoryItemName: string; quantity: number; inventoryItemId: number | null }

const toBody = (horseId: number, draft: PlanDraft) => ({
  horseId, startDate: draft.startDate, endDate: draft.endDate, notes: draft.notes.trim() || undefined,
  details: draft.lines.map((l) => ({ inventoryItemId: Number(l.itemId), mealType: l.mealType, quantity: Number(l.quantity) })),
});

const changed = () => invalidate('feedRequests', 'horses', 'requisitions', 'inventory');

export const nutritionApi = {
  feedItems: () => beData<FeedItem[]>(be.get('/nutrition-plans/feed-items')),

  listPlans: (horseId: number) => beData<NutritionPlan[]>(be.get('/nutrition-plans', { params: { horseId } })),

  today: (horseId: number) => beData<TodayLine[]>(be.get(`/horses/${horseId}/nutrition-plan/today`)),

  async create(horseId: number, draft: PlanDraft) {
    validateDraft(draft);
    const planId = await beData<number>(be.post('/nutrition-plans', toBody(horseId, draft)));
    changed();
    return planId;
  },

  getPlan: (planId: number) => beData<NutritionPlan>(be.get(`/nutrition-plans/${planId}`)),

  async update(planId: number, horseId: number, draft: PlanDraft) {
    const latest = await nutritionApi.getPlan(planId);
    validateDraft(draft, latest.startDate);
    if (latest.status !== 'ACTIVE') throw new Error('Thực đơn này không còn hiệu lực, tải lại để xem thực đơn mới.');
    const plan = await beData<NutritionPlan>(be.put(`/nutrition-plans/${planId}`, toBody(horseId, draft)));
    changed();
    return plan;
  },

  async sendFeedTasks(planId: number) {
    const res = await be.post<ApiResponse<number>>(`/nutrition-plans/${planId}/feed-tasks`);
    invalidate('tasks');
    return res.data.message || (res.data.data
      ? `Đã gửi ${res.data.data} việc cho ăn cho Mã phu.`
      : 'Đã gửi kho, chờ kho cấp thức ăn.');
  },

  async cancel(planId: number) {
    await be.put(`/nutrition-plans/${planId}/cancel`);
    changed();
  },
};
