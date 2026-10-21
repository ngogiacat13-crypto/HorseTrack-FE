import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { managerApi, Registration } from '../../../api/managerApi';
import { useActor } from '../../../auth/AuthContext';
import { Icon } from '../../../components/ui/Icon';
import { BackButton, Badge, Loading, PageHeader, TimelineItem } from '../../../components/ui/Ht';
import { ChecklistPanel } from './ChecklistPanel';
import { Attachments, HorseInfo, OwnerInfo, RegistrationHistory } from './InfoPanels';
import { ApproveDialog, RejectDialog } from './DecisionDialogs';

type Decision = { kind: 'Approved' | 'Rejected'; at: string };

export const ManagerRegistrationDetail: React.FC = () => {
  const { id = 'REG-0019' } = useParams<{ id: string }>();
  const actor = useActor();
  const [d, setD] = useState<Registration | null>(null);
  const [checks, setChecks] = useState<Registration['checklist']>([]);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [history, setHistory] = useState<TimelineItem[]>([]);
  const [dlg, setDlg] = useState<null | 'approve' | 'reject'>(null);

  useEffect(() => {
    managerApi.getRegistration(id).then((r) => {
      setD(r);
      setChecks(r.checklist);
      setHistory(
        r.history.map((h) => ({
          tone: h.tone,
          what: (
            <>
              <b>{h.who}</b> {h.text}
            </>
          ),
          when: h.at,
        }))
      );
      if (r.status !== 'Pending')
        setDecision({ kind: r.status as Decision['kind'], at: r.decidedNote ?? '' });
    });
  }, [id]);

  if (!d)
    return (
      <div className="ht ht-page">
        <Loading />
      </div>
    );

  const allPassed = checks.every((c) => c.passed);
  const setCheck = (key: string, ok: boolean) =>
    setChecks((cs) =>
      cs.map((c) =>
        c.key === key
          ? { ...c, passed: ok, detail: ok && !c.passed ? 'Đã kiểm tra thủ công.' : c.detail }
          : c
      )
    );
  const finish = (kind: Decision['kind'], line: React.ReactNode) => {
    setDecision({ kind, at: '03/10 10:31' });
    setHistory((h) => [
      { tone: kind === 'Approved' ? 'success' : 'danger', what: line, when: '03/10 10:31' },
      ...h,
    ]);
    setDlg(null);
  };

  const statusBadge =
    decision?.kind === 'Approved' ? (
      <Badge tone="success">Đã duyệt</Badge>
    ) : decision?.kind === 'Rejected' ? (
      <Badge tone="danger">Đã từ chối</Badge>
    ) : (
      <Badge tone="info">Chờ duyệt</Badge>
    );

  return (
    <div className="ht ht-page">
      <PageHeader
        crumbs={<BackButton fallback="/manager/registrations" />}
        title={d.horse.name}
        badge={statusBadge}
        sub={
          <>
            Hồ sơ <span className="ht-mono">{d.id}</span> · gửi bởi {d.owner.fullName} lúc{' '}
            <span className="ht-mono">{d.submittedAt}</span>
            {d.status === 'Pending' && <> · đã chờ {d.waitingDays} ngày</>}
          </>
        }
        actions={
          decision ? (
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>
              Đã xử lý <span className="ht-mono">{decision.at}</span>
            </span>
          ) : (
            <>
              <button
                type="button"
                className="ht-btn ht-btn--secondary"
                style={{ color: 'var(--danger-ink)' }}
                onClick={() => setDlg('reject')}
              >
                <Icon name="x" />
                Từ chối
              </button>
              <button
                type="button"
                className="ht-btn ht-btn--primary"
                disabled={!allPassed}
                aria-describedby="approve-why"
                onClick={() => setDlg('approve')}
              >
                <Icon name="check" />
                Phê duyệt
              </button>
            </>
          )
        }
      />

      <div className="ht-cols">
        <div>
          <ChecklistPanel checks={checks} locked={!!decision} onSet={setCheck} />
          <HorseInfo reg={d} />
          <OwnerInfo reg={d} />
        </div>
        <div>
          <Attachments reg={d} />
          <RegistrationHistory items={history} />
        </div>
      </div>

      {dlg === 'approve' && (
        <ApproveDialog
          reg={d}
          checks={checks}
          onClose={() => setDlg(null)}
          onDone={(note) =>
            finish(
              'Approved',
              <>
                <b>{actor.name}</b> phê duyệt · chuyển <span className="ht-mono">APPROVED</span>
                {note && <>: “{note}”</>}
              </>
            )
          }
        />
      )}
      {dlg === 'reject' && (
        <RejectDialog
          reg={d}
          checks={checks}
          onClose={() => setDlg(null)}
          onDone={(reason, resubmit) =>
            finish(
              'Rejected',
              <>
                <b>{actor.name}</b> từ chối{resubmit ? ' · cho phép nộp lại' : ''}: “{reason}”
              </>
            )
          }
        />
      )}
    </div>
  );
};
