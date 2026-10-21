import React, { useState } from 'react';
import { trainerApi, TrainingSession } from '../../../api/trainerApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Icon } from '../../../components/ui/Icon';
import { Callout, Dialog } from '../../../components/ui/Ht';

type Severity = 'MEDIUM' | 'HIGH' | 'CRITICAL';

export const StopSessionDialog: React.FC<{ session: TrainingSession; onClose: () => void; onDone: () => void }> = ({ session: s, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, setError, run } = useAction();
  const [reason, setReason] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [speed, setSpeed] = useState('');
  const [severity, setSeverity] = useState<Severity>('HIGH');

  const save = async () => {
    if (reason.trim().length < 10) { setError('Mô tả dấu hiệu cho bác sĩ ít nhất 10 ký tự.'); return; }
    const hr = heartRate.trim() ? Number(heartRate) : undefined;
    const kmh = speed.trim() ? Number(speed) : undefined;
    if (hr !== undefined && !(hr > 0 && hr <= 400)) { setError('Nhịp tim không hợp lệ (1–400 bpm).'); return; }
    if (kmh !== undefined && !(kmh >= 0 && kmh <= 100)) { setError('Tốc độ không hợp lệ (0–100 km/h).'); return; }
    const ok = await run(() => trainerApi.stopSessionForVet(s, { reason: reason.trim(), heartRate: hr, speedKmh: kmh, severity }, actor),
      `Đã dừng ${s.horseName} (${s.id}) và gửi ca cho bác sĩ.`);
    if (ok) onDone();
  };

  return (
    <Dialog open onClose={onClose} icon="alarm" tone="danger" danger width={620} busy={busy} busyLabel="Đang gửi…"
      title={`Dừng buổi tập & gửi bác sĩ · ${s.horseName}`} sub={`${s.id} · ${s.label} · ${s.date.slice(0, 5)} ${s.time} · Mã phu ${s.groom}`}
      confirmLabel="Dừng & gửi bác sĩ" onConfirm={save}>
      <label className="ht-label" htmlFor="stop-reason" style={{ display: 'block', marginBottom: 6 }}>Dấu hiệu / lý do dừng<span className="ht-req">*</span></label>
      <textarea id="stop-reason" className="ht-textarea" value={reason} onChange={(e) => { setReason(e.target.value); setError(''); }}
        placeholder="VD: Nhịp tim vượt ngưỡng 210 bpm, ngựa thở gấp, bước chân lệch." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
        <div className="ht-field" style={{ margin: 0 }}>
          <label className="ht-label" htmlFor="stop-hr">Nhịp tim (bpm)</label>
          <input id="stop-hr" className="ht-input" type="number" min={1} max={400} value={heartRate} onChange={(e) => setHeartRate(e.target.value)} />
        </div>
        <div className="ht-field" style={{ margin: 0 }}>
          <label className="ht-label" htmlFor="stop-speed">Tốc độ (km/h)</label>
          <input id="stop-speed" className="ht-input" type="number" min={0} max={100} value={speed} onChange={(e) => setSpeed(e.target.value)} />
        </div>
        <div className="ht-field" style={{ margin: 0 }}>
          <label className="ht-label" htmlFor="stop-sev">Mức độ</label>
          <select id="stop-sev" className="ht-select" value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
            <option value="MEDIUM">Trung bình</option>
            <option value="HIGH">Cao</option>
            <option value="CRITICAL">Nguy kịch</option>
          </select>
        </div>
      </div>
      <Callout tone="info" style={{ marginTop: 14 }}>
        Buổi tập chuyển <b>Đã dừng — chờ bác sĩ</b> và hệ thống gửi ca khám cho bác sĩ thú y. Khi bác sĩ khóa huấn luyện hoặc kết luận không cần khóa,
        buổi tập kết thúc và giáo án hiện tại được đóng để bạn lập giáo án mới (nếu bị khóa thì sau khi bác sĩ mở khóa).
      </Callout>
      {error && <div className="ht-error" style={{ marginTop: 8 }}><Icon name="alert" /><span>{error}</span></div>}
    </Dialog>
  );
};
