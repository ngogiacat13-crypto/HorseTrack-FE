import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { SESSION_LABEL, trainerApi } from '../../../api/trainerApi';
import { useActor } from '../../../auth/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { Icon } from '../../../components/ui/Icon';
import { BackButton, Badge, PageHeader } from '../../../components/ui/Ht';
import { LoadState } from '../../../components/trainer/TrainerParts';
import { MetricsPanel } from './MetricsPanel';
import { DecisionForm } from './DecisionForm';
import { DecisionRecord, SessionSide } from './SessionSide';
import { EvaluateDialog } from '../TrainerSchedule/EvaluateDialog';

export const TrainerSessionDetail: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => trainerApi.getSession(id, actor), [id, actor]);
  const [evaluating, setEvaluating] = useState(false);

  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  const { session: s, horse, plan, previousMax } = data;
  const phase = plan.phases.find((p) => p.no === s.phaseNo) ?? plan.phases[0];
  const peak = s.readings.length ? s.readings.reduce((m, r) => (r.hr > m.hr ? r : m), s.readings[0]) : null;
  const pending = s.status === 'PAUSED_PENDING_TRAINER';
  const canEvaluate = (s.status === 'COMPLETED' || (s.status === 'STOPPED' && !s.cancelled)) && !s.evaluation;

  return (
    <div className="ht ht-page">
      <PageHeader
        crumbs={<BackButton fallback="/trainer/schedule" />}
        title={<>Phiên tập <span className="ht-mono">#{s.id}</span></>}
        badge={<Badge tone={SESSION_LABEL[s.status][1]}>{SESSION_LABEL[s.status][0]}</Badge>}
        actions={canEvaluate ? <button type="button" className="ht-btn ht-btn--primary" data-testid="session-evaluate-btn" onClick={() => setEvaluating(true)}><Icon name="check" />Đánh giá</button> : undefined}
        sub={<><b>{s.horseName}</b> · <span className="ht-mono">{s.date} {s.time}</span> · Mã phu: <b>{s.groom}</b> · {s.label} · {s.track}</>}
      />

      {(pending || s.status === 'STOPPED') && peak && (
        <div className="ht-banner" role="alert" data-testid={s.status === 'STOPPED' && s.decision?.caseId ? 'session-sent-vet' : undefined}>
          <Icon name="alarm" />
          <div>
            <b>{pending ? 'PHIÊN TẬP TẠM DỪNG — vượt ngưỡng an toàn (BR_02)' : 'PHIÊN TẬP ĐÃ KẾT THÚC'}</b>
            <p>
              Nhịp tim đạt <b className="ht-mono">{peak.hr} bpm</b> / ngưỡng {s.thresholds.hr}
              {s.pausedAt ? <> · dừng lúc <b className="ht-mono">{s.pausedAt}</b></> : null} bởi Hệ thống.{' '}
              {pending ? 'Mã phu không thể tự tiếp tục — chờ quyết định của bạn.' : s.decision?.caseId
                ? <>Đã gửi ca <span className="ht-mono">{s.decision.caseId}</span> cho bác sĩ. Giáo án vẫn chạy; Mã phu chưa bắt đầu được buổi tập mới của ngựa cho đến khi bác sĩ đóng ca hoặc khóa huấn luyện.</>
                : `Quyết định: ${s.decision?.by ?? 'HLV'}${s.decision?.at ? ` lúc ${s.decision.at}` : ''}.`}
            </p>
          </div>
        </div>
      )}

      <div className="ht-cols">
        <div>
          <MetricsPanel session={s} />
          {pending ? <DecisionForm session={s} horse={horse} phase={phase} onDone={reload} /> : s.decision ? <DecisionRecord decision={s.decision} /> : null}
        </div>
        <div><SessionSide session={s} horse={horse} plan={plan} previousMax={previousMax} /></div>
      </div>
      {evaluating && <EvaluateDialog session={s} onClose={() => setEvaluating(false)} onDone={() => { setEvaluating(false); reload(); }} />}
    </div>
  );
};
