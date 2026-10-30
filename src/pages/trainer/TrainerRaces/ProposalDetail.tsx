import React from 'react';
import { PROPOSAL_LABEL, ProposalStatus, RaceProposal, Tournament } from '../../../api/trainerApi';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Callout, Panel, Timeline } from '../../../components/ui/Ht';

export type ProposalDialog = 'submit' | 'reject' | 'result';

const STEPS = ['Đề xuất', 'Chủ ngựa đồng ý', 'Khám sức khỏe', 'Gửi ban tổ chức', 'Kết quả'] as const;
const stepOf = (s: ProposalStatus): { at: number; failed: boolean } => ({
  PROPOSED: { at: 0, failed: false }, WAITING_OWNER: { at: 1, failed: false }, OWNER_DECLINED: { at: 1, failed: true },
  WAITING_VET_EXAM: { at: 2, failed: false }, VET_FAILED: { at: 2, failed: true }, READY_TO_SUBMIT: { at: 3, failed: false },
  SUBMITTED: { at: 4, failed: false }, REJECTED_BY_ORGANIZER: { at: 3, failed: true }, RESULT_RECORDED: { at: 5, failed: false },
} as Partial<Record<ProposalStatus, { at: number; failed: boolean }>>)[s] ?? { at: 0, failed: false };

const Stepper: React.FC<{ status: ProposalStatus }> = ({ status }) => {
  const st = stepOf(status);
  return (
    <ol className="ht-stepper" style={{ flexWrap: 'wrap', rowGap: 8 }} aria-label="Tiến trình đề xuất">
      {STEPS.map((label, i) => {
        const state = i < st.at ? 'done' : i === st.at && !st.failed && st.at < 5 ? 'current' : undefined;
        const failedHere = st.failed && i === st.at;
        return (
          <li key={label} className="ht-step" data-state={state} style={failedHere ? { color: 'var(--danger-ink)' } : undefined}>
            <span className="ht-step__dot" style={failedHere ? { background: 'var(--danger-ink)', borderColor: 'var(--danger-ink)', color: 'var(--on-primary)' } : undefined}>
              {state === 'done' ? <Icon name="check" /> : failedHere ? <Icon name="x" /> : i + 1}
            </span>{label}
          </li>
        );
      })}
    </ol>
  );
};

export const ProposalDetail: React.FC<{ proposal: RaceProposal; tournament?: Tournament; onOpen: (d: ProposalDialog) => void }> = ({ proposal: p, tournament: t, onOpen }) => (
  <Panel as="h3" title={<>{p.horseName} · <span className="ht-mono" style={{ fontWeight: 500 }}>{p.id}</span></>} sub={t?.name}
    right={<Badge tone={PROPOSAL_LABEL[p.status][1]}>{PROPOSAL_LABEL[p.status][0]}</Badge>} headStyle={{ alignItems: 'flex-start' }}>
    <div className="ht-panel__body" style={{ display: 'grid', gap: 16 }}>
      <Stepper status={p.status} />

      <dl className="ht-kv">
        <dt>Giải</dt><dd>{t?.name}</dd>
        <dt>Ngày · cự ly</dt><dd><span className="ht-mono">{t?.date}</span> · {t?.distance}</dd>
        <dt>Địa điểm</dt><dd>{t?.venue}</dd>
        <dt>Chủ ngựa</dt><dd>{p.owner}</dd>
        {p.vetResult && <><dt>Khám thi đấu</dt><dd><b style={{ color: p.vetResult.pass ? 'var(--success-ink)' : 'var(--danger-ink)' }}>{p.vetResult.pass ? 'ĐẠT' : 'KHÔNG ĐẠT'}</b> · BS {p.vetResult.by} · <span className="ht-mono">{p.vetResult.at}</span><br /><span style={{ color: 'var(--muted)' }}>{p.vetResult.note}</span></dd></>}
        {p.ownerResponse && <><dt>Chủ ngựa</dt><dd><b style={{ color: p.ownerResponse.agree ? 'var(--success-ink)' : 'var(--danger-ink)' }}>{p.ownerResponse.agree ? 'Đồng ý' : 'Từ chối'}</b> · <span className="ht-mono">{p.ownerResponse.at}</span>{p.ownerResponse.reason && <><br /><span style={{ color: 'var(--muted)' }}>{p.ownerResponse.reason}</span></>}</dd></>}
        {p.result && <><dt>Kết quả</dt><dd><b>Hạng {p.result.rank}</b> · <span className="ht-mono">{p.result.time}</span>{p.result.note && <><br /><span style={{ color: 'var(--muted)' }}>{p.result.note}</span></>}</dd></>}
        {p.organizerReason && <><dt>BTC từ chối</dt><dd>{p.organizerReason}</dd></>}
      </dl>

      {p.status === 'READY_TO_SUBMIT' && (
        <button type="button" className="ht-btn ht-btn--primary ht-btn--block" onClick={() => onOpen('submit')}><Icon name="send" />Đánh dấu đã gửi ban tổ chức</button>
      )}
      {p.status === 'SUBMITTED' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button type="button" className="ht-btn ht-btn--secondary" style={{ color: 'var(--danger-ink)' }} onClick={() => onOpen('reject')}>BTC từ chối</button>
          <button type="button" className="ht-btn ht-btn--primary" onClick={() => onOpen('result')}>Nhập kết quả</button>
        </div>
      )}
      {(p.status === 'WAITING_VET_EXAM' || p.status === 'WAITING_OWNER') && (
        <Callout tone="info">{p.status === 'WAITING_VET_EXAM' ? 'Chủ ngựa đã đồng ý. Đang chờ Bác sĩ thú y khám trước thi đấu.' : 'Đang chờ chủ ngựa đồng ý trước khi chuyển sang khám sức khỏe.'} Bạn chỉ theo dõi ở bước này.</Callout>
      )}

      <div>
        <div className="ht-overline" style={{ marginBottom: 10 }}>Lịch sử</div>
        <Timeline items={p.history.map((h) => ({ tone: h.tone, what: <><b>{h.who}</b> {h.text}</>, when: h.at }))} />
      </div>
    </div>
  </Panel>
);
