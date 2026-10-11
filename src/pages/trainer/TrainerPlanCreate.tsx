import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Intensity, PlanPhase, trainerApi, trainingBlock } from '../../api/trainerApi';
import type { ApiError } from '../../api/http';
import { useActor } from '../../auth/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { Icon } from '../../components/ui/Icon';
import { Badge, Busy, Callout, PageHeader, Panel, useToast } from '../../components/ui/Ht';
import { HorseBadges, LoadState } from '../../components/trainer/TrainerParts';

const TYPES = ['Sức bền', 'Tốc độ', 'Phục hồi', 'Kỹ thuật'] as const;
type PlanType = (typeof TYPES)[number];
const INTENSITIES: Intensity[] = ['Nhẹ', 'Vừa', 'Cao'];

/* Phase templates the trainer can start from and then edit. */
const TEMPLATES: Record<PlanType, Omit<PlanPhase, 'no'>[]> = {
  'Sức bền': [
    { name: 'Nền thể lực', weeks: 2, intensity: 'Nhẹ', distanceM: 1200, sessionsPerWeek: 4, hrLimit: 160 },
    { name: 'Tăng sức bền', weeks: 3, intensity: 'Vừa', distanceM: 1600, sessionsPerWeek: 4, hrLimit: 180 },
    { name: 'Duy trì trước giải', weeks: 2, intensity: 'Cao', distanceM: 2000, sessionsPerWeek: 3, hrLimit: 185 },
  ],
  'Tốc độ': [
    { name: 'Khởi động tốc độ', weeks: 2, intensity: 'Vừa', distanceM: 800, sessionsPerWeek: 3, hrLimit: 175 },
    { name: 'Bứt tốc ngắn', weeks: 2, intensity: 'Cao', distanceM: 1000, sessionsPerWeek: 3, hrLimit: 185 },
  ],
  'Phục hồi': [
    { name: 'Hồi phục nhẹ', weeks: 2, intensity: 'Nhẹ', distanceM: 600, sessionsPerWeek: 3, hrLimit: 150 },
    { name: 'Trở lại nhịp', weeks: 2, intensity: 'Vừa', distanceM: 1000, sessionsPerWeek: 3, hrLimit: 165 },
  ],
  'Kỹ thuật': [{ name: 'Xuất phát & vào cua', weeks: 2, intensity: 'Vừa', distanceM: 800, sessionsPerWeek: 3, hrLimit: 170 }],
};

type PhaseDraft = Omit<PlanPhase, 'no'>;
const validPhase = (p: PhaseDraft) => p.name.trim() && p.weeks >= 1 && p.weeks <= 12 && p.distanceM >= 200 && p.distanceM <= 4000 && p.sessionsPerWeek >= 1 && p.sessionsPerWeek <= 7 && p.hrLimit >= 120 && p.hrLimit <= 200;

