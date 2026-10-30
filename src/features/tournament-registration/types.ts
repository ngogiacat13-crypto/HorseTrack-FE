export type TournamentStatus = 'DRAFT' | 'PUBLISHED' | 'FINISHED';

export interface Prize { rank: number; amount: number }

export interface RaceTournament {
  id: string; beId?: number; name: string; organizer: string; location: string;
  raceDate: string; registrationDeadline: string; distanceM: number; entryFee: number; slots: number;
  minAgeYears: number | null; maxAgeYears: number | null; minWeightKg: number | null; maxWeightKg: number | null;
  allowedBreeds: string[]; prizes: Prize[]; status: TournamentStatus; note?: string;
}

export type TournamentDraft = Omit<RaceTournament, 'id' | 'beId' | 'status'>;

export type EntryStatus =
  | 'WAITLISTED' | 'WAITING_TRAINER' | 'WAITING_VET_EXAM' | 'WAITING_PAYMENT' | 'REGISTERED' | 'RESULTED'
  | 'TRAINER_REJECTED' | 'TRAINER_EXPIRED' | 'VET_FAILED' | 'VET_EXPIRED' | 'PAYMENT_EXPIRED' | 'OWNER_CANCELLED' | 'NO_SLOT';

export type RejectCode = 'NOT_READY' | 'HEALTH_RISK' | 'SCHEDULE_CONFLICT' | 'DISTANCE_MISMATCH' | 'OTHER';

export interface EntryHistory { at: string; who: string; text: string; tone?: 'success' | 'danger' | 'warning' | 'info' }

export interface Complaint {
  reason: string; at: string; status: 'OPEN' | 'ACCEPTED' | 'REJECTED';
  decidedBy?: string; decidedAt?: string; decisionNote?: string;
}

export interface RaceEntry {
  id: string; beId?: number; tournamentId: string; horseId: string; horseName: string; owner: string; trainerId?: string;
  status: EntryStatus; createdAt: string; stageDeadline: string | null; queuePosition: number | null;
  trainerDecision: null | { approve: boolean; reasonCode?: RejectCode; note?: string; by: string; at: string };
  vetResult: null | { pass: boolean; note: string; by: string; at: string };
  invoiceId: string | null;
  complaint: Complaint | null;
  result: null | { rank: number; finishTime: string; prize: number };
  history: EntryHistory[];
}

export interface HorseEligibility { horseId: string; horseName: string; eligible: boolean; reasons: string[]; formScore: number }

export interface OwnerTournament {
  tournament: RaceTournament; eligible: boolean; horses: HorseEligibility[];
  myProposal: RaceEntry | null; slotsLeft: number; queueLength: number;
}

export interface Dossier {
  entryId: string; tournament: RaceTournament; horse: { id: string; name: string; breed: string; sex?: string; age: number; weightKg: number | null };
  owner: string; trainer: string; vetResult: RaceEntry['vetResult']; paidAt: string | null; generatedAt: string;
}
