/* Data shapes of the HorseOwner module (match db.json). */
import type { Invoice } from '../managerApi';
import type { Horse } from '../trainerApi';

export type LineKind = 'TRAIN' | 'STABLE' | 'MED' | 'PENALTY' | 'REACTIVATION';
export interface InvoiceLine { label: string; kind: LineKind; period: string; amount: number }

/** Invoice as stored + the service lines added for the owner views. */
export type OwnerInvoice = Invoice & { horseId: string | null; issuedAt: string; service: string; lines: InvoiceLine[] };

/** What the owner has to pay now — computed from the demo clock (BR_12 / BR_13 / BR_14). */
export interface InvoiceDue {
  overdueDays: number;
  /** Fee for being late more than the grace period (BR_12). */
  penalty: number;
  /** Fee to reopen a suspended service (BR_14). */
  reactivationFee: number;
  total: number;
  group: 'UNPAID' | 'OVERDUE' | 'SUSPENDED' | 'PAID';
}

/**
 * One payment attempt through VNPay.
 * INIT → (gateway result) PENDING_VERIFY / FAILED / PROCESSING → (server IPN check) VERIFIED.
 * Only VERIFIED marks the invoice as paid.
 */
export type PaymentStatus = 'INIT' | 'PROCESSING' | 'PENDING_VERIFY' | 'VERIFIED' | 'FAILED';
export interface Payment {
  id: string; invoiceId: string; owner: string; horse: string; amount: number; method: 'VNPay';
  status: PaymentStatus; createdAt: string; verifiedAt: string | null; bankRef: string | null; note: string;
  breakdown?: { base: number; penalty: number; reactivationFee: number };
}

export type RaceResult = NonNullable<Horse['raceResults']>[number];

export interface NewRegistration {
  name: string; breed: string; sex: '♂' | '♀'; age: number; color: string; height: string; weight: number;
  microchip: string; passport: string; healthCert: string;
  phone: string; taxCode: string; billingAddress: string;
  files: { ownership: UploadedDoc | null; health: UploadedDoc | null; microchip: UploadedDoc | null };
}
export interface UploadedDoc { name: string; size: number; type: string }
