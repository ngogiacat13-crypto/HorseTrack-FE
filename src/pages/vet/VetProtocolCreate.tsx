import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { DEMO_NOW, type ApiError } from '../../api/http';
import { addDays, InventoryItem, ProtoPhase, protoCost, vetApi } from '../../api/vetApi';
import { useActor } from '../../auth/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { Icon } from '../../components/ui/Icon';
import { Callout, money, PageHeader, Panel, useToast } from '../../components/ui/Ht';
import { HorseBadges, LoadState } from '../../components/trainer/TrainerParts';

const newPhase = (no: number, start: string): ProtoPhase => ({ no, name: '', startDate: start, days: 7, goal: '', items: [] });
/** On hand minus held — plus what the replaced version holds, since sending the new version releases it. */
const available = (i: InventoryItem | undefined, releasedByOld = 0) => (i ? Math.max(0, i.onHand - i.held + releasedByOld) : 0);

/* 2.1 Tạo phác đồ nhiều giai đoạn · 2.2 Gửi kiểm tra tồn kho · 2.4 Tạo phiên bản mới khi đổi thuốc */
export const VetProtocolCreate: React.FC = () => {
  const [params] = useSearchParams();
  const replaceId = params.get('replace') ?? undefined;
  const { data, loading, error, reload } = useFetch(() => vetApi.getProtocolForm({ replaceId }), [replaceId]);
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  return <ProtocolForm key={replaceId ?? 'new'} data={data} horseParam={params.get('horse') ?? ''} caseParam={params.get('case') ?? ''} />;
};

type FormData = Awaited<ReturnType<typeof vetApi.getProtocolForm>>;

/** Case to use for a horse: the one asked for, else the first examined one. */
const pickCase = (data: FormData, horseId: string, wanted = '') => {
  const cases = data.cases.filter((c) => c.horseId === horseId);
  return cases.find((c) => c.id === wanted) ?? cases.find((c) => c.exam);
};

