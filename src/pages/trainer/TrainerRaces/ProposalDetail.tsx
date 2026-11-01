import React from 'react';
import { Link } from 'react-router-dom';
import { PROPOSAL_LABEL, ProposalStatus, RaceProposal, Tournament } from '../../../api/trainerApi';
import { PATH } from '../../../routers/routerPath';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Callout, Panel, Timeline } from '../../../components/ui/Ht';

export type ProposalDialog = 'submit' | 'reject' | 'result';

const STEPS = ['Chủ ngựa đề xuất', 'HLV xác nhận', 'Khám trước giải', 'Đóng lệ phí', 'Kết quả & giải thưởng'] as const;
const FINAL = STEPS.length;
const STEP_OF: Partial<Record<ProposalStatus, { at: number; failed?: boolean }>> = {
  PROPOSED: { at: 0 }, WAITLISTED: { at: 0 },
  WAITING_TRAINER: { at: 1 }, WAITING_OWNER: { at: 1 }, TRAINER_REJECTED: { at: 1, failed: true }, TRAINER_EXPIRED: { at: 1, failed: true }, OWNER_DECLINED: { at: 1, failed: true },
  WAITING_VET_EXAM: { at: 2 }, VET_FAILED: { at: 2, failed: true }, VET_EXPIRED: { at: 2, failed: true },
  WAITING_PAYMENT: { at: 3 }, PAYMENT_EXPIRED: { at: 3, failed: true }, READY_TO_SUBMIT: { at: 3 },
  REGISTERED: { at: 4 }, SUBMITTED: { at: 4 }, REJECTED_BY_ORGANIZER: { at: 4, failed: true },
  RESULT_RECORDED: { at: FINAL },
};
const CLOSED: ProposalStatus[] = ['CANCELLED', 'NO_SLOT', 'INELIGIBLE'];

const reachedStep = (p: RaceProposal) => (p.vetResult?.pass ? 3 : p.vetResult ? 2 : 1);
const stepOf = (p: RaceProposal) => STEP_OF[p.status] ?? (CLOSED.includes(p.status) ? { at: reachedStep(p), failed: true } : { at: 0 });

const NOTE: Partial<Record<ProposalStatus, { tone: 'info' | 'danger' | 'success'; text: string }>> = {
  WAITLISTED: { tone: 'info', text: 'Giải đã hết suất, đề xuất đang ở hàng chờ. Khi có suất trống, đề xuất sẽ chuyển sang chờ HLV xác nhận.' },
  WAITING_TRAINER: { tone: 'info', text: 'Chủ ngựa đã chọn ngựa tham gia. HLV cần xác nhận Sẵn sàng hoặc Từ chối trong 2 ngày.' },
  TRAINER_REJECTED: { tone: 'danger', text: 'HLV đã từ chối. Chủ ngựa có thể gửi khiếu nại; nếu Quản lý CLB chấp nhận, đề xuất chuyển sang Bác sĩ khám trước giải.' },
  TRAINER_EXPIRED: { tone: 'danger', text: 'HLV không xác nhận trong hạn, đề xuất đã đóng và suất được trả lại.' },
  WAITING_VET_EXAM: { tone: 'info', text: 'HLV đã xác nhận sẵn sàng. Đang chờ Bác sĩ thú y khám trước giải.' },
  VET_FAILED: { tone: 'danger', text: 'Bác sĩ đánh giá không đạt, hồ sơ dừng. Chủ ngựa có thể chọn ngựa khác để thi đấu.' },
  VET_EXPIRED: { tone: 'danger', text: 'Quá hạn khám trước giải, hồ sơ dừng. Chủ ngựa có thể chọn ngựa khác để thi đấu.' },
  WAITING_PAYMENT: { tone: 'info', text: 'Ngựa đã đạt khám. Đang chờ chủ ngựa đóng lệ phí tham dự.' },
  PAYMENT_EXPIRED: { tone: 'danger', text: 'Chủ ngựa không đóng lệ phí trong hạn, hồ sơ dừng.' },
  REGISTERED: { tone: 'success', text: 'Đã đóng lệ phí, ngựa đã đăng ký thi đấu. Chờ Quản lý CLB nhập kết quả sau giải.' },
  RESULT_RECORDED: { tone: 'success', text: 'Quản lý CLB đã nhập kết quả. Chủ ngựa xem hạng và giải thưởng trong hồ sơ ngựa.' },
  CANCELLED: { tone: 'danger', text: 'Chủ ngựa đã hủy đề xuất.' },
  NO_SLOT: { tone: 'danger', text: 'Giải đã kết thúc hoặc hết hạn đăng ký khi đề xuất chưa hoàn tất.' },
  INELIGIBLE: { tone: 'danger', text: 'Ngựa không còn đủ điều kiện (bị khóa y tế); lệ phí đã đóng được hoàn lại.' },
};

