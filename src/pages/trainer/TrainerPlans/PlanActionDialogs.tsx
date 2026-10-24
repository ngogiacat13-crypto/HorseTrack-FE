import React, { useState } from 'react';
import { trainerApi, type TrainingPlan } from '../../../api/trainerApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { Callout, Dialog, ReasonField } from '../../../components/ui/Ht';

export const CancelPlanDialog: React.FC<{ plan: TrainingPlan; onClose: () => void; onDone: () => void }> = ({ plan, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const [reason, setReason] = useState('');
  const confirm = async () => {
    if (await run(() => trainerApi.cancelPlan(plan, reason, actor), `Đã hủy giáo án ${plan.id} · ${plan.horseName}.`)) onDone();
  };
  return (
    <Dialog open onClose={onClose} icon="ban" tone="danger" danger busy={busy} busyLabel="Đang hủy…" testId="cancel-plan-dialog"
      title={`Hủy giáo án · ${plan.name}`} sub={`${plan.horseName} · mã ${plan.id}`} disabled={reason.trim().length < 5}
      confirmLabel="Hủy giáo án" onConfirm={confirm}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      <Callout tone="info" style={{ marginBottom: 14 }}>Các buổi tập chưa thực hiện sẽ bị hủy. Sau khi hủy, ngựa có thể được lập giáo án mới.</Callout>
      <ReasonField id="cancel-plan-reason" label="Lý do hủy" value={reason} onChange={setReason} min={5} minHeight={72}
        placeholder="VD: Ngựa đổi mục tiêu thi đấu, lập giáo án mới phù hợp hơn" />
    </Dialog>
  );
};

export const ResumePlanDialog: React.FC<{ plan: TrainingPlan; onClose: () => void; onDone: () => void }> = ({ plan, onClose, onDone }) => {
  const actor = useActor();
  const { busy, error, run } = useAction();
  const confirm = async () => {
    if (await run(() => trainerApi.resumePlan(plan, actor), `Giáo án ${plan.id} đã được cho chạy lại.`)) onDone();
  };
  return (
    <Dialog open onClose={onClose} icon="refresh" tone="brand" busy={busy} busyLabel="Đang lưu…" testId="resume-plan-dialog"
      title={`Cho chạy lại · ${plan.name}`} sub={`${plan.horseName} · mã ${plan.id}`} confirmLabel="Cho chạy lại" onConfirm={confirm}>
      {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
      <p style={{ margin: 0 }}>Giáo án chuyển về <b>chờ chạy</b> và tự chạy khi Mã phu xác nhận buổi tập và tới ngày bắt đầu. Không chạy lại được nếu ngựa đang bị khóa huấn luyện, còn buổi tập chờ bác sĩ, hoặc giáo án đã quá ngày kết thúc.</p>
      {plan.pausedReason && <Callout tone="demo" icon="warn" style={{ marginTop: 14 }}>Lý do tạm dừng: {plan.pausedReason}</Callout>}
    </Dialog>
  );
};
