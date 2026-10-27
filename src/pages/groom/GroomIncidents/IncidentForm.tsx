import React, { useState } from 'react';
import { groomApi } from '../../../api/groomApi';
import type { Horse } from '../../../api/trainerApi';
import type { Severity } from '../../../api/vetApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Icon } from '../../../components/ui/Icon';
import { Callout, ReasonField, Segmented, useToast } from '../../../components/ui/Ht';

const TYPES = ['Mất ăn', 'Đau bụng', 'Sốt', 'Đi khập khiễng', 'Vết thương ngoài da', 'Móng chân'];

export const IncidentForm: React.FC<{ horses: Horse[]; initialHorse: string; onDone: () => void }> = ({ horses, initialHorse, onDone }) => {
  const actor = useActor();
  const toast = useToast();
  const { busy, error, run } = useAction(onDone);
  const [horseId, setHorseId] = useState(initialHorse);
  const [type, setType] = useState('');
  const [severity, setSeverity] = useState<Severity>('MEDIUM');
  const [note, setNote] = useState('');
  const [notifyTrainer, setNotifyTrainer] = useState(true);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    let msg = '';
    const ok = await run(async () => {
      if (!horseId) throw new Error('Chọn ngựa gặp sự cố.');
      const r = await groomApi.reportIncident({ horseId, type, severity, note, photo: null, notifyTrainer }, actor);
      msg = `Đã gửi ca ${r.vetCase.id} cho Bác sĩ thú y${r.paused ? ` · phiên ${r.paused} đã tạm dừng` : ''}.`;
    });
    if (ok) { toast(msg); setType(''); setNote(''); }
  };

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
      {error && <Callout tone="danger">{error}</Callout>}
      <div className="ht-field" style={{ margin: 0 }}>
        <label className="ht-label" htmlFor="ic-horse">Ngựa<span className="ht-req">*</span></label>
        <select id="ic-horse" className="ht-input" value={horseId} onChange={(e) => setHorseId(e.target.value)}>
          <option value="">— Chọn ngựa trong khu của bạn —</option>
          {horses.map((h) => <option key={h.id} value={h.id}>{h.name} · {h.stall}</option>)}
        </select>
      </div>
      <div className="ht-field" style={{ margin: 0 }}>
        <label className="ht-label" htmlFor="ic-type">Loại sự cố<span className="ht-req">*</span></label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {TYPES.map((t) => <button key={t} type="button" className="ht-chip" aria-pressed={type === t} onClick={() => setType(t)}>{t}</button>)}
        </div>
        <input id="ic-type" className="ht-input" value={type} onChange={(e) => setType(e.target.value)} placeholder="Hoặc nhập loại khác" />
      </div>
      <div className="ht-field" style={{ margin: 0 }}>
        <span className="ht-label">Mức độ</span>
        <Segmented<Severity> label="Mức độ" value={severity} onChange={setSeverity} items={[{ value: 'LOW', label: 'Thấp' }, { value: 'MEDIUM', label: 'Trung bình' }, { value: 'HIGH', label: 'Cao' }]} />
      </div>
      <ReasonField id="ic-note" label="Mô tả dấu hiệu" value={note} min={15} onChange={setNote} placeholder="VD: Bỏ ăn sáng, nằm lăn nhiều lần, toát mồ hôi vùng cổ." minHeight={80} />
      <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 14 }}>
        <input type="checkbox" checked={notifyTrainer} onChange={(e) => setNotifyTrainer(e.target.checked)} style={{ marginTop: 3 }} />
        <span>Báo HLV trưởng — nếu ngựa đang trong phiên tập, phiên sẽ <b>tạm dừng</b> chờ HLV quyết định.</span>
      </label>
      <button type="submit" className="ht-btn ht-btn--primary" disabled={busy}><Icon name="send" size={16} />{busy ? 'Đang gửi…' : 'Gửi Bác sĩ thú y'}</button>
    </form>
  );
};
