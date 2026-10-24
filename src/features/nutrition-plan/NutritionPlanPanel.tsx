import React, { useCallback, useEffect, useState } from 'react';
import { Badge, Callout, Dialog, Panel, useToast } from '../../components/ui/Ht';
import { Icon } from '../../components/ui/Icon';
import { useAction } from '../../hooks/useAction';
import { MEALS, dmy, editBlock, isCurrent, isUpcoming, toMealType } from './logic';
import { type NutritionPlan, type TodayLine, nutritionApi } from './nutritionApi';
import { NutritionPlanDialog } from './NutritionPlanDialog';

const STATUS: Record<string, string> = { ACTIVE: 'Đang áp dụng', ENDED: 'Đã kết thúc', CANCELLED: 'Đã hủy' };
const fmtQty = (q: number) => (Number.isInteger(q) ? String(q) : q.toLocaleString('vi-VN'));

const Meals: React.FC<{ lines: { mealType: string; name: string; quantity: number; unit?: string | null }[] }> = ({ lines }) => (
  <div className="ht-meals" data-testid="nutrition-meals">
    {MEALS.map(([k, label]) => {
      const meal = lines.filter((l) => toMealType(l.mealType) === k);
      return <div key={k}><span className="ht-overline">{label}</span>{meal.length ? meal.map((l) => `${fmtQty(l.quantity)}${l.unit ? ` ${l.unit}` : ''} ${l.name}`).join(' + ') : '—'}</div>;
    })}
  </div>
);

