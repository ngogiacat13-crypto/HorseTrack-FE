import React, { useState } from 'react';
import { DEMO_NOW } from '../../../api/http';
import { Icon } from '../../../components/ui/Icon';

export const ReadingForm: React.FC<{ recovery?: boolean; busy: boolean; onSubmit: (v: { t: string; hr: number; speed: number }) => Promise<boolean> }> = ({ recovery, busy, onSubmit }) => {
  const [t, setT] = useState(DEMO_NOW.time);
  const [hr, setHr] = useState('');
  const [speed, setSpeed] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await onSubmit({ t, hr: Number(hr), speed: recovery ? 0 : Number(speed) })) { setHr(''); setSpeed(''); }
  };
  return (
    <form className="ht-reading-form" onSubmit={submit}>
      <div className="ht-field"><label className="ht-label" htmlFor={recovery ? 'rc-t' : 'rd-t'}>Thời điểm</label><input id={recovery ? 'rc-t' : 'rd-t'} className="ht-input ht-mono" value={t} onChange={(e) => setT(e.target.value)} placeholder="HH:mm" /></div>
      <div className="ht-field"><label className="ht-label" htmlFor={recovery ? 'rc-hr' : 'rd-hr'}>Nhịp tim (bpm)</label><input id={recovery ? 'rc-hr' : 'rd-hr'} className="ht-input" inputMode="numeric" value={hr} onChange={(e) => setHr(e.target.value)} placeholder={recovery ? 'VD: 96' : 'VD: 168'} /></div>
      {!recovery && <div className="ht-field"><label className="ht-label" htmlFor="rd-sp">Tốc độ (km/h)</label><input id="rd-sp" className="ht-input" inputMode="decimal" value={speed} onChange={(e) => setSpeed(e.target.value)} placeholder="VD: 42" /></div>}
      <button type="submit" className="ht-btn ht-btn--primary" disabled={busy}><Icon name={recovery ? 'heart' : 'pulse'} size={16} />{recovery ? 'Lưu nhịp hồi phục' : 'Ghi chỉ số'}</button>
    </form>
  );
};
