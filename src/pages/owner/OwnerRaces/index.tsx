import React, { useState } from 'react';
import { ownerApi } from '../../../api/ownerApi';
import { PROPOSAL_LABEL } from '../../../api/trainerApi';
import { useActor } from '../../../auth/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Callout, PageHeader, Panel, Timeline } from '../../../components/ui/Ht';
import { LoadState } from '../../../components/trainer/TrainerParts';
import { RespondDialog } from './RespondDialog';

/* 3.1 Nhận đề xuất · 3.2 Đồng ý / từ chối · 3.3 Kết quả khám · 3.4 Kết quả thi đấu (BR_04) */
export const OwnerRaces: React.FC = () => {
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => ownerApi.getMyProposals(actor), [actor]);
  const [sel, setSel] = useState<string | null>(null);
  const [answer, setAnswer] = useState<boolean | null>(null);
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const cur = data.find((x) => x.proposal.id === sel) ?? data.find((x) => x.proposal.status === 'WAITING_OWNER') ?? data[0];
  const waiting = data.filter((x) => x.proposal.status === 'WAITING_OWNER').length;
  const p = cur?.proposal;
  const t = cur?.tournament;

  return (
    <div className="ht ht-page">
      <PageHeader title="Xác nhận thi đấu" sub="HLV trưởng đề xuất → bạn đồng ý hoặc từ chối → Bác sĩ khám sức khỏe"
        actions={waiting > 0 ? <Badge tone="warning">{waiting} chờ bạn trả lời</Badge> : undefined} />
      <div className="ht-cols" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)' }}>
        <Panel title="Đề xuất thi đấu" sub={`${data.length} đề xuất cho ngựa của bạn`}>
          <div style={{ overflowX: 'auto' }}>
            <table className="ht-table">
              <thead><tr><th>Mã</th><th>Ngựa</th><th>Giải</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {data.map(({ proposal: x, tournament: tt }) => (
                  <tr key={x.id} onClick={() => setSel(x.id)} style={{ cursor: 'pointer', background: x.id === p?.id ? 'var(--primary-soft)' : undefined }}>
                    <td className="ht-mono">{x.id}</td><td><b>{x.horseName}</b></td><td>{tt?.name ?? x.tournamentId}<div style={{ fontSize: 12, color: 'var(--muted)' }}>{tt?.date}</div></td>
                    <td><Badge tone={PROPOSAL_LABEL[x.status][1]}>{PROPOSAL_LABEL[x.status][0]}</Badge></td>
                  </tr>
                ))}
                {data.length === 0 && <tr><td colSpan={4} className="ht-empty">Chưa có đề xuất thi đấu.</td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>

        {p && (
          <div>
            <Panel title={<>{p.horseName} · <span className="ht-mono">{p.id}</span></>} right={<Badge tone={PROPOSAL_LABEL[p.status][1]}>{PROPOSAL_LABEL[p.status][0]}</Badge>} sub={`Đề xuất bởi HLV ${p.createdBy} ngày ${p.createdAt}`}>
              <div className="ht-panel__body" style={{ display: 'grid', gap: 16 }}>
                {t && (
                  <dl className="ht-kv">
                    <dt>Giải đấu</dt><dd><b>{t.name}</b></dd><dt>Ban tổ chức</dt><dd>{t.organizer}</dd>
                    <dt>Ngày thi đấu</dt><dd className="ht-mono">{t.date}</dd><dt>Địa điểm</dt><dd>{t.venue}</dd>
                    <dt>Cự ly</dt><dd>{t.distance}</dd><dt>Hạn đăng ký</dt><dd className="ht-mono">{t.deadline}</dd><dt>Điều kiện</dt><dd>{t.conditions}</dd>
                  </dl>
                )}
                <div className="ht-report">
                  <b>Kết quả khám trước thi đấu</b>
                  {p.vetResult ? (
                    <>
                      <div><Badge tone={p.vetResult.pass ? 'success' : 'danger'}>{p.vetResult.pass ? 'ĐẠT' : 'KHÔNG ĐẠT'}</Badge> <small style={{ color: 'var(--muted)' }}>BS {p.vetResult.by} · {p.vetResult.at}</small></div>
                      <div style={{ fontSize: 13 }}>{p.vetResult.note}</div>
                      {p.vetResult.conditions && <div style={{ fontSize: 13 }}><b>Điều kiện:</b> {p.vetResult.conditions}</div>}
                    </>
                  ) : <span style={{ fontSize: 13, color: 'var(--muted)' }}>Chủ ngựa đồng ý trước, sau đó Bác sĩ thú y sẽ khám sức khỏe.</span>}
                </div>

                {p.status === 'WAITING_OWNER' && (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button type="button" className="ht-btn ht-btn--primary" onClick={() => setAnswer(true)}><Icon name="check" size={16} />Đồng ý tham gia</button>
                    <button type="button" className="ht-btn ht-btn--secondary" onClick={() => setAnswer(false)}><Icon name="x" size={16} />Từ chối</button>
                  </div>
                )}
                {p.status === 'VET_FAILED' && <Callout tone="danger">Ngựa không đạt khám — quy trình đăng ký nội bộ dừng lại (BR_04).</Callout>}
                {p.status === 'READY_TO_SUBMIT' && <Callout tone="success">Bạn đã đồng ý. CLB sẽ gửi hồ sơ cho ban tổ chức (ngoài hệ thống) — trạng thái chưa có nghĩa BTC đã nhận.</Callout>}
                {p.ownerResponse && !p.ownerResponse.agree && <Callout tone="info">Bạn đã từ chối lúc {p.ownerResponse.at}: “{p.ownerResponse.reason}”.</Callout>}
                {p.result && <Callout tone="success" title={`Kết quả: hạng ${p.result.rank} · ${p.result.time}`}>{p.result.note}</Callout>}
              </div>
            </Panel>
            <Panel as="h3" title="Diễn biến">
              <div className="ht-panel__body"><Timeline items={p.history.map((hh) => ({ tone: hh.tone, what: <><b>{hh.who}</b> {hh.text}</>, when: hh.at }))} /></div>
            </Panel>
          </div>
        )}
      </div>
      {p && answer !== null && <RespondDialog proposal={p} agree={answer} onClose={() => setAnswer(null)} onDone={() => { setAnswer(null); reload(); }} />}
    </div>
  );
};
