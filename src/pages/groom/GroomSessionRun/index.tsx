import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DEMO_NOW } from '../../../api/http';
import { groomApi } from '../../../api/groomApi';
import { SESSION_LABEL } from '../../../api/trainerApi';
import { useActor } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { useFetch } from '../../../hooks/useFetch';
import { PATH } from '../../../routers/routerPath';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Callout, PageHeader, Panel } from '../../../components/ui/Ht';
import { HorseBadges, HrChart, LoadState } from '../../../components/trainer/TrainerParts';
import { ReadingForm } from './ReadingForm';

/* 3.1 Bắt đầu phiên · 3.2 Nhập chỉ số · 3.3 Tự tạm dừng khi vượt ngưỡng (BR_02) · 3.4 Kết thúc phiên */
export const GroomSessionRun: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => groomApi.getSession(id, actor), [id, actor]);
  const act = useAction(reload);
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const { session: s, horse, plan } = data;
  const running = s.status === 'IN_PROGRESS' || s.status === 'RESUMED';
  const paused = s.status === 'PAUSED_PENDING_TRAINER';
  const last = s.readings[s.readings.length - 1];
  const d = s.decision;
  const over = (r: { hr: number; speed: number }) => r.hr > s.thresholds.hr || r.speed > s.thresholds.speed;

  return (
    <div className="ht ht-page">
      <PageHeader crumbs={<button type="button" className="ht-back" onClick={() => navigate(-1)}><Icon name="back" size={14} />Quay lại</button>}
        title={<>Phiên <span className="ht-mono">#{s.id}</span> · {s.horseName}</>}
        sub={<>{s.label} · <span className="ht-mono">{s.date}</span> {s.time} · {s.track}{plan.name ? <> · giáo án “{plan.name}”</> : null}</>}
        badge={<Badge tone={SESSION_LABEL[s.status][1]}>{SESSION_LABEL[s.status][0]}</Badge>} />

      {act.error && <Callout tone="danger" style={{ marginBottom: 16 }}>{act.error}</Callout>}

      {paused && (
        <div className="ht-banner" role="alert">
          <Icon name="alarm" />
          <div>
            <b>Phiên tự tạm dừng lúc {s.pausedAt} — đã báo HLV trưởng.</b>
            <p>{s.pausedReason} Không tự tiếp tục. Cho ngựa đi bộ thả lỏng và đo nhịp tim hồi phục mỗi 2–3 phút.</p>
          </div>
        </div>
      )}
      {s.status === 'STOPPED' && (
        <Callout tone="danger" title="HLV trưởng đã dừng phiên" style={{ marginBottom: 16 }}>
          {d?.note ?? 'Phiên đã dừng.'}{d?.caseId && <> Đã chuyển Bác sĩ thú y — ca <span className="ht-mono">{d.caseId}</span>.</>} Đưa ngựa về chuồng, không nhập thêm chỉ số.
        </Callout>
      )}
      {s.status === 'RESUMED' && d?.adjustment && (
        <Callout tone="info" title={`HLV ${d.by} cho tiếp tục lúc ${d.at}`} style={{ marginBottom: 16 }}>
          Điều chỉnh: cự ly {d.adjustment.distanceM} m · ngưỡng nhịp tim mới {d.adjustment.hrLimit} bpm. {d.note}
        </Callout>
      )}
      {s.status === 'COMPLETED' && <Callout tone="success" title="Phiên đã hoàn thành" style={{ marginBottom: 16 }}>{s.readings.length} lần đo. HLV trưởng sẽ đánh giá phiên.</Callout>}

      <div className="ht-cols">
        <div>
          <Panel title="Diễn biến nhịp tim" sub={`Ngưỡng an toàn: ${s.thresholds.hr} bpm · ${s.thresholds.speed} km/h`}
            right={last ? <span className="ht-mono" style={{ fontSize: 13 }}>Lần cuối {last.t}: <b>{last.hr}</b> bpm · {last.speed} km/h</span> : undefined}>
            <div className="ht-panel__body">
              {s.readings.length ? <HrChart readings={s.readings} recovery={s.recovery} limit={s.thresholds.hr} /> : <p style={{ margin: 0, color: 'var(--muted)' }}>Chưa có lần đo nào.</p>}
            </div>
          </Panel>

          {running && (
            <Panel title="Nhập chỉ số" sub="Vượt ngưỡng → hệ thống tự tạm dừng phiên và báo HLV trưởng (BR_02)">
              <div className="ht-panel__body"><ReadingForm busy={act.busy} onSubmit={(v) => act.run(() => groomApi.addReading(s, v, actor), 'Đã ghi chỉ số.')} /></div>
            </Panel>
          )}
          {paused && (
            <Panel title="Nhịp tim hồi phục" sub="HLV cần số liệu hồi phục để quyết định tiếp tục hay chuyển Bác sĩ">
              <div className="ht-panel__body"><ReadingForm recovery busy={act.busy} onSubmit={(v) => act.run(() => groomApi.addRecovery(s, v, actor), 'Đã lưu nhịp hồi phục.')} /></div>
            </Panel>
          )}

          <Panel title="Bảng chỉ số">
            <div style={{ overflowX: 'auto' }}>
              <table className="ht-table">
                <thead><tr><th>Thời điểm</th><th>Nhịp tim</th><th>Tốc độ</th><th>Ghi chú</th></tr></thead>
                <tbody>
                  {s.readings.map((r, i) => (
                    <tr key={`r${i}`}>
                      <td className="ht-mono">{r.t}</td>
                      <td className="ht-mono" style={r.hr > s.thresholds.hr ? { color: 'var(--danger)', fontWeight: 700 } : undefined}>{r.hr} bpm</td>
                      <td className="ht-mono">{r.speed} km/h</td>
                      <td>{over(r) && <Badge tone="danger" plain>Vượt ngưỡng</Badge>}</td>
                    </tr>
                  ))}
                  {(s.recovery ?? []).map((r, i) => (
                    <tr key={`h${i}`}><td className="ht-mono">{r.t}</td><td className="ht-mono">{r.hr} bpm</td><td>—</td><td><Badge tone="info" plain>Hồi phục</Badge></td></tr>
                  ))}
                  {!s.readings.length && <tr><td colSpan={4} className="ht-empty">Chưa có số liệu.</td></tr>}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div>
          <Panel as="h3" title="Ngựa" >
            <div className="ht-panel__body" style={{ display: 'grid', gap: 10 }}>
              <b style={{ fontSize: 18 }}>{horse.name}</b>
              <HorseBadges horse={horse} compact />
              {horse.trainingLocked && <Callout tone="danger" icon="lock">Đang bị khóa huấn luyện bởi BS {horse.lock?.by} (BR_01).</Callout>}
            </div>
          </Panel>
          <Panel as="h3" title="Thao tác">
            <div className="ht-panel__body" style={{ display: 'grid', gap: 10 }}>
              {s.status === 'SCHEDULED' && (
                <>
                  <button type="button" className="ht-btn ht-btn--primary" disabled={act.busy || s.date !== DEMO_NOW.date || !!horse.trainingLocked}
                    onClick={() => act.run(() => groomApi.start(s, actor), `Đã bắt đầu phiên ${s.id}.`)}>
                    <Icon name="pulse" size={16} />Bắt đầu phiên
                  </button>
                  {s.date !== DEMO_NOW.date && <small style={{ color: 'var(--muted)' }}>Phiên lịch ngày {s.date} — chỉ bắt đầu đúng ngày.</small>}
                </>
              )}
              {running && (
                <button type="button" className="ht-btn ht-btn--secondary" disabled={act.busy} onClick={() => act.run(() => groomApi.complete(s, actor), `Đã kết thúc phiên ${s.id}.`)}>
                  <Icon name="check" size={16} />Kết thúc phiên
                </button>
              )}
              <Link className="ht-btn ht-btn--ghost" to={`${PATH.groom.incidents}?horse=${horse.id}`}><Icon name="alert" size={16} />Báo sự cố cho ngựa này</Link>
              {paused && <small style={{ color: 'var(--muted)' }}>Đang chờ HLV trưởng quyết định — chỉ HLV mới có quyền cho tiếp tục.</small>}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};
