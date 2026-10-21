import React, { useState } from 'react';
import { groomApi } from '../../../api/groomApi';
import type { VetHorse } from '../../../api/vetApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Callout, Dialog, ReasonField } from '../../../components/ui/Ht';

export const FeedRequestDialog: React.FC<{ horse: VetHorse; onClose: () => void; onDone: () => void }> = ({ horse, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const [item, setItem] = useState('');
  const [reason, setReason] = useState('');
  const save = async () => { if (await run(() => groomApi.requestFeed(horse, { item, reason }, actor), 'Đã gửi đề nghị cho Bác sĩ thú y.')) onDone(); };
  return (
    <Dialog open onClose={onClose} icon="heart" tone="brand" busy={busy} title={`Đề nghị chỉnh khẩu phần · ${horse.name}`}
      sub="Khẩu phần do Bác sĩ chỉ định — Mã phu không tự sửa. Đề nghị được gửi vào hồ sơ của Bác sĩ để duyệt." confirmLabel="Gửi Bác sĩ" onConfirm={save}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      <div style={{ display: 'grid', gap: 12 }}>
        <div className="ht-field" style={{ margin: 0 }}><label className="ht-label" htmlFor="fr-item">Thức ăn / phụ gia đề nghị<span className="ht-req">*</span></label>
          <input id="fr-item" className="ht-input" value={item} onChange={(e) => setItem(e.target.value)} placeholder="VD: Men tiêu hóa 50 g/ngày" /></div>
        <ReasonField id="fr-reason" label="Lý do / dấu hiệu quan sát" value={reason} onChange={setReason} placeholder="VD: Ngựa ăn kém, phân lỏng nhẹ 2 ngày." minHeight={64} />
      </div>
    </Dialog>
  );
};
