import React from 'react';
import { Badge, Timeline, money } from '../../components/ui/Ht';
import { ENTRY_LABEL, TOURNAMENT_LABEL } from './labels';
import { countdown, criteriaText, fmtDate, fmtDateTime } from './logic';
import { clockNow } from './tournamentApi';
import type { EntryStatus, RaceEntry, RaceTournament, TournamentStatus } from './types';

export const EntryBadge: React.FC<{ status: EntryStatus; statusLabel?: string }> = ({ status, statusLabel }) => <Badge tone={ENTRY_LABEL[status][1]}>{statusLabel || ENTRY_LABEL[status][0]}</Badge>;
export const TournamentBadge: React.FC<{ status: TournamentStatus; raceEnded?: boolean }> = ({ status, raceEnded }) =>
  status === 'PUBLISHED' && raceEnded
    ? <Badge tone="info">Chờ nhập kết quả</Badge>
    : <Badge tone={TOURNAMENT_LABEL[status][1]}>{TOURNAMENT_LABEL[status][0]}</Badge>;

export const Deadline: React.FC<{ entry: RaceEntry; testId?: string }> = ({ entry, testId }) => {
  if (!entry.stageDeadline) return <span className="sub">—</span>;
  const left = countdown(entry.stageDeadline, clockNow());
  const late = left === 'đã quá hạn';
  return (
    <span data-testid={testId}>
      <span className="ht-mono">{fmtDateTime(entry.stageDeadline)}</span>
      <span className="sub" style={{ display: 'block', color: late ? 'var(--danger-ink)' : undefined }}>{left}</span>
    </span>
  );
};

export const TournamentFacts: React.FC<{ t: RaceTournament }> = ({ t }) => (
  <dl className="ht-kv">
    <dt>Ban tổ chức</dt><dd>{t.organizer}</dd>
    <dt>Ngày thi đấu</dt><dd className="ht-mono">{fmtDate(t.raceDate)}</dd>
    <dt>Địa điểm</dt><dd>{t.location}</dd>
    <dt>Cự ly</dt><dd>{t.distanceM} m</dd>
    <dt>Hạn đăng ký</dt><dd className="ht-mono">{fmtDate(t.registrationDeadline)}</dd>
    <dt>Lệ phí</dt><dd>{t.entryFee ? money(t.entryFee) : 'Miễn phí'}</dd>
    <dt>Số suất</dt><dd>{t.slots}</dd>
    <dt>Điều kiện</dt><dd>{criteriaText(t)}</dd>
    <dt>Giải thưởng</dt><dd>{t.prizes.length ? t.prizes.map((p) => `Hạng ${p.rank}: ${money(p.amount)}`).join(' · ') : '—'}</dd>
  </dl>
);

export const EntryTimeline: React.FC<{ entry: RaceEntry }> = ({ entry }) => (
  <Timeline items={entry.history.map((h) => ({ tone: h.tone, what: <><b>{h.who}</b> {h.text}</>, when: fmtDateTime(h.at) }))} />
);
