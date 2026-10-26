import React from 'react';
import type { Intensity } from '../../../api/trainerApi';
import { Icon } from '../../../components/ui/Icon';
import { INTENSITIES, PhaseDraft } from './templates';

export const PhaseRow: React.FC<{ phase: PhaseDraft; index: number; invalid: boolean; canRemove: boolean; onChange: (patch: Partial<PhaseDraft>) => void; onRemove: () => void }> = ({ phase: p, index: i, invalid, canRemove, onChange, onRemove }) => (
  <div className="ht-phase" style={invalid ? { borderColor: 'var(--danger-line)' } : undefined}>
    <div className="ht-phase__head">
      <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center' }}><span className="ht-phase__no">{String(i + 1).padStart(2, '0')}</span><b>Giai đoạn {i + 1}</b></span>
      {canRemove && <button type="button" className="ht-iconbtn" aria-label={`Xóa giai đoạn ${i + 1}`} onClick={onRemove}><Icon name="x" /></button>}
    </div>
    <div className="ht-phase__grid">
      <div className="ht-field"><label className="ht-label" htmlFor={`n${i}`}>Tên</label><input id={`n${i}`} className="ht-input" value={p.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="VD: Tăng sức bền" /></div>
      <div className="ht-field"><label className="ht-label" htmlFor={`w${i}`}>Số tuần</label><input id={`w${i}`} type="number" min={1} max={12} className="ht-input" value={p.weeks} onChange={(e) => onChange({ weeks: Number(e.target.value) })} /></div>
      <div className="ht-field"><label className="ht-label" htmlFor={`i${i}`}>Cường độ</label><select id={`i${i}`} className="ht-select" value={p.intensity} onChange={(e) => onChange({ intensity: e.target.value as Intensity })}>{INTENSITIES.map((x) => <option key={x}>{x}</option>)}</select></div>
      <div className="ht-field"><label className="ht-label" htmlFor={`d${i}`}>Quãng đường (m)</label><input id={`d${i}`} type="number" step={100} className="ht-input" value={p.distanceM} onChange={(e) => onChange({ distanceM: Number(e.target.value) })} /></div>
      <div className="ht-field"><label className="ht-label" htmlFor={`s${i}`}>Buổi/tuần</label><input id={`s${i}`} type="number" min={1} max={7} className="ht-input" value={p.sessionsPerWeek} onChange={(e) => onChange({ sessionsPerWeek: Number(e.target.value) })} /></div>
      <div className="ht-field"><label className="ht-label" htmlFor={`h${i}`}>Ngưỡng bpm</label><input id={`h${i}`} type="number" min={120} max={200} className="ht-input" value={p.hrLimit} onChange={(e) => onChange({ hrLimit: Number(e.target.value) })} /></div>
    </div>
  </div>
);
