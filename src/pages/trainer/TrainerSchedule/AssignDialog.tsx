import React, { useState } from 'react';
import { trainerApi, trainingBlock, type Groom, TrainingSession } from '../../../api/trainerApi';
import { USE_BACKEND } from '../../../api/beClient';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Callout, Dialog } from '../../../components/ui/Ht';
import { DEMO_NOW } from '../../../api/http';
import { METRICS, TODAY, dmyToIso, dowOf, isoToDmy } from './constants';

type Schedule = Awaited<ReturnType<typeof trainerApi.getSchedule>>;
const selectStyle: React.CSSProperties = { height: 44 };

export const AssignDialog: React.FC<{ data: Schedule; onClose: () => void; onDone: (s: TrainingSession) => void }> = ({ data, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, setError, run } = useAction();
  const [form, setForm] = useState({ zone: '', horseId: '', date: TODAY, time: '09:00', groom: '', groomId: '', track: 'đường cát 1200 m', metrics: [METRICS[0], METRICS[1]] });
  const runningPlans = data.plans.filter((p) => p.status === 'PLANNED' || p.status === 'ACTIVE');
  const activePlanHorses = new Set(runningPlans.map((p) => p.horseId));
  const zoneHorses = form.zone ? data.horses.filter((h) => data.zoneOf(h) === form.zone) : [];
  const [beGrooms, setBeGrooms] = useState<{ planId: string; list: Groom[] | null; error: string }>({ planId: '', list: null, error: '' });
  const zoneGrooms = USE_BACKEND ? beGrooms.list ?? [] : form.zone ? data.grooms.filter((g) => g.zones.includes(form.zone)) : [];
  const pickGroom = (g?: Groom) => ({ groom: g?.name ?? '', groomId: g?.id ?? '' });

  const pickZone = (zone: string) => {
    const grooms = data.grooms.filter((g) => g.zones.includes(zone));
    setForm({ ...form, zone, horseId: '', ...pickGroom(!USE_BACKEND && grooms.length === 1 ? grooms[0] : undefined) });
    setBeGrooms({ planId: '', list: null, error: '' });
    setError('');
  };

  const pickHorse = async (horseId: string) => {
    setForm((f) => ({ ...f, horseId, ...pickGroom() }));
    if (!USE_BACKEND) return;
    const planId = runningPlans.find((p) => p.horseId === horseId)?.id ?? '';
    setBeGrooms({ planId, list: null, error: '' });
    if (!planId) return;
    try {
      const list = await trainerApi.getAssignableGrooms(planId);
      setBeGrooms((s) => (s.planId === planId ? { planId, list, error: '' } : s));
      if (list.length === 1) setForm((f) => (f.horseId === horseId ? { ...f, ...pickGroom(list[0]) } : f));
    } catch (e) {
      setBeGrooms((s) => (s.planId === planId ? { planId, list: [], error: (e as Error).message } : s));
    }
  };
  const groomPlaceholder = !form.zone ? '— Chọn khu trước —'
    : USE_BACKEND && !form.horseId ? '— Chọn ngựa trước —'
      : USE_BACKEND && beGrooms.list === null ? 'Đang tải Mã phu…'
        : zoneGrooms.length ? '— Chọn Mã phu —' : `Chưa có Mã phu phụ trách ${form.zone}`;

  const assign = async () => {
    if (!form.zone) { setError('Chọn khu chuồng.'); return; }
    if (!form.horseId) { setError('Chọn ngựa.'); return; }
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(form.date)) { setError('Chọn ngày tập.'); return; }
    if (dmyToIso(form.date) < dmyToIso(TODAY)) { setError('Không xếp phiên vào ngày đã qua.'); return; }
    if (!/^\d{2}:\d{2}$/.test(form.time)) { setError('Giờ theo dạng HH:mm.'); return; }
    if (form.date === TODAY && form.time <= DEMO_NOW.time) { setError(`Hôm nay đã qua ${DEMO_NOW.time} — chọn giờ muộn hơn hoặc ngày khác.`); return; }
    if (!form.groom) { setError('Chọn Mã phu thực hiện.'); return; }
    if (form.metrics.length === 0) { setError('Chọn ít nhất 1 chỉ số cần ghi nhận.'); return; }
    let created: TrainingSession | null = null;
    const ok = await run(async () => { created = await trainerApi.assignSession(form, actor); });
    if (ok && created) onDone(created);
  };

  return (
    <Dialog open testId="assign-session-dialog" onClose={onClose} icon="calendar" tone="brand" width={600} busy={busy} busyLabel="Đang phân công…"
      title="Phân công phiên tập" sub="Chọn khu chuồng → ngựa trong khu → Mã phu phụ trách khu. Phiên dùng giai đoạn hiện tại của giáo án; ngựa bị khóa y tế không thể xếp lịch (BR_01)."
      confirmLabel="Gửi cho Mã phu" onConfirm={assign}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      <div className="ht-grid-2">
        <div className="ht-field">
          <label className="ht-label" htmlFor="as-zone">Khu chuồng<span className="ht-req">*</span></label>
          <select id="as-zone" data-testid="assign-zone-select" className="ht-select" style={selectStyle} value={form.zone} onChange={(e) => pickZone(e.target.value)}>
            <option value="">— Chọn khu —</option>
            {data.zones.map((z) => <option key={z} value={z}>{z} · {data.horses.filter((h) => data.zoneOf(h) === z).length} ngựa</option>)}
          </select>
        </div>
        <div className="ht-field">
          <label className="ht-label" htmlFor="as-horse">Ngựa<span className="ht-req">*</span></label>
          <select id="as-horse" data-testid="assign-horse-select" className="ht-select" style={selectStyle} value={form.horseId} disabled={!form.zone} onChange={(e) => pickHorse(e.target.value)}>
            <option value="">{form.zone ? `— Chọn ngựa ${form.zone} —` : '— Chọn khu trước —'}</option>
            {zoneHorses.map((h) => {
              const why = trainingBlock(h) ? 'đang khóa tập' : !activePlanHorses.has(h.id) ? 'chưa có giáo án' : '';
              return <option key={h.id} value={h.id} disabled={!!why}>{h.name} · {h.stall}{why ? ` — ${why}` : ''}</option>;
            })}
          </select>
        </div>
      </div>
      <div className="ht-grid-2">
        <div className="ht-field">
          <label className="ht-label" htmlFor="as-date">Ngày{form.date && <span style={{ fontWeight: 400, color: 'var(--muted-foreground)' }}> · {dowOf(form.date)}{form.date === TODAY ? ' · hôm nay' : ''}</span>}</label>
          <input id="as-date" data-testid="assign-date-input" type="date" className="ht-input" style={selectStyle} min={dmyToIso(TODAY)} value={dmyToIso(form.date)}
            onChange={(e) => setForm({ ...form, date: e.target.value ? isoToDmy(e.target.value) : '' })} />
        </div>
        <div className="ht-field">
          <label className="ht-label" htmlFor="as-time">Giờ</label>
          <input id="as-time" data-testid="assign-time-input" type="time" className="ht-input" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
        </div>
      </div>
      <div className="ht-grid-2">
        <div className="ht-field">
          <label className="ht-label" htmlFor="as-groom">Mã phu<span className="ht-req">*</span></label>
          <select id="as-groom" data-testid="assign-groom-select" className="ht-select" style={selectStyle} value={form.groomId} disabled={!form.zone || (USE_BACKEND && !zoneGrooms.length)}
            onChange={(e) => setForm({ ...form, ...pickGroom(zoneGrooms.find((g) => g.id === e.target.value)) })}>
            <option value="">{groomPlaceholder}</option>
            {zoneGrooms.map((g) => <option key={g.id} value={g.id}>{g.name} · {g.zones.join(', ')}</option>)}
          </select>
          {USE_BACKEND && beGrooms.error && <div className="ht-error" role="alert">{beGrooms.error}</div>}
        </div>
        <div className="ht-field">
          <label className="ht-label" htmlFor="as-track">Đường tập</label>
          <input id="as-track" data-testid="assign-track-input" className="ht-input" value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value })} />
        </div>
      </div>
      <fieldset className="ht-field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="ht-label" style={{ marginBottom: 6 }}>Chỉ số Mã phu cần ghi nhận</legend>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {METRICS.map((m) => (
            <label key={m} className="ht-check">
              <input type="checkbox" checked={form.metrics.includes(m)}
                onChange={(e) => setForm({ ...form, metrics: e.target.checked ? [...form.metrics, m] : form.metrics.filter((x) => x !== m) })} /> {m}
            </label>
          ))}
        </div>
      </fieldset>
    </Dialog>
  );
};
