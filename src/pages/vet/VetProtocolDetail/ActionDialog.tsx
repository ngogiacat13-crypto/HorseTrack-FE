import React, { useState } from 'react';
import { dateKey, phaseRequiredBy, Protocol, stockShort, vetApi } from '../../../api/vetApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Callout, Dialog, ReasonField } from '../../../components/ui/Ht';
import { phaseProgressOf } from '../../../features/protocol-phases/phaseState';

export type ProtocolAction = 'send' | 'cancel' | 'wait' | 'confirm' | 'progress' | 'complete' | 'continue-phase' | 'stop-phase';

interface Spec { title: string; sub?: string; label: string; field?: [label: string, placeholder: string, min?: number]; danger?: boolean; ok: string }

const specFor = (p: Protocol, a: ProtocolAction): Spec => {
  const short = stockShort(p);
  const requiredBy = phaseRequiredBy(p, short.map((l) => l.itemId));
  const late = short.some((l) => l.eta && dateKey(l.eta) > dateKey(requiredBy));
  switch (a) {
    case 'send': return { title: `Gửi ${p.id} cho kho kiểm tồn`, label: 'Gửi kiểm tồn', ok: `${p.id} đã gửi kho kiểm tồn.`,
      sub: p.replaces ? `Khi gửi, ${p.replaces} chuyển SUPERSEDED và không được cấp phát.` : 'Kho đối chiếu tồn, lô/hạn dùng và phản hồi đủ hoặc thiếu kèm ETA.' };
    case 'cancel': return p.state === 'DRAFT'
      ? { title: `Hủy bản nháp ${p.id}`, label: 'Hủy bản nháp', danger: true, ok: `Đã hủy bản nháp ${p.id}.` }
      : { title: `Hủy phác đồ ${p.id}`, label: 'Hủy phác đồ', danger: true, ok: `Đã hủy ${p.id} — kho đã được báo và trả lại hàng đã giữ.`,
        sub: 'Kho thấy phác đồ ở mục “Bác sĩ đã đổi / hủy” kèm lý do, hàng đã giữ được trả lại. Sau khi hủy, lập phác đồ mới cho ca khám này nếu cần.',
        field: ['Lý do hủy', 'VD: Khám lại thấy cần đổi hướng điều trị, sẽ lập phác đồ mới.', 10] };
    case 'wait': return { title: 'Chờ hàng về', label: 'Chọn chờ hàng', ok: `${p.id}: chờ hàng về.`,
      sub: `Hàng thiếu dự kiến về ${short.map((l) => l.eta).filter(Boolean).join(', ') || '—'}; mốc cần thuốc ${requiredBy}.`,
      field: [late ? 'Đánh giá chờ vẫn an toàn về chuyên môn' : 'Ghi chú', 'VD: Ngựa ổn định, chườm lạnh thay thế đến khi hàng về.'] };
    case 'confirm': return { title: `Xác nhận phác đồ ${p.id}`, label: 'Xác nhận & chuyển kho cấp phát', ok: `${p.id} đã xác nhận — kho chuẩn bị cấp phát.`,
      sub: 'Kho đã đủ khả năng cấp. Xác nhận phác đồ vẫn phù hợp với tình trạng ngựa hiện tại.',
      field: ['Đánh giá tính phù hợp', 'VD: Đã khám lại, tình trạng không đổi, giữ nguyên liều.'] };
    case 'progress': return { title: 'Ghi tiến triển điều trị', label: 'Lưu tiến triển', ok: 'Đã ghi tiến triển.',
      field: ['Tiến triển', 'VD: Giảm sưng, đi lại tốt hơn, nhiệt độ bình thường.'] };
    case 'complete': return { title: `Kết thúc điều trị ${p.id}`, label: 'Kết thúc điều trị', ok: `${p.id} đã kết thúc điều trị.`,
      sub: 'Ghi kết quả và chỉ định tiếp theo. Mở khóa huấn luyện (nếu đủ điều kiện) làm riêng ở hồ sơ ngựa.',
      field: ['Kết quả & chỉ định tiếp theo', 'VD: Hết sưng, tái khám sau 2 tuần, tập nhẹ 1 tuần đầu.'] };
    case 'continue-phase': return { title: 'Tiếp tục phác đồ', label: 'Hoàn thành giai đoạn & tiếp tục', ok: 'Đã hoàn thành giai đoạn và gửi thông báo thanh toán giai đoạn tiếp theo.',
      sub: 'Chủ ngựa phải thanh toán chi phí giai đoạn tiếp theo trước khi bác sĩ bắt đầu giai đoạn đó.',
      field: ['Đánh giá giai đoạn', 'VD: Đáp ứng tốt, tiếp tục theo dõi thêm 7 ngày.'] };
    case 'stop-phase': return { title: 'Ngưng phác đồ sau giai đoạn', label: 'Ngưng sau giai đoạn', danger: true, ok: 'Đã ngưng phác đồ và lưu lý do quyết định.',
      field: ['Lý do ngưng', 'VD: Đã đạt mục tiêu, không cần tiếp tục giai đoạn sau.', 10] };
  }
};

export const ActionDialog: React.FC<{ protocol: Protocol; action: ProtocolAction; onClose: () => void; onDone: () => void }> = ({ protocol: p, action, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const [text, setText] = useState('');
  const spec = specFor(p, action);
  const activePhaseNo = phaseProgressOf(p).find((phase) => phase.status === 'IN_PROGRESS')?.phaseNo ?? 0;
  const call: Record<ProtocolAction, () => Promise<unknown>> = {
    send: () => vetApi.sendStockCheck(p, actor),
    cancel: () => vetApi.cancelDraft(p, actor, text),
    wait: () => vetApi.waitRestock(p, text, actor),
    confirm: () => vetApi.confirmProtocol(p, text, actor),
    progress: () => vetApi.addProgress(p, text, actor),
    complete: () => vetApi.completeProtocol(p, text, actor),
    'continue-phase': () => vetApi.completePhase(p, activePhaseNo, 'CONTINUE', text, actor),
    'stop-phase': () => vetApi.completePhase(p, activePhaseNo, 'STOP', text, actor),
  };
  const confirm = async () => { if (await run(call[action], spec.ok)) onDone(); };

  return (
    <Dialog open onClose={onClose} icon={action === 'cancel' ? 'x' : action === 'wait' ? 'clock' : 'check'} tone={spec.danger ? 'danger' : 'brand'} danger={spec.danger}
      busy={busy} title={spec.title} sub={spec.sub} confirmLabel={spec.label} onConfirm={confirm}>
      {error && <Callout tone="danger" style={{ marginBottom: spec.field ? 14 : 0 }}>{error}</Callout>}
      {spec.field && <ReasonField id="pd-text" label={spec.field[0]} value={text} onChange={setText} placeholder={spec.field[1]} min={spec.field[2]} />}
    </Dialog>
  );
};
