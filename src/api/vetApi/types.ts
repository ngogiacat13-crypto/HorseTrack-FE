import type { ProtocolState } from '../managerApi';
import type { HealthStatus, Horse } from '../trainerApi';

export type CaseSource = 'SESSION_STOP' | 'GROOM_REPORT' | 'TRAINER_REQUEST';
export type Severity = 'HIGH' | 'MEDIUM' | 'LOW';
export type CaseStatus = 'NEW' | 'MONITORING' | 'CLOSED';
export interface CaseExam { symptoms: string; diagnosis: string; severity: Severity; plan: string; health: HealthStatus; by: string; at: string }
export interface VetCase {
  id: string; horseId: string; horse: string; source: CaseSource; sessionId?: string; type: string; severity: Severity;
  status: CaseStatus; sender: string; at: string; note: string;
  exam?: CaseExam | null; protocolId?: string | null; outcome?: string;
}

export interface InventoryItem {
  id: string; name: string; note?: string; category: string; unit: string; unitPrice: number; onHand: number; held: number; safety: number;
  group: string; route: string; brand?: string; doseRef?: string;
  detectionHours?: number;
  rx?: boolean; controlled?: boolean;
}
export interface ProtoItem { itemId: string; name: string; unit: string; unitPrice: number; qty: number }
export interface ProtoPhase { no: number; name: string; startDate: string; days: number; goal: string; items: ProtoItem[] }
export interface StockLine {
  itemId: string; name: string; unit: string; need: number; available: number; held: number; short: number;
  eta: string | null; lot: string | null; expiry: string | null; shipment?: string;
}
export interface Protocol {
  id: string; version: number; replaces: string | null; supersededBy: string | null;
  horseId: string; horse: string; caseId: string; diagnosis: string; vet: string; createdAt: string; requiredBy: string;
  phases: ProtoPhase[]; state: ProtocolState; path: ProtocolState[];
  stock: null | { at: string; by: string; lines: StockLine[] };
  wait: null | { eta: string; requiredBy: string; at: string; note: string };
  delayed: boolean;
  progress: { at: string; by: string; text: string }[];
  outcome: string | null;
  label: string; tone: 'danger' | 'info' | 'success' | 'neutral'; cost: number; trainingLocked?: boolean; open: boolean;
  alertState?: ProtocolState; materials: { item: string; status: string; tone: 'success' | 'danger' | 'neutral' }[]; note: string;
  log: { tone?: 'danger' | 'warning' | 'success'; who: string; text: string; at: string }[];
}
export interface Shipment { id: string; item: string; status: 'ORDERED' | 'IN_TRANSIT' | 'DELAYED' | 'RECEIVED' | 'CANCELLED'; etaOld?: string; eta: string; forRef: string }
export interface MedicalDiet { by: string; at: string; morning: string; noon: string; evening: string; special: string; note: string }
export interface FeedRequest {
  id: string; horseId: string; horse: string; item: string; reason: string; by: string; at: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED'; vetNote?: string; decidedBy?: string; decidedAt?: string;
}
export type VetHorse = Horse & { medicalDiet: MedicalDiet | null };
