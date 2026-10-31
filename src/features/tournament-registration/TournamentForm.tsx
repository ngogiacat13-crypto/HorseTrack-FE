import React, { useState } from 'react';
import { HORSE_BREEDS } from '../../api/ownerApi';
import { useActor } from '../../auth/AuthContext';
import { useAction } from '../../hooks/useAction';
import { Callout, Dialog } from '../../components/ui/Ht';
import { Icon } from '../../components/ui/Icon';
import { MAX_PRIZE_RANKS, MIN_DAYS_BEFORE_RACE, MIN_DEADLINE_GAP_DAYS, MIN_PRIZE_RANKS, shiftDay, validateTournament, withPrizeRanks } from './logic';
import { todayIso, tournamentApi } from './tournamentApi';
import type { Prize, RaceTournament, TournamentDraft } from './types';

const EMPTY: TournamentDraft = {
  name: '', organizer: '', location: '', raceDate: '', registrationDeadline: '', distanceM: 1200, entryFee: Number.NaN, slots: 8,
  minAgeYears: null, maxAgeYears: null, minWeightKg: null, maxWeightKg: null, allowedBreeds: [], prizes: withPrizeRanks([]), note: '',
};

const fromTournament = (t: RaceTournament): TournamentDraft => ({
  name: t.name, organizer: t.organizer, location: t.location, raceDate: t.raceDate, registrationDeadline: t.registrationDeadline,
  distanceM: t.distanceM, entryFee: t.entryFee, slots: t.slots, minAgeYears: t.minAgeYears, maxAgeYears: t.maxAgeYears,
  minWeightKg: t.minWeightKg, maxWeightKg: t.maxWeightKg, allowedBreeds: [...t.allowedBreeds], prizes: withPrizeRanks(t.prizes), note: t.note ?? '',
});

const optionalNumber = (v: string) => (v.trim() === '' ? null : Number(v));
const vndText = (n: number) => (Number.isFinite(n) ? n.toLocaleString('vi-VN') : '');
const parseVnd = (v: string) => {
  const digits = v.replace(/\D/g, '');
  return digits ? Number(digits) : Number.NaN;
};
const selectAll = (e: React.MouseEvent<HTMLInputElement>) => e.currentTarget.select();

const MoneyInput: React.FC<{ id?: string; testId: string; label?: string; value: number; onChange: (n: number) => void; invalid?: boolean }> = ({ id, testId, label, value, onChange, invalid }) => (
  <div style={{ position: 'relative' }}>
    <input id={id} aria-label={label} data-testid={testId} className="ht-input" inputMode="numeric" autoComplete="off" placeholder="VD: 5.000.000"
      value={vndText(value)} onChange={(e) => onChange(parseVnd(e.target.value))} onDoubleClick={selectAll} aria-invalid={invalid || undefined} style={{ paddingRight: 56 }} />
    <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>VND</span>
  </div>
);

