import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ownerApi } from '../../../api/ownerApi';
import { useActor } from '../../../auth/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { PATH, toPath } from '../../../routers/routerPath';
import { Badge, Callout, money, PageHeader, Panel, Tabs } from '../../../components/ui/Ht';
import { HorseBadges, LoadState, PhaseBar } from '../../../components/trainer/TrainerParts';
import { HealthTab } from './HealthTab';
import { PerformanceTab } from './PerformanceTab';

type Tab = 'INFO' | 'HEALTH' | 'PERF' | 'COST';

/* 1.2 Hồ sơ chi tiết ngựa · 1.3 Phong độ · 4.1–4.3 Thông tin y tế chỉ xem (BR_09) */
export const OwnerHorseDetail: React.FC = () => {
  const { id = '' } = useParams();
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => ownerApi.getMyHorse(id, actor), [id, actor]);
  const [tab, setTab] = useState<Tab>('INFO');
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  const { horse: h, plan, sessions, medicalCost } = data;
  const billedTotal = medicalCost.billed.reduce((s, l) => s + l.amount, 0);
  const estimate = medicalCost.estimate.reduce((s, p) => s + p.cost, 0);

  return (
    <div className="ht ht-page">
      <PageHeader crumbs={<Link to={PATH.owner.home}>Ngựa của tôi</Link>} title={h.name}
        sub={<>{h.breed} · {h.sex === '♂' ? 'Đực' : 'Cái'} · {h.age} tuổi · microchip <span className="ht-mono">{h.microchip}</span> · chuồng {h.stall}</>}
        badge={<HorseBadges horse={h} compact />} />
      <Tabs<Tab> value={tab} onChange={setTab} items={[
        { value: 'INFO', label: 'Tổng quan' }, { value: 'HEALTH', label: 'Sức khỏe & điều trị', count: data.protocols.length || undefined },
        { value: 'PERF', label: 'Phong độ & thi đấu', count: data.stats.starts || undefined }, { value: 'COST', label: 'Chi phí y tế' },
      ]} />

      {tab === 'INFO' && (
        <div className="ht-cols">
          <div>
            <Panel title="Tình trạng huấn luyện" right={plan ? <Badge tone={h.trainingLocked ? 'danger' : 'success'}>{h.trainingLocked ? 'Tạm khóa' : 'Đang tập'}</Badge> : undefined}>
              <div className="ht-panel__body" style={{ display: 'grid', gap: 14 }}>
                {plan ? (
                  <>
                    <div><b>{plan.name}</b><div style={{ fontSize: 13, color: 'var(--muted)' }}>{plan.goal} · bắt đầu {plan.startDate} · HLV {plan.createdBy}</div></div>
                    <PhaseBar phases={plan.phases} current={plan.currentPhase} />
                  </>
                ) : <p style={{ margin: 0, color: 'var(--muted)' }}>Chưa có giáo án đang chạy.</p>}
                {h.trainingLocked && <Callout tone="danger" icon="lock">Bác sĩ thú y tạm khóa huấn luyện — xem tab Sức khỏe.</Callout>}
              </div>
            </Panel>
            <Panel title="Phiên tập gần đây">
              <div style={{ overflowX: 'auto' }}>
                <table className="ht-table">
                  <thead><tr><th>Ngày</th><th>Nội dung</th><th>Kết quả</th><th>HLV đánh giá</th></tr></thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.id}>
                        <td className="ht-mono">{s.date}</td><td>{s.label}</td>
                        <td><Badge tone={s.status === 'COMPLETED' ? 'success' : 'danger'} plain>{s.status === 'COMPLETED' ? 'Hoàn thành' : 'Dừng giữa chừng'}</Badge></td>
                        <td>{s.evaluation ? <><b>{s.evaluation.score}/10</b> · {s.evaluation.comment}</> : '—'}</td>
                      </tr>
                    ))}
                    {sessions.length === 0 && <tr><td colSpan={4} className="ht-empty">Chưa có phiên tập.</td></tr>}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
          <div>
            <Panel as="h3" title="Thông tin ngựa">
              <div className="ht-panel__body">
                <dl className="ht-kv">
                  <dt>Giống</dt><dd>{h.breed}</dd><dt>Giới tính</dt><dd>{h.sex === '♂' ? 'Đực' : 'Cái'}</dd><dt>Tuổi</dt><dd>{h.age}</dd>
                  <dt>Microchip</dt><dd className="ht-mono">{h.microchip}</dd><dt>Chuồng</dt><dd>{h.stall}</dd><dt>Chủ sở hữu</dt><dd>{h.owner}</dd>
                </dl>
              </div>
            </Panel>
            <Callout tone="info" title="Phạm vi xem (BR_09)">Bạn xem được hồ sơ, sức khỏe, phác đồ và chi phí của ngựa thuộc sở hữu của mình. Chỉ Bác sĩ thú y và HLV mới chỉnh sửa chuyên môn.</Callout>
          </div>
        </div>
      )}

      {tab === 'HEALTH' && <HealthTab horse={h} protocols={data.protocols} cases={data.cases} vaccinations={data.vaccinations} />}
      {tab === 'PERF' && <PerformanceTab results={data.results} stats={data.stats} proposals={data.proposals} />}

      {tab === 'COST' && (
        <div className="ht-cols">
          <Panel title="Chi phí y tế đã vào hóa đơn" sub={`Tổng ${money(billedTotal)}`}>
            <div style={{ overflowX: 'auto' }}>
              <table className="ht-table">
                <thead><tr><th>Khoản</th><th>Kỳ</th><th>Hóa đơn</th><th style={{ textAlign: 'right' }}>Số tiền</th></tr></thead>
                <tbody>
                  {medicalCost.billed.map((l) => (
                    <tr key={l.invoiceId + l.label}>
                      <td>{l.label}</td><td className="ht-mono">{l.period}</td>
                      <td><Link to={toPath(PATH.owner.invoice, { id: l.invoiceId })} className="ht-mono">{l.invoiceId}</Link> {l.paid ? <Badge tone="success" plain>Đã trả</Badge> : <Badge tone="warning" plain>Chưa trả</Badge>}</td>
                      <td className="ht-mono" style={{ textAlign: 'right' }}>{money(l.amount)}</td>
                    </tr>
                  ))}
                  {medicalCost.billed.length === 0 && <tr><td colSpan={4} className="ht-empty">Chưa có khoản y tế nào trong hóa đơn.</td></tr>}
                </tbody>
              </table>
            </div>
          </Panel>
          <div>
            <Panel as="h3" title="Dự tính (chưa vào hóa đơn)" sub="Phác đồ đang mở — sẽ được tính vào kỳ hóa đơn tiếp theo">
              <div className="ht-panel__body" style={{ display: 'grid', gap: 8, fontSize: 13 }}>
                {medicalCost.estimate.map((p) => <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><span><span className="ht-mono">{p.id}</span> · {p.diagnosis}</span><b className="ht-mono">{money(p.cost)}</b></div>)}
                {medicalCost.estimate.length === 0 ? <span style={{ color: 'var(--muted)' }}>Không có phác đồ đang mở.</span> : <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}><span>Tổng dự tính</span><b className="ht-mono">{money(estimate)}</b></div>}
              </div>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
};