export const NutritionPlanPanel: React.FC<{ horseId: string | number; horseName: string; locked: boolean; role: string; title?: string; children?: React.ReactNode; onChanged?: () => void }> = ({ horseId, horseName, locked, role, title, children, onChanged }) => {
  const id = Number(horseId);
  const groomView = role === 'Groom';
  const [plans, setPlans] = useState<NutritionPlan[] | null>(null);
  const [today, setToday] = useState<TodayLine[]>([]);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState<NutritionPlan | 'new' | null>(null);
  const [cancelling, setCancelling] = useState<NutritionPlan | null>(null);
  const { busy, error, run } = useAction();

  const load = useCallback(() => {
    const valid = Number.isFinite(id) && id > 0;
    Promise.all([valid ? nutritionApi.listPlans(id) : Promise.resolve([] as NutritionPlan[]), valid && groomView ? nutritionApi.today(id) : Promise.resolve([] as TodayLine[])])
      .then(([p, t]) => { setLoadError(''); setPlans(p); setToday(t); })
      .catch((e: Error) => { setPlans([]); setLoadError(e.message); });
  }, [id, groomView]);
  useEffect(load, [load]);

  const refresh = () => { load(); onChanged?.(); };
  const toast = useToast();
  const [sending, setSending] = useState(false);
  const sendFeed = async () => {
    if (!current) return;
    setSending(true);
    try {
      toast(await nutritionApi.sendFeedTasks(current.planId));
    } catch (e) {
      toast((e as Error).message || 'Không gửi được việc cho ăn.');
    } finally {
      setSending(false);
    }
  };
  const current = plans?.find((p) => isCurrent(p)) ?? null;
  const upcoming = plans?.filter((p) => isUpcoming(p)) ?? [];
  const history = plans?.filter((p) => p !== current && !upcoming.includes(p)).slice(0, 4) ?? [];
  const block = groomView ? 'view' : editBlock(role, locked);
  const medical = locked || current?.planType === 'MEDICAL';
  const lines = groomView && today.length
    ? today.map((t) => ({ mealType: t.mealType, name: t.inventoryItemName, quantity: t.quantity, unit: current?.details.find((d) => d.inventoryItemId === t.inventoryItemId)?.unit }))
    : (current?.details ?? []).map((d) => ({ mealType: d.mealType, name: d.itemName ?? `#${d.inventoryItemId}`, quantity: d.quantity, unit: d.unit }));

  const right = block
    ? (current ? <Badge tone={current.planType === 'MEDICAL' ? 'danger' : 'neutral'} plain>{current.planType === 'MEDICAL' ? 'Bác sĩ chỉ định' : 'Khẩu phần thường'}</Badge> : null)
    : current
      ? <span style={{ display: 'flex', gap: 6 }}>
        <button type="button" className="ht-more" data-testid="nutrition-feed-tasks-btn" disabled={sending} onClick={sendFeed}>{sending ? 'Đang gửi…' : 'Gửi việc cho ăn'}</button>
        <button type="button" className="ht-more" data-testid="nutrition-edit-btn" onClick={() => setEditing(current)}>Sửa <Icon name="arrow" /></button>
        <button type="button" className="ht-more" data-testid="nutrition-cancel-btn" style={{ color: 'var(--danger-ink)' }} onClick={() => setCancelling(current)}>Hủy</button>
      </span>
      : <button type="button" className="ht-more" data-testid="nutrition-create-btn" onClick={() => setEditing('new')}>Lên thực đơn <Icon name="arrow" /></button>;

  return (
    <Panel as="h3" title={title ?? (groomView ? 'Thực đơn hôm nay' : 'Thực đơn dinh dưỡng')} right={right}>
      <div className="ht-panel__body" style={{ display: 'grid', gap: 10 }} data-testid="nutrition-panel">
        {loadError && <Callout tone="danger">{loadError}</Callout>}
        {!plans && !loadError && <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>Đang tải thực đơn…</p>}
        {plans && (current ? (
          <>
            <Meals lines={lines} />
            {current.specialInstructions && <div style={{ fontSize: 13 }}><b>Đặc biệt (Bác sĩ duyệt):</b> {current.specialInstructions}</div>}
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {current.notes ? `${current.notes} · ` : ''}{current.planType === 'MEDICAL' ? 'Khẩu phần y tế' : 'Khẩu phần thường'} · {current.createdByName ?? '—'} · {dmy(current.startDate)} – {dmy(current.endDate)}
            </div>
            {groomView && current.planType === 'MEDICAL' && <Callout tone="demo" icon="lock">Khẩu phần y tế — chỉ thực hiện, không tự sửa (BR_03).</Callout>}
          </>
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }} data-testid="nutrition-empty">
            {groomView ? 'Hôm nay chưa có thực đơn — hỏi HLV (hoặc Bác sĩ nếu ngựa đang khóa y tế).' : 'Chưa có thực đơn đang áp dụng.'}
          </p>
        ))}
        {upcoming.map((p) => <div key={p.planId} style={{ fontSize: 13, color: 'var(--info-ink)' }}><Icon name="clock" size={13} /> Thực đơn mới áp dụng từ {dmy(p.startDate)} ({p.details.length} món)</div>)}
        {block && block !== 'view' && <div style={{ fontSize: 12, color: 'var(--muted)' }}><Icon name="info" size={12} /> {block}</div>}
        {!groomView && history.length > 0 && (
          <details>
            <summary style={{ fontSize: 12, cursor: 'pointer', color: 'var(--muted)' }} data-testid="nutrition-history-toggle">Thực đơn trước ({history.length})</summary>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 12 }}>
              {history.map((p) => <li key={p.planId}>{dmy(p.startDate)} – {dmy(p.endDate)} · {p.details.length} món · {STATUS[p.status] ?? 'Hết hạn'} · {p.createdByName ?? '—'}</li>)}
            </ul>
          </details>
        )}
        {children}
      </div>
      {editing && (
        <NutritionPlanDialog horseId={id} horseName={horseName} plan={editing === 'new' ? null : editing} medical={medical}
          onClose={() => setEditing(null)} onDone={() => { setEditing(null); refresh(); }} />
      )}
      {cancelling && (
        <Dialog open testId="nutrition-cancel-dialog" onClose={() => setCancelling(null)} icon="x" tone="danger" danger busy={busy}
          title={`Hủy thực đơn · ${horseName}`} sub={`Thực đơn ${dmy(cancelling.startDate)} – ${dmy(cancelling.endDate)} sẽ ngừng áp dụng; Mã phu không còn thấy thực đơn này.`}
          confirmLabel="Hủy thực đơn" onConfirm={async () => { if (await run(() => nutritionApi.cancel(cancelling.planId), 'Đã hủy thực đơn.')) { setCancelling(null); refresh(); } }}>
          {error && <Callout tone="danger">{error}</Callout>}
        </Dialog>
      )}
    </Panel>
  );
};
