import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { HEALTH_LABEL, raceBlock, trainerApi } from '../../../api/trainerApi';
import type { ApiError } from '../../../api/http';
import { useActor } from '../../../auth/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Busy, Callout, PageHeader, Panel, useToast } from '../../../components/ui/Ht';
import { LoadState } from '../../../components/trainer/TrainerParts';

/* 3.2 chọn ngựa đủ điều kiện · 3.3 tạo đề xuất thi đấu (BR_01, BR_04) */
export const TrainerProposalCreate: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const actor = useActor();
  const [params] = useSearchParams();
  const { data, loading, error, reload } = useFetch(() => trainerApi.getRaces(actor), [actor]);
  const [tournamentId, setTournamentId] = useState(params.get('t') ?? '');
  const [horseId, setHorseId] = useState(params.get('horse') ?? '');
  const [note, setNote] = useState('');
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');

  const open = useMemo(() => (data?.tournaments ?? []).filter((x) => !x.finished), [data]);
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const tour = open.find((x) => x.id === tournamentId);
  const horse = data.horses.find((h) => h.id === horseId);
  const dup = (hid: string) => data.proposals.find((p) => p.horseId === hid && p.tournamentId === tournamentId && !['VET_FAILED', 'OWNER_DECLINED', 'REJECTED_BY_ORGANIZER'].includes(p.status));
  const errs = { tour: tour ? '' : 'Chọn giải đấu', horse: !horse ? 'Chọn một ngựa đủ điều kiện' : raceBlock(horse) ?? (dup(horse.id) ? `Đã có đề xuất ${dup(horse.id)?.id} cho giải này` : '') };

  const submit = async () => {
    setTried(true);
    setServerError('');
    if (errs.tour || errs.horse) return;
    setBusy(true);
    try {
      const p = await trainerApi.createProposal({ horseId, tournamentId, note }, actor);
      toast(`Đã tạo đề xuất ${p.id} · gửi yêu cầu khám cho Bác sĩ thú y.`);
      navigate(`/trainer/races?p=${p.id}`);
    } catch (err) {
      setServerError((err as ApiError).message ?? 'Tạo đề xuất thất bại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ht ht-page">
      <PageHeader
        crumbs={<><Link className="ht-back" to="/trainer/races"><Icon name="back" size={14} />Giải đua</Link><Icon name="chev" size={14} /><b>Tạo đề xuất</b></>}
        title="Đề xuất ngựa thi đấu"
        sub="Tạo hồ sơ nội bộ: gửi yêu cầu khám trước thi đấu cho Bác sĩ, sau đó chủ ngựa xác nhận. Chưa phải đăng ký với ban tổ chức."
      />

      <Panel>
        <div className="ht-panel__body" style={{ paddingTop: 20 }}>
          <ol className="ht-stepper" aria-label="Quy trình BR_04">
            <li className="ht-step" data-state="current"><span className="ht-step__dot">1</span>HLV đề xuất</li><li className="ht-step-line" aria-hidden="true" />
            <li className="ht-step"><span className="ht-step__dot">2</span>Bác sĩ khám</li><li className="ht-step-line" aria-hidden="true" />
            <li className="ht-step"><span className="ht-step__dot">3</span>Chủ ngựa đồng ý</li><li className="ht-step-line" aria-hidden="true" />
            <li className="ht-step"><span className="ht-step__dot">4</span>Gửi ban tổ chức</li>
          </ol>
        </div>
      </Panel>
      <div style={{ height: 24 }} />

      {serverError && <Callout tone="danger" style={{ marginBottom: 16 }}>{serverError}</Callout>}

      <div className="ht-cols">
        <div>
          <Panel title="Giải đấu" sub="Danh sách do Quản lý CLB nhập.">
            <div className="ht-panel__body" style={{ display: 'grid', gap: 8 }}>
              {open.map((x) => (
                <label key={x.id} className="ht-role" style={{ alignItems: 'flex-start', padding: '12px 14px' }}>
                  <input type="radio" name="tour" checked={tournamentId === x.id} onChange={() => setTournamentId(x.id)} style={{ marginTop: 3 }} />
                  <span style={{ display: 'grid', gap: 2, flex: 1 }}>
                    <b style={{ fontWeight: 600 }}>{x.name}</b>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}><span className="ht-mono">{x.date}</span> · {x.distance} · {x.venue} · hạn <span className="ht-mono">{x.deadline}</span></span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{x.conditions}</span>
                  </span>
                </label>
              ))}
              {tried && errs.tour && <div className="ht-error"><Icon name="alert" /><span>{errs.tour}</span></div>}
            </div>
          </Panel>

          <Panel title="Chọn ngựa đủ điều kiện" sub="Ngựa chấn thương, cách ly hoặc đang khóa y tế không thể chọn (BR_01).">
            <div className="ht-panel__body" style={{ display: 'grid', gap: 8 }}>
              {data.horses.map((h) => {
                const why = raceBlock(h) ?? (tournamentId && dup(h.id) ? `Đã có đề xuất ${dup(h.id)?.id}` : null);
                const [hl, ht] = HEALTH_LABEL[h.health];
                return (
                  <label key={h.id} className="ht-role" style={{ padding: '10px 14px', ...(why ? { background: 'var(--bg)' } : {}) }}>
                    <input type="radio" name="horse" checked={horseId === h.id} disabled={!!why} onChange={() => setHorseId(h.id)} />
                    <span style={{ display: 'grid', flex: 1 }}>
                      <b style={{ fontWeight: 600 }}>{h.name}</b>
                      <span style={{ fontSize: 12, color: why ? 'var(--danger-ink)' : 'var(--muted)' }}>{why ?? <>{h.breed} · {h.sex} {h.age} tuổi · chủ {h.owner}</>}</span>
                    </span>
                    <Badge tone={ht}>{hl}</Badge>
                  </label>
                );
              })}
              {tried && errs.horse && <div className="ht-error"><Icon name="alert" /><span>{errs.horse}</span></div>}
            </div>
          </Panel>
        </div>

        <div>
          <Panel as="h3" title="Tóm tắt hồ sơ dự kiến" right={<Badge tone="neutral" plain>Bản nháp</Badge>}>
            <div className="ht-panel__body">
              <dl className="ht-kv">
                <dt>Người tạo</dt><dd>{actor.name}</dd>
                <dt>Ngựa</dt><dd>{horse?.name ?? '—'}</dd>
                <dt>Chủ ngựa</dt><dd>{horse?.owner ?? '—'}</dd>
                <dt>Giải</dt><dd>{tour?.name ?? '—'}</dd>
                <dt>Ngày thi</dt><dd className="ht-mono">{tour?.date ?? '—'}</dd>
              </dl>
              <label className="ht-label" htmlFor="pr-note" style={{ display: 'block', margin: '16px 0 6px' }}>Ghi chú cho Bác sĩ (không bắt buộc)</label>
              <textarea id="pr-note" className="ht-textarea" style={{ minHeight: 72 }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: Theo dõi nhịp tim khi bứt tốc." />
              <button type="button" className="ht-btn ht-btn--primary ht-btn--block" style={{ marginTop: 16 }} onClick={submit} disabled={busy} aria-busy={busy || undefined}>
                <Busy busy={busy} label="Đang gửi…"><Icon name="send" />Gửi đề xuất & yêu cầu khám</Busy>
              </button>
            </div>
          </Panel>
          <Callout tone="info" title="Khi nào là “đã đăng ký”?">
            Chỉ khi Bác sĩ khám ĐẠT, chủ ngựa đồng ý và bạn đã gửi hồ sơ cho ban tổ chức. Mọi từ chối phải kèm lý do.
          </Callout>
        </div>
      </div>
    </div>
  );
};
