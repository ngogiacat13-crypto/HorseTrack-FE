import React, { useState } from 'react';
import { Horse, Intensity, PlanPhase, trainerApi, trainingBlock, TrainingSession } from '../../../api/trainerApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Icon } from '../../../components/ui/Icon';
import { Busy, Callout, Panel, ReasonField, Rules, useToast } from '../../../components/ui/Ht';

type Choice = 'stop' | 'adjust';
const INTENSITIES: Intensity[] = ['Nhẹ', 'Vừa', 'Cao'];

export const DecisionForm: React.FC<{ session: TrainingSession; horse: Horse; phase: PlanPhase; onDone: () => void }> = ({ session: s, horse, phase, onDone }) => {
  const actor = useActor();
  const toast = useToast();
  const { busy, error, setError, run } = useAction(onDone);
  const [choice, setChoice] = useState<Choice>('stop');
  const [note, setNote] = useState('');
  const [adj, setAdj] = useState({ intensity: (phase.intensity === 'Cao' ? 'Vừa' : 'Nhẹ') as Intensity, distanceM: Math.max(400, phase.distanceM - 400), hrLimit: s.thresholds.hr });

  const recovered = (s.recovery ?? [])[(s.recovery ?? []).length - 1];
  const lock = trainingBlock(horse);
  const recoveryOk = !!recovered && recovered.hr < s.thresholds.hr;
  const canContinue = !lock && recoveryOk;
  const pick = (c: Choice) => { setChoice(c); setError(''); };

  const submit = async () => {
    if (note.trim().length < 10) { setError(choice === 'stop' ? 'Mô tả dấu hiệu cho bác sĩ ít nhất 10 ký tự.' : 'Ghi rõ nội dung điều chỉnh ít nhất 10 ký tự.'); return; }
    const ok = choice === 'stop'
      ? await run(async () => { const r = await trainerApi.stopAndRequestVet(s, note, actor); toast(`Đã dừng ${s.id} và gửi ca khám ${r.decision?.caseId} cho Bác sĩ thú y.`); })
      : await run(() => trainerApi.adjustAndContinue(s, { ...adj, note }, actor), `Đã điều chỉnh giáo án và cho ${s.horseName} tiếp tục phiên ${s.id}.`);
    if (ok) setNote('');
  };

  return (
    <Panel title="Hành động tiếp theo" sub="Chọn một hướng xử lý. Quyết định được lưu vào lịch sử phiên tập và nhật ký hệ thống.">
      <div className="ht-panel__body" style={{ display: 'grid', gap: 16 }}>
        <div className="ht-choices" role="group" aria-label="Hướng xử lý">
          <button type="button" className="ht-choice" aria-pressed={choice === 'stop'} onClick={() => pick('stop')}>
            <b><Icon name="heart" />Dừng phiên & gửi ca khám cho Bác sĩ</b>
            <small>Tạo ca mới trong hộp thư Bác sĩ thú y, tạm dừng giáo án đến khi có kết luận.</small>
          </button>
          <button type="button" className="ht-choice" aria-pressed={choice === 'adjust'} disabled={!canContinue} onClick={() => pick('adjust')}>
            <b><Icon name="calendar" />Điều chỉnh giáo án & tiếp tục</b>
            <small>{canContinue ? 'Giảm cường độ / quãng đường của giai đoạn hiện tại rồi cho phép Mã phu tiếp tục.' : lock ?? `Nhịp tim hồi phục ${recovered ? `${recovered.hr} bpm` : 'chưa đo'} — chưa về dưới ${s.thresholds.hr}.`}</small>
          </button>
        </div>

        <Rules items={[
          { ok: !lock, label: <>Ngựa không bị khóa y tế <span className="ht-mono" style={{ fontSize: 12 }}>(BR_01)</span></> },
          { ok: recoveryOk, label: <>Nhịp tim hồi phục dưới ngưỡng: {recovered ? <b className="ht-mono">{recovered.hr} bpm lúc {recovered.t}</b> : 'chưa có số đo'} <span className="ht-mono" style={{ fontSize: 12 }}>(BR_02)</span></> },
        ]} />

        {choice === 'adjust' && canContinue && (
          <div className="ht-grid-2" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="ht-field" style={{ margin: 0 }}>
              <label className="ht-label" htmlFor="adj-i">Cường độ mới</label>
              <select id="adj-i" className="ht-select" style={{ height: 44 }} value={adj.intensity} onChange={(e) => setAdj({ ...adj, intensity: e.target.value as Intensity })}>
                {INTENSITIES.map((x) => <option key={x}>{x}</option>)}
              </select>
              <span className="ht-hint">Đang: {phase.estimated ? 'chưa có trên server' : phase.intensity}</span>
            </div>
            <div className="ht-field" style={{ margin: 0 }}>
              <label className="ht-label" htmlFor="adj-d">Quãng đường (m)</label>
              <input id="adj-d" type="number" step={100} min={200} className="ht-input" value={adj.distanceM} onChange={(e) => setAdj({ ...adj, distanceM: Number(e.target.value) })} />
              <span className="ht-hint">Đang: {phase.estimated ? 'chưa có trên server' : `${phase.distanceM} m`}</span>
            </div>
            <div className="ht-field" style={{ margin: 0 }}>
              <label className="ht-label" htmlFor="adj-h">Ngưỡng bpm</label>
              <input id="adj-h" type="number" min={120} max={s.thresholds.hr} className="ht-input" value={adj.hrLimit} onChange={(e) => setAdj({ ...adj, hrLimit: Number(e.target.value) })} />
              <span className="ht-hint">Không vượt {s.thresholds.hr}</span>
            </div>
          </div>
        )}

        <ReasonField id="decision-note" label={choice === 'stop' ? 'Mô tả dấu hiệu cho Bác sĩ' : 'Nội dung điều chỉnh'} value={note}
          onChange={(v) => { setNote(v); if (v.trim().length >= 10) setError(''); }}
          placeholder={choice === 'stop' ? 'VD: Thở gấp sau vòng 3, bước chân trước phải hơi ngắn.' : 'VD: Giảm cường độ, chạy nhẹ 800 m còn lại, theo dõi nhịp tim mỗi 2 phút.'} />
        {error && <Callout tone="danger">{error}</Callout>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', display: 'inline-flex', gap: 6, alignItems: 'center' }}><Icon name="info" size={14} />Mã phu chỉ tiếp tục khi bạn đã điều chỉnh và hệ thống cho phép.</span>
          <button type="button" className={`ht-btn ${choice === 'stop' ? 'ht-btn--danger' : 'ht-btn--primary'}`} onClick={submit}
            disabled={busy || (choice === 'adjust' && (!canContinue || adj.hrLimit > s.thresholds.hr))} aria-busy={busy || undefined}>
            <Busy busy={busy} label="Đang lưu…"><Icon name="send" />{choice === 'stop' ? 'Dừng phiên & gửi Bác sĩ' : 'Điều chỉnh & cho tiếp tục'}</Busy>
          </button>
        </div>
      </div>
    </Panel>
  );
};
