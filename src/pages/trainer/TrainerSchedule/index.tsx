import React, { useMemo, useState } from 'react';
import { trainerApi, TrainingSession } from '../../../api/trainerApi';
import { useActor } from '../../../auth/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { Icon } from '../../../components/ui/Icon';
import { PageHeader, useToast } from '../../../components/ui/Ht';
import { LoadState } from '../../../components/trainer/TrainerParts';
import { TODAY } from './constants';
import { DaySessions, EvaluateQueue, PausedBanners, VaccinesSoon, WeekStrip } from './ScheduleParts';
import { AssignDialog } from './AssignDialog';
import { EvaluateDialog } from './EvaluateDialog';

export const TrainerSchedule: React.FC = () => {
  const toast = useToast();
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => trainerApi.getSchedule(actor), [actor]);
  const [day, setDay] = useState(TODAY);
  const [assignOpen, setAssignOpen] = useState(false);
  const [evalFor, setEvalFor] = useState<TrainingSession | null>(null);

  const sessions = useMemo(() => data?.sessions ?? [], [data]);
  const dayList = useMemo(() => sessions.filter((s) => s.date === day).sort((a, b) => a.time.localeCompare(b.time)), [sessions, day]);

  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const assigned = (s: TrainingSession) => {
    toast(`Đã phân công ${s.id ? `${s.id} · ` : ''}${s.horseName} cho ${s.groom} lúc ${s.time} ${s.date.slice(0, 5)}.`);
    setAssignOpen(false);
    setDay(s.date);
    reload();
  };

  return (
    <div className="ht ht-page">
      <PageHeader title="Lịch tập" sub="Phân công phiên tập cho Mã phu theo giáo án, theo dõi trạng thái và chấm phong độ sau buổi tập."
        actions={<button type="button" className="ht-btn ht-btn--primary" onClick={() => setAssignOpen(true)}><Icon name="calendar" />Phân công phiên tập</button>} />

      <PausedBanners sessions={sessions.filter((s) => s.status === 'PAUSED_PENDING_TRAINER')} />
      <WeekStrip sessions={sessions} day={day} onDay={setDay} />

      <div className="ht-cols">
        <div><DaySessions day={day} sessions={dayList} onEvaluate={setEvalFor} /></div>
        <div>
          <EvaluateQueue sessions={sessions.filter((s) => s.status === 'COMPLETED' && !s.evaluation)} onEvaluate={setEvalFor} />
          <VaccinesSoon vaccinations={data.vaccinations.filter((v) => v.status === 'DUE_SOON' || v.status === 'POSTPONED')} />
        </div>
      </div>

      {assignOpen && <AssignDialog data={data} onClose={() => setAssignOpen(false)} onDone={assigned} />}
      {evalFor && <EvaluateDialog session={evalFor} onClose={() => setEvalFor(null)} onDone={() => { setEvalFor(null); reload(); }} />}
    </div>
  );
};
