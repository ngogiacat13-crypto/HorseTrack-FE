import type { InventoryItem } from '../vetApi';

export interface Lot { lot: string; expiry: string; qty: number }
export type StockItem = InventoryItem & { lots?: Lot[] };

export type TxType = 'RECEIVE' | 'ISSUE' | 'ADJUST' | 'HOLD' | 'RELEASE';
export interface StockTx { id: string; at: string; type: TxType; itemId: string; item: string; qty: number; lot?: string; ref?: string; by: string; note: string; balance: number }

export type ShipmentStatus = 'ORDERED' | 'IN_TRANSIT' | 'DELAYED' | 'RECEIVED' | 'CANCELLED';
export interface ShipmentLine { itemId: string; name: string; unit: string; qty: number; received: number | null; lot: string | null; expiry: string | null }
export interface HistoryLine { at: string; who: string; text: string; tone?: 'danger' | 'warning' | 'success' | 'info' }
export interface ShipmentOrder {
  id: string; supplier: string; orderedAt: string; status: ShipmentStatus; eta: string; etaOld?: string; requiredBy?: string;
  forRef: string;
  item: string;
  lines: ShipmentLine[]; history: HistoryLine[]; receivedAt?: string; cancelReason?: string;
}

export type ReqStatus = 'SUBMITTED' | 'CHECKING_STOCK' | 'APPROVED_FOR_ISSUE' | 'WAITING_RESTOCK' | 'REJECTED' | 'ISSUED' | 'CLOSED';
export interface Requisition {
  id: string; by: string; zone: string; itemId: string; item: string; unit: string; qty: number; reason: string; at: string; neededBy: string;
  status: ReqStatus; shipmentId?: string; rejectReason?: string; issued?: { qty: number; to: string; at: string; by: string };
  history: HistoryLine[];
}

export interface StockCheckLine { itemId: string; item: string; unit: string; system: number; counted: number; reason: string }
export interface StockCheck { id: string; month: string; at: string; by: string; status: 'DONE'; note: string; lines: StockCheckLine[] }
