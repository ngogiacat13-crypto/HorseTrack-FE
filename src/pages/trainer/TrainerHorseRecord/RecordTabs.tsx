import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Horse, PLAN_LABEL, PROPOSAL_LABEL, RaceProposal, Tournament, TrainingPlan, TrainingSession, Vaccination } from '../../../api/trainerApi';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Callout, Panel, Timeline } from '../../../components/ui/Ht';
import { HorseBadges, PhaseBar } from '../../../components/trainer/TrainerParts';
import { InjuryMap } from '../../../components/vet/InjuryMap';
import { SessionTable } from './SessionTable';

const muted: React.CSSProperties = { margin: 0, color: 'var(--muted)', fontSize: 13 };


export const OverviewTab: React.FC<{ horse: Horse; plan?: TrainingPlan; recent: TrainingSession[]; avg: string; vaccinations: Vaccination[]; block: string | null }> = ({ horse, plan, recent, avg, vaccinations, block }) => {
  const phase = plan?.phases.find((p) => p.no === plan.currentPhase);
  return (
    <div className="ht-cols">
      <div>
        <Panel title="Giáo án hiện tại" right={plan && <Badge tone={PLAN_LABEL[plan.status][1]}>{PLAN_LABEL[plan.status][0]}</Badge>}>
          <div className="ht-panel__body">
            {plan && phase ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <span><b>{plan.name}</b> · <span className="ht-mono">{plan.id}</span> · {plan.type} · {plan.goal}</span>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>GĐ {plan.currentPhase}/{plan.phases.length} · tuần {plan.week}/{phase.weeks}</span>
                </div>
                <PhaseBar phases={plan.phases} current={plan.currentPhase} />
                <dl className="ht-kv">
                  <dt>Giai đoạn</dt><dd>{phase.name}</dd>
                  <dt>Cường độ</dt><dd>{phase.intensity} · {phase.distanceM} m · {phase.sessionsPerWeek} buổi/tuần</dd>
                  <dt>Ngưỡng nhịp tim</dt><dd className="ht-mono">{phase.hrLimit} bpm</dd>
                </dl>
                {plan.pausedReason && <Callout tone="demo" icon="warn">{plan.pausedReason}</Callout>}
              </div>
            ) : <p style={{ margin: 0, color: 'var(--muted)' }}>Chưa có giáo án. {block ?? 'Bấm “Tạo giáo án” để lập kế hoạch nhiều giai đoạn.'}</p>}
          </div>
        </Panel>
        <Panel title="Phiên tập gần đây" right={<span style={{ fontSize: 13, color: 'var(--muted)' }}>Điểm TB <span className="ht-score-chip">{avg}</span></span>}>
          <SessionTable sessions={recent} />
        </Panel>
      </div>
      <div>
        <Panel as="h3" title="Lịch tiêm phòng">
          <div className="ht-panel__body">
            {vaccinations.length ? <Timeline items={vaccinations.map((v) => ({ tone: v.status === 'POSTPONED' ? 'warning' : 'info', what: <><b>{v.type}</b>{v.note && <> — {v.note}</>}</>, when: v.due }))} />
              : <p style={muted}>Không có lịch tiêm sắp tới.</p>}
          </div>
        </Panel>
        <Panel as="h3" title="Lịch sử y tế" right={<span className="ht-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>chỉ xem</span>}>
          <div className="ht-panel__body">
            {horse.medicalHistory.length ? <Timeline items={horse.medicalHistory.map((m) => ({ tone: m.tone, what: m.title, when: m.date }))} /> : <p style={muted}>Chưa có ghi nhận.</p>}
          </div>
        </Panel>
      </div>
    </div>
  );
};

