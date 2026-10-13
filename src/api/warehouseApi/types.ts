/* Data shapes of the WarehouseManager module (match db.json). */
import type { InventoryItem } from '../vetApi';

export interface Lot { lot: string; expiry: string; qty: number }
/** Inventory item with its lots (medicines / vaccines). Available = onHand − held (BR_08). */
export type StockItem = InventoryItem & { lots?: Lot[] };

export type TxType = 'RECEIVE' | 'ISSUE' | 'ADJUST' | 'HOLD' | 'RELEASE';
/** One line of the warehouse log (4.4). qty is signed for RECEIVE / ISSUE / ADJUST. */
export interface StockTx { id: string; at: string; type: TxType; itemId: string; item: string; qty: number; lot?: string; ref?: string; by: string; note: string; balance: number }

export type ShipmentStatus = 'ORDERED' | 'IN_TRANSIT' | 'DELAYED' | 'RECEIVED' | 'CANCELLED';
export interface ShipmentLine { itemId: string; name: string; unit: string; qty: number; received: number | null; lot: string | null; expiry: string | null }
export interface HistoryLine { at: string; who: string; text: string; tone?: 'danger' | 'warning' | 'success' | 'info' }
export interface ShipmentOrder {
  id: string; supplier: string; orderedAt: string; status: ShipmentStatus; eta: string; etaOld?: string; requiredBy?: string;
  /** What the order is for: a protocol (PD-…), a Groom requisition (RQ-…) or "bổ sung tồn". */
  forRef: string;
  /** One-line summary kept for the Club Manager monitor. */
  item: string;
  lines: ShipmentLine[]; history: HistoryLine[]; receivedAt?: string; cancelReason?: string;
}

export type ReqStatus = 'SUBMITTED' | 'CHECKING_STOCK' | 'APPROVED_FOR_ISSUE' | 'WAITING_RESTOCK' | 'REJECTED' | 'ISSUED' | 'CLOSED';
/** Non-medical supply request from a Groom (4.x). */
export interface Requisition {
  id: string; by: string; zone: string; itemId: string; item: string; unit: string; qty: number; reason: string; at: string; neededBy: string;
  status: ReqStatus; shipmentId?: string; rejectReason?: string; issued?: { qty: number; to: string; at: string; by: string };
  history: HistoryLine[];
}

export interface StockCheckLine { itemId: string; item: string; unit: string; system: number; counted: number; reason: string }
/** Monthly stock count record (1.5). */
export interface StockCheck { id: string; month: string; at: string; by: string; status: 'DONE'; note: string; lines: StockCheckLine[] }
