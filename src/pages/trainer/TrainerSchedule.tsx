import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SESSION_LABEL, trainerApi, trainingBlock, TrainingSession } from '../../api/trainerApi';
import type { ApiError } from '../../api/http';
import { useActor } from '../../auth/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { Icon } from '../../components/ui/Icon';
import { Badge, Callout, Dialog, PageHeader, Panel, Timeline, useToast } from '../../components/ui/Ht';
import { LoadState } from '../../components/trainer/TrainerParts';

/* Week of the demo clock (Mon 28/09 → Sun 04/10/2026). */
const WEEK = [
  ['T2', '28/09/2026'], ['T3', '29/09/2026'], ['T4', '30/09/2026'], ['T5', '01/10/2026'],
  ['T6', '02/10/2026'], ['T7', '03/10/2026'], ['CN', '04/10/2026'],
] as const;
const TODAY = '03/10/2026';
/* New sessions can be planned from today forward. */
const ASSIGN_DAYS = [['T7', '03/10/2026'], ['CN', '04/10/2026'], ['T2', '05/10/2026'], ['T3', '06/10/2026']] as const;
const METRICS = ['Nhịp tim (bpm)', 'Tốc độ (km/h)', 'Quãng đường (m)', 'Thời gian hồi phục'];
const timeKey = (s: TrainingSession) => s.time;

