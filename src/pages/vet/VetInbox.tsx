import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { ApiError } from '../../api/http';
import { HEALTH_LABEL } from '../../api/trainerApi';
import { CASE_LABEL, CaseSource, CaseStatus, isOpenProtocol, PROTOCOL_LABEL, SEVERITY_LABEL, SOURCE_LABEL, VetCase, vetApi } from '../../api/vetApi';
import { useActor } from '../../auth/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { Icon } from '../../components/ui/Icon';
import { Badge, Callout, Dialog, PageHeader, Panel, ReasonField, Tabs, useToast } from '../../components/ui/Ht';
import { LoadState } from '../../components/trainer/TrainerParts';
import { CaseSourceTag, SeverityTag } from '../../components/vet/VetParts';
import { ExamDialog, LockDialog } from '../../components/vet/VetDialogs';

const SEV_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;

/* 1.1 Hộp thư ca khám · 1.2 Ghi nhận ca khám · 3.1 Khóa huấn luyện */
export const VetInbox: React.FC = () => {
  const actor = useActor();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const { data, loading, error, reload } = useFetch(() => vetApi.getCases());
  const [tab, setTab] = useState<CaseStatus>('NEW');
  const [source, setSource] = useState<'' | CaseSource>('');
  const [examFor, setExamFor] = useState<VetCase | null>(null);
  const [lockOpen, setLockOpen] = useState(false);
  const [closeFor, setCloseFor] = useState<VetCase | null>(null);
  const [outcome, setOutcome] = useState('');
  const [closeErr, setCloseErr] = useState('');
  const [busy, setBusy] = useState(false);

  const cases = useMemo(() => data?.cases ?? [], [data]);
  const list = useMemo(() => cases
    .filter((c) => c.status === tab && (!source || c.source === source))
    .sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity] || b.at.localeCompare(a.at)), [cases, tab, source]);

  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const selId = params.get('case');
  const sel = cases.find((c) => c.id === selId) ?? list[0] ?? null;
  const select = (id: string) => setParams({ case: id }, { replace: true });
  const horse = sel ? data.horses.find((h) => h.id === sel.horseId) : undefined;
  const session = sel?.sessionId ? data.sessions.find((s) => s.id === sel.sessionId) : undefined;
  const protocol = sel?.protocolId ? data.protocols.find((p) => p.id === sel.protocolId) : undefined;
  const maxHr = session?.readings.length ? Math.max(...session.readings.map((r) => r.hr)) : null;
  const maxSpeed = session?.readings.length ? Math.max(...session.readings.map((r) => r.speed)) : null;
  const count = (s: CaseStatus) => cases.filter((c) => c.status === s).length;

  const closeCase = async () => {
    if (!closeFor) return;
    setBusy(true);
    try {
      await vetApi.closeCase(closeFor, outcome, actor);
      toast(`Đã đóng ca ${closeFor.id}.`);
      setCloseFor(null);
      reload();
    } catch (e) {
      setCloseErr((e as ApiError).message ?? 'Đóng ca thất bại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ht ht-page">
      <PageHeader title="Hộp thư ca khám" sub="Ca từ phiên tập bị dừng, báo cáo sự cố của Mã phu và yêu cầu của HLV trưởng."
        actions={
          <select className="ht-select" value={source} onChange={(e) => setSource(e.target.value as CaseSource | '')} aria-label="Lọc theo nguồn">
            <option value="">Lọc: Tất cả nguồn</option>
            {(Object.keys(SOURCE_LABEL) as CaseSource[]).map((s) => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}
          </select>} />

      <Tabs<CaseStatus> value={tab} onChange={(t) => { setTab(t); setParams({}, { replace: true }); }} items={[
        { value: 'NEW', label: 'Mới', count: count('NEW') },
        { value: 'MONITORING', label: 'Đang theo dõi', count: count('MONITORING') },
        { value: 'CLOSED', label: 'Đã đóng', count: count('CLOSED') },
      ]} />

      <div className="ht-cols" style={{ gridTemplateColumns: 'minmax(0,1fr) 380px' }}>
        <div>
          <Panel foot={<span style={{ fontSize: 12, color: 'var(--muted)' }}>{list.length} ca · ưu tiên theo mức độ</span>}>
            <div style={{ overflowX: 'auto' }}>
              <table className="ht-table">
                <thead><tr><th>Ca</th><th>Ngựa</th><th>Nguồn</th><th>Loại</th><th>Mức</th><th>Ngày</th></tr></thead>
                <tbody>
                  {list.map((c) => {
                    const h = data.horses.find((x) => x.id === c.horseId);
                    return (
                      <tr key={c.id} className={sel?.id === c.id ? 'is-selected' : undefined} onClick={() => select(c.id)} style={{ cursor: 'pointer' }}
                        tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') select(c.id); }} aria-selected={sel?.id === c.id}>
                        <td className="id">{c.id}</td>
                        <td className="strong">{c.horse}</td>
                        <td><CaseSourceTag source={c.source} /></td>
                        <td>{c.type}</td>
                        <td>{h?.trainingLocked && c.status !== 'CLOSED' ? <Badge tone="danger" plain><Icon name="lock" size={12} />&nbsp;ĐÃ KHÓA</Badge> : <SeverityTag severity={c.severity} />}</td>
                        <td className="mono">{c.at.slice(0, 5)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {list.length === 0 && <div className="ht-empty">Không có ca nào ở mục này.</div>}
            </div>
          </Panel>
        </div>

        <div>
          {sel && horse ? (
            <Panel as="h3" title={<span className="ht-mono" style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400 }}>Ca khám #{sel.id}</span>}
              right={<Badge tone={CASE_LABEL[sel.status][1]}>{CASE_LABEL[sel.status][0]}</Badge>}>
              <div className="ht-panel__body" style={{ display: 'grid', gap: 14 }}>
                <div>
                  <Link to={`/vet/horses/${horse.id}`} style={{ font: '600 20px/28px var(--font-sans)', color: 'var(--foreground)' }}>{horse.name}</Link>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{horse.breed} · {horse.sex} {horse.age} tuổi · Chủ: {horse.owner}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    <Badge tone={HEALTH_LABEL[horse.health][1]}>{HEALTH_LABEL[horse.health][0]}</Badge>
                    {horse.trainingLocked ? <Badge tone="danger" plain><Icon name="lock" size={12} />&nbsp;KHÓA TẬP</Badge> : <Badge tone="neutral" plain>Chưa khóa tập</Badge>}
                  </div>
                </div>
                <dl className="ht-kv" style={{ gridTemplateColumns: '90px 1fr' }}>
                  <dt>Nguồn</dt><dd>{SOURCE_LABEL[sel.source]}{sel.sessionId && <> · phiên <span className="ht-mono">#{sel.sessionId}</span></>}</dd>
                  <dt>Mức độ</dt><dd><SeverityTag severity={sel.severity} /></dd>
                  <dt>Người gửi</dt><dd>{sel.sender} · <span className="ht-mono">{sel.at}</span></dd>
                </dl>
                <div className="ht-quote"><span className="ht-overline">Mô tả</span>{sel.note}</div>
                {session && (
                  <div className="ht-mini-metrics">
                    <div className={maxHr && maxHr > session.thresholds.hr ? 'is-danger' : undefined}>Nhịp tim max<b>{maxHr ?? '—'}</b>ngưỡng {session.thresholds.hr}</div>
                    <div>Tốc độ max<b>{maxSpeed ?? '—'} <small style={{ fontSize: 12, color: 'var(--muted)' }}>km/h</small></b>ngưỡng {session.thresholds.speed}</div>
                  </div>
                )}
                {sel.exam && (
                  <div className="ht-quote">
                    <span className="ht-overline">Kết quả khám · BS {sel.exam.by} · {sel.exam.at}</span>
                    <b>{sel.exam.diagnosis}</b> ({SEVERITY_LABEL[sel.exam.severity][0]})<br />{sel.exam.symptoms}<br /><i>Hướng xử lý:</i> {sel.exam.plan}
                  </div>
                )}
                {protocol && (
                  <Link className="ht-more" to={`/vet/protocols/${protocol.id}`}>Phác đồ <span className="ht-mono">{protocol.id}</span> · {PROTOCOL_LABEL[protocol.state][0]} <Icon name="arrow" /></Link>
                )}
                {sel.outcome && <Callout tone="success" title="Kết luận">{sel.outcome}</Callout>}

                {sel.status !== 'CLOSED' && (
                  <div className="ht-actions-grid">
                    {sel.status === 'NEW'
                      ? <button type="button" className="ht-btn ht-btn--secondary" onClick={() => setExamFor(sel)}><Icon name="clip" />Ghi nhận khám</button>
                      : <button type="button" className="ht-btn ht-btn--secondary" onClick={() => { setCloseFor(sel); setOutcome(''); setCloseErr(''); }}><Icon name="check" />Đóng ca</button>}
                    <button type="button" className="ht-btn ht-btn--danger" disabled={horse.trainingLocked} onClick={() => setLockOpen(true)}
                      title={horse.trainingLocked ? 'Ngựa đã bị khóa huấn luyện' : undefined}><Icon name="lock" />{horse.trainingLocked ? 'Đã khóa' : 'Khóa huấn luyện'}</button>
                    {protocol && isOpenProtocol(protocol)
                      ? <Link className="ht-btn ht-btn--primary ht-btn--block" to={`/vet/protocols/${protocol.id}`}><Icon name="file" />Mở phác đồ {protocol.id}</Link>
                      : <Link className="ht-btn ht-btn--primary ht-btn--block" to={`/vet/protocols/new?horse=${horse.id}&case=${sel.id}`} aria-disabled={!sel.exam}
                          onClick={(e) => { if (!sel.exam) { e.preventDefault(); toast('Ghi nhận khám trước khi lập phác đồ.'); } }}><Icon name="file" />Tạo phác đồ điều trị</Link>}
                  </div>
                )}
                <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}><Icon name="info" size={12} /> Khóa huấn luyện chặn mọi lịch tập của {horse.name} và tạm dừng giáo án đang chạy (BR_01).</p>
              </div>
            </Panel>
          ) : <Panel><div className="ht-empty">Chọn một ca để xem chi tiết.</div></Panel>}
        </div>
      </div>

      <ExamDialog vetCase={examFor} horse={examFor ? data.horses.find((h) => h.id === examFor.horseId) : undefined} onClose={() => setExamFor(null)} onDone={() => { setExamFor(null); setTab('MONITORING'); reload(); }} />
      <LockDialog horse={lockOpen && horse ? horse : null} onClose={() => setLockOpen(false)} onDone={() => { setLockOpen(false); reload(); }} />
      <Dialog open={!!closeFor} onClose={() => setCloseFor(null)} icon="check" tone="brand" busy={busy} busyLabel="Đang đóng…"
        title={`Đóng ca ${closeFor?.id ?? ''}`} sub="Chỉ đóng khi phác đồ của ca đã hoàn tất hoặc ca không cần điều trị." confirmLabel="Đóng ca" onConfirm={closeCase}>
        {closeErr && <Callout tone="danger" style={{ marginBottom: 14 }}>{closeErr}</Callout>}
        <ReasonField id="cl-out" label="Kết luận" value={outcome} onChange={setOutcome} placeholder="VD: Hồi phục hoàn toàn, đủ điều kiện tập lại." />
      </Dialog>
    </div>
  );
};
