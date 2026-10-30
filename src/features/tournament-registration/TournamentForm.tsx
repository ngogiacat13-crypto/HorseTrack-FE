import React, { useState } from 'react';
import { HORSE_BREEDS } from '../../api/ownerApi';
import { useActor } from '../../auth/AuthContext';
import { useAction } from '../../hooks/useAction';
import { Callout, Dialog } from '../../components/ui/Ht';
import { Icon } from '../../components/ui/Icon';
import { validateTournament } from './logic';
import { todayIso, tournamentApi } from './tournamentApi';
import type { Prize, RaceTournament, TournamentDraft } from './types';

const EMPTY: TournamentDraft = {
  name: '', organizer: '', location: '', raceDate: '', registrationDeadline: '', distanceM: 1200, entryFee: 0, slots: 8,
  minAgeYears: 3, maxAgeYears: 8, minWeightKg: null, maxWeightKg: null, allowedBreeds: [], prizes: [{ rank: 1, amount: 0 }], note: '',
};

const fromTournament = (t: RaceTournament): TournamentDraft => ({
  name: t.name, organizer: t.organizer, location: t.location, raceDate: t.raceDate, registrationDeadline: t.registrationDeadline,
  distanceM: t.distanceM, entryFee: t.entryFee, slots: t.slots, minAgeYears: t.minAgeYears, maxAgeYears: t.maxAgeYears,
  minWeightKg: t.minWeightKg, maxWeightKg: t.maxWeightKg, allowedBreeds: [...t.allowedBreeds], prizes: t.prizes.map((p) => ({ ...p })), note: t.note ?? '',
});

const optionalNumber = (v: string) => (v.trim() === '' ? null : Number(v));

