import React, { useState } from 'react';
import { trainerApi, TrainingSession } from '../../../api/trainerApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Icon } from '../../../components/ui/Icon';
import { Dialog } from '../../../components/ui/Ht';

/* 1.4 — score 1–10 + comment after a completed session. */
export const EvaluateDialog: React.FC<{ session: TrainingSession; onClose: () => void; onDone: () => void }> = ({ session: s, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, setError, run } = useAction();
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const maxHr = s.readings.length ? Math.max(...s.readings.map((r) => r.hr)) : '—';

  const save = async () => {
    if (score < 1) { setError('Chọn điểm từ 1 đến 10.'); return; }
    if (await run(() => trainerApi.evaluateSession(s, score, comment, actor), `Đã chấm ${score}/10 cho ${s.horseName} (${s.id}).`)) onDone();
  };

  return (
    <Dialog open onClose={onClose} icon="trend" tone="brand" busy={busy} busyLabel="Đang lưu…"
      title={`Đánh giá phong độ · ${s.horseName}`} sub={`${s.id} · ${s.label} · ${s.date.slice(0, 5)} ${s.time} · max ${maxHr} bpm`}
      confirmLabel="Lưu đánh giá" onConfirm={save}>
      <div className="ht-field">
        <span className="ht-label" id="score-label">Điểm phong độ (1–10)<span className="ht-req">*</span></span>
        <div className="ht-score" role="group" aria-labelledby="score-label">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button key={n} type="button" aria-pressed={score === n} onClick={() => { setScore(n); setError(''); }}>{n}</button>
          ))}
        </div>
      </div>
      <label className="ht-label" htmlFor="ev-comment" style={{ display: 'block', marginBottom: 6 }}>Nhận xét</label>
      <textarea id="ev-comment" className="ht-textarea" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="VD: Giữ nhịp ổn định, cần cải thiện xuất phát." />
      {error && <div className="ht-error" style={{ marginTop: 6 }}><Icon name="alert" /><span>{error}</span></div>}
    </Dialog>
  );
};
