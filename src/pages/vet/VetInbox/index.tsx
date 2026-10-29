import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CaseSource, CaseStatus, isOpenProtocol, SOURCE_LABEL, VetCase, vetApi } from '../../../api/vetApi';
import { useFetch } from '../../../hooks/useFetch';
import { PageHeader, Panel, Tabs } from '../../../components/ui/Ht';
import { LoadState } from '../../../components/trainer/TrainerParts';
import { ExamDialog, LockDialog } from '../../../components/vet/VetDialogs';
import { CaseTable } from './CaseTable';
import { CaseDetail } from './CaseDetail';
import { CloseCaseDialog } from './CloseCaseDialog';

const SEV_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;

export const VetInbox: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const { data, loading, error, reload } = useFetch(() => vetApi.getCases());
  const [tab, setTab] = useState<CaseStatus>('NEW');
  const [source, setSource] = useState<'' | CaseSource>('');
  const [examFor, setExamFor] = useState<VetCase | null>(null);
  const [closeFor, setCloseFor] = useState<VetCase | null>(null);
  const [lockOpen, setLockOpen] = useState(false);

  const cases = useMemo(() => data?.cases ?? [], [data]);
  const list = useMemo(() => cases
    .filter((c) => c.status === tab && (!source || c.source === source))
    .sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity] || b.at.localeCompare(a.at)), [cases, tab, source]);

  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const sel = cases.find((c) => c.id === params.get('case')) ?? list[0] ?? null;
  const horse = sel ? data.horses.find((h) => h.id === sel.horseId) : undefined;
  const count = (s: CaseStatus) => cases.filter((c) => c.status === s).length;

  return (
    <div className="ht ht-page">
      <PageHeader title="Hộp thư ca khám" sub="Ca từ phiên tập bị dừng, báo cáo sự cố của Mã phu và yêu cầu của HLV trưởng."
        actions={
          <select className="ht-select" value={source} onChange={(e) => setSource(e.target.value as CaseSource | '')} aria-label="Lọc theo nguồn">
            <option value="">Lọc: Tất cả nguồn</option>
            {(Object.keys(SOURCE_LABEL) as CaseSource[]).map((s) => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}
          </select>} />

      <Tabs<CaseStatus> value={tab} onChange={(t) => { setTab(t); setParams({}, { replace: true }); }} items={[
        { value: 'NEW', label: 'Mới', count: count('NEW') },
        { value: 'MONITORING', label: 'Đang theo dõi', count: count('MONITORING') },
        { value: 'CLOSED', label: 'Đã đóng', count: count('CLOSED') },
      ]} />

      <div className="ht-cols" style={{ gridTemplateColumns: 'minmax(0,1fr) 380px' }}>
        <div><CaseTable cases={list} horses={data.horses} selectedId={sel?.id} onSelect={(id) => setParams({ case: id }, { replace: true })} /></div>
        <div>
          {sel && horse
            ? <CaseDetail vetCase={sel} horse={horse}
                session={sel.sessionId ? data.sessions.find((s) => s.id === sel.sessionId) : undefined}
                protocol={data.protocols.find((p) => isOpenProtocol(p) && (p.caseId === sel.id || (!!sel.beId && p.caseId === String(sel.beId))))}
                onExam={() => setExamFor(sel)} onClose={() => setCloseFor(sel)} onLock={() => setLockOpen(true)} />
            : <Panel><div className="ht-empty">Chọn một ca để xem chi tiết.</div></Panel>}
        </div>
      </div>

      <ExamDialog vetCase={examFor} horse={examFor ? data.horses.find((h) => h.id === examFor.horseId) : undefined} onClose={() => setExamFor(null)} onDone={() => { setExamFor(null); setTab('MONITORING'); reload(); }} />
      <LockDialog horse={lockOpen && horse ? horse : null} onClose={() => setLockOpen(false)} onDone={() => { setLockOpen(false); reload(); }} />
      {closeFor && <CloseCaseDialog vetCase={closeFor} onClose={() => setCloseFor(null)} onDone={() => { setCloseFor(null); reload(); }} />}
    </div>
  );
};
