import React, { useState } from 'react';
import type { ApiError } from '../../api/http';
import { HealthStatus, HEALTH_LABEL, Horse } from '../../api/trainerApi';
import { Severity, SEVERITY_LABEL, VetCase, vetApi } from '../../api/vetApi';
import { useActor } from '../../auth/AuthContext';
import { Callout, Dialog, ReasonField, Segmented, useToast } from '../ui/Ht';

/* Dialogs used from several Veterinarian pages. Each one calls vetApi and reports back with onDone(). */

/** 1.2 — record the exam; optionally lock training in the same step (flow 2.2, step 1). */
type ExamProps = { vetCase: VetCase | null; horse?: Horse; onClose: () => void; onDone: () => void };
export const ExamDialog: React.FC<ExamProps> = (props) => (props.vetCase ? <ExamForm key={props.vetCase.id} {...props} vetCase={props.vetCase} /> : null);

// Mounted only while open, so the form starts from the case every time.
const ExamForm: React.FC<ExamProps & { vetCase: VetCase }> = ({ vetCase, horse, onClose, onDone }) => {
  const actor = useActor();
  const toast = useToast();
  const [f, setF] = useState({ symptoms: vetCase.note, diagnosis: '', severity: vetCase.severity, plan: '', health: (horse?.health ?? 'WATCH') as HealthStatus, lock: false, lockReason: '', review: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await vetApi.examineCase(vetCase, f, actor);
      if (f.lock && horse && !horse.trainingLocked) await vetApi.lockTraining(horse, { reason: f.lockReason || f.diagnosis, review: f.review }, actor);
      toast(`Đã ghi nhận ca ${vetCase.id}${f.lock ? ' và khóa huấn luyện' : ''}.`);
      onDone();
    } catch (e) {
      setErr((e as ApiError).message ?? 'Lưu thất bại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!vetCase} onClose={onClose} icon="clip" tone="brand" width={640} busy={busy} busyLabel="Đang lưu…"
      title={`Ghi nhận ca khám · ${vetCase?.id ?? ''}`} sub={vetCase ? `${vetCase.horse} · ${vetCase.type} · gửi bởi ${vetCase.sender} lúc ${vetCase.at}` : undefined}
      confirmLabel="Lưu kết quả khám" onConfirm={save}>
      {err && <Callout tone="danger" style={{ marginBottom: 14 }}>{err}</Callout>}
      <div style={{ display: 'grid', gap: 14 }}>
        <ReasonField id="ex-sym" label="Triệu chứng ghi nhận" value={f.symptoms} onChange={(v) => setF({ ...f, symptoms: v })} placeholder="VD: Sưng nóng gân gấp chân trước trái, đau khi ấn…" minHeight={72} />
        <div className="ht-field" style={{ margin: 0 }}>
          <label className="ht-label" htmlFor="ex-dx">Chẩn đoán<span className="ht-req">*</span></label>
          <input id="ex-dx" className="ht-input" value={f.diagnosis} onChange={(e) => setF({ ...f, diagnosis: e.target.value })} placeholder="VD: Viêm gân gấp nông chân trước trái" />
        </div>
        <div className="ht-grid-2">
          <div className="ht-field" style={{ margin: 0 }}>
            <span className="ht-label">Mức độ</span>
            <Segmented<Severity> label="Mức độ" value={f.severity} onChange={(v) => setF({ ...f, severity: v })}
              items={(['HIGH', 'MEDIUM', 'LOW'] as Severity[]).map((s) => ({ value: s, label: SEVERITY_LABEL[s][0] }))} />
          </div>
          <div className="ht-field" style={{ margin: 0 }}>
            <label className="ht-label" htmlFor="ex-health">Tình trạng sức khỏe</label>
            <select id="ex-health" className="ht-select" style={{ height: 40, width: '100%' }} value={f.health} onChange={(e) => setF({ ...f, health: e.target.value as HealthStatus })}>
              {(Object.keys(HEALTH_LABEL) as HealthStatus[]).map((h) => <option key={h} value={h}>{HEALTH_LABEL[h][0]}</option>)}
            </select>
          </div>
        </div>
        <ReasonField id="ex-plan" label="Hướng xử lý ban đầu" value={f.plan} onChange={(v) => setF({ ...f, plan: v })} placeholder="VD: Chườm lạnh 2 lần/ngày, lập phác đồ chống viêm…" minHeight={64} />
        {horse && !horse.trainingLocked && (
          <label className="ht-check" style={{ alignItems: 'flex-start' }}>
            <input type="checkbox" checked={f.lock} onChange={(e) => setF({ ...f, lock: e.target.checked })} />
            <span><b>Khóa huấn luyện {horse.name} ngay</b> — ngựa chưa đủ điều kiện sức khỏe (BR_01).</span>
          </label>
        )}
        {f.lock && (
          <ReasonField id="ex-review" label="Điều kiện đánh giá lại để mở khóa" value={f.review} onChange={(v) => setF({ ...f, review: v })} placeholder="VD: Khám lại sau 7 ngày, hết sưng và đi lại bình thường." minHeight={56} />
        )}
      </div>
    </Dialog>
  );
};

/** 3.1 — BR_01 lock. */
type HorseDialogProps = { horse: Horse | null; onClose: () => void; onDone: () => void };
export const LockDialog: React.FC<HorseDialogProps> = (props) => (props.horse ? <LockForm key={props.horse.id} {...props} /> : null);
const LockForm: React.FC<HorseDialogProps> = ({ horse, onClose, onDone }) => {
  const actor = useActor();
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [review, setReview] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!horse) return;
    setBusy(true);
    try {
      const r = await vetApi.lockTraining(horse, { reason, review }, actor);
      toast(`Đã khóa huấn luyện ${horse.name}${r.pausedPlans ? ` · tạm dừng ${r.pausedPlans} giáo án` : ''}. HLV trưởng và Mã phu được thông báo.`);
      onDone();
    } catch (e) {
      setErr((e as ApiError).message ?? 'Khóa thất bại.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={!!horse} onClose={onClose} icon="lock" tone="danger" danger busy={busy} busyLabel="Đang khóa…" width={560}
      title={`Khóa huấn luyện ${horse?.name ?? ''}`} sub="Chặn mọi lịch tập, giáo án, phiên tiếp tục và đề xuất thi đấu cho đến khi Bác sĩ mở khóa (BR_01)."
      confirmLabel="Khóa huấn luyện" onConfirm={save}>
      {err && <Callout tone="danger" style={{ marginBottom: 14 }}>{err}</Callout>}
      <div style={{ display: 'grid', gap: 14 }}>
        <ReasonField id="lk-reason" label="Lý do khóa" value={reason} onChange={setReason} placeholder="VD: Chấn thương chân trước trái, cần nghỉ hoàn toàn." minHeight={64} />
        <ReasonField id="lk-review" label="Điều kiện đánh giá lại" value={review} onChange={setReview} placeholder="VD: Đánh giá lại sau GĐ 1 phác đồ (dự kiến 18/10)." minHeight={56} />
      </div>
    </Dialog>
  );
};

/** 3.2 — BR_01 unlock. */
export const UnlockDialog: React.FC<HorseDialogProps> = (props) => (props.horse ? <UnlockForm key={props.horse.id} {...props} /> : null);
const UnlockForm: React.FC<HorseDialogProps> = ({ horse, onClose, onDone }) => {
  const actor = useActor();
  const toast = useToast();
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!horse) return;
    setBusy(true);
    try {
      await vetApi.unlockTraining(horse, note, actor);
      toast(`Đã mở khóa huấn luyện ${horse.name}. HLV trưởng và Mã phu được thông báo.`);
      onDone();
    } catch (e) {
      setErr((e as ApiError).message ?? 'Mở khóa thất bại.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={!!horse} onClose={onClose} icon="unlock" tone="brand" busy={busy} busyLabel="Đang mở khóa…" width={560}
      title={`Mở khóa huấn luyện ${horse?.name ?? ''}`} sub={horse?.lock ? `Khóa từ ${horse.lock.at}: ${horse.lock.reason}. Điều kiện: ${horse.lock.review}` : undefined}
      confirmLabel="Mở khóa" onConfirm={save}>
      {err && <Callout tone="danger" style={{ marginBottom: 14 }}>{err}</Callout>}
      <ReasonField id="ul-note" label="Đánh giá đủ điều kiện y tế" value={note} onChange={setNote} placeholder="VD: Hết sưng, đi lại bình thường, test chạy nhẹ không đau." minHeight={72} />
      <Callout tone="info" style={{ marginTop: 14 }}>Giáo án đang tạm dừng vẫn giữ nguyên — HLV trưởng quyết định khi nào tập lại.</Callout>
    </Dialog>
  );
};
