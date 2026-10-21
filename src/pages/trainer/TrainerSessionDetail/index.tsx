import React from 'react';
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

export const TrainerSessionDetail: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => trainerApi.getSession(id, actor), [id, actor]);

  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  const { session: s, horse, plan, previousMax } = data;
  const phase = plan.phases.find((p) => p.no === s.phaseNo) ?? plan.phases[0];
  const peak = s.readings.length ? s.readings.reduce((m, r) => (r.hr > m.hr ? r : m), s.readings[0]) : null;
  const pending = s.status === 'PAUSED_PENDING_TRAINER';

  return (
    <div className="ht ht-page">
      <PageHeader
        crumbs={<BackButton fallback="/trainer/schedule" />}
        title={<>Phiên tập <span className="ht-mono">#{s.id}</span></>}
        badge={<Badge tone={SESSION_LABEL[s.status][1]}>{SESSION_LABEL[s.status][0]}</Badge>}
        sub={<><b>{s.horseName}</b> · <span className="ht-mono">{s.date} {s.time}</span> · Mã phu: <b>{s.groom}</b> · {s.label} · {s.track}</>}
      />

      {(pending || s.status === 'STOPPED') && peak && (
        <div className="ht-banner" role="alert">
          <Icon name="alarm" />
          <div>
            <b>{pending ? 'PHIÊN TẬP TẠM DỪNG — vượt ngưỡng an toàn (BR_02)' : 'PHIÊN TẬP ĐÃ DỪNG'}</b>
            <p>
              Nhịp tim đạt <b className="ht-mono">{peak.hr} bpm</b> / ngưỡng {s.thresholds.hr} · dừng lúc <b className="ht-mono">{s.pausedAt}</b> bởi Hệ thống.{' '}
              {pending ? 'Mã phu không thể tự tiếp tục — chờ quyết định của bạn.' : `Quyết định: ${s.decision?.by} lúc ${s.decision?.at}.`}
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
    </div>
  );
};
