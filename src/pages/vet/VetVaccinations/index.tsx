import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DEMO_NOW, type ApiError } from '../../../api/http';
import type { Vaccination } from '../../../api/trainerApi';
import type { InventoryItem } from '../../../api/vetApi';
import { addDays, dateKey, daysFromToday, dueWithin7, vetApi } from '../../../api/vetApi';
import { USE_BACKEND } from '../../../api/beClient';
import { useActor } from '../../../auth/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Callout, Dialog, PageHeader, Panel, Segmented, Tabs, useToast } from '../../../components/ui/Ht';
import { LoadState } from '../../../components/trainer/TrainerParts';

type Tab = 'due7' | 'upcoming' | 'done';
type Kind = 'VACCINE' | 'DEWORM';
const STATUS: Record<Vaccination['status'], [string, 'info' | 'neutral' | 'warning' | 'success']> = {
  DUE_SOON: ['Sắp đến hạn', 'info'], SCHEDULED: ['Đã lên lịch', 'neutral'], POSTPONED: ['Hoãn', 'warning'], DONE: ['Đã thực hiện', 'success'],
};
const REQ_TONE: Record<string, 'info' | 'neutral' | 'warning' | 'success' | 'danger'> = {
  SUBMITTED: 'info', CHECKING_STOCK: 'info', WAITING_RESTOCK: 'warning', APPROVED_FOR_ISSUE: 'success',
  ISSUED: 'success', CLOSED: 'neutral', REJECTED: 'danger', CANCELLED: 'neutral',
};
const byDue = (a: Vaccination, b: Vaccination) => dateKey(a.due).localeCompare(dateKey(b.due));
const beItemId = (it: InventoryItem) => {
  const raw = (it as InventoryItem & { beId?: number }).beId ?? Number(String(it.id).replace(/\D/g, ''));
  return raw || null;
};

