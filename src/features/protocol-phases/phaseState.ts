import type { Protocol } from '../../api/vetApi/types';

export type PhaseProgressStatus = 'WAITING_PAYMENT' | 'READY_TO_START' | 'IN_PROGRESS' | 'COMPLETED' | 'STOPPED';
export type PhasePaymentStatus = 'UNPAID' | 'PAID';
export interface PhaseProgress { phaseNo: number; status: PhaseProgressStatus; reason?: string }
export interface PhaseBilling { phaseNo: number; invoiceId: string | null; amount: number; status: PhasePaymentStatus; notice?: string }

const completedFromProgress = (p: Protocol) => new Set(p.progress.flatMap((entry) => {
  const match = entry.text.match(/(?:Hoàn thành giai đoạn|Hoàn tất GĐ)\s*(\d+)/i);
  return match ? [Number(match[1])] : [];
}));

export const phaseProgressOf = (p: Protocol): PhaseProgress[] => {
  if (p.phaseProgress?.length) return p.phaseProgress;
  const completed = completedFromProgress(p);
  return p.phases.map((phase, index) => ({
    phaseNo: phase.no,
    status: completed.has(phase.no) ? 'COMPLETED' : p.state === 'IN_TREATMENT' && index === 0 ? 'IN_PROGRESS' : 'WAITING_PAYMENT',
  }));
};

export const phaseBillingOf = (p: Protocol): PhaseBilling[] => p.phaseBilling?.length
  ? p.phaseBilling
  : p.phases.map((phase) => ({ phaseNo: phase.no, invoiceId: null, amount: phase.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0), status: 'UNPAID' }));

export const currentPhaseOf = (p: Protocol) => phaseProgressOf(p).find((phase) => phase.status === 'IN_PROGRESS')
  ?? phaseProgressOf(p).find((phase) => !['COMPLETED', 'STOPPED'].includes(phase.status));

export const phaseIsPaid = (p: Protocol, phaseNo: number) => phaseBillingOf(p).find((phase) => phase.phaseNo === phaseNo)?.status === 'PAID';
export const phaseIsDispensed = (p: Protocol, phaseNo: number) => {
  const phase = p.phases.find((item) => item.no === phaseNo);
  return !!phase && (phase.items.length === 0 || (p.dispensedPhases ?? []).includes(phaseNo));
};
export const phaseReadyToStart = (p: Protocol, phaseNo: number) => phaseIsPaid(p, phaseNo) && phaseIsDispensed(p, phaseNo);
