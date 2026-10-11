import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PLAN_LABEL, PROPOSAL_LABEL, raceBlock, SESSION_LABEL, trainerApi, trainingBlock, horseInitials } from '../../api/trainerApi';
import { useActor } from '../../auth/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { Icon } from '../../components/ui/Icon';
import { Badge, Callout, PageHeader, Panel, Tabs, Timeline } from '../../components/ui/Ht';
import { HorseBadges, LoadState, PhaseBar } from '../../components/trainer/TrainerParts';
import { InjuryMap } from '../../components/vet/InjuryMap';

type Tab = 'overview' | 'health' | 'training' | 'races';

/* 1.5 lịch sử huấn luyện · 4.1 hồ sơ sức khỏe (chỉ xem) · 4.2 khóa tập · 4.3 lịch tiêm */
export const TrainerHorseRecord: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => trainerApi.getHorse(id, actor), [id, actor]);
  const [tab, setTab] = useState<Tab>('overview');
  const [selMark, setSelMark] = useState<string | null>(null);

  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  const { horse, plans, sessions, vaccinations, proposals, tournaments } = data;
  const plan = plans.find((p) => p.status === 'ACTIVE' || p.status === 'PAUSED');
  const phase = plan?.phases.find((p) => p.no === plan.currentPhase);
  const history = [...sessions].sort((a, b) => (b.date.split('/').reverse().join('') + b.time).localeCompare(a.date.split('/').reverse().join('') + a.time));
  const scored = history.filter((s) => s.evaluation);
  const avg = scored.length ? (scored.reduce((s, x) => s + (x.evaluation?.score ?? 0), 0) / scored.length).toFixed(1) : '—';
  const block = trainingBlock(horse);
  const raceNo = raceBlock(horse);
  const tName = (tid: string) => tournaments.find((t) => t.id === tid);

  return (
    <div className="ht ht-page">
      <PageHeader
        crumbs={<><Link className="ht-back" to="/trainer"><Icon name="back" size={14} />Tổng quan đàn ngựa</Link><Icon name="chev" size={14} /><b>{horse.name}</b></>}
        title={<span style={{ display: 'inline-flex', gap: 12, alignItems: 'center' }}><i className="ht-avatar ht-avatar--xl">{horseInitials(horse.name)}</i>{horse.name}</span>}
        badge={<HorseBadges horse={horse} />}
        sub={<><span className="ht-mono">{horse.microchip}</span> · {horse.breed} · {horse.sex} {horse.age} tuổi · Chuồng <b>{horse.stall}</b> · Chủ: <b>{horse.owner}</b></>}
        actions={<>
          {raceNo
            ? <button type="button" className="ht-btn ht-btn--secondary" disabled title={raceNo}><Icon name="send" />Đề xuất thi đấu</button>
            : <Link className="ht-btn ht-btn--secondary" to={`/trainer/races/new?horse=${horse.id}`}><Icon name="send" />Đề xuất thi đấu</Link>}
          {block
            ? <button type="button" className="ht-btn ht-btn--primary" disabled title={block}><Icon name="calendar" />Tạo giáo án</button>
            : <Link className="ht-btn ht-btn--primary" to={`/trainer/plans/new?horse=${horse.id}`}><Icon name="calendar" />Tạo giáo án</Link>}
        </>}
      />

      {horse.lock && (
        <div className="ht-banner" role="alert">
          <Icon name="lock" />
          <div>
            <b>Ngựa đang bị khóa huấn luyện từ <span className="ht-mono">{horse.lock.at}</span> bởi BS {horse.lock.by} — {horse.lock.reason}.</b>
            <p>Mọi lịch tập, giáo án và đề xuất thi đấu bị chặn. {horse.lock.review}. Chỉ Bác sĩ thú y được mở khóa (BR_01).</p>
          </div>
        </div>
      )}

      <Tabs<Tab> value={tab} onChange={setTab} items={[
        { value: 'overview', label: 'Tổng quan' },
        { value: 'health', label: 'Sức khỏe' },
        { value: 'training', label: 'Huấn luyện', count: sessions.length },
        { value: 'races', label: 'Thi đấu', count: proposals.length },
      ]} />

      {tab === 'overview' && (
        <div className="ht-cols">
          <div>
            <Panel title="Giáo án hiện tại" right={plan && <Badge tone={PLAN_LABEL[plan.status][1]}>{PLAN_LABEL[plan.status][0]}</Badge>}>
              <div className="ht-panel__body">
                {plan && phase ? (
                  <div style={{ display: 'grid', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <span><b>{plan.type}</b> · <span className="ht-mono">{plan.id}</span> · {plan.goal}</span>
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
                ) : <p style={{ margin: 0, color: 'var(--muted)' }}>Chưa có giáo án. {block ? block : 'Bấm “Tạo giáo án” để lập kế hoạch nhiều giai đoạn.'}</p>}
              </div>
            </Panel>

            <Panel title="Phiên tập gần đây" right={<span style={{ fontSize: 13, color: 'var(--muted)' }}>Điểm TB <span className="ht-score-chip">{avg}</span></span>}>
              <SessionTable sessions={history.slice(0, 4)} />
            </Panel>
          </div>
          <div>
            <Panel as="h3" title="Lịch tiêm phòng">
              <div className="ht-panel__body">
                {vaccinations.length ? <Timeline items={vaccinations.map((v) => ({ tone: v.status === 'POSTPONED' ? 'warning' : 'info', what: <><b>{v.type}</b>{v.note && <> — {v.note}</>}</>, when: v.due }))} />
                  : <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>Không có lịch tiêm sắp tới.</p>}
              </div>
            </Panel>
            <Panel as="h3" title="Lịch sử y tế" right={<span className="ht-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>chỉ xem</span>}>
              <div className="ht-panel__body">
                {horse.medicalHistory.length ? <Timeline items={horse.medicalHistory.map((m) => ({ tone: m.tone, what: m.title, when: m.date }))} />
                  : <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>Chưa có ghi nhận.</p>}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {tab === 'health' && (
        <div className="ht-cols">
          <div>
            <Panel title="Bản đồ chấn thương 2D" sub="Chỉ xem — ghi nhận do Bác sĩ thú y">
              <div className="ht-panel__body">
                <InjuryMap injuries={horse.injuries} horseName={horse.name} selectedId={selMark} onSelect={setSelMark} />
              </div>
              <table className="ht-table">
                <thead><tr><th>Bộ phận</th><th>Mức độ</th><th>Ngày ghi</th><th>Bác sĩ</th><th>Ghi chú</th></tr></thead>
                <tbody>
                  {horse.injuries.map((i) => (
                    <tr key={i.part}>
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
      )}

      {tab === 'training' && (
        <>
          <Panel title="Lịch sử phiên tập" sub={`${sessions.length} phiên · ${scored.length} đã đánh giá · điểm trung bình ${avg}`}>
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
                    <td><span className="strong">{p.type}</span><span className="sub">{p.goal}</span></td>
                    <td style={{ minWidth: 140 }}><PhaseBar phases={p.phases} current={p.currentPhase} /><span className="sub">GĐ {p.currentPhase}/{p.phases.length}</span></td>
                    <td className="mono">{p.startDate}</td>
                    <td><Badge tone={PLAN_LABEL[p.status][1]}>{PLAN_LABEL[p.status][0]}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </>
      )}

      {tab === 'races' && (
        <Panel title="Đề xuất & kết quả thi đấu" right={<Link className="ht-more" to="/trainer/races">Giải đua <Icon name="arrow" /></Link>}>
          <table className="ht-table">
            <thead><tr><th>Mã</th><th>Giải</th><th>Ngày</th><th>Trạng thái</th><th>Kết quả</th></tr></thead>
            <tbody>
              {proposals.map((p) => (
                <tr key={p.id}>
                  <td className="id">{p.id}</td>
                  <td className="strong">{tName(p.tournamentId)?.name}</td>
                  <td className="mono">{tName(p.tournamentId)?.date}</td>
                  <td><Badge tone={PROPOSAL_LABEL[p.status][1]}>{PROPOSAL_LABEL[p.status][0]}</Badge></td>
                  <td>{p.result ? <b>Hạng {p.result.rank} · <span className="ht-mono">{p.result.time}</span></b> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {proposals.length === 0 && <div className="ht-empty">Chưa có đề xuất thi đấu.</div>}
        </Panel>
      )}
    </div>
  );
};

const SessionTable: React.FC<{ sessions: Awaited<ReturnType<typeof trainerApi.getHorse>>['sessions'] }> = ({ sessions }) => (
  <>
    <table className="ht-table">
      <thead><tr><th>Phiên</th><th>Ngày giờ</th><th>Nội dung</th><th>Max nhịp tim</th><th>Trạng thái</th><th>Phong độ</th></tr></thead>
      <tbody>
        {sessions.map((s) => {
          const max = s.readings.length ? Math.max(...s.readings.map((r) => r.hr)) : null;
          return (
            <tr key={s.id}>
              <td className="id"><Link to={`/trainer/sessions/${s.id}`}>{s.id}</Link></td>
              <td className="mono">{s.date.slice(0, 5)} {s.time}</td>
              <td>{s.label}<span className="sub">{s.track}</span></td>
              <td className="mono" style={max && max >= s.thresholds.hr ? { color: 'var(--danger-ink)', fontWeight: 600 } : undefined}>{max ? `${max} bpm` : '—'}</td>
              <td><Badge tone={SESSION_LABEL[s.status][1]}>{SESSION_LABEL[s.status][0]}</Badge></td>
              <td>{s.evaluation ? <span className="ht-score-chip">{s.evaluation.score}/10</span> : '—'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
    {sessions.length === 0 && <div className="ht-empty">Chưa có phiên tập.</div>}
  </>
);