export const TournamentForm: React.FC<{ tournament?: RaceTournament; onClose: () => void; onDone: () => void }> = ({ tournament, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const [d, setD] = useState<TournamentDraft>(tournament ? fromTournament(tournament) : EMPTY);
  const [tried, setTried] = useState(false);
  const today = todayIso();
  const errors = validateTournament(d, today, tournament);
  const set = (patch: Partial<TournamentDraft>) => setD((x) => ({ ...x, ...patch }));
  const setPrize = (i: number, patch: Partial<Prize>) => set({ prizes: d.prizes.map((p, k) => (k === i ? { ...p, ...patch } : p)) });
  const toggleBreed = (b: string) => set({ allowedBreeds: d.allowedBreeds.includes(b) ? d.allowedBreeds.filter((x) => x !== b) : [...d.allowedBreeds, b] });
  const allBreeds = HORSE_BREEDS.every((b) => d.allowedBreeds.includes(b));
  const err = (k: keyof TournamentDraft) => tried && errors[k] && <div className="ht-error"><Icon name="alert" /><span>{errors[k]}</span></div>;
  const bad = (k: keyof TournamentDraft) => (tried && !!errors[k]) || undefined;
  const earliestRace = shiftDay(today, MIN_DAYS_BEFORE_RACE);
  const latestDeadline = d.raceDate ? shiftDay(d.raceDate, -MIN_DEADLINE_GAP_DAYS) : undefined;

  const save = async () => {
    setTried(true);
    if (Object.keys(errors).length) return;
    if (await run(() => tournamentApi.saveTournament(d, actor, tournament), tournament ? `Đã cập nhật ${d.name}.` : `Đã nhập ${d.name} (bản nháp).`)) onDone();
  };

  const text = (key: 'name' | 'organizer' | 'location', label: string, placeholder: string) => (
    <div className="ht-field">
      <label className="ht-label" htmlFor={`tf-${key}`}>{label}<span className="ht-req">*</span></label>
      <input id={`tf-${key}`} data-testid={`tournament-${key}`} className="ht-input" value={d[key]} onChange={(e) => set({ [key]: e.target.value })} placeholder={placeholder} aria-invalid={bad(key)} />
      {err(key)}
    </div>
  );
  const num = (key: 'distanceM' | 'slots', label: string) => (
    <div className="ht-field">
      <label className="ht-label" htmlFor={`tf-${key}`}>{label}<span className="ht-req">*</span></label>
      <input id={`tf-${key}`} data-testid={`tournament-${key}`} type="number" min={0} className="ht-input" value={Number.isFinite(d[key]) ? d[key] : ''} onChange={(e) => set({ [key]: e.target.value === '' ? Number.NaN : Number(e.target.value) })} onDoubleClick={selectAll} aria-invalid={bad(key)} />
      {err(key)}
    </div>
  );
  const range = (key: 'minAgeYears' | 'maxAgeYears' | 'minWeightKg' | 'maxWeightKg', label: string, placeholder: string) => (
    <div className="ht-field">
      <label className="ht-label" htmlFor={`tf-${key}`}>{label}<span className="ht-req">*</span></label>
      <input id={`tf-${key}`} data-testid={`tournament-${key}`} type="number" min={1} className="ht-input" value={d[key] ?? ''} onChange={(e) => set({ [key]: optionalNumber(e.target.value) })} onDoubleClick={selectAll} placeholder={placeholder} aria-invalid={bad(key)} />
      {err(key)}
    </div>
  );

  return (
    <Dialog open onClose={onClose} busy={busy} icon="trend" tone="brand" width={760} testId="tournament-form-dialog"
      title={tournament ? `Sửa giải đấu · ${tournament.name}` : 'Nhập giải đấu'}
      sub="Nhập giải do ban tổ chức bên ngoài công bố để chủ ngựa biết và đề xuất tham gia. Hệ thống lọc ngựa đủ điều kiện theo tiêu chí bên dưới. Lưu xong là bản nháp, bấm “Công bố” để chủ ngựa thấy."
      confirmLabel={tournament ? 'Lưu thay đổi' : 'Lưu bản nháp'} onConfirm={save}>
      <div style={{ maxHeight: 'calc(100vh - 260px)', overflowY: 'auto', paddingRight: 4 }} data-testid="tournament-form-body">
        {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
        {tried && Object.keys(errors).length > 0 && <Callout tone="danger" testId="tournament-form-missing" style={{ marginBottom: 14 }}>Vui lòng nhập đủ và đúng các thông tin được đánh dấu.</Callout>}
        {text('name', 'Tên giải', 'VD: Giải Mở rộng Bình Dương 2026')}
        <div className="ht-grid-2">
          {text('organizer', 'Ban tổ chức', 'VD: CLB Đua ngựa Bình Dương')}
          {text('location', 'Địa điểm', 'VD: Trường đua Đại Nam')}
        </div>
        <div className="ht-grid-2">
          <div className="ht-field">
            <label className="ht-label" htmlFor="tf-raceDate">Ngày thi đấu<span className="ht-req">*</span></label>
            <input id="tf-raceDate" data-testid="tournament-raceDate" type="date" className="ht-input" value={d.raceDate} min={earliestRace} onChange={(e) => set({ raceDate: e.target.value })} aria-invalid={bad('raceDate')} />
            <span className="ht-hint">Sau hôm nay ít nhất {MIN_DAYS_BEFORE_RACE} ngày.</span>
            {err('raceDate')}
          </div>
          <div className="ht-field">
            <label className="ht-label" htmlFor="tf-deadline">Hạn đăng ký<span className="ht-req">*</span></label>
            <input id="tf-deadline" data-testid="tournament-registrationDeadline" type="date" className="ht-input" value={d.registrationDeadline} min={today} max={latestDeadline} onChange={(e) => set({ registrationDeadline: e.target.value })} aria-invalid={bad('registrationDeadline')} />
            <span className="ht-hint">Trước ngày thi đấu ít nhất {MIN_DEADLINE_GAP_DAYS} ngày.</span>
            {err('registrationDeadline')}
          </div>
        </div>
        <div className="ht-grid-2">
          {num('distanceM', 'Cự ly (m)')}
          {num('slots', 'Số suất')}
        </div>
        <div className="ht-field">
          <label className="ht-label" htmlFor="tf-entryFee">Lệ phí (VND)<span className="ht-req">*</span></label>
          <MoneyInput id="tf-entryFee" testId="tournament-entryFee" value={d.entryFee} onChange={(n) => set({ entryFee: n })} invalid={bad('entryFee')} />
          <span className="ht-hint">Gõ số, hệ thống tự thêm dấu chấm phân cách. Giải miễn phí nhập 0.</span>
          {err('entryFee')}
        </div>
        <div className="ht-grid-2">
          {range('minAgeYears', 'Tuổi tối thiểu', 'VD: 3')}
          {range('maxAgeYears', 'Tuổi tối đa', 'VD: 8')}
        </div>
        <div className="ht-grid-2">
          {range('minWeightKg', 'Cân nặng tối thiểu (kg)', 'VD: 420')}
          {range('maxWeightKg', 'Cân nặng tối đa (kg)', 'VD: 560')}
        </div>
        <div className="ht-field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span className="ht-label">Giống được nhận<span className="ht-req">*</span></span>
            <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" data-testid="tournament-breed-all" onClick={() => set({ allowedBreeds: allBreeds ? [] : [...HORSE_BREEDS] })}>{allBreeds ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 8 }}>
            {HORSE_BREEDS.map((b) => (
              <label key={b} className="ht-check"><input type="checkbox" data-testid={`tournament-breed-${b.replace(/\s+/g, '-')}`} checked={d.allowedBreeds.includes(b)} onChange={() => toggleBreed(b)} />{b}</label>
            ))}
          </div>
          {err('allowedBreeds')}
        </div>
        <div className="ht-field">
          <span className="ht-label">Giải thưởng (VND)<span className="ht-req">*</span></span>
          <span className="ht-hint" style={{ display: 'block', marginBottom: 8 }}>Mặc định hạng 1–{MIN_PRIZE_RANKS}; thêm được tới hạng {MAX_PRIZE_RANKS} nếu giải có.</span>
          {d.prizes.map((p, i) => {
            const removable = i === d.prizes.length - 1 && d.prizes.length > MIN_PRIZE_RANKS;
            return (
              <div key={p.rank} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 40px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <span className="ht-input" style={{ display: 'flex', alignItems: 'center', fontWeight: 600 }} data-testid={`tournament-prize-rank-${i}`}>Hạng {p.rank}</span>
                <MoneyInput testId={`tournament-prize-amount-${i}`} label={`Tiền thưởng hạng ${p.rank}`} value={p.amount} onChange={(n) => setPrize(i, { amount: n })} invalid={bad('prizes')} />
                {removable && <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" aria-label={`Xóa hạng ${p.rank}`} data-testid={`tournament-prize-remove-${i}`} onClick={() => set({ prizes: d.prizes.slice(0, -1) })}><Icon name="x" /></button>}
              </div>
            );
          })}
          {d.prizes.length < MAX_PRIZE_RANKS && (
            <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" data-testid="tournament-prize-add" onClick={() => set({ prizes: [...d.prizes, { rank: d.prizes.length + 1, amount: Number.NaN }] })}><Icon name="check" />Thêm hạng {d.prizes.length + 1}</button>
          )}
          {err('prizes')}
        </div>
        <div className="ht-field" style={{ margin: 0 }}>
          <label className="ht-label" htmlFor="tf-note">Ghi chú (không bắt buộc)</label>
          <textarea id="tf-note" data-testid="tournament-note" className="ht-textarea" style={{ minHeight: 56 }} value={d.note ?? ''} onChange={(e) => set({ note: e.target.value })} placeholder="VD: Nguồn thông tin, đường dẫn điều lệ của ban tổ chức" />
        </div>
      </div>
    </Dialog>
  );
};
