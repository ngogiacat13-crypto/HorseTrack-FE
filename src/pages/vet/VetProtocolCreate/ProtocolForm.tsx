import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DEMO_NOW, type ApiError } from '../../../api/http';
import { addDays, ProtoPhase, vetApi } from '../../../api/vetApi';
import { useActor } from '../../../auth/AuthContext';
import { Icon } from '../../../components/ui/Icon';
import { Callout, PageHeader, useToast } from '../../../components/ui/Ht';
import { HorseBadges } from '../../../components/trainer/TrainerParts';
import { PhaseEditor } from './PhaseEditor';
import { HorseCaseFields, SummaryPanel } from './FormParts';

export type FormData = Awaited<ReturnType<typeof vetApi.getProtocolForm>>;

const newPhase = (no: number, start: string): ProtoPhase => ({ no, name: '', startDate: start, days: 7, goal: '', items: [] });

/** Case to use for a horse: the one asked for, else the first examined one. */
const pickCase = (data: FormData, horseId: string, wanted = '') => {
  const cases = data.cases.filter((c) => c.horseId === horseId);
  return cases.find((c) => c.id === wanted) ?? cases.find((c) => c.exam);
};

// Starts from the replaced protocol (new version, 2.4) or from the case exam.
export const ProtocolForm: React.FC<{ data: FormData; horseParam: string; caseParam: string }> = ({ data, horseParam, caseParam }) => {
  const navigate = useNavigate();
  const actor = useActor();
  const toast = useToast();
  const r = data.replacing;
  const firstCase = r ? undefined : pickCase(data, horseParam, caseParam);
  const [horseId, setHorseId] = useState(r?.horseId ?? horseParam);
  const [caseId, setCaseId] = useState(r?.caseId ?? firstCase?.id ?? '');
  const [diagnosis, setDiagnosis] = useState(r?.diagnosis ?? firstCase?.exam?.diagnosis ?? '');
  const [requiredBy, setRequiredBy] = useState(r?.requiredBy ?? addDays(DEMO_NOW.date, 2));
  const [phases, setPhases] = useState<ProtoPhase[]>(() => (r
    ? r.phases.map((p) => ({ ...p, items: p.items.map((i) => ({ ...i })) }))
    : [newPhase(1, addDays(DEMO_NOW.date, 2))]));
  const [open, setOpen] = useState(0);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState<'' | 'draft' | 'send'>('');

  const cases = data.cases.filter((c) => c.horseId === horseId);
  const horse = data.horses.find((h) => h.id === horseId);
  const vetCase = cases.find((c) => c.id === caseId);
  const inv = Object.fromEntries(data.inventory.map((i) => [i.id, i]));
  // On hand minus held — plus what the replaced version holds, since sending the new version releases it.
  const availableOf = (itemId: string) => {
    const i = inv[itemId];
    const released = r?.stock?.lines.find((l) => l.itemId === itemId)?.held ?? 0;
    return i ? Math.max(0, i.onHand - i.held + released) : 0;
  };
  const needOf = (itemId: string) => phases.reduce((s, p) => s + p.items.filter((i) => i.itemId === itemId).reduce((t, i) => t + i.qty, 0), 0);

  const chooseHorse = (id: string) => {
    const c = pickCase(data, id);
    setHorseId(id); setCaseId(c?.id ?? ''); setDiagnosis(c?.exam?.diagnosis ?? '');
  };
  const chooseCase = (id: string) => { setCaseId(id); setDiagnosis(cases.find((c) => c.id === id)?.exam?.diagnosis ?? ''); };
  const setPhase = (idx: number, patch: Partial<ProtoPhase>) => setPhases(phases.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  const removePhase = (idx: number) => { setPhases(phases.filter((_, i) => i !== idx).map((p, i) => ({ ...p, no: i + 1 }))); setOpen(-1); };
  const addPhase = () => {
    const last = phases[phases.length - 1];
    setPhases([...phases, newPhase(phases.length + 1, addDays(last.startDate, last.days))]);
    setOpen(phases.length);
  };

  const submit = async (send: boolean) => {
    setErr('');
    if (!horse) { setErr('Chọn ngựa.'); return; }
    if (!vetCase) { setErr('Chọn ca khám cho phác đồ.'); return; }
    setBusy(send ? 'send' : 'draft');
    try {
      const p = await vetApi.createProtocol({ horseId, caseId, diagnosis, requiredBy, phases, replaces: r?.id ?? null }, send, actor);
      toast(send ? `${p.id} đã gửi kho kiểm tra tồn.` : `Đã lưu nháp ${p.id}.`);
      navigate(`/vet/protocols/${p.id}`);
    } catch (e) {
      setErr((e as ApiError).message ?? 'Lưu thất bại.');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="ht ht-page">
      <PageHeader
        crumbs={<><Link className="ht-back" to="/vet/protocols"><Icon name="back" size={14} />Phác đồ điều trị</Link><Icon name="chev" size={14} /><b>{r ? `Phiên bản mới của ${r.id}` : 'Tạo mới'}</b></>}
        title={<>Tạo phác đồ điều trị{horse && <span style={{ color: 'var(--muted)', fontWeight: 500 }}> / {horse.name}</span>}</>}
        badge={horse && <HorseBadges horse={horse} compact />}
      />

      {r && (
        <Callout tone="demo" icon="refresh" title={`Phiên bản ${r.version + 1} thay cho ${r.id}`} style={{ marginBottom: 24 }}>
          Sửa thuốc / số lượng rồi gửi kho kiểm tồn lại. Khi gửi, {r.id} chuyển SUPERSEDED, phần tồn đã giữ được trả lại và kho không cấp theo bản cũ (BR_07).
        </Callout>
      )}

      <div className="ht-cols" style={{ gridTemplateColumns: 'minmax(0,1fr) 320px' }}>
        <div>
          <HorseCaseFields horses={data.horses.filter((h) => data.cases.some((c) => c.horseId === h.id))} cases={cases} locked={!!r}
            horseId={horseId} caseId={caseId} diagnosis={diagnosis} requiredBy={requiredBy}
            onHorse={chooseHorse} onCase={chooseCase} onDiagnosis={setDiagnosis} onRequiredBy={setRequiredBy} />
          {phases.map((ph, idx) => (
            <PhaseEditor key={idx} phase={ph} index={idx} open={open === idx} inventory={data.inventory} availableOf={availableOf} needOf={needOf}
              onToggle={() => setOpen(open === idx ? -1 : idx)} onRemove={phases.length > 1 ? () => removePhase(idx) : undefined} onChange={(patch) => setPhase(idx, patch)} />
          ))}
          <button type="button" className="ht-dashed-btn" onClick={addPhase}>+ Thêm giai đoạn</button>
          <Callout tone="info" icon="box">“Tồn khả dụng” chỉ để tham khảo (tồn thực tế trừ phần đang giữ). Số lượng có thể cấp, lô/hạn dùng và ETA do Quản lý kho phản hồi sau khi bạn gửi kiểm tồn.</Callout>
        </div>
        <div>
          <SummaryPanel horse={horse} vetCase={vetCase} phases={phases} error={err} busy={busy} onSend={() => submit(true)} onDraft={() => submit(false)} />
        </div>
      </div>
    </div>
  );
};
