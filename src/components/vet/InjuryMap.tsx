import React from 'react';
import PropTypes from 'prop-types';
import type { Injury } from '../../api/trainerApi';

/* 2D injury map (spec 1.3) on public/horse-injury-map.svg — the horse seen from its left side.
   Marks are placed in % of the image so they stay on the same body part at any width.
   - read-only: HeadTrainer / others see the marks.
   - editable: the vet clicks the body to place a new mark (onPick), and picks a mark to see its details. */
export interface InjuryMapProps {
  injuries: Injury[];
  horseName: string;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  /** Editable mode: where the new mark will go, and the click handler that moves it. */
  pending?: { x: number; y: number } | null;
  onPick?: (x: number, y: number) => void;
}

const sevKey = (s: string) => (s === 'Nặng' ? 'high' : s === 'Trung bình' ? 'mid' : 'low');

export const InjuryMap: React.FC<InjuryMapProps> = ({ injuries, horseName, selectedId, onSelect, pending, onPick }) => {
  const sel = injuries.find((i) => i.id === selectedId);
  const pick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onPick) return;
    const r = e.currentTarget.getBoundingClientRect();
    onPick(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100);
  };
  return (
    <div className="ht-injury">
      <div className={`ht-injury__canvas${onPick ? ' is-editable' : ''}`} onClick={pick}
        role={onPick ? 'button' : undefined} aria-label={onPick ? `Bấm lên sơ đồ ${horseName} để đặt vị trí chấn thương` : undefined}>
        <img src="/horse-injury-map.svg" alt={`Sơ đồ cơ thể ngựa ${horseName}, nhìn từ bên trái`} draggable={false} />
        {injuries.map((i) => (
          <button key={i.id ?? i.part} type="button" className="ht-injury__mark" data-sev={sevKey(i.severity)} aria-pressed={selectedId === i.id}
            style={{ left: `${i.x}%`, top: `${i.y}%` }} title={`${i.part} · ${i.severity}`} aria-label={`${i.part}, mức ${i.severity}`}
            onClick={(e) => { e.stopPropagation(); onSelect?.(selectedId === i.id ? null : i.id ?? null); }} />
        ))}
        {pending && <span className="ht-injury__mark ht-injury__mark--pending" style={{ left: `${pending.x}%`, top: `${pending.y}%` }} aria-hidden="true" />}
        {sel && (
          <div className="ht-injury__pop" style={{ left: `${Math.min(sel.x, 62)}%`, top: `${sel.y > 60 ? sel.y - 4 : sel.y + 4}%`, transform: sel.y > 60 ? 'translateY(-100%)' : undefined }}
            onClick={(e) => e.stopPropagation()}>
            <b>{sel.part}</b> · <span data-sev={sevKey(sel.severity)}>{sel.severity}</span>
            <p>{sel.note}</p>
            <small>Ghi {sel.date.slice(0, 5)} · BS {sel.vet}{sel.caseId ? ` · #${sel.caseId}` : ''}</small>
          </div>
        )}
      </div>
      <div className="ht-injury__legend" aria-hidden="true">
        <span><i data-sev="high" />Nặng</span><span><i data-sev="mid" />Trung bình</span><span><i data-sev="low" />Nhẹ</span>
        {onPick && <span><i className="pending" />Vị trí đang chọn</span>}
      </div>
    </div>
  );
};

Object.assign(InjuryMap, {
  propTypes: {
    injuries: PropTypes.arrayOf(PropTypes.shape({ part: PropTypes.string.isRequired, severity: PropTypes.string.isRequired, x: PropTypes.number.isRequired, y: PropTypes.number.isRequired })).isRequired,
    horseName: PropTypes.string.isRequired,
    selectedId: PropTypes.string,
    onSelect: PropTypes.func,
    pending: PropTypes.shape({ x: PropTypes.number, y: PropTypes.number }),
    onPick: PropTypes.func,
  },
});