/* 1.3 Phân công lịch tập cho Groom · 1.4 Đánh giá phong độ sau buổi tập */
export const TrainerSchedule: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => trainerApi.getSchedule(actor), [actor]);
  const [day, setDay] = useState(TODAY);

  // Assign dialog
  const [assignOpen, setAssignOpen] = useState(false);
  const [form, setForm] = useState({ zone: '', horseId: '', date: '04/10/2026', time: '09:00', groom: '', track: 'đường cát 1200 m', metrics: [METRICS[0], METRICS[1]] });
  const [formErr, setFormErr] = useState('');
  // Evaluate dialog
  const [evalFor, setEvalFor] = useState<TrainingSession | null>(null);
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [evalErr, setEvalErr] = useState('');
  const [busy, setBusy] = useState(false);

  const sessions = useMemo(() => data?.sessions ?? [], [data]);
  const dayList = useMemo(() => sessions.filter((s) => s.date === day).sort((a, b) => timeKey(a).localeCompare(timeKey(b))), [sessions, day]);

  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const pending = sessions.filter((s) => s.status === 'PAUSED_PENDING_TRAINER');
  const toEvaluate = sessions.filter((s) => s.status === 'COMPLETED' && !s.evaluation);
  const activePlanHorses = new Set(data.plans.filter((p) => p.status === 'ACTIVE').map((p) => p.horseId));
  const dueSoon = data.vaccinations.filter((v) => v.status === 'DUE_SOON' || v.status === 'POSTPONED');

  // Flow: Khu chuồng → Ngựa trong khu đó → Mã phu phụ trách khu đó.
  const zoneHorses = form.zone ? data.horses.filter((h) => data.zoneOf(h) === form.zone) : [];
  const zoneGrooms = form.zone ? data.grooms.filter((g) => g.zones.includes(form.zone)) : [];
  const pickZone = (zone: string) => {
    const grooms = data.grooms.filter((g) => g.zones.includes(zone));
    setForm({ ...form, zone, horseId: '', groom: grooms.length === 1 ? grooms[0].name : '' });
    setFormErr('');
  };

  const openAssign = () => {
    setFormErr('');
    setAssignOpen(true);
  };

  const assign = async () => {
    if (!form.zone) { setFormErr('Chọn khu chuồng.'); return; }
    if (!form.horseId) { setFormErr('Chọn ngựa.'); return; }
    if (!/^\d{2}:\d{2}$/.test(form.time)) { setFormErr('Giờ theo dạng HH:mm.'); return; }
    if (!form.groom) { setFormErr('Chọn Mã phu thực hiện.'); return; }
    if (form.metrics.length === 0) { setFormErr('Chọn ít nhất 1 chỉ số cần ghi nhận.'); return; }
    setBusy(true);
    try {
      const s = await trainerApi.assignSession(form, actor);
      toast(`Đã phân công ${s.id} · ${s.horseName} cho ${s.groom} lúc ${s.time} ${s.date.slice(0, 5)}.`);
      setAssignOpen(false);
      setDay(s.date);
      reload();
    } catch (err) {
      setFormErr((err as ApiError).message ?? 'Phân công thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const openEval = (s: TrainingSession) => { setEvalFor(s); setScore(0); setComment(''); setEvalErr(''); };
  const evaluate = async () => {
    if (!evalFor) return;
    if (score < 1) { setEvalErr('Chọn điểm từ 1 đến 10.'); return; }
    setBusy(true);
    try {
      await trainerApi.evaluateSession(evalFor, score, comment, actor);
      toast(`Đã chấm ${score}/10 cho ${evalFor.horseName} (${evalFor.id}).`);
      setEvalFor(null);
      reload();
    } catch (err) {
      setEvalErr((err as ApiError).message ?? 'Lưu đánh giá thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const action = (s: TrainingSession) => {
    if (s.status === 'PAUSED_PENDING_TRAINER') return <Link className="ht-btn ht-btn--danger ht-btn--sm" to={`/trainer/sessions/${s.id}`}>Xử lý</Link>;
    if (s.status === 'COMPLETED' && !s.evaluation) return <button type="button" className="ht-btn ht-btn--primary ht-btn--sm" onClick={() => openEval(s)}>Đánh giá</button>;
    if (s.evaluation) return <span className="ht-score-chip" title={s.evaluation.comment}>{s.evaluation.score}/10</span>;
    if (s.status === 'STOPPED' || s.status === 'RESUMED') return <Link className="ht-more" to={`/trainer/sessions/${s.id}`}>Xem <Icon name="arrow" /></Link>;
    return <span style={{ color: 'var(--muted)', fontSize: 13 }}>—</span>;
  };

  return (
    <div className="ht ht-page">
      <PageHeader
        title="Lịch tập"
        sub="Phân công phiên tập cho Mã phu theo giáo án, theo dõi trạng thái và chấm phong độ sau buổi tập."
        actions={<button type="button" className="ht-btn ht-btn--primary" onClick={openAssign}><Icon name="calendar" />Phân công phiên tập</button>}
      />

      {pending.map((s) => (
        <div key={s.id} className="ht-banner" role="alert">
          <Icon name="alarm" />
          <div><b>{s.id} · {s.horseName} tạm dừng lúc <span className="ht-mono">{s.pausedAt}</span> — chờ bạn quyết định.</b><p>{s.pausedReason}</p></div>
          <Link className="ht-more" to={`/trainer/sessions/${s.id}`}>Xử lý ngay <Icon name="arrow" /></Link>
        </div>
      ))}

      <div className="ht-week" role="group" aria-label="Chọn ngày">
        {WEEK.map(([dow, date]) => {
          const list = sessions.filter((s) => s.date === date);
          const alert = list.some((s) => s.status === 'PAUSED_PENDING_TRAINER');
          return (
            <button key={date} type="button" className="ht-day" aria-pressed={day === date} onClick={() => setDay(date)}>
              <small>{dow}{date === TODAY ? ' · hôm nay' : ''}</small>
              <b>{date.slice(0, 5)}</b>
              <span className={alert ? 'ht-day__alert' : undefined}>{list.length ? `${list.length} phiên${alert ? ' · 1 chờ xử lý' : ''}` : 'Trống'}</span>
            </button>
          );
        })}
      </div>

      <div className="ht-cols">
        <div>
          <Panel title={`Phiên tập ngày ${day}`} sub={`${dayList.length} phiên`}>
            <table className="ht-table">
              <thead><tr><th>Giờ</th><th>Phiên · ngựa</th><th>Giáo án</th><th>Mã phu</th><th>Trạng thái</th><th style={{ textAlign: 'right' }}>Phong độ / thao tác</th></tr></thead>
              <tbody>
                {dayList.map((s) => (
                  <tr key={s.id} className={s.status === 'PAUSED_PENDING_TRAINER' || s.status === 'STOPPED' ? 'is-danger' : undefined}
                    data-href tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate(`/trainer/sessions/${s.id}`)} onDoubleClick={() => navigate(`/trainer/sessions/${s.id}`)}>
                    <td className="mono">{s.time}</td>
                    <td><span className="strong">{s.horseName}</span><span className="sub mono">{s.id}</span></td>
                    <td>{s.label}<span className="sub">{s.track}</span></td>
                    <td>{s.groom}</td>
                    <td><Badge tone={SESSION_LABEL[s.status][1]}>{SESSION_LABEL[s.status][0]}</Badge></td>
                    <td style={{ textAlign: 'right' }}>{action(s)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {dayList.length === 0 && <div className="ht-empty">Chưa có phiên tập trong ngày này.</div>}
          </Panel>
        </div>

        <div>
          <Panel as="h3" title="Chờ đánh giá phong độ" right={<span className="ht-count" style={{ margin: 0 }}>{toEvaluate.length}</span>}>
            <ul className="ht-list">
              {toEvaluate.map((s) => (
                <li key={s.id} className="ht-list-row">
                  <div className="r1"><span className="r2">{s.horseName} · <span className="ht-mono" style={{ fontWeight: 400 }}>{s.id}</span></span><button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" onClick={() => openEval(s)}>Chấm điểm</button></div>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{s.label} · <span className="ht-mono">{s.date.slice(0, 5)} {s.time}</span> · {s.groom}</span>
                </li>
              ))}
              {toEvaluate.length === 0 && <li className="ht-empty" style={{ padding: 16 }}>Đã chấm hết.</li>}
            </ul>
          </Panel>
          <Panel as="h3" title="Lịch tiêm 7 ngày tới" right={<span className="ht-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>tránh xếp tập nặng</span>}>
            <div className="ht-panel__body">
              <Timeline items={dueSoon.map((v) => ({ tone: v.status === 'POSTPONED' ? 'warning' : 'info', what: <><b>{v.horse}</b> · {v.type}</>, when: v.due }))} />
            </div>
          </Panel>
        </div>
      </div>

      {/* ----- Assign session ----- */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} icon="calendar" tone="brand" width={600} busy={busy} busyLabel="Đang phân công…"
        title="Phân công phiên tập" sub="Chọn khu chuồng → ngựa trong khu → Mã phu phụ trách khu. Phiên dùng giai đoạn hiện tại của giáo án; ngựa bị khóa y tế không thể xếp lịch (BR_01)."
        confirmLabel="Gửi cho Mã phu" onConfirm={assign}>
        {formErr && <Callout tone="danger" style={{ marginBottom: 14 }}>{formErr}</Callout>}
        <div className="ht-grid-2">
          <div className="ht-field">
            <label className="ht-label" htmlFor="as-zone">Khu chuồng<span className="ht-req">*</span></label>
            <select id="as-zone" className="ht-select" style={{ height: 44 }} value={form.zone} onChange={(e) => pickZone(e.target.value)}>
              <option value="">— Chọn khu —</option>
              {data.zones.map((z) => <option key={z} value={z}>{z} · {data.horses.filter((h) => data.zoneOf(h) === z).length} ngựa</option>)}
            </select>
          </div>
          <div className="ht-field">
            <label className="ht-label" htmlFor="as-horse">Ngựa<span className="ht-req">*</span></label>
            <select id="as-horse" className="ht-select" style={{ height: 44 }} value={form.horseId} disabled={!form.zone}
              onChange={(e) => setForm({ ...form, horseId: e.target.value })}>
              <option value="">{form.zone ? `— Chọn ngựa ${form.zone} —` : '— Chọn khu trước —'}</option>
              {zoneHorses.map((h) => {
                const why = trainingBlock(h) ? 'đang khóa tập' : !activePlanHorses.has(h.id) ? 'chưa có giáo án đang chạy' : '';
                return <option key={h.id} value={h.id} disabled={!!why}>{h.name} · {h.stall}{why ? ` — ${why}` : ''}</option>;
              })}
            </select>
          </div>
        </div>
        <div className="ht-grid-2">
          <div className="ht-field">
            <label className="ht-label" htmlFor="as-date">Ngày</label>
            <select id="as-date" className="ht-select" style={{ height: 44 }} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}>
              {ASSIGN_DAYS.map(([dow, d]) => <option key={d} value={d}>{dow} · {d}</option>)}
            </select>
          </div>
          <div className="ht-field">
            <label className="ht-label" htmlFor="as-time">Giờ</label>
            <input id="as-time" type="time" className="ht-input" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </div>
        </div>
        <div className="ht-grid-2">
          <div className="ht-field">
            <label className="ht-label" htmlFor="as-groom">Mã phu<span className="ht-req">*</span></label>
            <select id="as-groom" className="ht-select" style={{ height: 44 }} value={form.groom} disabled={!form.zone}
              onChange={(e) => setForm({ ...form, groom: e.target.value })}>
              <option value="">{!form.zone ? '— Chọn khu trước —' : zoneGrooms.length ? '— Chọn Mã phu —' : `Chưa có Mã phu phụ trách ${form.zone}`}</option>
              {zoneGrooms.map((g) => <option key={g.id} value={g.name}>{g.name} · {g.zones.join(', ')}</option>)}
            </select>
          </div>
          <div className="ht-field">
            <label className="ht-label" htmlFor="as-track">Đường tập</label>
            <input id="as-track" className="ht-input" value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value })} />
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

      {/* ----- Evaluate ----- */}
      <Dialog open={!!evalFor} onClose={() => setEvalFor(null)} icon="trend" tone="brand" busy={busy} busyLabel="Đang lưu…"
        title={`Đánh giá phong độ · ${evalFor?.horseName ?? ''}`}
        sub={evalFor ? `${evalFor.id} · ${evalFor.label} · ${evalFor.date.slice(0, 5)} ${evalFor.time} · max ${evalFor.readings.length ? Math.max(...evalFor.readings.map((r) => r.hr)) : '—'} bpm` : undefined}
        confirmLabel="Lưu đánh giá" onConfirm={evaluate}>
        <div className="ht-field">
          <span className="ht-label" id="score-label">Điểm phong độ (1–10)<span className="ht-req">*</span></span>
          <div className="ht-score" role="group" aria-labelledby="score-label">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button key={n} type="button" aria-pressed={score === n} onClick={() => { setScore(n); setEvalErr(''); }}>{n}</button>
            ))}
          </div>
        </div>
        <label className="ht-label" htmlFor="ev-comment" style={{ display: 'block', marginBottom: 6 }}>Nhận xét</label>
        <textarea id="ev-comment" className="ht-textarea" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="VD: Giữ nhịp ổn định, cần cải thiện xuất phát." />
        {evalErr && <div className="ht-error" style={{ marginTop: 6 }}><Icon name="alert" /><span>{evalErr}</span></div>}
      </Dialog>
    </div>
  );
};