/* 1.2 Xây dựng giáo án huấn luyện — chặn ngựa đang bị khóa y tế (BR_01) */
export const TrainerPlanCreate: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const actor = useActor();
  const [params] = useSearchParams();
  const { data, loading, error, reload } = useFetch(() => trainerApi.getPlans(actor), [actor]);

  const [horseId, setHorseId] = useState(params.get('horse') ?? '');
  const [type, setType] = useState<PlanType>('Sức bền');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState('2026-10-05');
  const [phases, setPhases] = useState<PhaseDraft[]>(TEMPLATES['Sức bền'].map((p) => ({ ...p })));
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');

  const horses = useMemo(() => data?.horses ?? [], [data]);
  const horse = horses.find((h) => h.id === horseId);
  const running = data?.plans.find((p) => p.horseId === horseId && (p.status === 'ACTIVE' || p.status === 'PAUSED'));

  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const block = horse ? trainingBlock(horse) : null;
  const totalWeeks = phases.reduce((s, p) => s + (p.weeks || 0), 0);
  const totalSessions = phases.reduce((s, p) => s + (p.weeks || 0) * (p.sessionsPerWeek || 0), 0);
  const errors = {
    horse: !horseId ? 'Chọn ngựa' : block ?? '',
    goal: goal.trim().length < 5 ? 'Mục tiêu ít nhất 5 ký tự' : '',
    phases: phases.length === 0 ? 'Cần ít nhất 1 giai đoạn' : phases.some((p) => !validPhase(p)) ? 'Kiểm tra lại các giai đoạn: tuần 1–12, quãng đường 200–4000 m, 1–7 buổi/tuần, ngưỡng 120–200 bpm' : '',
  };
  const valid = !errors.horse && !errors.goal && !errors.phases;

  const setPhase = (i: number, patch: Partial<PhaseDraft>) => setPhases((ps) => ps.map((p, k) => (k === i ? { ...p, ...patch } : p)));
  const applyTemplate = (t: PlanType) => { setType(t); setPhases(TEMPLATES[t].map((p) => ({ ...p }))); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    setServerError('');
    if (!valid) return;
    setBusy(true);
    try {
      const d = startDate.split('-').reverse().join('/');
      const plan = await trainerApi.createPlan({ horseId, type, goal: goal.trim(), startDate: d, phases: phases.map((p, i) => ({ ...p, name: p.name.trim(), no: i + 1 })) }, actor);
      toast(`Đã tạo giáo án ${plan.id} cho ${plan.horseName}.`);
      navigate('/trainer/plans');
    } catch (err) {
      setServerError((err as ApiError).message ?? 'Tạo giáo án thất bại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="ht ht-page" onSubmit={submit} noValidate>
      <PageHeader
        crumbs={<><Link className="ht-back" to="/trainer/plans"><Icon name="back" size={14} />Giáo án</Link><Icon name="chev" size={14} /><b>Tạo mới</b></>}
        title="Tạo giáo án huấn luyện"
        sub="Chọn ngựa, đặt mục tiêu, rồi chia giai đoạn. Ngựa đang bị khóa y tế không thể lập giáo án (BR_01)."
      />

      {serverError && <Callout tone="danger" style={{ marginBottom: 16 }}>{serverError}</Callout>}

      <div className="ht-cols">
        <div>
          <Panel title="Ngựa & mục tiêu">
            <div className="ht-panel__body">
              <div className="ht-grid-2">
                <div className="ht-field">
                  <label className="ht-label" htmlFor="horse">Ngựa<span className="ht-req">*</span></label>
                  <select id="horse" className="ht-select" style={{ height: 44 }} value={horseId} onChange={(e) => setHorseId(e.target.value)} aria-invalid={tried && !!errors.horse || undefined}>
                    <option value="">— Chọn ngựa —</option>
                    {horses.map((h) => (
                      <option key={h.id} value={h.id} disabled={h.trainingLocked}>{h.name} · {h.breed}{h.trainingLocked ? ' — đang khóa tập' : ''}</option>
                    ))}
                  </select>
                  {tried && errors.horse && <div className="ht-error"><Icon name="alert" /><span>{errors.horse}</span></div>}
                </div>
                <div className="ht-field">
                  <label className="ht-label" htmlFor="start">Ngày bắt đầu<span className="ht-req">*</span></label>
                  <input id="start" type="date" className="ht-input" value={startDate} min="2026-10-03" onChange={(e) => setStartDate(e.target.value)} />
                </div>
              </div>
              {horse && <div style={{ margin: '-4px 0 16px' }}><HorseBadges horse={horse} /></div>}
              {running && !block && <Callout tone="demo" icon="warn" style={{ marginBottom: 16 }}>{horse?.name} đang có giáo án <b className="ht-mono">{running.id}</b> ({running.type}). Lưu giáo án mới sẽ chuyển giáo án cũ sang “Đã thay thế”.</Callout>}

              <div className="ht-field">
                <span className="ht-label">Loại giáo án</span>
                <div className="ht-seg" role="group" aria-label="Loại giáo án">
                  {TYPES.map((t) => <button key={t} type="button" aria-pressed={type === t} onClick={() => applyTemplate(t)}>{t}</button>)}
                </div>
                <span className="ht-hint">Đổi loại sẽ nạp lại giai đoạn mẫu — bạn vẫn sửa được từng giai đoạn bên dưới.</span>
              </div>
              <div className="ht-field" style={{ marginBottom: 0 }}>
                <label className="ht-label" htmlFor="goal">Mục tiêu<span className="ht-req">*</span></label>
                <input id="goal" className="ht-input" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="VD: Giải đua Đại Việt 2026 · 1600 m" aria-invalid={tried && !!errors.goal || undefined} />
                {tried && errors.goal && <div className="ht-error"><Icon name="alert" /><span>{errors.goal}</span></div>}
              </div>
            </div>
          </Panel>

          <Panel title="Các giai đoạn" sub="Mỗi giai đoạn: số tuần, cường độ, quãng đường mỗi buổi, số buổi/tuần và ngưỡng nhịp tim (BR_02)."
            right={<button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" disabled={phases.length >= 6}
              onClick={() => setPhases((ps) => [...ps, { name: '', weeks: 2, intensity: 'Vừa', distanceM: 1200, sessionsPerWeek: 3, hrLimit: 175 }])}>+ Thêm giai đoạn</button>}>
            <div className="ht-panel__body" style={{ display: 'grid', gap: 12 }}>
              {phases.map((p, i) => (
                <div key={i} className="ht-phase" style={tried && !validPhase(p) ? { borderColor: 'var(--danger-line)' } : undefined}>
                  <div className="ht-phase__head">
                    <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center' }}><span className="ht-phase__no">{String(i + 1).padStart(2, '0')}</span><b>Giai đoạn {i + 1}</b></span>
                    <button type="button" className="ht-iconbtn" aria-label={`Xóa giai đoạn ${i + 1}`} disabled={phases.length === 1} onClick={() => setPhases((ps) => ps.filter((_, k) => k !== i))}><Icon name="x" /></button>
                  </div>
                  <div className="ht-phase__grid">
                    <div className="ht-field"><label className="ht-label" htmlFor={`n${i}`}>Tên</label><input id={`n${i}`} className="ht-input" value={p.name} onChange={(e) => setPhase(i, { name: e.target.value })} placeholder="VD: Tăng sức bền" /></div>
                    <div className="ht-field"><label className="ht-label" htmlFor={`w${i}`}>Số tuần</label><input id={`w${i}`} type="number" min={1} max={12} className="ht-input" value={p.weeks} onChange={(e) => setPhase(i, { weeks: Number(e.target.value) })} /></div>
                    <div className="ht-field"><label className="ht-label" htmlFor={`i${i}`}>Cường độ</label><select id={`i${i}`} className="ht-select" value={p.intensity} onChange={(e) => setPhase(i, { intensity: e.target.value as Intensity })}>{INTENSITIES.map((x) => <option key={x}>{x}</option>)}</select></div>
                    <div className="ht-field"><label className="ht-label" htmlFor={`d${i}`}>Quãng đường (m)</label><input id={`d${i}`} type="number" step={100} className="ht-input" value={p.distanceM} onChange={(e) => setPhase(i, { distanceM: Number(e.target.value) })} /></div>
                    <div className="ht-field"><label className="ht-label" htmlFor={`s${i}`}>Buổi/tuần</label><input id={`s${i}`} type="number" min={1} max={7} className="ht-input" value={p.sessionsPerWeek} onChange={(e) => setPhase(i, { sessionsPerWeek: Number(e.target.value) })} /></div>
                    <div className="ht-field"><label className="ht-label" htmlFor={`h${i}`}>Ngưỡng bpm</label><input id={`h${i}`} type="number" min={120} max={200} className="ht-input" value={p.hrLimit} onChange={(e) => setPhase(i, { hrLimit: Number(e.target.value) })} /></div>
                  </div>
                </div>
              ))}
              {tried && errors.phases && <div className="ht-error"><Icon name="alert" /><span>{errors.phases}</span></div>}
            </div>
          </Panel>
        </div>

        <div>
          <Panel as="h3" title="Tóm tắt giáo án">
            <div className="ht-panel__body">
              <dl className="ht-kv">
                <dt>Ngựa</dt><dd>{horse ? horse.name : '—'}</dd>
                <dt>Loại</dt><dd>{type}</dd>
                <dt>Bắt đầu</dt><dd className="ht-mono">{startDate.split('-').reverse().join('/')}</dd>
                <dt>Số giai đoạn</dt><dd>{phases.length}</dd>
                <dt>Tổng thời gian</dt><dd>{totalWeeks} tuần</dd>
                <dt>Tổng số buổi</dt><dd>{totalSessions} buổi</dd>
              </dl>
              <hr className="ht-divider" />
              {phases.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13, padding: '4px 0' }}>
                  <span>GĐ {i + 1} · {p.name || <i>chưa đặt tên</i>}</span>
                  <Badge tone={p.intensity === 'Cao' ? 'danger' : p.intensity === 'Vừa' ? 'warning' : 'success'} plain>{p.intensity}</Badge>
                </div>
              ))}
              <button type="submit" className="ht-btn ht-btn--primary ht-btn--block" style={{ marginTop: 16 }} disabled={busy || (tried && !valid)} aria-busy={busy || undefined}>
                <Busy busy={busy} label="Đang lưu…"><Icon name="check" />Lưu giáo án</Busy>
              </button>
              {block && <p className="ht-error" style={{ marginTop: 10 }}><Icon name="lock" /><span>{block}</span></p>}
            </div>
          </Panel>
          <Callout tone="info">Sau khi lưu, vào <b>Lịch tập</b> để phân công phiên cho Mã phu theo giai đoạn hiện tại.</Callout>
        </div>
      </div>
    </form>
  );
};