const Stepper: React.FC<{ proposal: RaceProposal }> = ({ proposal }) => {
  const st = stepOf(proposal);
  return (
    <ol className="ht-stepper" style={{ flexWrap: 'wrap', rowGap: 8 }} aria-label="Tiến trình đăng ký thi đấu" data-testid="race-entry-stepper">
      {STEPS.map((label, i) => {
        const failedHere = !!st.failed && i === st.at;
        const state = i < st.at ? 'done' : i === st.at && !st.failed ? 'current' : undefined;
        return (
          <li key={label} className="ht-step" data-state={state} data-testid={`race-entry-step-${i + 1}`} style={failedHere ? { color: 'var(--danger-ink)' } : undefined}>
            <span className="ht-step__dot" style={failedHere ? { background: 'var(--danger-ink)', borderColor: 'var(--danger-ink)', color: 'var(--on-primary)' } : undefined}>
              {state === 'done' ? <Icon name="check" /> : failedHere ? <Icon name="x" /> : i + 1}
            </span>{label}
          </li>
        );
      })}
    </ol>
  );
};

export const ProposalDetail: React.FC<{ proposal: RaceProposal; tournament?: Tournament }> = ({ proposal: p, tournament: t }) => {
  const note = NOTE[p.status];
  return (
    <Panel as="h3" title={<>{p.horseName} · <span className="ht-mono" style={{ fontWeight: 500 }}>{p.id}</span></>} sub={t?.name}
      right={<Badge tone={PROPOSAL_LABEL[p.status][1]}>{PROPOSAL_LABEL[p.status][0]}</Badge>} headStyle={{ alignItems: 'flex-start' }}>
      <div className="ht-panel__body" style={{ display: 'grid', gap: 16 }}>
        <Stepper proposal={p} />
        {note && <Callout tone={note.tone} testId="race-entry-note">{note.text}</Callout>}
        {p.status === 'WAITING_TRAINER' && (
          <Link className="ht-btn ht-btn--primary ht-btn--block" to={PATH.trainer.raceConfirmations} data-testid="race-entry-go-confirm"><Icon name="check" />Mở trang Xác nhận thi đấu</Link>
        )}

        <dl className="ht-kv">
          <dt>Giải</dt><dd>{t?.name}</dd>
          <dt>Ngày · cự ly</dt><dd><span className="ht-mono">{t?.date}</span> · {t?.distance}</dd>
          <dt>Địa điểm</dt><dd>{t?.venue}</dd>
          <dt>Chủ ngựa</dt><dd>{p.owner}</dd>
          {p.vetResult && <><dt>Khám trước giải</dt><dd><b style={{ color: p.vetResult.pass ? 'var(--success-ink)' : 'var(--danger-ink)' }}>{p.vetResult.pass ? 'ĐẠT' : 'KHÔNG ĐẠT'}</b> · BS {p.vetResult.by} · <span className="ht-mono">{p.vetResult.at}</span><br /><span style={{ color: 'var(--muted)' }}>{p.vetResult.note}</span></dd></>}
          {p.result && <><dt>Kết quả</dt><dd><b>Hạng {p.result.rank}</b> · <span className="ht-mono">{p.result.time}</span>{p.result.note && <><br /><span style={{ color: 'var(--muted)' }}>{p.result.note}</span></>}</dd></>}
        </dl>

        <div>
          <div className="ht-overline" style={{ marginBottom: 10 }}>Lịch sử</div>
          <Timeline items={p.history.map((h) => ({ tone: h.tone, what: <><b>{h.who}</b> {h.text}</>, when: h.at }))} />
        </div>
      </div>
    </Panel>
  );
};