// Starts from the replaced protocol (new version, 2.4) or from the case exam.
const ProtocolForm: React.FC<{ data: FormData; horseParam: string; caseParam: string }> = ({ data, horseParam, caseParam }) => {
  const navigate = useNavigate();
  const actor = useActor();
  const toast = useToast();
  const r = data.replacing;
  const firstCase = r ? undefined : pickCase(data, horseParam, caseParam);
  const [horseId, setHorseId] = useState(r?.horseId ?? horseParam);
  const [caseId, setCaseId] = useState(r?.caseId ?? firstCase?.id ?? '');
  const [diagnosis, setDiagnosis] = useState(r?.diagnosis ?? firstCase?.exam?.diagnosis ?? '');
  const [requiredBy, setRequiredBy] = useState(r?.requiredBy ?? addDays(DEMO_NOW.date, 2));
  const [phases, setPhases] = useState<ProtoPhase[]>(() => (r
    ? r.phases.map((p) => ({ ...p, items: p.items.map((i) => ({ ...i })) }))
    : [newPhase(1, addDays(DEMO_NOW.date, 2))]));
  const [open, setOpen] = useState(0);
  const [adding, setAdding] = useState<Record<number, string>>({});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState<'' | 'draft' | 'send'>('');

  const cases = data.cases.filter((c) => c.horseId === horseId);
  const chooseHorse = (id: string) => {
    const c = pickCase(data, id);
    setHorseId(id); setCaseId(c?.id ?? ''); setDiagnosis(c?.exam?.diagnosis ?? '');
  };
  const inv = Object.fromEntries(data.inventory.map((i) => [i.id, i]));
  const horse = data.horses.find((h) => h.id === horseId);
  const vetCase = cases.find((c) => c.id === caseId);
  const horsesWithCases = data.horses.filter((h) => data.cases.some((c) => c.horseId === h.id));
  const total = protoCost(phases);
  const needOf = (itemId: string) => phases.reduce((s, p) => s + p.items.filter((i) => i.itemId === itemId).reduce((t, i) => t + i.qty, 0), 0);

  const setPhase = (idx: number, patch: Partial<ProtoPhase>) => setPhases(phases.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  const addItem = (idx: number) => {
    const it = inv[adding[idx]];
    if (!it) return;
    if (phases[idx].items.some((x) => x.itemId === it.id)) { toast(`${it.name} đã có trong giai đoạn này.`); return; }
    setPhase(idx, { items: [...phases[idx].items, { itemId: it.id, name: it.name, unit: it.unit, unitPrice: it.unitPrice, qty: 1 }] });
    setAdding({ ...adding, [idx]: '' });
  };
  const addPhase = () => {
    const last = phases[phases.length - 1];
    setPhases([...phases, newPhase(phases.length + 1, addDays(last.startDate, last.days))]);
    setOpen(phases.length);
  };

  const submit = async (send: boolean) => {
    setErr('');
    if (!horse) { setErr('Chọn ngựa.'); return; }
    if (!vetCase) { setErr('Chọn ca khám cho phác đồ.'); return; }
    setBusy(send ? 'send' : 'draft');
    try {
      const p = await vetApi.createProtocol({ horseId, caseId, diagnosis, requiredBy, phases, replaces: data.replacing?.id ?? null }, send, actor);
      toast(send ? `${p.id} đã gửi kho kiểm tra tồn.` : `Đã lưu nháp ${p.id}.`);
      navigate(`/vet/protocols/${p.id}`);
    } catch (e) {
      setErr((e as ApiError).message ?? 'Lưu thất bại.');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="ht ht-page">
      <PageHeader
        crumbs={<><Link className="ht-back" to="/vet/protocols"><Icon name="back" size={14} />Phác đồ điều trị</Link><Icon name="chev" size={14} /><b>{data.replacing ? `Phiên bản mới của ${data.replacing.id}` : 'Tạo mới'}</b></>}
        title={<>Tạo phác đồ điều trị{horse && <span style={{ color: 'var(--muted)', fontWeight: 500 }}> / {horse.name}</span>}</>}
        badge={horse && <HorseBadges horse={horse} compact />}
      />

      {data.replacing && (
        <Callout tone="demo" icon="refresh" title={`Phiên bản ${data.replacing.version + 1} thay cho ${data.replacing.id}`} style={{ marginBottom: 24 }}>
          Sửa thuốc / số lượng rồi gửi kho kiểm tồn lại. Khi gửi, {data.replacing.id} chuyển SUPERSEDED, phần tồn đã giữ được trả lại và kho không cấp theo bản cũ (BR_07).
        </Callout>
      )}

      <div className="ht-cols" style={{ gridTemplateColumns: 'minmax(0,1fr) 320px' }}>
        <div>
          <Panel title="Ngựa & chẩn đoán">
            <div className="ht-panel__body ht-proto-phase__grid" style={{ gridTemplateColumns: '1fr 1fr 2fr 1fr' }}>
              <div className="ht-field">
                <label className="ht-label" htmlFor="pc-horse">Ngựa<span className="ht-req">*</span></label>
                <select id="pc-horse" className="ht-select" style={{ height: 40, width: '100%' }} value={horseId} disabled={!!data.replacing}
                  onChange={(e) => chooseHorse(e.target.value)}>
                  <option value="">— Chọn ngựa —</option>
                  {horsesWithCases.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div className="ht-field">
                <label className="ht-label" htmlFor="pc-case">Ca khám<span className="ht-req">*</span></label>
                <select id="pc-case" className="ht-select" style={{ height: 40, width: '100%' }} value={caseId} disabled={!horseId || !!data.replacing}
                  onChange={(e) => { setCaseId(e.target.value); setDiagnosis(cases.find((c) => c.id === e.target.value)?.exam?.diagnosis ?? ''); }}>
                  <option value="">{horseId ? '— Chọn ca —' : '— Chọn ngựa trước —'}</option>
                  {cases.map((c) => <option key={c.id} value={c.id} disabled={!c.exam}>#{c.id} · {c.type}{!c.exam ? ' — chưa khám' : ''}</option>)}
                </select>
              </div>
              <div className="ht-field">
                <label className="ht-label" htmlFor="pc-dx">Chẩn đoán<span className="ht-req">*</span></label>
                <input id="pc-dx" className="ht-input" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
              </div>
              <div className="ht-field">
                <label className="ht-label" htmlFor="pc-req">Ngày cần thuốc</label>
                <input id="pc-req" className="ht-input ht-mono" value={requiredBy} onChange={(e) => setRequiredBy(e.target.value)} placeholder="dd/mm/yyyy" />
              </div>
            </div>
          </Panel>

          {phases.map((ph, idx) => (
            <section key={idx} className="ht-proto-phase">
              <div className="ht-proto-phase__head">
                <span className="ht-phase__no">{String(idx + 1).padStart(2, '0')}</span>
                <h3>Giai đoạn {idx + 1}{ph.name && ` · ${ph.name}`}</h3>
                {open !== idx && <span style={{ fontSize: 13, color: 'var(--muted)' }}>Bắt đầu <span className="ht-mono">{ph.startDate}</span> · {ph.items.map((i) => `${i.name} × ${i.qty}`).join(', ') || 'chưa có thuốc'}</span>}
                <b className="ht-mono" style={{ fontSize: 14 }}>{money(protoCost([ph]))}</b>
                <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" onClick={() => setOpen(open === idx ? -1 : idx)} aria-expanded={open === idx}>{open === idx ? 'Thu gọn' : 'Mở'}</button>
                {phases.length > 1 && <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" onClick={() => { setPhases(phases.filter((_, i) => i !== idx).map((p, i) => ({ ...p, no: i + 1 }))); setOpen(-1); }} aria-label={`Xóa giai đoạn ${idx + 1}`}><Icon name="x" /></button>}
              </div>
              {open === idx && (
                <div className="ht-proto-phase__body">
                  <div className="ht-proto-phase__grid">
                    <div className="ht-field"><label className="ht-label" htmlFor={`ph-name-${idx}`}>Tên giai đoạn<span className="ht-req">*</span></label>
                      <input id={`ph-name-${idx}`} className="ht-input" value={ph.name} onChange={(e) => setPhase(idx, { name: e.target.value })} placeholder="VD: Chống viêm cấp" /></div>
                    <div className="ht-field"><label className="ht-label" htmlFor={`ph-start-${idx}`}>Ngày bắt đầu</label>
                      <input id={`ph-start-${idx}`} className="ht-input ht-mono" value={ph.startDate} onChange={(e) => setPhase(idx, { startDate: e.target.value })} placeholder="dd/mm/yyyy" /></div>
                    <div className="ht-field"><label className="ht-label" htmlFor={`ph-days-${idx}`}>Thời lượng (ngày)</label>
                      <input id={`ph-days-${idx}`} className="ht-input" type="number" min={1} value={ph.days} onChange={(e) => setPhase(idx, { days: Number(e.target.value) })} /></div>
                    <div className="ht-field"><label className="ht-label" htmlFor={`ph-goal-${idx}`}>Mục tiêu</label>
                      <input id={`ph-goal-${idx}`} className="ht-input" value={ph.goal} onChange={(e) => setPhase(idx, { goal: e.target.value })} placeholder="VD: Giảm sưng" /></div>
                  </div>
                  <table className="ht-proto-items">
                    <thead><tr><th>Thuốc / vật tư</th><th className="num">Số lượng</th><th className="num">Đơn giá</th><th className="num">Thành tiền</th><th className="num">Tồn khả dụng</th><th /></tr></thead>
                    <tbody>
                      {ph.items.map((it, j) => {
                        const avail = available(inv[it.itemId], r?.stock?.lines.find((l) => l.itemId === it.itemId)?.held ?? 0);
                        const warn = needOf(it.itemId) > avail;
                        return (
                          <tr key={it.itemId} className={warn ? 'is-warn' : undefined}>
                            <td><b>{it.name}</b>{inv[it.itemId]?.note && <span style={{ color: 'var(--muted)' }}> · {inv[it.itemId].note}</span>}{warn && <> <Icon name="warn" size={14} style={{ color: 'var(--warning-ink)' }} /></>}
                              {inv[it.itemId] && <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)' }}>{inv[it.itemId].route}{inv[it.itemId].doseRef && ` · liều tham khảo ${inv[it.itemId].doseRef}`}{inv[it.itemId].detectionHours && <b style={{ color: 'var(--warning-ink)' }}> · phát hiện thi đấu ~{Math.round((inv[it.itemId].detectionHours as number) / 24)} ngày</b>}</span>}</td>
                            <td className="num"><input className="ht-input" type="number" min={1} value={it.qty} aria-label={`Số lượng ${it.name}`}
                              onChange={(e) => setPhase(idx, { items: ph.items.map((x, k) => (k === j ? { ...x, qty: Number(e.target.value) } : x)) })} /> {it.unit}</td>
                            <td className="num ht-mono">{money(it.unitPrice)}</td>
                            <td className="num"><b>{money(it.qty * it.unitPrice)}</b></td>
                            <td className="num ht-mono" style={{ color: warn ? 'var(--warning-ink)' : undefined }}>{avail} {it.unit}</td>
                            <td className="num"><button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" aria-label={`Bỏ ${it.name}`} onClick={() => setPhase(idx, { items: ph.items.filter((_, k) => k !== j) })}><Icon name="x" /></button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="ht-proto-add">
                    <select className="ht-select" value={adding[idx] ?? ''} onChange={(e) => setAdding({ ...adding, [idx]: e.target.value })} aria-label="Chọn thuốc / vật tư">
                      <option value="">— Chọn thuốc / vật tư từ danh mục kho —</option>
                      {[...new Set(data.inventory.map((i) => i.group))].map((g) => (
                        <optgroup key={g} label={g}>
                          {data.inventory.filter((i) => i.group === g).map((i) => <option key={i.id} value={i.id}>{i.name}{i.note ? ` (${i.note})` : ''} · {money(i.unitPrice)}/{i.unit}</option>)}
                        </optgroup>
                      ))}
                    </select>
                    <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" onClick={() => addItem(idx)} disabled={!adding[idx]}><Icon name="check" />Thêm thuốc</button>
                    <span style={{ marginLeft: 'auto', fontSize: 13 }}>Chi phí giai đoạn: <b>{money(protoCost([ph]))}</b></span>
                  </div>
                </div>
              )}
            </section>
          ))}
          <button type="button" className="ht-dashed-btn" onClick={addPhase}>+ Thêm giai đoạn</button>
          <Callout tone="info" icon="box">“Tồn khả dụng” chỉ để tham khảo (tồn thực tế trừ phần đang giữ). Số lượng có thể cấp, lô/hạn dùng và ETA do Quản lý kho phản hồi sau khi bạn gửi kiểm tồn.</Callout>
        </div>

        <div>
          <Panel as="h3" title="Tóm tắt phác đồ">
            <div className="ht-panel__body" style={{ display: 'grid', gap: 14 }}>
              <dl className="ht-kv" style={{ gridTemplateColumns: '100px 1fr' }}>
                <dt>Ngựa</dt><dd>{horse ? <>{horse.name} <span className="ht-mono" style={{ color: 'var(--muted)', fontSize: 12 }}>{horse.microchip}</span></> : '—'}</dd>
                <dt>Ca khám</dt><dd className="ht-mono">{vetCase ? vetCase.id : '—'}</dd>
                <dt>Khóa tập</dt><dd>{horse ? (horse.trainingLocked ? <b style={{ color: 'var(--danger-ink)' }}>ĐANG KHÓA</b> : 'Không') : '—'}</dd>
                <dt>Số giai đoạn</dt><dd>{phases.length}</dd>
              </dl>
              <dl className="ht-sum">
                {phases.map((p, i) => <React.Fragment key={i}><dt>Giai đoạn {i + 1}</dt><dd className="ht-mono">{money(protoCost([p]))}</dd></React.Fragment>)}
                <dt style={{ alignSelf: 'center', color: 'var(--foreground)', fontWeight: 600 }}>Tổng chi phí</dt><dd className="total">{money(total)}</dd>
              </dl>
              {err && <Callout tone="danger">{err}</Callout>}
              <button type="button" className="ht-btn ht-btn--primary ht-btn--block" onClick={() => submit(true)} disabled={!!busy}>
                {busy === 'send' ? 'Đang gửi…' : <>Gửi kiểm tra tồn kho <Icon name="arrow" /></>}
              </button>
              <button type="button" className="ht-btn ht-btn--secondary ht-btn--block" onClick={() => submit(false)} disabled={!!busy}>{busy === 'draft' ? 'Đang lưu…' : 'Lưu nháp'}</button>
            </div>
          </Panel>
          <Callout tone="info" title="Không cần Quản lý CLB duyệt" icon="info">
            Kho chỉ kiểm tồn, giữ hàng và cấp phát. Sau khi kho phản hồi, bạn tự xác nhận phác đồ (BR_07).
          </Callout>
        </div>
      </div>
    </div>
  );
};
