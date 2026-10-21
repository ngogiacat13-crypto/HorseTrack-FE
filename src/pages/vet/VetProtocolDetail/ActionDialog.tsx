import React, { useState } from 'react';
import { dateKey, phaseRequiredBy, Protocol, stockShort, vetApi } from '../../../api/vetApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Callout, Dialog, ReasonField } from '../../../components/ui/Ht';

export type ProtocolAction = 'send' | 'cancel' | 'wait' | 'confirm' | 'progress' | 'complete';

interface Spec { title: string; sub?: string; label: string; field?: [label: string, placeholder: string, min?: number]; danger?: boolean; ok: string }

const specFor = (p: Protocol, a: ProtocolAction): Spec => {
  const short = stockShort(p);
  const requiredBy = phaseRequiredBy(p, short.map((l) => l.itemId));
  const late = short.some((l) => l.eta && dateKey(l.eta) > dateKey(requiredBy));
  switch (a) {
    case 'send': return { title: `Gửi ${p.id} cho kho kiểm tồn`, label: 'Gửi kiểm tồn', ok: `${p.id} đã gửi kho kiểm tồn.`,
      sub: p.replaces ? `Khi gửi, ${p.replaces} chuyển SUPERSEDED và không được cấp phát.` : 'Kho đối chiếu tồn, lô/hạn dùng và phản hồi đủ hoặc thiếu kèm ETA.' };
    case 'cancel': return { title: `Hủy bản nháp ${p.id}`, label: 'Hủy bản nháp', danger: true, ok: `Đã hủy bản nháp ${p.id}.` };
    case 'wait': return { title: 'Chờ hàng về', label: 'Chọn chờ hàng', ok: `${p.id}: chờ hàng về.`,
      sub: `Hàng thiếu dự kiến về ${short.map((l) => l.eta).filter(Boolean).join(', ') || '—'}; mốc cần thuốc ${requiredBy}.`,
      field: [late ? 'Đánh giá chờ vẫn an toàn về chuyên môn' : 'Ghi chú', 'VD: Ngựa ổn định, chườm lạnh thay thế đến khi hàng về.', late ? 15 : 10] };
    case 'confirm': return { title: `Xác nhận phác đồ ${p.id}`, label: 'Xác nhận & chuyển kho cấp phát', ok: `${p.id} đã xác nhận — kho chuẩn bị cấp phát.`,
      sub: 'Kho đã đủ khả năng cấp. Xác nhận phác đồ vẫn phù hợp với tình trạng ngựa hiện tại.',
      field: ['Đánh giá tính phù hợp', 'VD: Đã khám lại, tình trạng không đổi, giữ nguyên liều.'] };
    case 'progress': return { title: 'Ghi tiến triển điều trị', label: 'Lưu tiến triển', ok: 'Đã ghi tiến triển.',
      field: ['Tiến triển', 'VD: Giảm sưng, đi lại tốt hơn, nhiệt độ bình thường.'] };
    case 'complete': return { title: `Kết thúc điều trị ${p.id}`, label: 'Kết thúc điều trị', ok: `${p.id} đã kết thúc điều trị.`,
      sub: 'Ghi kết quả và chỉ định tiếp theo. Mở khóa huấn luyện (nếu đủ điều kiện) làm riêng ở hồ sơ ngựa.',
      field: ['Kết quả & chỉ định tiếp theo', 'VD: Hết sưng, tái khám sau 2 tuần, tập nhẹ 1 tuần đầu.'] };
  }
};

export const ActionDialog: React.FC<{ protocol: Protocol; action: ProtocolAction; onClose: () => void; onDone: () => void }> = ({ protocol: p, action, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const [text, setText] = useState('');
  const spec = specFor(p, action);
  const call: Record<ProtocolAction, () => Promise<unknown>> = {
    send: () => vetApi.sendStockCheck(p, actor),
    cancel: () => vetApi.cancelDraft(p, actor),
    wait: () => vetApi.waitRestock(p, text, actor),
    confirm: () => vetApi.confirmProtocol(p, text, actor),
    progress: () => vetApi.addProgress(p, text, actor),
    complete: () => vetApi.completeProtocol(p, text, actor),
  };
  const confirm = async () => { if (await run(call[action], spec.ok)) onDone(); };

  return (
    <Dialog open onClose={onClose} icon={action === 'cancel' ? 'x' : action === 'wait' ? 'clock' : 'check'} tone={spec.danger ? 'danger' : 'brand'} danger={spec.danger}
      busy={busy} title={spec.title} sub={spec.sub} confirmLabel={spec.label} onConfirm={confirm}>
      {error && <Callout tone="danger" style={{ marginBottom: spec.field ? 14 : 0 }}>{error}</Callout>}
      {spec.field && <ReasonField id="pd-text" label={spec.field[0]} value={text} onChange={setText} placeholder={spec.field[1]} min={spec.field[2] ?? 10} />}
    </Dialog>
  );
};