export const HealthTab: React.FC<{ horse: Horse }> = ({ horse }) => {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="ht-cols">
      <div>
        <Panel title="Bản đồ chấn thương 2D" sub="Chỉ xem — ghi nhận do Bác sĩ thú y">
          <div className="ht-panel__body"><InjuryMap injuries={horse.injuries} horseName={horse.name} selectedId={selected} onSelect={setSelected} /></div>
          <table className="ht-table">
            <thead><tr><th>Bộ phận</th><th>Mức độ</th><th>Ngày ghi</th><th>Bác sĩ</th><th>Ghi chú</th></tr></thead>
            <tbody>
              {horse.injuries.map((i) => (
                <tr key={i.id ?? i.part}>
                  <td className="strong">{i.part}</td>
                  <td><Badge tone={i.severity === 'Nặng' ? 'danger' : 'warning'}>{i.severity}</Badge></td>
                  <td className="mono">{i.date}</td><td>{i.vet}</td><td>{i.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {horse.injuries.length === 0 && <div className="ht-empty">Không có chấn thương được ghi nhận.</div>}
        </Panel>
      </div>
      <div>
        <Panel as="h3" title="Trạng thái hiện tại">
          <div className="ht-panel__body">
            <dl className="ht-kv">
              <dt>Sức khỏe</dt><dd><HorseBadges horse={horse} compact /></dd>
              <dt>Huấn luyện</dt><dd>{horse.trainingLocked ? <b style={{ color: 'var(--danger-ink)' }}>Khóa tập</b> : 'Được tập'}</dd>
              {horse.lock && <><dt>Lý do</dt><dd>{horse.lock.reason}</dd><dt>Khóa bởi</dt><dd>BS {horse.lock.by} · <span className="ht-mono">{horse.lock.at}</span></dd><dt>Xem xét mở</dt><dd>{horse.lock.review}</dd></>}
              {horse.pendingCase && <><dt>Ca khám chờ</dt><dd className="ht-mono">#{horse.pendingCase}</dd></>}
            </dl>
          </div>
        </Panel>
        <Callout tone="info">HLV trưởng chỉ xem thông tin y tế cần cho huấn luyện. Chẩn đoán, phác đồ và mở khóa thuộc Bác sĩ thú y.</Callout>
      </div>
    </div>
  );
};

export const TrainingTab: React.FC<{ history: TrainingSession[]; plans: TrainingPlan[]; scored: number; avg: string }> = ({ history, plans, scored, avg }) => (
  <>
    <Panel title="Lịch sử phiên tập" sub={`${history.length} phiên · ${scored} đã đánh giá · điểm trung bình ${avg}`}>
      <SessionTable sessions={history} />
    </Panel>
    <div style={{ height: 24 }} />
    <Panel title="Các giáo án">
      <table className="ht-table">
        <thead><tr><th>Mã</th><th>Loại · mục tiêu</th><th>Tiến độ</th><th>Bắt đầu</th><th>Trạng thái</th></tr></thead>
        <tbody>
          {plans.map((p) => (
            <tr key={p.id}>
              <td className="id">{p.id}</td>
              <td><span className="strong">{p.name}</span><span className="sub">{p.type} · {p.goal}</span></td>
              <td style={{ minWidth: 140 }}><PhaseBar phases={p.phases} current={p.currentPhase} /><span className="sub">GĐ {p.currentPhase}/{p.phases.length}</span></td>
              <td className="mono">{p.startDate}</td>
              <td><Badge tone={PLAN_LABEL[p.status][1]}>{PLAN_LABEL[p.status][0]}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  </>
);

export const RacesTab: React.FC<{ proposals: RaceProposal[]; tournaments: Tournament[] }> = ({ proposals, tournaments }) => {
  const tour = (tid: string) => tournaments.find((t) => t.id === tid);
  return (
    <Panel title="Đề xuất & kết quả thi đấu" right={<Link className="ht-more" to="/trainer/races">Giải đua <Icon name="arrow" /></Link>}>
      <table className="ht-table">
        <thead><tr><th>Mã</th><th>Giải</th><th>Ngày</th><th>Trạng thái</th><th>Kết quả</th></tr></thead>
        <tbody>
          {proposals.map((p) => (
            <tr key={p.id}>
              <td className="id">{p.id}</td>
              <td className="strong">{tour(p.tournamentId)?.name}</td>
              <td className="mono">{tour(p.tournamentId)?.date}</td>
              <td><Badge tone={PROPOSAL_LABEL[p.status][1]}>{PROPOSAL_LABEL[p.status][0]}</Badge></td>
              <td>{p.result ? <b>Hạng {p.result.rank} · <span className="ht-mono">{p.result.time}</span></b> : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {proposals.length === 0 && <div className="ht-empty">Chưa có đề xuất thi đấu.</div>}
    </Panel>
  );
};
