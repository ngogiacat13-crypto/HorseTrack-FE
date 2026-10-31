import type { Invoice } from '../managerApi';
import type { Horse } from '../trainerApi';

export type LineKind = 'TRAIN' | 'STABLE' | 'MED' | 'PENALTY' | 'REACTIVATION' | 'RACE';
export interface InvoiceLine { label: string; kind: LineKind; period: string; amount: number; protocolId?: string; phaseNo?: number }

export type OwnerInvoice = Invoice & { horseId: string | null; issuedAt: string; service: string; lines: InvoiceLine[] };

export interface InvoiceDue {
  overdueDays: number;
  penalty: number;
  reactivationFee: number;
  total: number;
  group: 'UNPAID' | 'OVERDUE' | 'SUSPENDED' | 'PAID' | 'REFUNDED';
}

export type PaymentStatus = 'INIT' | 'PROCESSING' | 'PENDING_VERIFY' | 'VERIFIED' | 'FAILED';
export interface Payment {
  id: string; invoiceId: string; owner: string; horse: string; amount: number; method: 'VNPay';
  status: PaymentStatus; createdAt: string; verifiedAt: string | null; bankRef: string | null; note: string;
  breakdown?: { base: number; penalty: number; reactivationFee: number };
}

export type RaceResult = NonNullable<Horse['raceResults']>[number];

export interface NewRegistration {
  name: string; breed: string; sex: '♂' | '♀'; age: number; color: string; height: string; weight: number;
  passport: string; healthCert: string;
  phone: string;
  files: { ownership: UploadedDoc | null; health: UploadedDoc | null };
}
export interface UploadedDoc { name: string; size: number; type: string; file?: File }
