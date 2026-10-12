import React, { useState } from 'react';
import { BODY_PARTS, INJURY_SEVERITIES, VetCase, VetHorse, vetApi } from '../../../api/vetApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Callout, Panel } from '../../../components/ui/Ht';
import { InjuryMap } from '../../../components/vet/InjuryMap';

const EMPTY = { part: '', severity: 'Trung bình', note: '', caseId: '' };

/** Closest named body part to a click on the map. */
const nearestPart = (x: number, y: number) =>
  BODY_PARTS.reduce((best, b) => (Math.hypot(b.x - x, b.y - y) < Math.hypot(best.x - x, best.y - y) ? b : best)).part;

/* 1.3 — mark injuries on the 2D map: pick a body part or click the map, then add. */
export const InjuryPanel: React.FC<{ horse: VetHorse; openCases: VetCase[]; onChanged: () => void }> = ({ horse, openCases, onChanged }) => {
  const actor = useActor();
  const { busy, error, setError, run } = useAction(onChanged);
  const [selected, setSelected] = useState<string | null>(null);
  const [mark, setMark] = useState(EMPTY);
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null);

  const pickPart = (part: string) => {
    setMark({ ...mark, part });
    const p = BODY_PARTS.find((b) => b.part === part);
    if (p) setPending({ x: p.x, y: p.y });
  };
  const add = async () => {
    if (!pending) { setError('Chọn bộ phận hoặc bấm lên sơ đồ để đặt vị trí.'); return; }
    if (await run(() => vetApi.addInjury(horse, { ...mark, ...pending }, actor), `Đã đánh dấu ${mark.part} trên sơ đồ.`)) {
      setPending(null);
      setMark({ ...EMPTY, caseId: mark.caseId });
    }
  };

  return (
    <Panel title="Bản đồ chấn thương 2D" sub="Chọn bộ phận hoặc bấm trực tiếp lên sơ đồ để đặt vị trí, rồi bấm Thêm.">
      <div className="ht-panel__body" style={{ display: 'grid', gap: 14 }}>
        <div className="ht-injury-tools">
          <select className="ht-select" value={mark.part} onChange={(e) => pickPart(e.target.value)} aria-label="Bộ phận">
            <option value="">— Bộ phận —</option>
            {BODY_PARTS.map((b) => <option key={b.part}>{b.part}</option>)}
          </select>
          <select className="ht-select" value={mark.severity} onChange={(e) => setMark({ ...mark, severity: e.target.value })} aria-label="Mức độ">
            {INJURY_SEVERITIES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <input className="ht-input" value={mark.note} onChange={(e) => setMark({ ...mark, note: e.target.value })} placeholder="Mô tả: sưng, đau khi chạm…" aria-label="Mô tả" />
          {openCases.length > 0 && (
            <select className="ht-select" value={mark.caseId} onChange={(e) => setMark({ ...mark, caseId: e.target.value })} aria-label="Liên kết ca khám">
              <option value="">Không gắn ca</option>
              {openCases.map((c) => <option key={c.id} value={c.id}>#{c.id} · {c.type}</option>)}
            </select>
          )}
          <button type="button" className="ht-btn ht-btn--primary ht-btn--sm" onClick={add} disabled={busy}><Icon name="check" />Thêm</button>
        </div>
        {error && <Callout tone="danger">{error}</Callout>}
        <InjuryMap injuries={horse.injuries} horseName={horse.name} selectedId={selected} onSelect={setSelected} pending={pending}
          onPick={(x, y) => { setPending({ x, y }); if (!mark.part) setMark({ ...mark, part: nearestPart(x, y) }); }} />
      </div>
      <table className="ht-table">
        <thead><tr><th>Bộ phận</th><th>Mức độ</th><th>Ngày ghi</th><th>Bác sĩ</th><th>Ghi chú</th><th /></tr></thead>
        <tbody>
          {horse.injuries.map((i) => (
            <tr key={i.id ?? i.part} className={selected === i.id ? 'is-selected' : undefined}>
              <td className="strong"><button type="button" className="ht-more" onClick={() => setSelected(i.id ?? null)}>{i.part}</button></td>
              <td><Badge tone={i.severity === 'Nặng' ? 'danger' : i.severity === 'Trung bình' ? 'warning' : 'neutral'}>{i.severity}</Badge></td>
              <td className="mono">{i.date}</td><td>{i.vet}</td><td>{i.note}{i.caseId && <span className="sub mono">#{i.caseId}</span>}</td>
              <td className="num"><button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" disabled={busy}
                onClick={() => i.id && run(() => vetApi.removeInjury(horse, i.id as string, actor), `Đã gỡ ${i.part}.`)}>Gỡ</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {horse.injuries.length === 0 && <div className="ht-empty">Chưa có chấn thương được đánh dấu.</div>}
    </Panel>
  );
};
