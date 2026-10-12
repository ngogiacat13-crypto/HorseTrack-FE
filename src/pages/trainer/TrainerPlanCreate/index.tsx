import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { trainerApi, trainingBlock } from '../../../api/trainerApi';
import type { ApiError } from '../../../api/http';
import { useActor } from '../../../auth/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { Icon } from '../../../components/ui/Icon';
import { Callout, PageHeader, Panel, useToast } from '../../../components/ui/Ht';
import { HorseBadges, LoadState } from '../../../components/trainer/TrainerParts';
import { NEW_PHASE, PhaseDraft, PlanType, TEMPLATES, TYPES, validPhase } from './templates';
import { PhaseRow } from './PhaseRow';
import { PlanSummary } from './PlanSummary';

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
  const fieldError = (msg: string) => tried && msg && <div className="ht-error"><Icon name="alert" /><span>{msg}</span></div>;

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
                  <select id="horse" className="ht-select" style={{ height: 44 }} value={horseId} onChange={(e) => setHorseId(e.target.value)} aria-invalid={(tried && !!errors.horse) || undefined}>
                    <option value="">— Chọn ngựa —</option>
                    {horses.map((h) => <option key={h.id} value={h.id} disabled={h.trainingLocked}>{h.name} · {h.breed}{h.trainingLocked ? ' — đang khóa tập' : ''}</option>)}
                  </select>
                  {fieldError(errors.horse)}
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
                <input id="goal" className="ht-input" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="VD: Giải đua Đại Việt 2026 · 1600 m" aria-invalid={(tried && !!errors.goal) || undefined} />
                {fieldError(errors.goal)}
              </div>
            </div>
          </Panel>

          <Panel title="Các giai đoạn" sub="Mỗi giai đoạn: số tuần, cường độ, quãng đường mỗi buổi, số buổi/tuần và ngưỡng nhịp tim (BR_02)."
            right={<button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" disabled={phases.length >= 6} onClick={() => setPhases((ps) => [...ps, { ...NEW_PHASE }])}>+ Thêm giai đoạn</button>}>
            <div className="ht-panel__body" style={{ display: 'grid', gap: 12 }}>
              {phases.map((p, i) => (
                <PhaseRow key={i} phase={p} index={i} invalid={tried && !validPhase(p)} canRemove={phases.length > 1}
                  onChange={(patch) => setPhase(i, patch)} onRemove={() => setPhases((ps) => ps.filter((_, k) => k !== i))} />
              ))}
              {fieldError(errors.phases)}
            </div>
          </Panel>
        </div>

        <div><PlanSummary horse={horse} type={type} startDate={startDate} phases={phases} busy={busy} disabled={tried && !valid} block={block} /></div>
      </div>
    </form>
  );
};