export const VetVaccinations: React.FC = () => {
  const actor = useActor();
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => vetApi.getVaccinations());
  const medsFetch = useFetch(() => vetApi.getMedicines());
  const [tab, setTab] = useState<Tab>('due7');
  const [planOpen, setPlanOpen] = useState(false);
  const [plan, setPlan] = useState({ kind: 'VACCINE' as Kind, type: '', due: addDays(DEMO_NOW.date, 7), cycleMonths: 6, note: '', horseIds: [] as string[], itemId: null as number | null, dosePerHorse: 1 });
  const [recFor, setRecFor] = useState<Vaccination | null>(null);
  const [rec, setRec] = useState({ doneAt: DEMO_NOW.date, by: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const all = useMemo(() => data?.vaccinations ?? [], [data]);
  const meds = useMemo(() => (medsFetch.data ?? []).filter((m) => m.category === 'Thuốc' || m.category === 'Vaccine' || /thuốc|vaccine|giun/i.test(m.name)), [medsFetch.data]);
  const groups = useMemo(() => ({
    due7: all.filter(dueWithin7).sort(byDue),
    upcoming: all.filter((v) => v.status !== 'DONE' && !dueWithin7(v)).sort(byDue),
    done: all.filter((v) => v.status === 'DONE').sort((a, b) => byDue(b, a)),
  }), [all]);

  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  const list = groups[tab];

  const run = async (fn: () => Promise<unknown>, ok: string, close: () => void) => {
    setBusy(true);
    try { await fn(); toast(ok); close(); reload(); } catch (e) { setErr((e as ApiError).message ?? 'Thao tác thất bại.'); } finally { setBusy(false); }
  };
  const openPlan = (kind: Kind) => {
    setPlan({ kind, type: kind === 'DEWORM' ? 'Tẩy giun định kỳ' : '', due: addDays(DEMO_NOW.date, 7), cycleMonths: kind === 'DEWORM' ? 3 : 6, note: '', horseIds: [], itemId: null, dosePerHorse: 1 });
    setErr(''); setPlanOpen(true);
  };
  const toggleHorse = (id: string) => setPlan({ ...plan, horseIds: plan.horseIds.includes(id) ? plan.horseIds.filter((x) => x !== id) : [...plan.horseIds, id] });
  const pickMed = (id: string) => {
    const m = meds.find((x) => String(beItemId(x)) === id || x.id === id);
    if (!m) { setPlan({ ...plan, itemId: null }); return; }
    setPlan({ ...plan, itemId: beItemId(m), type: plan.type.trim() || m.name });
  };
  const needStockResend = (v: Vaccination) =>
    USE_BACKEND && v.status !== 'DONE' && (!v.requisitionCode || v.requisitionStatus === 'REJECTED' || v.requisitionStatus === 'CANCELLED');

  return (
    <div className="ht ht-page">
      <PageHeader title="Tiêm phòng & tẩy giun" sub={`${groups.due7.length} mũi đến hạn trong 7 ngày (tính từ ${DEMO_NOW.date}) · ${groups.upcoming.length} đã lên lịch`}
        actions={<>
          <button type="button" className="ht-btn ht-btn--secondary" onClick={() => openPlan('DEWORM')}><Icon name="calendar" />Lịch tẩy giun</button>
          <button type="button" className="ht-btn ht-btn--primary" onClick={() => openPlan('VACCINE')}><Icon name="calendar" />Lịch tiêm phòng</button>
        </>} />

      <Tabs<Tab> value={tab} onChange={setTab} items={[
        { value: 'due7', label: 'Đến hạn trong 7 ngày', count: groups.due7.length },
        { value: 'upcoming', label: 'Sắp tới', count: groups.upcoming.length },
        { value: 'done', label: 'Đã thực hiện', count: groups.done.length },
      ]} />

      <Panel>
        <div style={{ overflowX: 'auto' }}>
          <table className="ht-table">
            <thead><tr><th>Mã</th><th>Ngựa</th><th>Loại</th><th>Thuốc kho</th><th>Ngày dự kiến</th><th>Yêu cầu kho</th><th>Trạng thái</th><th>{tab === 'done' ? 'Thực hiện' : ''}</th></tr></thead>
            <tbody>
              {list.map((v) => {
                const d = daysFromToday(v.due);
                const canDo = !USE_BACKEND || v.canExecute !== false;
                return (
                  <tr key={v.id} className={v.status !== 'DONE' && d < 0 ? 'is-danger' : undefined}>
                    <td className="id">{v.id}</td>
                    <td className="strong"><Link to={`/vet/horses/${v.horseId}`}>{v.horse}</Link></td>
                    <td>{v.type}<span className="sub">{v.kind === 'DEWORM' ? 'Tẩy giun' : 'Vaccine'}{v.note && ` · ${v.note}`}</span></td>
                    <td>{v.itemName || '—'}{v.itemId != null && <span className="sub">#{v.itemId}</span>}</td>
                    <td className="mono">{v.due}{v.status !== 'DONE' && <span className="sub" style={{ color: d < 0 ? 'var(--danger-ink)' : undefined }}>{d < 0 ? `quá ${-d} ngày` : d === 0 ? 'hôm nay' : `còn ${d} ngày`}</span>}</td>
                    <td>
                      {v.requisitionCode
                        ? <><span className="ht-mono">{v.requisitionCode}</span>{v.requisitionStatus && <Badge tone={REQ_TONE[v.requisitionStatus] ?? 'neutral'} plain>{v.requisitionStatus}</Badge>}
                          {v.requisitionRejectReason && <span className="sub" style={{ color: 'var(--danger-ink)' }}>{v.requisitionRejectReason}</span>}</>
                        : <span className="sub">Chưa gửi kho</span>}
                    </td>
                    <td><Badge tone={STATUS[v.status][1]}>{STATUS[v.status][0]}</Badge></td>
                    <td className="num">{v.status === 'DONE'
                      ? <span style={{ fontSize: 13 }}><span className="ht-mono">{v.doneAt}</span><span className="sub">{v.by}</span></span>
                      : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' }}>
                          <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm"
                            disabled={!canDo} title={!canDo ? (v.executeBlockedReason || 'Chưa thể xác nhận tiêm') : undefined}
                            onClick={() => { setRecFor(v); setRec({ doneAt: DEMO_NOW.date, by: actor.name }); setErr(''); }}>
                            <Icon name="check" />Xác nhận tiêm
                          </button>
                          {needStockResend(v) && (
                            <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" disabled={busy}
                              onClick={() => run(() => vetApi.resendStockRequest(v), `Đã gửi lại yêu cầu kho cho ${v.id}.`, () => {})}>
                              Gửi lại yêu cầu kho
                            </button>
                          )}
                          {!canDo && v.executeBlockedReason && <span className="sub" style={{ color: 'var(--muted)', maxWidth: 220 }}>{v.executeBlockedReason}</span>}
                        </div>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {list.length === 0 && <div className="ht-empty">Không có mục nào.</div>}
        </div>
      </Panel>
      <Callout tone="info" style={{ marginTop: 24 }}>Lịch tiêm gắn thuốc kho và gửi yêu cầu cấp phát. Chỉ xác nhận tiêm khi đã tới ngày và kho đã cấp (`canExecute`).</Callout>

      <Dialog open={planOpen} onClose={() => setPlanOpen(false)} icon="calendar" tone="brand" width={620} busy={busy} busyLabel="Đang tạo…"
        title={plan.kind === 'DEWORM' ? 'Tạo lịch tẩy giun' : 'Tạo lịch tiêm phòng'} sub={plan.kind === 'DEWORM' ? 'Chu kỳ 3–6 tháng theo cấu hình chuyên môn của CLB (4.2).' : 'Lịch định kỳ theo loại vaccine (4.1).'}
        confirmLabel={`Tạo lịch cho ${plan.horseIds.length || ''} ngựa`} onConfirm={() => run(() => vetApi.scheduleVaccination(plan, actor), `Đã tạo lịch “${plan.type}” cho ${plan.horseIds.length} ngựa.`, () => setPlanOpen(false))}>
        {err && <Callout tone="danger" style={{ marginBottom: 14 }}>{err}</Callout>}
        <div style={{ display: 'grid', gap: 14 }}>
          <Segmented<Kind> label="Loại lịch" value={plan.kind} onChange={(k) => setPlan({ ...plan, kind: k, cycleMonths: k === 'DEWORM' ? 3 : 6, type: k === 'DEWORM' ? 'Tẩy giun định kỳ' : '', itemId: null })}
            items={[{ value: 'VACCINE', label: 'Tiêm phòng' }, { value: 'DEWORM', label: 'Tẩy giun' }]} />
          <div className="ht-grid-2">
            <div className="ht-field" style={{ margin: 0 }}>
              <label className="ht-label" htmlFor="vc-item">Thuốc / vaccine trong kho<span className="ht-req">*</span></label>
              <select id="vc-item" className="ht-select" value={plan.itemId ?? ''} onChange={(e) => pickMed(e.target.value)} required>
                <option value="">— Chọn từ tồn kho —</option>
                {meds.map((m) => <option key={m.id} value={String(beItemId(m) ?? m.id)}>{m.name} · tồn {m.onHand} {m.unit}</option>)}
              </select>
            </div>
            <div className="ht-field" style={{ margin: 0 }}>
              <label className="ht-label" htmlFor="vc-dose">Liều mỗi ngựa<span className="ht-req">*</span></label>
              <input id="vc-dose" className="ht-input" type="number" min={0.01} step={0.01} value={plan.dosePerHorse}
                onChange={(e) => setPlan({ ...plan, dosePerHorse: Number(e.target.value) || 1 })} />
            </div>
          </div>
          <div className="ht-grid-2">
            <div className="ht-field" style={{ margin: 0 }}>
              <label className="ht-label" htmlFor="vc-type">{plan.kind === 'DEWORM' ? 'Thuốc / tên lịch' : 'Loại vaccine'}<span className="ht-req">*</span></label>
              <input id="vc-type" className="ht-input" list="vc-types" value={plan.type} onChange={(e) => setPlan({ ...plan, type: e.target.value })} placeholder="VD: Cúm ngựa (nhắc lại)" />
              <datalist id="vc-types"><option value="Cúm ngựa (nhắc lại)" /><option value="Uốn ván" /><option value="Viêm não Nhật Bản" /><option value="Tẩy giun định kỳ" /></datalist>
            </div>
            <div className="ht-grid-2" style={{ gap: '0 12px' }}>
              <div className="ht-field" style={{ margin: 0 }}>
                <label className="ht-label" htmlFor="vc-due">Ngày dự kiến</label>
                <input id="vc-due" className="ht-input ht-mono" value={plan.due} onChange={(e) => setPlan({ ...plan, due: e.target.value })} placeholder="dd/mm/yyyy" />
              </div>
              <div className="ht-field" style={{ margin: 0 }}>
                <label className="ht-label" htmlFor="vc-cycle">Chu kỳ (tháng)</label>
                <input id="vc-cycle" className="ht-input" type="number" min={1} value={plan.cycleMonths} onChange={(e) => setPlan({ ...plan, cycleMonths: Number(e.target.value) })} />
              </div>
            </div>
          </div>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="ht-label" style={{ marginBottom: 6 }}>Ngựa<span className="ht-req">*</span> <button type="button" className="ht-more" style={{ marginLeft: 8 }} onClick={() => setPlan({ ...plan, horseIds: plan.horseIds.length === data.horses.length ? [] : data.horses.map((h) => h.id) })}>{plan.horseIds.length === data.horses.length ? 'Bỏ chọn' : 'Chọn tất cả'}</button></legend>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
              {data.horses.map((h) => (
                <label key={h.id} className="ht-check"><input type="checkbox" checked={plan.horseIds.includes(h.id)} onChange={() => toggleHorse(h.id)} /> {h.name} <span style={{ color: 'var(--muted)', fontSize: 12 }}>{h.stall}</span></label>
              ))}
            </div>
          </fieldset>
          <div className="ht-field" style={{ margin: 0 }}>
            <label className="ht-label" htmlFor="vc-note">Ghi chú</label>
            <input id="vc-note" className="ht-input" value={plan.note} onChange={(e) => setPlan({ ...plan, note: e.target.value })} />
          </div>
        </div>
      </Dialog>

      <Dialog open={!!recFor} onClose={() => setRecFor(null)} icon="check" tone="brand" busy={busy} busyLabel="Đang lưu…"
        title={`Xác nhận tiêm · ${recFor?.horse ?? ''}`} sub={recFor ? `${recFor.type} · dự kiến ${recFor.due}${recFor.cycleMonths ? ` · nhắc lại sau ${recFor.cycleMonths} tháng` : ''}` : undefined}
        confirmLabel="Xác nhận tiêm" onConfirm={() => recFor && run(() => vetApi.recordVaccination(recFor, rec, actor), `Đã ghi nhận ${recFor.type} cho ${recFor.horse}.`, () => setRecFor(null))}>
        {err && <Callout tone="danger" style={{ marginBottom: 14 }}>{err}</Callout>}
        {recFor?.executeBlockedReason && recFor.canExecute === false && <Callout tone="demo" style={{ marginBottom: 14 }}>{recFor.executeBlockedReason}</Callout>}
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="ht-field" style={{ margin: 0 }}><label className="ht-label" htmlFor="rc-date">Ngày thực hiện</label><input id="rc-date" className="ht-input ht-mono" value={rec.doneAt} onChange={(e) => setRec({ ...rec, doneAt: e.target.value })} /></div>
          <div className="ht-field" style={{ margin: 0 }}><label className="ht-label" htmlFor="rc-by">Người thực hiện<span className="ht-req">*</span></label><input id="rc-by" className="ht-input" value={rec.by} onChange={(e) => setRec({ ...rec, by: e.target.value })} /></div>
        </div>
      </Dialog>
    </div>
  );
};