export const TournamentForm: React.FC<{ tournament?: RaceTournament; onClose: () => void; onDone: () => void }> = ({ tournament, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const [d, setD] = useState<TournamentDraft>(tournament ? fromTournament(tournament) : EMPTY);
  const [tried, setTried] = useState(false);
  const errors = validateTournament(d, todayIso());
  const set = (patch: Partial<TournamentDraft>) => setD((x) => ({ ...x, ...patch }));
  const setPrize = (i: number, patch: Partial<Prize>) => set({ prizes: d.prizes.map((p, k) => (k === i ? { ...p, ...patch } : p)) });
  const toggleBreed = (b: string) => set({ allowedBreeds: d.allowedBreeds.includes(b) ? d.allowedBreeds.filter((x) => x !== b) : [...d.allowedBreeds, b] });
  const err = (k: keyof TournamentDraft) => tried && errors[k] && <div className="ht-error"><Icon name="alert" /><span>{errors[k]}</span></div>;

  const save = async () => {
    setTried(true);
    if (Object.keys(errors).length) return;
    if (await run(() => tournamentApi.saveTournament(d, actor, tournament), tournament ? `Đã cập nhật ${d.name}.` : `Đã tạo ${d.name} (bản nháp).`)) onDone();
  };

  const text = (key: 'name' | 'organizer' | 'location', label: string, placeholder: string) => (
    <div className="ht-field">
      <label className="ht-label" htmlFor={`tf-${key}`}>{label}<span className="ht-req">*</span></label>
      <input id={`tf-${key}`} data-testid={`tournament-${key}`} className="ht-input" value={d[key]} onChange={(e) => set({ [key]: e.target.value })} placeholder={placeholder} />
      {err(key)}
    </div>
  );
  const num = (key: 'distanceM' | 'entryFee' | 'slots', label: string) => (
    <div className="ht-field">
      <label className="ht-label" htmlFor={`tf-${key}`}>{label}<span className="ht-req">*</span></label>
      <input id={`tf-${key}`} data-testid={`tournament-${key}`} type="number" min={0} className="ht-input" value={d[key]} onChange={(e) => set({ [key]: Number(e.target.value) })} />
      {err(key)}
    </div>
  );
  const optional = (key: 'minAgeYears' | 'maxAgeYears' | 'minWeightKg' | 'maxWeightKg', label: string) => (
    <div className="ht-field">
      <label className="ht-label" htmlFor={`tf-${key}`}>{label}</label>
      <input id={`tf-${key}`} data-testid={`tournament-${key}`} type="number" min={0} className="ht-input" value={d[key] ?? ''} onChange={(e) => set({ [key]: optionalNumber(e.target.value) })} placeholder="Không giới hạn" />
      {err(key)}
    </div>
  );

  return (
    <Dialog open onClose={onClose} busy={busy} icon="trend" tone="brand" width={760} testId="tournament-form-dialog"
      title={tournament ? `Sửa giải · ${tournament.name}` : 'Tạo giải đấu'}
      sub="Hệ thống lọc ngựa đủ điều kiện theo tiêu chí bên dưới. Tạo xong là bản nháp, bấm “Công bố” để chủ ngựa thấy."
      confirmLabel={tournament ? 'Lưu thay đổi' : 'Tạo bản nháp'} onConfirm={save}>
      <div style={{ maxHeight: 'calc(100vh - 260px)', overflowY: 'auto', paddingRight: 4 }} data-testid="tournament-form-body">
        {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
        {text('name', 'Tên giải', 'VD: Giải Mở rộng Bình Dương 2026')}
        <div className="ht-grid-2">
          {text('organizer', 'Ban tổ chức', 'VD: CLB Đua ngựa Bình Dương')}
          {text('location', 'Địa điểm', 'VD: Trường đua Đại Nam')}
        </div>
        <div className="ht-grid-2">
          <div className="ht-field">
            <label className="ht-label" htmlFor="tf-raceDate">Ngày thi đấu<span className="ht-req">*</span></label>
            <input id="tf-raceDate" data-testid="tournament-raceDate" type="date" className="ht-input" value={d.raceDate} min={todayIso()} onChange={(e) => set({ raceDate: e.target.value })} />
            {err('raceDate')}
          </div>
          <div className="ht-field">
            <label className="ht-label" htmlFor="tf-deadline">Hạn đăng ký<span className="ht-req">*</span></label>
            <input id="tf-deadline" data-testid="tournament-registrationDeadline" type="date" className="ht-input" value={d.registrationDeadline} min={todayIso()} max={d.raceDate || undefined} onChange={(e) => set({ registrationDeadline: e.target.value })} />
            {err('registrationDeadline')}
          </div>
        </div>
        <div className="ht-grid-2">
          {num('distanceM', 'Cự ly (m)')}
          {num('slots', 'Số suất')}
        </div>
        {num('entryFee', 'Lệ phí (₫)')}
        <div className="ht-grid-2">
          {optional('minAgeYears', 'Tuổi tối thiểu')}
          {optional('maxAgeYears', 'Tuổi tối đa')}
        </div>
        <div className="ht-grid-2">
          {optional('minWeightKg', 'Cân nặng tối thiểu (kg)')}
          {optional('maxWeightKg', 'Cân nặng tối đa (kg)')}
        </div>
        <div className="ht-field">
          <span className="ht-label">Giống được nhận (bỏ trống = mọi giống)</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
            {HORSE_BREEDS.map((b) => (
              <label key={b} className="ht-check"><input type="checkbox" data-testid={`tournament-breed-${b.replace(/\s+/g, '-')}`} checked={d.allowedBreeds.includes(b)} onChange={() => toggleBreed(b)} />{b}</label>
            ))}
          </div>
        </div>
        <div className="ht-field">
          <span className="ht-label">Giải thưởng</span>
          {d.prizes.map((p, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr auto', gap: 8, marginBottom: 8 }}>
              <input aria-label={`Hạng ${i + 1}`} data-testid={`tournament-prize-rank-${i}`} type="number" min={1} className="ht-input" value={p.rank} onChange={(e) => setPrize(i, { rank: Number(e.target.value) })} />
              <input aria-label={`Tiền thưởng ${i + 1}`} data-testid={`tournament-prize-amount-${i}`} type="number" min={0} className="ht-input" value={p.amount} onChange={(e) => setPrize(i, { amount: Number(e.target.value) })} />
              <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" data-testid={`tournament-prize-remove-${i}`} onClick={() => set({ prizes: d.prizes.filter((_, k) => k !== i) })}><Icon name="x" /></button>
            </div>
          ))}
          <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" data-testid="tournament-prize-add" onClick={() => set({ prizes: [...d.prizes, { rank: d.prizes.length + 1, amount: 0 }] })}><Icon name="check" />Thêm hạng</button>
          {err('prizes')}
        </div>
        <div className="ht-field" style={{ margin: 0 }}>
          <label className="ht-label" htmlFor="tf-note">Ghi chú</label>
          <textarea id="tf-note" data-testid="tournament-note" className="ht-textarea" style={{ minHeight: 56 }} value={d.note ?? ''} onChange={(e) => set({ note: e.target.value })} />
        </div>
      </div>
    </Dialog>
  );
};
