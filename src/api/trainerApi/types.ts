export type HealthStatus = 'HEALTHY' | 'WATCH' | 'INJURED' | 'QUARANTINE';
export interface Injury { id?: string; part: string; severity: string; date: string; vet: string; note: string; x: number; y: number; caseId?: string }
export interface Horse {
  id: string; name: string; breed: string; sex: '♂' | '♀'; age: number; owner: string; stall: string;
  trainerId: string;
  health: HealthStatus; trainingLocked: boolean; form: 'GOOD' | null; pendingCase: string | null;
  lock: { by: string; at: string; reason: string; review: string } | null;
  injuries: Injury[];
  medicalHistory: { date: string; title: string; tone: 'danger' | 'warning' | 'success' }[];
  raceResults?: { date: string; race: string; distance: string; rank: number; field: number; time: string }[];
}

export type Intensity = 'Nhẹ' | 'Vừa' | 'Cao';
export interface PlanPhase { no: number; name: string; weeks: number; intensity: Intensity; distanceM: number; sessionsPerWeek: number; hrLimit: number; estimated?: boolean }
export type PlanStatus = 'PLANNED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'REPLACED' | 'CANCELLED';
export interface TrainingPlan {
  id: string; horseId: string; horseName: string;
  name: string;
  type: string; goal: string; phases: PlanPhase[];
  currentPhase: number; week: number; status: PlanStatus; startDate: string; createdBy: string; pausedReason?: string;
}

export type SessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'PAUSED_PENDING_TRAINER' | 'RESUMED' | 'STOPPED' | 'COMPLETED';
export interface Reading { t: string; hr: number; speed: number }
export interface TrainingSession {
  id: string; horseId: string; horseName: string; planId: string; phaseNo: number; label: string;
  date: string; time: string; groom: string; track: string; status: SessionStatus; confirmed?: boolean; cancelled?: boolean;
  thresholds: { hr: number; speed: number };
  readings: Reading[]; recovery?: Reading[];
  pausedAt?: string; pausedReason?: string;
  metrics?: string[];
  alerts?: { to: string; role: string; channel: string; at: string; seen: boolean }[];
  decision: null | {
    type: 'STOP_VET' | 'ADJUST_CONTINUE'; by: string; at: string; note: string; caseId?: string;
    adjustment?: { intensity: Intensity; distanceM: number; hrLimit: number };
  };
  evaluation: null | { score: number; comment: string; by: string; at: string };
}

export interface Tournament {
  id: string; name: string; organizer: string; date: string; venue: string; distance: string;
  deadline: string; conditions: string; source: string; finished?: boolean;
}
export type ProposalStatus =
  | 'PROPOSED' | 'WAITING_VET_EXAM' | 'VET_FAILED' | 'WAITING_OWNER' | 'OWNER_DECLINED'
  | 'READY_TO_SUBMIT' | 'SUBMITTED' | 'REJECTED_BY_ORGANIZER' | 'RESULT_RECORDED';
export interface RaceProposal {
  id: string; beId?: number; horseId: string; horseName: string; owner: string; tournamentId: string; status: ProposalStatus;
  createdAt: string; createdBy: string; note?: string;
  history: { at: string; who: string; text: string; tone?: 'success' | 'danger' | 'warning' | 'info' }[];
  vetResult: null | { pass: boolean; by: string; at: string; note: string; conditions?: string };
  ownerResponse: null | { agree: boolean; at: string; reason?: string };
  result: null | { rank: number; time: string; note?: string };
  organizerReason?: string;
}
export interface Vaccination {
  id: string; horseId: string; horse: string; type: string; due: string; status: 'DUE_SOON' | 'SCHEDULED' | 'POSTPONED' | 'DONE'; note?: string;
  kind?: 'VACCINE' | 'DEWORM'; cycleMonths?: number; doneAt?: string; lot?: string; by?: string;
  itemId?: number | null; itemName?: string | null; dosePerHorse?: number | null;
  requisitionCode?: string | null; requisitionStatus?: string | null; requisitionRejectReason?: string | null;
  canExecute?: boolean | null; executeBlockedReason?: string | null;
}
export interface Stall {
  id: string; zone: string; horseId: string | null; horse: string | null; status: 'CLEAN' | 'NEEDS_CLEANING' | 'MAINTENANCE'; groom: string;
  otherTrainer?: boolean;
}
export interface Groom { id: string; name: string; zones: string[] }
