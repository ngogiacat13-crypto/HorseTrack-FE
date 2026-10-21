import React, { useState } from 'react';
import { MedicalDiet, VetHorse, vetApi } from '../../../api/vetApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Callout, Dialog, ReasonField } from '../../../components/ui/Ht';

type DietForm = Omit<MedicalDiet, 'by' | 'at'>;
const EMPTY: DietForm = { morning: '', noon: '', evening: '', special: '', note: '' };
const MEALS = [['morning', 'Bữa sáng'], ['noon', 'Bữa trưa'], ['evening', 'Bữa chiều'], ['special', 'Thức ăn / phụ gia đặc biệt']] as const;

export const DietDialog: React.FC<{ horse: VetHorse; onClose: () => void; onDone: () => void }> = ({ horse, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const [diet, setDiet] = useState<DietForm>(horse.medicalDiet ? { ...horse.medicalDiet } : EMPTY);

  const save = async (value: DietForm | null, ok: string) => { if (await run(() => vetApi.setDiet(horse, value, actor), ok)) onDone(); };

  return (
    <Dialog open onClose={onClose} icon="heart" tone="brand" busy={busy} busyLabel="Đang lưu…" width={600}
      title={`Khẩu phần y tế · ${horse.name}`} sub="Chỉ định của Bác sĩ được ưu tiên hơn khẩu phần thường; Mã phu chỉ thực hiện, không tự sửa (BR_03)."
      confirmLabel="Lưu chỉ định" onConfirm={() => save(diet, 'Đã lưu khẩu phần y tế.')}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      <div style={{ display: 'grid', gap: 12 }}>
        {MEALS.map(([k, label]) => (
          <div key={k} className="ht-field" style={{ margin: 0 }}>
            <label className="ht-label" htmlFor={`dt-${k}`}>{label}</label>
            <input id={`dt-${k}`} className="ht-input" value={diet[k]} onChange={(e) => setDiet({ ...diet, [k]: e.target.value })} />
          </div>
        ))}
        <ReasonField id="dt-note" label="Lý do / ghi chú chỉ định" value={diet.note} onChange={(v) => setDiet({ ...diet, note: v })} placeholder="VD: Giảm năng lượng trong thời gian khóa tập." minHeight={56} />
        {horse.medicalDiet && (
          <button type="button" className="ht-btn ht-btn--ghost" disabled={busy} onClick={() => save(null, 'Đã bỏ khẩu phần y tế — quay về khẩu phần thường.')}>
            Bỏ chỉ định — quay về khẩu phần thường
          </button>
        )}
      </div>
    </Dialog>
  );
};
