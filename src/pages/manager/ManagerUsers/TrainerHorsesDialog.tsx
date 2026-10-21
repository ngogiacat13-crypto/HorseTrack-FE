import React, { useState } from 'react';
import { AssignedHorse, AssignedStall, ManagedUser, managerApi } from '../../../api/managerApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Callout, Dialog } from '../../../components/ui/Ht';

const NO_ZONE = 'Chưa rõ khu';

export const TrainerHorsesDialog: React.FC<{ user: ManagedUser; stalls: AssignedStall[]; horses: AssignedHorse[]; onClose: () => void; onDone: () => void }> = ({ user, stalls, horses, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const [horseIds, setHorseIds] = useState<string[]>(() => horses.filter((h) => h.trainerId === user.id).map((h) => h.id));
  const zoneOf = (h: AssignedHorse) => stalls.find((s) => s.horseId === h.id)?.zone ?? NO_ZONE;
  const zones = [...new Set(horses.map(zoneOf))].sort();
  const toggle = (id: string) => setHorseIds((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));
  const summary = zones.map((z) => [z, horses.filter((h) => zoneOf(h) === z && horseIds.includes(h.id)).length] as const).filter(([, n]) => n > 0);
  const save = async () => {
    if (await run(() => managerApi.assignTrainer(user, horseIds, actor), `Đã phân công ${horseIds.length} ngựa cho ${user.fullName}.`)) onDone();
  };

  return (
    <Dialog open testId="trainer-horses-dialog" onClose={onClose} icon="stable" tone="brand" width={700} busy={busy} busyLabel="Đang lưu…"
      title={`Phân công huấn luyện · ${user.fullName}`} sub="Chọn từng con ngựa HLV phụ trách — ngựa ở khu nào cũng được, không cần phân khu."
      confirmLabel="Lưu phân công" onConfirm={save}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      {horses.length === 0 && <div className="ht-empty">Chưa có ngựa đã duyệt (có chuồng) để phân công.</div>}
      {zones.map((zone) => (
        <div key={zone} style={{ marginBottom: 14 }}>
          <div className="ht-label" style={{ marginBottom: 8 }}>{zone}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {horses.filter((h) => zoneOf(h) === zone).map((h) => {
              const other = h.trainerId && h.trainerId !== user.id ? h.trainerName ?? 'HLV khác' : null;
              return (
                <label key={h.id} className="ht-role" style={{ alignItems: 'flex-start' }}>
                  <input type="checkbox" data-testid={`trainer-horse-${h.id}`} checked={horseIds.includes(h.id)} onChange={() => toggle(h.id)} />
                  <span>
                    <b>{h.name}</b> · {h.stall}
                    {other && <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)' }}>Đang do {other} phụ trách</span>}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
      <Callout tone="info" style={{ marginTop: 6 }}>
        {summary.length ? `Đã chọn ${horseIds.length} ngựa: ${summary.map(([z, n]) => `${z} ${n}`).join(' · ')}.` : 'Chưa chọn ngựa nào.'}
        {' '}Ngựa đang do HLV khác phụ trách sẽ được bàn giao cùng giáo án đang chạy.
      </Callout>
    </Dialog>
  );
};
