import { inventoryApi } from './inventoryApi';
import { medicalApi } from './medicalApi';
import { shipmentsApi } from './shipmentsApi';
import { requisitionsApi } from './requisitionsApi';
import { checksApi } from './checksApi';
import { nutritionStockApi } from './nutritionApi';
import { USE_BACKEND } from '../beClient';
import { warehouseBe } from '../beActions';

export * from './types';
export * from './labels';
export * from './nutritionApi';
export { needs, previewStock, WAREHOUSE_STATES } from './medicalApi';
export type { MoveKind } from './inventoryApi';

const base = {
  ...inventoryApi,
  ...medicalApi,
  ...shipmentsApi,
  ...requisitionsApi,
  ...checksApi,
  listNutritionRequests: nutritionStockApi.list,
  issueNutritionDay: nutritionStockApi.issue,
};
export const warehouseApi: typeof base = USE_BACKEND ? { ...base, ...warehouseBe } : base;
