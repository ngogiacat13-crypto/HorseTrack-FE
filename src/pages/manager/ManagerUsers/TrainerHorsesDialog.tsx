import React, { useState } from 'react';
import { AssignedHorse, AssignedStall, MAX_TRAINER_HORSES, ManagedUser, managerApi } from '../../../api/managerApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Callout, Dialog } from '../../../components/ui/Ht';
import { USE_BACKEND } from '../../../api/beClient';

const NO_ZONE = 'Chưa rõ khu';

export const TrainerHorsesDialog: React.FC<{ user: ManagedUser; stalls: AssignedStall[]; horses: AssignedHorse[]; onClose: () => void; onDone: () => void; onReload?: () => void }> = ({ user, stalls, horses, onClose, onDone, onReload }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const [horseIds, setHorseIds] = useState<string[]>(() => horses.filter((h) => h.trainerId === user.id).map((h) => h.id));
  const [limitNote, setLimitNote] = useState('');
  const limit = user.horseLimit ?? MAX_TRAINER_HORSES;
  const zoneOf = (h: AssignedHorse) => stalls.find((s) => s.horseId === h.id)?.zone ?? NO_ZONE;
  const zones = [...new Set(horses.map(zoneOf))].sort();
  const toggle = (id: string) => {
    if (!horseIds.includes(id) && horseIds.length >= limit) {
      setLimitNote(`Mỗi HLV chỉ phụ trách tối đa ${limit} ngựa. Bỏ chọn một con trước khi chọn con khác.`);
      return;
    }
    setLimitNote('');
    setHorseIds((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));
  };
  const summary = zones.map((z) => [z, horses.filter((h) => zoneOf(h) === z && horseIds.includes(h.id)).length] as const).filter(([, n]) => n > 0);
  const save = async () => {
    const done = USE_BACKEND
      ? `Đã gửi yêu cầu. ${user.fullName} cần xác nhận trước khi phân công có hiệu lực.`
      : `Đã phân công ${horseIds.length} ngựa cho ${user.fullName}.`;
    if (await run(() => managerApi.assignTrainer(user, horseIds, actor), done)) onDone();
    else onReload?.();
  };

  return (
    <Dialog open testId="trainer-horses-dialog" onClose={onClose} icon="stable" tone="brand" width={700} busy={busy} busyLabel="Đang lưu…"
      title={`Phân công huấn luyện · ${user.fullName}`} sub="Chọn từng con ngựa HLV phụ trách — ngựa ở khu nào cũng được, không cần phân khu."
      confirmLabel="Lưu phân công" onConfirm={save}>
      {error && <Callout tone="danger" testId="trainer-horses-error" style={{ marginBottom: 14 }}>{error}</Callout>}
      <div data-testid="trainer-horses-count" style={{ fontWeight: 600, marginBottom: 8 }}>Đã chọn {horseIds.length}/{limit}</div>
      {limitNote && <Callout tone="danger" testId="trainer-horses-limit" style={{ marginBottom: 14 }}>{limitNote}</Callout>}
      {horses.length === 0 && <div className="ht-empty">Chưa có ngựa đã duyệt (có chuồng) để phân công.</div>}
      <div data-testid="trainer-horses-list" style={{ maxHeight: 'min(40vh, 360px)', overflowY: 'auto', paddingRight: 4 }}>
      {zones.map((zone) => (
        <div key={zone} style={{ marginBottom: 14 }}>
          <div className="ht-label" style={{ marginBottom: 8 }}>{zone}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {horses.filter((h) => zoneOf(h) === zone).map((h) => {
              const other = h.trainerId && h.trainerId !== user.id ? h.trainerName ?? 'HLV khác' : null;
              const locked = h.canChangeTrainer === false;
              return (
                <label key={h.id} className="ht-role" style={{ alignItems: 'flex-start' }}>
                  <input type="checkbox" data-testid={`trainer-horse-${h.id}`} checked={horseIds.includes(h.id)} disabled={locked} onChange={() => toggle(h.id)} />
                  <span>
                    <b>{h.name}</b> · {h.stall}
                    {other && <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)' }}>Đang do {other} phụ trách</span>}
                    {h.openPlanName && <span data-testid={`trainer-open-plan-${h.id}`} style={{ display: 'block', fontSize: 12, color: 'var(--warning-ink, var(--muted))' }}>Đang có giáo án mở: {h.openPlanName}</span>}
                    {h.pendingNote && <span data-testid={`trainer-pending-${h.id}`} style={{ display: 'block', fontSize: 12, color: 'var(--warning-ink, var(--muted))' }}>{h.pendingNote}</span>}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
      </div>
      <Callout tone="info" style={{ marginTop: 6 }}>
        {summary.length ? `Đã chọn ${horseIds.length} ngựa: ${summary.map(([z, n]) => `${z} ${n}`).join(' · ')}.` : 'Chưa chọn ngựa nào.'}
        {' '}Chỉ chuyển HLV khi ngựa không còn giáo án đang mở (chưa bắt đầu, đang chạy hoặc tạm dừng). Phác đồ điều trị và thực đơn dinh dưỡng vẫn theo ngựa.
        {USE_BACKEND && ' Phân công chỉ có hiệu lực sau khi HLV xác nhận. Cả hai HLV đều nhận email.'}
      </Callout>
    </Dialog>
  );
};
