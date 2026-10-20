// ==================== API — QUẢN LÝ KHO (WarehouseManager) ====================
// The warehouse checks, holds, dispenses and receives stock; it never diagnoses or changes a protocol (BR_07).
//  - BR_08: on hand vs held vs available; alert when available < safety threshold.
//  - Protocol stock answer: enough → hold + STOCK_AVAILABLE; short → STOCK_SHORTAGE with a real ETA or "chưa xác định".
//  - Dispense only READY_FOR_DISPENSING protocols (confirmed by the vet). Late shipments warn the vet (DELAYED_MEDICINE).
//  - Every stock movement is written to the warehouse log (stockTx) and the audit log (BR_10).
import { inventoryApi } from './inventoryApi';
import { medicalApi } from './medicalApi';
import { shipmentsApi } from './shipmentsApi';
import { requisitionsApi } from './requisitionsApi';
import { checksApi } from './checksApi';
import { USE_BACKEND } from '../beClient';
import { warehouseBe } from '../beActions';

export * from './types';
export * from './labels';
export { needs, previewStock, WAREHOUSE_STATES } from './medicalApi';
export type { MoveKind } from './inventoryApi';

const base = { ...inventoryApi, ...medicalApi, ...shipmentsApi, ...requisitionsApi, ...checksApi };
// dev:be → every warehouse action goes to /api/v1/inventory/... (the backend moves the stock itself)
export const warehouseApi: typeof base = USE_BACKEND ? { ...base, ...warehouseBe } : base;
