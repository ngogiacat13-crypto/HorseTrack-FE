import React, { useEffect, useState } from 'react';
import { Callout, Dialog } from '../../components/ui/Ht';
import { Icon } from '../../components/ui/Icon';
import { useAction } from '../../hooks/useAction';
import { MEALS, type MealType, type PlanDraft, newLine, plusDaysIso, toMealType, todayIso } from './logic';
import { type FeedItem, type NutritionPlan, nutritionApi } from './nutritionApi';

const fromPlan = (p: NutritionPlan): PlanDraft => ({
  startDate: p.startDate.slice(0, 10), endDate: p.endDate.slice(0, 10), notes: p.notes ?? '',
  lines: p.details.map((d) => ({ ...newLine(toMealType(d.mealType)), itemId: String(d.inventoryItemId), quantity: String(d.quantity) })),
});
const blank = (): PlanDraft => ({ startDate: todayIso(), endDate: plusDaysIso(29), notes: '', lines: MEALS.map(([m]) => newLine(m)) });

export const NutritionPlanDialog: React.FC<{ horseId: number; horseName: string; plan: NutritionPlan | null; medical: boolean; onClose: () => void; onDone: () => void }> = ({ horseId, horseName, plan, medical, onClose, onDone }) => {
  const { busy, error, run } = useAction();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loadError, setLoadError] = useState('');
  const [draft, setDraft] = useState<PlanDraft>(() => (plan ? fromPlan(plan) : blank()));
  useEffect(() => { nutritionApi.feedItems().then(setItems).catch((e: Error) => setLoadError(e.message)); }, []);

  const setLine = (key: string, patch: Partial<PlanDraft['lines'][number]>) => setDraft((d) => ({ ...d, lines: d.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) }));
  const removeLine = (key: string) => setDraft((d) => ({ ...d, lines: d.lines.filter((l) => l.key !== key) }));
  const addLine = () => setDraft((d) => ({ ...d, lines: [...d.lines, newLine()] }));
  const unitOf = (itemId: string) => items.find((i) => String(i.itemId) === itemId)?.unit ?? '';

  const save = async () => {
    const ok = await run(
      () => (plan ? nutritionApi.update(plan.planId, horseId, draft) : nutritionApi.create(horseId, draft)),
      plan ? `Đã cập nhật thực đơn của ${horseName}.` : `Đã lên thực đơn cho ${horseName}.`,
    );
    if (ok) onDone();
  };

  return (
    <Dialog open testId="nutrition-plan-dialog" onClose={onClose} icon="heart" tone="brand" busy={busy} busyLabel="Đang lưu…" width={680}
      title={`${plan ? 'Sửa' : 'Lên'} thực đơn · ${horseName}`}
      sub={medical ? 'Khẩu phần y tế — Bác sĩ chỉ định khi ngựa bị khóa; Mã phu chỉ thực hiện (BR_03).' : 'Khẩu phần thường do HLV lên; Mã phu thực hiện theo từng bữa (BR_03).'}
      confirmLabel={plan ? 'Lưu thay đổi' : 'Lưu thực đơn'} onConfirm={save}>
      {(error || loadError) && <Callout tone="danger" style={{ marginBottom: 14 }}>{error || loadError}</Callout>}
      <div style={{ display: 'grid', gap: 12 }}>
        <div className="ht-grid-2">
          <div className="ht-field" style={{ margin: 0 }}>
            <label className="ht-label" htmlFor="np-start">Áp dụng từ<span className="ht-req">*</span></label>
            <input id="np-start" data-testid="nutrition-start-input" type="date" className="ht-input" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} />
          </div>
          <div className="ht-field" style={{ margin: 0 }}>
            <label className="ht-label" htmlFor="np-end">Đến ngày<span className="ht-req">*</span></label>
            <input id="np-end" data-testid="nutrition-end-input" type="date" className="ht-input" min={draft.startDate} value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} />
          </div>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          <span className="ht-label" style={{ margin: 0 }}>Món theo bữa<span className="ht-req">*</span></span>
          {draft.lines.map((l, i) => (
            <div key={l.key} style={{ display: 'grid', gridTemplateColumns: '96px 1fr 120px 36px', gap: 8, alignItems: 'center' }}>
              <select className="ht-select" data-testid={`nutrition-meal-select-${i}`} aria-label={`Bữa dòng ${i + 1}`} value={l.mealType} onChange={(e) => setLine(l.key, { mealType: e.target.value as MealType })}>
                {MEALS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </select>
              <select className="ht-select" data-testid={`nutrition-item-select-${i}`} aria-label={`Thức ăn dòng ${i + 1}`} value={l.itemId} onChange={(e) => setLine(l.key, { itemId: e.target.value })}>
                <option value="">{items.length ? 'Chọn thức ăn / phụ gia…' : 'Đang tải danh mục…'}</option>
                {items.map((it) => <option key={it.itemId} value={it.itemId}>{it.itemName} · còn {it.availableStock} {it.unit}</option>)}
              </select>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input className="ht-input" data-testid={`nutrition-qty-input-${i}`} aria-label={`Định lượng dòng ${i + 1}`} inputMode="decimal" placeholder="SL" value={l.quantity} onChange={(e) => setLine(l.key, { quantity: e.target.value.replace(/[^\d.,]/g, '') })} />
                <span style={{ fontSize: 12, color: 'var(--muted)', minWidth: 24 }}>{unitOf(l.itemId)}</span>
              </span>
              <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" data-testid={`nutrition-remove-line-${i}`} aria-label={`Xóa dòng ${i + 1}`} onClick={() => removeLine(l.key)}><Icon name="x" size={14} /></button>
            </div>
          ))}
          <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" data-testid="nutrition-add-line" style={{ justifySelf: 'start' }} onClick={addLine}>+ Thêm món</button>
        </div>
        <div className="ht-field" style={{ margin: 0 }}>
          <label className="ht-label" htmlFor="np-notes">Ghi chú</label>
          <textarea id="np-notes" data-testid="nutrition-notes-input" className="ht-input" style={{ minHeight: 56 }} value={draft.notes} placeholder={medical ? 'VD: Giảm năng lượng trong thời gian khóa tập.' : 'VD: Tăng cám trong tuần tập nặng.'} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
        </div>
      </div>
    </Dialog>
  );
};
