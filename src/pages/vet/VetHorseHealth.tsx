import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { ApiError } from '../../api/http';
import { HEALTH_LABEL, horseInitials, PROPOSAL_LABEL } from '../../api/trainerApi';
import { BODY_PARTS, CASE_LABEL, FeedRequest, INJURY_SEVERITIES, isOpenProtocol, MedicalDiet, SEVERITY_LABEL, vetApi } from '../../api/vetApi';
import { useActor } from '../../auth/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { Icon } from '../../components/ui/Icon';
import { Badge, Callout, Dialog, PageHeader, Panel, ReasonField, Tabs, Timeline, useToast } from '../../components/ui/Ht';
import { HorseBadges, LoadState } from '../../components/trainer/TrainerParts';
import { InjuryMap } from '../../components/vet/InjuryMap';
import { ProtocolBadge } from '../../components/vet/VetParts';
import { LockDialog, UnlockDialog } from '../../components/vet/VetDialogs';

type Tab = 'health' | 'cases' | 'vaccines' | 'races';
type DietForm = Omit<MedicalDiet, 'by' | 'at'>;
const EMPTY_DIET: DietForm = { morning: '', noon: '', evening: '', special: '', note: '' };

/* Hồ sơ sức khỏe: 1.3 sơ đồ 2D · 1.4 lịch sử y tế · 3.1–3.2 khóa/mở khóa · 3.3 khẩu phần y tế · 3.4 thức ăn đặc biệt */
export const VetHorseHealth: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const actor = useActor();
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => vetApi.getHorseHealth(id), [id]);
  const [tab, setTab] = useState<Tab>('health');
  const [selMark, setSelMark] = useState<string | null>(null);
  const [mark, setMark] = useState({ part: '', severity: 'Trung bình', note: '', caseId: '' });
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null);
  const [markErr, setMarkErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [dietOpen, setDietOpen] = useState(false);
  const [diet, setDiet] = useState<DietForm>(EMPTY_DIET);
  const [dietErr, setDietErr] = useState('');
  const [feedFor, setFeedFor] = useState<{ req: FeedRequest; approve: boolean } | null>(null);
  const [feedNote, setFeedNote] = useState('');
  const [feedErr, setFeedErr] = useState('');

  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  const { horse, cases, protocols, vaccinations, proposals, feedRequests } = data;
  const openCases = cases.filter((c) => c.status !== 'CLOSED');
  const activeProto = protocols.filter(isOpenProtocol).sort((a, b) => b.version - a.version)[0];
  const examined = openCases.find((c) => c.exam && !protocols.some((p) => p.caseId === c.id && isOpenProtocol(p)));
  const pendingFeeds = feedRequests.filter((f) => f.status === 'PENDING');

  const run = async (fn: () => Promise<unknown>, ok: string, onErr: (m: string) => void) => {
    setBusy(true);
    try { await fn(); toast(ok); reload(); return true; } catch (e) { onErr((e as ApiError).message ?? 'Thao tác thất bại.'); return false; } finally { setBusy(false); }
  };

  const pickPart = (part: string) => {
    setMark({ ...mark, part });
    const p = BODY_PARTS.find((b) => b.part === part);
    if (p) setPending({ x: p.x, y: p.y });
  };
  const addMark = async () => {
    setMarkErr('');
    if (!pending) { setMarkErr('Chọn bộ phận hoặc bấm lên sơ đồ để đặt vị trí.'); return; }
    const ok = await run(() => vetApi.addInjury(horse, { ...mark, ...pending }, actor), `Đã đánh dấu ${mark.part} trên sơ đồ.`, setMarkErr);
    if (ok) { setPending(null); setMark({ part: '', severity: 'Trung bình', note: '', caseId: mark.caseId }); }
  };

  return (
    <div className="ht ht-page">
      <PageHeader
        crumbs={<><Link className="ht-back" to="/vet"><Icon name="back" size={14} />Sức khỏe đàn ngựa</Link><Icon name="chev" size={14} /><b>{horse.name}</b></>}
        title={<span style={{ display: 'inline-flex', gap: 12, alignItems: 'center' }}><i className="ht-avatar ht-avatar--xl">{horseInitials(horse.name)}</i>{horse.name}</span>}
        badge={<HorseBadges horse={horse} />}
        sub={<><span className="ht-mono">{horse.microchip}</span> · {horse.breed} · {horse.sex} {horse.age} tuổi · Chuồng <b>{horse.stall}</b> · Chủ: <b>{horse.owner}</b></>}
        actions={<>
          {horse.trainingLocked
            ? <button type="button" className="ht-btn ht-btn--secondary" onClick={() => setUnlockOpen(true)}><Icon name="unlock" />Mở khóa huấn luyện</button>
            : <button type="button" className="ht-btn ht-btn--danger" onClick={() => setLockOpen(true)}><Icon name="lock" />Khóa huấn luyện</button>}
          {activeProto
            ? <Link className="ht-btn ht-btn--primary" to={`/vet/protocols/${activeProto.id}`}><Icon name="file" />Phác đồ {activeProto.id}</Link>
            : examined
              ? <Link className="ht-btn ht-btn--primary" to={`/vet/protocols/new?horse=${horse.id}&case=${examined.id}`}><Icon name="file" />Tạo phác đồ</Link>
              : <button type="button" className="ht-btn ht-btn--primary" disabled title="Cần một ca khám đã ghi nhận"><Icon name="file" />Tạo phác đồ</button>}
        </>}
      />

      {horse.lock && (
        <div className="ht-banner" role="alert">
          <Icon name="lock" />
          <div>
            <b>Ngựa đang bị khóa tập từ <span className="ht-mono">{horse.lock.at}</span> bởi BS {horse.lock.by} — lý do: {horse.lock.reason}.</b>
            <p>Mọi lịch huấn luyện bị chặn và chỉ Bác sĩ thú y được chỉnh khẩu phần (BR_01, BR_03). Điều kiện mở: {horse.lock.review}</p>
          </div>
        </div>
      )}

      <Tabs<Tab> value={tab} onChange={setTab} items={[
        { value: 'health', label: 'Sức khỏe' },
        { value: 'cases', label: 'Ca khám & phác đồ', count: cases.length },
        { value: 'vaccines', label: 'Tiêm phòng', count: vaccinations.filter((v) => v.status !== 'DONE').length },
        { value: 'races', label: 'Thi đấu', count: proposals.length },
      ]} />

      {tab === 'health' && (
        <div className="ht-cols">
          <div>
            <Panel title="Bản đồ chấn thương 2D" sub="Chọn bộ phận hoặc bấm trực tiếp lên sơ đồ để đặt vị trí, rồi bấm Thêm.">
              <div className="ht-panel__body" style={{ display: 'grid', gap: 14 }}>
                <div className="ht-injury-tools">
                  <select className="ht-select" value={mark.part} onChange={(e) => pickPart(e.target.value)} aria-label="Bộ phận">
                    <option value="">— Bộ phận —</option>
                    {BODY_PARTS.map((b) => <option key={b.part}>{b.part}</option>)}
                  </select>
                  <select className="ht-select" value={mark.severity} onChange={(e) => setMark({ ...mark, severity: e.target.value })} aria-label="Mức độ">
                    {INJURY_SEVERITIES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <input className="ht-input" value={mark.note} onChange={(e) => setMark({ ...mark, note: e.target.value })} placeholder="Mô tả: sưng, đau khi chạm…" aria-label="Mô tả" />
                  {openCases.length > 0 && (
                    <select className="ht-select" value={mark.caseId} onChange={(e) => setMark({ ...mark, caseId: e.target.value })} aria-label="Liên kết ca khám">
                      <option value="">Không gắn ca</option>
                      {openCases.map((c) => <option key={c.id} value={c.id}>#{c.id} · {c.type}</option>)}
                    </select>
                  )}
                  <button type="button" className="ht-btn ht-btn--primary ht-btn--sm" onClick={addMark} disabled={busy}><Icon name="check" />Thêm</button>
                </div>
                {markErr && <Callout tone="danger">{markErr}</Callout>}
                <InjuryMap injuries={horse.injuries} horseName={horse.name} selectedId={selMark} onSelect={setSelMark} pending={pending}
                  onPick={(x, y) => { setPending({ x, y }); if (!mark.part) setMark({ ...mark, part: nearestPart(x, y) }); }} />
              </div>
              <table className="ht-table">
                <thead><tr><th>Bộ phận</th><th>Mức độ</th><th>Ngày ghi</th><th>Bác sĩ</th><th>Ghi chú</th><th /></tr></thead>
                <tbody>
                  {horse.injuries.map((i) => (
                    <tr key={i.id ?? i.part} className={selMark === i.id ? 'is-selected' : undefined}>
                      <td className="strong"><button type="button" className="ht-more" onClick={() => setSelMark(i.id ?? null)}>{i.part}</button></td>
                      <td><Badge tone={i.severity === 'Nặng' ? 'danger' : i.severity === 'Trung bình' ? 'warning' : 'neutral'}>{i.severity}</Badge></td>
                      <td className="mono">{i.date}</td><td>{i.vet}</td><td>{i.note}{i.caseId && <span className="sub mono">#{i.caseId}</span>}</td>
                      <td className="num"><button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" disabled={busy}
                        onClick={() => i.id && run(() => vetApi.removeInjury(horse, i.id as string, actor), `Đã gỡ ${i.part}.`, (m) => toast(m))}>Gỡ</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {horse.injuries.length === 0 && <div className="ht-empty">Chưa có chấn thương được đánh dấu.</div>}
            </Panel>
          </div>

          <div>
            <Panel as="h3" title="Trạng thái hiện tại">
              <div className="ht-panel__body">
                <dl className="ht-kv" style={{ gridTemplateColumns: '100px 1fr' }}>
                  <dt>Sức khỏe</dt><dd><Badge tone={HEALTH_LABEL[horse.health][1]}>{HEALTH_LABEL[horse.health][0]}</Badge></dd>
                  <dt>Huấn luyện</dt><dd>{horse.trainingLocked ? <Badge tone="danger" plain><Icon name="lock" size={12} />&nbsp;KHÓA TẬP</Badge> : 'Được tập'}</dd>
                  {horse.lock && <><dt>Lý do</dt><dd>{horse.lock.reason}</dd><dt>Khóa bởi</dt><dd>{horse.lock.by}</dd><dt>Ngày khóa</dt><dd className="ht-mono">{horse.lock.at}</dd></>}
                </dl>
              </div>
            </Panel>

            <Panel as="h3" title="Khẩu phần y tế" right={<button type="button" className="ht-more" onClick={() => { setDiet(horse.medicalDiet ? { ...horse.medicalDiet } : EMPTY_DIET); setDietErr(''); setDietOpen(true); }}>{horse.medicalDiet ? 'Sửa' : 'Chỉ định'} <Icon name="arrow" /></button>}>
              <div className="ht-panel__body" style={{ display: 'grid', gap: 10 }}>
                {horse.medicalDiet ? (
                  <>
                    <div className="ht-meals">
                      <div><span className="ht-overline">Sáng</span>{horse.medicalDiet.morning || '—'}</div>
                      <div><span className="ht-overline">Trưa</span>{horse.medicalDiet.noon || '—'}</div>
                      <div><span className="ht-overline">Chiều</span>{horse.medicalDiet.evening || '—'}</div>
                    </div>
                    {horse.medicalDiet.special && <div style={{ fontSize: 13 }}><b>Đặc biệt:</b> {horse.medicalDiet.special}</div>}
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{horse.medicalDiet.note} · BS {horse.medicalDiet.by} · {horse.medicalDiet.at}</div>
                  </>
                ) : <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>Khẩu phần thường. Chỉ định khẩu phần y tế khi ngựa bị khóa hoặc đang điều trị (BR_03).</p>}
                {pendingFeeds.map((f) => (
                  <div key={f.id} className="ht-quote" style={{ display: 'grid', gap: 8 }}>
                    <span><b>{f.item}</b> — {f.by} đề nghị lúc <span className="ht-mono">{f.at}</span></span>
                    <span style={{ color: 'var(--muted)' }}>{f.reason}</span>
                    <span style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="ht-btn ht-btn--primary ht-btn--sm" onClick={() => { setFeedFor({ req: f, approve: true }); setFeedNote(''); setFeedErr(''); }}>Duyệt</button>
                      <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" onClick={() => { setFeedFor({ req: f, approve: false }); setFeedNote(''); setFeedErr(''); }}>Từ chối</button>
                    </span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel as="h3" title="Phác đồ đang áp dụng" right={activeProto && <span className="ht-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{activeProto.id}</span>}>
              <div className="ht-panel__body" style={{ display: 'grid', gap: 8 }}>
                {activeProto ? (
                  <>
                    <ProtocolBadge state={activeProto.state} delayed={activeProto.delayed} />
                    {activeProto.phases.map((ph) => (
                      <div key={ph.no} className="ht-row-between" style={{ fontSize: 13, padding: '8px 10px', background: 'var(--bg)', borderRadius: 8 }}>
                        <span><b>GĐ {ph.no}</b> · <span className="ht-mono">{ph.startDate.slice(0, 5)}</span> · {ph.name}</span><span style={{ color: 'var(--muted)' }}>{ph.days} ngày</span>
                      </div>
                    ))}
                    <Link className="ht-more" to={`/vet/protocols/${activeProto.id}`}>Xem phác đồ <Icon name="arrow" /></Link>
                  </>
                ) : <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>Không có phác đồ đang mở.</p>}
              </div>
            </Panel>

            <Panel as="h3" title="Lịch sử y tế">
              <div className="ht-panel__body">
                {horse.medicalHistory.length ? <Timeline items={horse.medicalHistory.map((m) => ({ tone: m.tone, what: m.title, when: m.date }))} />
                  : <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>Chưa có ghi nhận.</p>}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {tab === 'cases' && (
        <div style={{ display: 'grid', gap: 24 }}>
          <Panel title="Ca khám">
            <table className="ht-table">
              <thead><tr><th>Ca</th><th>Loại</th><th>Chẩn đoán</th><th>Mức</th><th>Ngày</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id}>
                    <td className="id"><Link to={`/vet/cases?case=${c.id}`}>{c.id}</Link></td>
                    <td className="strong">{c.type}</td><td>{c.exam?.diagnosis ?? <span style={{ color: 'var(--muted)' }}>Chưa khám</span>}</td>
                    <td><Badge tone={SEVERITY_LABEL[c.severity][1]} plain>{SEVERITY_LABEL[c.severity][0]}</Badge></td>
                    <td className="mono">{c.at}</td><td><Badge tone={CASE_LABEL[c.status][1]}>{CASE_LABEL[c.status][0]}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {cases.length === 0 && <div className="ht-empty">Chưa có ca khám.</div>}
          </Panel>
          <Panel title="Phác đồ điều trị">
            <table className="ht-table">
              <thead><tr><th>Mã</th><th>Chẩn đoán</th><th>Phiên bản</th><th>Ngày cần thuốc</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {[...protocols].sort((a, b) => b.id.localeCompare(a.id)).map((p) => (
                  <tr key={p.id}>
                    <td className="id"><Link to={`/vet/protocols/${p.id}`}>{p.id}</Link></td><td className="strong">{p.diagnosis}</td>
                    <td className="mono">v{p.version}{p.replaces && ` · thay ${p.replaces}`}</td><td className="mono">{p.requiredBy}</td>
                    <td><ProtocolBadge state={p.state} delayed={p.delayed} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {protocols.length === 0 && <div className="ht-empty">Chưa có phác đồ.</div>}
          </Panel>
        </div>
      )}

      {tab === 'vaccines' && (
        <Panel title="Tiêm phòng & tẩy giun" right={<Link className="ht-more" to="/vet/vaccinations">Lịch tiêm toàn đàn <Icon name="arrow" /></Link>}>
          <table className="ht-table">
            <thead><tr><th>Mã</th><th>Loại</th><th>Ngày dự kiến</th><th>Trạng thái</th><th>Thực hiện</th></tr></thead>
            <tbody>
              {[...vaccinations].sort((a, b) => b.due.split('/').reverse().join('').localeCompare(a.due.split('/').reverse().join(''))).map((v) => (
                <tr key={v.id}>
                  <td className="id">{v.id}</td><td className="strong">{v.type}{v.note && <span className="sub">{v.note}</span>}</td><td className="mono">{v.due}</td>
                  <td><Badge tone={v.status === 'DONE' ? 'success' : v.status === 'POSTPONED' ? 'warning' : v.status === 'DUE_SOON' ? 'info' : 'neutral'}>{v.status === 'DONE' ? 'Đã tiêm' : v.status === 'POSTPONED' ? 'Hoãn' : v.status === 'DUE_SOON' ? 'Sắp đến hạn' : 'Đã lên lịch'}</Badge></td>
                  <td>{v.doneAt ? <><span className="ht-mono">{v.doneAt}</span> · lô {v.lot}</> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {vaccinations.length === 0 && <div className="ht-empty">Chưa có lịch tiêm.</div>}
        </Panel>
      )}

      {tab === 'races' && (
        <Panel title="Khám trước thi đấu" right={<Link className="ht-more" to="/vet/race-exams">Yêu cầu khám <Icon name="arrow" /></Link>}>
          <table className="ht-table">
            <thead><tr><th>Mã</th><th>Trạng thái</th><th>Kết quả khám</th></tr></thead>
            <tbody>
              {proposals.map((p) => (
                <tr key={p.id}>
                  <td className="id">{p.id}</td><td><Badge tone={PROPOSAL_LABEL[p.status][1]}>{PROPOSAL_LABEL[p.status][0]}</Badge></td>
                  <td>{p.vetResult ? <><b style={{ color: p.vetResult.pass ? 'var(--success-ink)' : 'var(--danger-ink)' }}>{p.vetResult.pass ? 'ĐẠT' : 'KHÔNG ĐẠT'}</b> · {p.vetResult.note}</> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {proposals.length === 0 && <div className="ht-empty">Chưa có đề xuất thi đấu.</div>}
        </Panel>
      )}

      <LockDialog horse={lockOpen ? horse : null} onClose={() => setLockOpen(false)} onDone={() => { setLockOpen(false); reload(); }} />
      <UnlockDialog horse={unlockOpen ? horse : null} onClose={() => setUnlockOpen(false)} onDone={() => { setUnlockOpen(false); reload(); }} />

      <Dialog open={dietOpen} onClose={() => setDietOpen(false)} icon="heart" tone="brand" busy={busy} busyLabel="Đang lưu…" width={600}
        title={`Khẩu phần y tế · ${horse.name}`} sub="Chỉ định của Bác sĩ được ưu tiên hơn khẩu phần thường; Mã phu chỉ thực hiện, không tự sửa (BR_03)."
        confirmLabel="Lưu chỉ định" onConfirm={() => run(() => vetApi.setDiet(horse, diet, actor), 'Đã lưu khẩu phần y tế.', setDietErr).then((ok) => ok && setDietOpen(false))}>
        {dietErr && <Callout tone="danger" style={{ marginBottom: 14 }}>{dietErr}</Callout>}
        <div style={{ display: 'grid', gap: 12 }}>
          {([['morning', 'Bữa sáng'], ['noon', 'Bữa trưa'], ['evening', 'Bữa chiều'], ['special', 'Thức ăn / phụ gia đặc biệt']] as const).map(([k, label]) => (
            <div key={k} className="ht-field" style={{ margin: 0 }}>
              <label className="ht-label" htmlFor={`dt-${k}`}>{label}</label>
              <input id={`dt-${k}`} className="ht-input" value={diet[k]} onChange={(e) => setDiet({ ...diet, [k]: e.target.value })} />
            </div>
          ))}
          <ReasonField id="dt-note" label="Lý do / ghi chú chỉ định" value={diet.note} onChange={(v) => setDiet({ ...diet, note: v })} placeholder="VD: Giảm năng lượng trong thời gian khóa tập." minHeight={56} />
          {horse.medicalDiet && (
            <button type="button" className="ht-btn ht-btn--ghost" disabled={busy}
              onClick={() => run(() => vetApi.setDiet(horse, null, actor), 'Đã bỏ khẩu phần y tế — quay về khẩu phần thường.', setDietErr).then((ok) => ok && setDietOpen(false))}>
              Bỏ chỉ định — quay về khẩu phần thường
            </button>
          )}
        </div>
      </Dialog>

      <Dialog open={!!feedFor} onClose={() => setFeedFor(null)} icon={feedFor?.approve ? 'check' : 'x'} tone={feedFor?.approve ? 'brand' : 'danger'} danger={!feedFor?.approve}
        busy={busy} title={`${feedFor?.approve ? 'Duyệt' : 'Từ chối'} thức ăn đặc biệt`} sub={feedFor ? `${feedFor.req.item} · ${feedFor.req.horse}` : undefined}
        confirmLabel={feedFor?.approve ? 'Duyệt và thêm vào khẩu phần' : 'Từ chối'}
        onConfirm={() => feedFor && run(() => vetApi.decideFeed(feedFor.req, feedFor.approve, feedNote, actor), feedFor.approve ? 'Đã duyệt và thêm vào khẩu phần y tế.' : 'Đã từ chối yêu cầu.', setFeedErr).then((ok) => ok && setFeedFor(null))}>
        {feedErr && <Callout tone="danger" style={{ marginBottom: 14 }}>{feedErr}</Callout>}
        {feedFor?.approve
          ? <div className="ht-field" style={{ margin: 0 }}><label className="ht-label" htmlFor="fd-note">Ghi chú (không bắt buộc)</label><input id="fd-note" className="ht-input" value={feedNote} onChange={(e) => setFeedNote(e.target.value)} /></div>
          : <ReasonField id="fd-note" label="Lý do từ chối" value={feedNote} onChange={setFeedNote} />}
      </Dialog>
    </div>
  );
};

/** Closest named body part to a click on the map. */
const nearestPart = (x: number, y: number) =>
  BODY_PARTS.reduce((best, b) => (Math.hypot(b.x - x, b.y - y) < Math.hypot(best.x - x, best.y - y) ? b : best)).part;
