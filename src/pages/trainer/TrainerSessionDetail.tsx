import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Intensity, SESSION_LABEL, trainerApi, trainingBlock, horseInitials } from '../../api/trainerApi';
import type { ApiError } from '../../api/http';
import { useActor } from '../../auth/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { Icon } from '../../components/ui/Icon';
import { Badge, Busy, Callout, PageHeader, Panel, ReasonField, Rules, useToast } from '../../components/ui/Ht';
import { HorseBadges, HrChart, LoadState } from '../../components/trainer/TrainerParts';

type Choice = 'stop' | 'adjust';
const INTENSITIES: Intensity[] = ['Nhẹ', 'Vừa', 'Cao'];

/* 2.1 cảnh báo PAUSED_PENDING_TRAINER · 2.2 biểu đồ chỉ số · 2.3 dừng & gửi bác sĩ · 2.4 điều chỉnh & tiếp tục */
export const TrainerSessionDetail: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const toast = useToast();
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => trainerApi.getSession(id, actor), [id, actor]);
  const [choice, setChoice] = useState<Choice>('stop');
  const [note, setNote] = useState('');
  const [adj, setAdj] = useState<{ intensity: Intensity; distanceM: number; hrLimit: number } | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  const { session: s, horse, plan, previousMax } = data;
  const phase = plan.phases.find((p) => p.no === s.phaseNo) ?? plan.phases[0];
  const a = adj ?? { intensity: phase.intensity === 'Cao' ? 'Vừa' : 'Nhẹ', distanceM: Math.max(400, phase.distanceM - 400), hrLimit: s.thresholds.hr };

  const peak = s.readings.length ? s.readings.reduce((m, r) => (r.hr > m.hr ? r : m), s.readings[0]) : null;
  const peakSpeed = s.readings.length ? Math.max(...s.readings.map((r) => r.speed)) : 0;
  const recovered = (s.recovery ?? [])[(s.recovery ?? []).length - 1];
  const lock = trainingBlock(horse);
  const recoveryOk = !!recovered && recovered.hr < s.thresholds.hr;
  const canContinue = !lock && recoveryOk;
  const pending = s.status === 'PAUSED_PENDING_TRAINER';
  const hrPct = peak ? Math.round((peak.hr / s.thresholds.hr) * 100) : 0;
  const spPct = Math.round((peakSpeed / s.thresholds.speed) * 100);

  const submit = async () => {
    setErr('');
    if (note.trim().length < 10) { setErr(choice === 'stop' ? 'Mô tả dấu hiệu cho bác sĩ ít nhất 10 ký tự.' : 'Ghi rõ nội dung điều chỉnh ít nhất 10 ký tự.'); return; }
    setBusy(true);
    try {
      if (choice === 'stop') {
        const r = await trainerApi.stopAndRequestVet(s, note, actor);
        toast(`Đã dừng ${s.id} và gửi ca khám ${r.decision?.caseId} cho Bác sĩ thú y.`);
      } else {
        await trainerApi.adjustAndContinue(s, { ...a, note }, actor);
        toast(`Đã điều chỉnh giáo án và cho ${s.horseName} tiếp tục phiên ${s.id}.`);
      }
      setNote('');
      reload();
    } catch (e) {
      setErr((e as ApiError).message ?? 'Lưu quyết định thất bại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ht ht-page">
      <PageHeader
        crumbs={<><Link className="ht-back" to="/trainer/schedule"><Icon name="back" size={14} />Lịch tập</Link><Icon name="chev" size={14} /><span className="ht-mono">{s.date}</span><Icon name="chev" size={14} /><b className="ht-mono">{s.id}</b></>}
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
          <Panel title="Chỉ số tại thời điểm dừng" right={<span style={{ fontSize: 12, color: 'var(--muted)', display: 'inline-flex', gap: 6, alignItems: 'center' }}><Icon name="lock" size={12} />Chỉ đọc</span>}>
            <div className="ht-panel__body" style={{ display: 'grid', gap: 20 }}>
              <div className="ht-metrics">
                <div className={`ht-metric${hrPct >= 100 ? ' ht-metric--over' : ''}`}>
                  <div className="ht-metric__top"><span>Nhịp tim (bpm)</span><span>Ngưỡng <b className="ht-mono">{s.thresholds.hr}</b></span></div>
                  <div className="ht-metric__value">{peak?.hr ?? '—'}<small>max · lúc {peak?.t}</small></div>
                  <div className="ht-metric__bar"><i style={{ width: `${Math.min(hrPct, 100)}%` }} /></div>
                  <span className="ht-metric__pct">{hrPct}% ngưỡng</span>
                </div>
                <div className={`ht-metric${spPct >= 100 ? ' ht-metric--over' : ''}`}>
                  <div className="ht-metric__top"><span>Tốc độ (km/h)</span><span>Ngưỡng <b className="ht-mono">{s.thresholds.speed}</b></span></div>
                  <div className="ht-metric__value">{peakSpeed || '—'}<small>max</small></div>
                  <div className="ht-metric__bar"><i style={{ width: `${Math.min(spPct, 100)}%` }} /></div>
                  <span className="ht-metric__pct">{spPct}% ngưỡng</span>
                </div>
              </div>
              {s.readings.length > 0 ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 12, flexWrap: 'wrap' }}>
                    <b style={{ fontSize: 14 }}>Diễn biến nhịp tim</b>
                    <span className="ht-chart-legend">
                      <span><i style={{ borderColor: 'var(--danger)' }} />Trong phiên</span>
                      {s.recovery?.length ? <span><i style={{ borderColor: 'var(--primary-light)', borderTopStyle: 'dashed' }} />Hồi phục</span> : null}
                      <span><i style={{ borderColor: 'var(--warning)', borderTopStyle: 'dashed' }} />Ngưỡng</span>
                    </span>
                  </div>
                  <HrChart readings={s.readings} recovery={s.recovery} limit={s.thresholds.hr} />
                </div>
              ) : <p style={{ margin: 0, color: 'var(--muted)' }}>Phiên chưa có số liệu đo.</p>}
            </div>
          </Panel>

          {pending ? (
            <Panel title="Hành động tiếp theo" sub="Chọn một hướng xử lý. Quyết định được lưu vào lịch sử phiên tập và nhật ký hệ thống.">
              <div className="ht-panel__body" style={{ display: 'grid', gap: 16 }}>
                <div className="ht-choices" role="group" aria-label="Hướng xử lý">
                  <button type="button" className="ht-choice" aria-pressed={choice === 'stop'} onClick={() => { setChoice('stop'); setErr(''); }}>
                    <b><Icon name="heart" />Dừng phiên & gửi ca khám cho Bác sĩ</b>
                    <small>Tạo ca mới trong hộp thư Bác sĩ thú y, tạm dừng giáo án đến khi có kết luận.</small>
                  </button>
                  <button type="button" className="ht-choice" aria-pressed={choice === 'adjust'} disabled={!canContinue} onClick={() => { setChoice('adjust'); setErr(''); }}>
                    <b><Icon name="calendar" />Điều chỉnh giáo án & tiếp tục</b>
                    <small>{canContinue ? 'Giảm cường độ / quãng đường của giai đoạn hiện tại rồi cho phép Mã phu tiếp tục.' : lock ?? `Nhịp tim hồi phục ${recovered ? `${recovered.hr} bpm` : 'chưa đo'} — chưa về dưới ${s.thresholds.hr}.`}</small>
                  </button>
                </div>

                <Rules items={[
                  { ok: !lock, label: <>Ngựa không bị khóa y tế <span className="ht-mono" style={{ fontSize: 12 }}>(BR_01)</span></> },
                  { ok: recoveryOk, label: <>Nhịp tim hồi phục dưới ngưỡng: {recovered ? <b className="ht-mono">{recovered.hr} bpm lúc {recovered.t}</b> : 'chưa có số đo'} <span className="ht-mono" style={{ fontSize: 12 }}>(BR_02)</span></> },
                ]} />

                {choice === 'adjust' && canContinue && (
                  <div className="ht-grid-2" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                    <div className="ht-field" style={{ margin: 0 }}>
                      <label className="ht-label" htmlFor="adj-i">Cường độ mới</label>
                      <select id="adj-i" className="ht-select" style={{ height: 44 }} value={a.intensity} onChange={(e) => setAdj({ ...a, intensity: e.target.value as Intensity })}>
                        {INTENSITIES.map((x) => <option key={x}>{x}</option>)}
                      </select>
                      <span className="ht-hint">Đang: {phase.intensity}</span>
                    </div>
                    <div className="ht-field" style={{ margin: 0 }}>
                      <label className="ht-label" htmlFor="adj-d">Quãng đường (m)</label>
                      <input id="adj-d" type="number" step={100} min={200} className="ht-input" value={a.distanceM} onChange={(e) => setAdj({ ...a, distanceM: Number(e.target.value) })} />
                      <span className="ht-hint">Đang: {phase.distanceM} m</span>
                    </div>
                    <div className="ht-field" style={{ margin: 0 }}>
                      <label className="ht-label" htmlFor="adj-h">Ngưỡng bpm</label>
                      <input id="adj-h" type="number" min={120} max={s.thresholds.hr} className="ht-input" value={a.hrLimit} onChange={(e) => setAdj({ ...a, hrLimit: Number(e.target.value) })} />
                      <span className="ht-hint">Không vượt {s.thresholds.hr}</span>
                    </div>
                  </div>
                )}

                <ReasonField id="decision-note" label={choice === 'stop' ? 'Mô tả dấu hiệu cho Bác sĩ' : 'Nội dung điều chỉnh'} value={note}
                  onChange={(v) => { setNote(v); if (v.trim().length >= 10) setErr(''); }}
                  placeholder={choice === 'stop' ? 'VD: Thở gấp sau vòng 3, bước chân trước phải hơi ngắn.' : 'VD: Giảm cường độ, chạy nhẹ 800 m còn lại, theo dõi nhịp tim mỗi 2 phút.'} />
                {err && <Callout tone="danger">{err}</Callout>}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)', display: 'inline-flex', gap: 6, alignItems: 'center' }}><Icon name="info" size={14} />Mã phu chỉ tiếp tục khi bạn đã điều chỉnh và hệ thống cho phép.</span>
                  <button type="button" className={`ht-btn ${choice === 'stop' ? 'ht-btn--danger' : 'ht-btn--primary'}`} onClick={submit} disabled={busy || (choice === 'adjust' && (!canContinue || a.hrLimit > s.thresholds.hr))} aria-busy={busy || undefined}>
                    <Busy busy={busy} label="Đang lưu…"><Icon name="send" />{choice === 'stop' ? 'Dừng phiên & gửi Bác sĩ' : 'Điều chỉnh & cho tiếp tục'}</Busy>
                  </button>
                </div>
              </div>
            </Panel>
          ) : s.decision ? (
            <Panel title="Quyết định đã ghi nhận" right={<Badge tone={s.decision.type === 'STOP_VET' ? 'danger' : 'info'}>{s.decision.type === 'STOP_VET' ? 'Dừng & gửi BS' : 'Điều chỉnh & tiếp tục'}</Badge>}>
              <div className="ht-panel__body">
                <dl className="ht-kv">
                  <dt>Người quyết định</dt><dd>{s.decision.by} · <span className="ht-mono">{s.decision.at}</span></dd>
                  {s.decision.caseId && <><dt>Ca khám</dt><dd className="ht-mono">#{s.decision.caseId} · đã gửi BS</dd></>}
                  {s.decision.adjustment && <><dt>Điều chỉnh</dt><dd>{s.decision.adjustment.intensity} · {s.decision.adjustment.distanceM} m · ngưỡng {s.decision.adjustment.hrLimit} bpm</dd></>}
                  <dt>Ghi chú</dt><dd>{s.decision.note}</dd>
                </dl>
              </div>
            </Panel>
          ) : null}
        </div>

        <div>
          <Panel as="h3">
            <div className="ht-panel__body" style={{ paddingTop: 20 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <i className="ht-avatar ht-avatar--xl">{horseInitials(horse.name)}</i>
                <div><Link className="strong" style={{ fontWeight: 600 }} to={`/trainer/horses/${horse.id}`}>{horse.name}</Link><div style={{ fontSize: 13, color: 'var(--muted)' }}>{horse.breed} · {horse.sex} {horse.age} tuổi</div></div>
              </div>
              <HorseBadges horse={horse} />
              <hr className="ht-divider" />
              <dl className="ht-kv">
                <dt>Chủ ngựa</dt><dd>{horse.owner}</dd>
                <dt>Giáo án</dt><dd>{plan.type} · P{s.phaseNo} <span className="ht-mono" style={{ color: 'var(--muted)' }}>{plan.id}</span></dd>
                <dt>Phiên trước</dt><dd className="ht-mono">{previousMax ? `Max ${previousMax} bpm` : '—'}</dd>
              </dl>
            </div>
          </Panel>

          {s.alerts && (
            <Panel as="h3" title="Cảnh báo đã gửi">
              <ul className="ht-list">
                {s.alerts.map((al) => (
                  <li key={al.to} className="ht-list-row">
                    <div className="r1"><span className="r2">{al.to}</span>{al.seen ? <Badge tone="success" plain>Đã xem</Badge> : <span className="ht-mono" style={{ fontSize: 12 }}>{al.at}</span>}</div>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{al.role} · {al.channel} · <span className="ht-mono">{al.at}</span></span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <Callout tone="demo" title="Ngưỡng an toàn · DEMO ONLY">
            Giá trị {s.thresholds.hr} bpm / {s.thresholds.speed} km/h chỉ để trình diễn. Ngưỡng sản xuất cần được Bác sĩ thú y xác nhận.
          </Callout>
        </div>
      </div>
    </div>
  );
};
