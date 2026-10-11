import React, { useEffect, useMemo, useState } from 'react';
import { Invoice, InvoiceStatus, managerApi } from '../../api/managerApi';
import { useActor } from '../../auth/AuthContext';
import { Icon } from '../../components/ui/Icon';
import { Badge, Callout, Dialog, Loading, PageHeader, Panel, Rules, StatCard, Tabs, money, useToast } from '../../components/ui/Ht';

/* BR_12: 10-day grace, then penalty. BR_13: suspension from day 25. BR_14: reactivate only after full verified payment. */
const SUSPEND_AT = 25;
const GRACE = 10;

type Filter = 'all' | 'unpaid' | 'overdue' | 'suspended' | 'paid';
const BADGE: Record<InvoiceStatus, [React.ComponentProps<typeof Badge>['tone'], string]> = {
  SUSPENDED: ['danger', 'Đình chỉ'], OVERDUE: ['warning', 'Quá hạn'], REACTIVATION_PENDING: ['info', 'Chờ kích hoạt lại'],
  UNPAID: ['neutral', 'Chờ thanh toán'], PAID: ['success', 'Đã thanh toán'], ACTIVE: ['success', 'Đã kích hoạt lại'],
};

const OverdueMeter: React.FC<{ inv: Invoice }> = ({ inv }) => {
  if (inv.status === 'PAID' || inv.status === 'ACTIVE') return <span className="ht-od__label">—</span>;
  if (inv.status === 'REACTIVATION_PENDING') return <span className="ht-od__label" style={{ color: 'var(--info-ink)' }}>Đã tất toán {inv.paidRef?.split(' · ')[1]}</span>;
  if (inv.status === 'UNPAID') return <span className="ht-od__label">Còn {inv.dueInDays} ngày đến hạn</span>;
  const d = inv.overdueDays;
  const a = Math.min(d, GRACE) / GRACE * 100;
  const b = Math.max(0, Math.min(d - GRACE, SUSPEND_AT - GRACE)) / (SUSPEND_AT - GRACE) * 100;
  const c = Math.max(0, Math.min(d - SUSPEND_AT, 5)) / 5 * 100;
  let txt: string, cls: string;
  if (inv.status === 'SUSPENDED') { txt = `${d} ngày · đình chỉ từ ${inv.suspendedSince}`; cls = 'danger'; }
  else if (d >= SUSPEND_AT) { txt = `${d} ngày · đủ mốc đình chỉ`; cls = 'danger'; }
  else if (d > GRACE) { txt = `${d} ngày · tính phạt · còn ${SUSPEND_AT - d} ngày`; cls = 'danger'; }
  else { txt = `${d} ngày · ân hạn còn ${GRACE - d} ngày`; cls = 'warning'; }
  return (
    <div className="ht-od">
      <div className="ht-od__track" aria-hidden="true"><span><i style={{ width: `${a}%` }} /></span><span><i style={{ width: `${b}%` }} /></span><span><i style={{ width: `${c}%` }} /></span></div>
      <span className={`ht-od__label ht-od__label--${cls}`}>{txt}</span>
    </div>
  );
};

export const ManagerInvoices: React.FC = () => {
  const toast = useToast();
  const actor = useActor();
  const [items, setItems] = useState<Invoice[] | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [dlg, setDlg] = useState<null | { kind: 'suspend' | 'react'; inv: Invoice }>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { managerApi.getInvoices().then(setItems); }, []);

  const list = useMemo(() => (items ?? []).filter((i) => {
    const okF = filter === 'all'
      || (filter === 'suspended' && (i.status === 'SUSPENDED' || i.status === 'REACTIVATION_PENDING'))
      || (filter === 'paid' && (i.status === 'PAID' || i.status === 'ACTIVE'))
      || (filter === 'overdue' && i.status === 'OVERDUE')
      || (filter === 'unpaid' && i.status === 'UNPAID');
    return okF && (i.id + i.horse + i.owner).toLowerCase().includes(q.trim().toLowerCase());
  }), [items, filter, q]);

  if (!items) return <div className="ht ht-page"><Loading /></div>;

  const suspendedOwners = new Set(items.filter((i) => i.status === 'SUSPENDED').map((i) => i.owner)).size;
  const reactPending = items.filter((i) => i.status === 'REACTIVATION_PENDING').length;
  /* Tong hop tinh tu chinh danh sach hoa don, cung dinh nghia "no qua han" voi getFinanceReport. */
  const isOverdue = (i: Invoice) => i.status === 'OVERDUE' || i.status === 'SUSPENDED';
  const total = (pred: (i: Invoice) => boolean) => items.filter(pred).reduce((s, i) => s + i.amount, 0);
  const summary = {
    collectedSept: total((i) => (i.status === 'PAID' || i.status === 'ACTIVE') && i.period === '09/2026'),
    overdue: total(isOverdue),
    overdueCount: items.filter(isOverdue).length,
    pending: total((i) => i.status === 'UNPAID'),
  };
  const update = (id: string, patch: Partial<Invoice>) => setItems((xs) => xs!.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const openSuspend = (inv: Invoice) => {
    setReason(`Hóa đơn ${inv.id} quá hạn ${inv.overdueDays} ngày, chưa có thanh toán được xác minh (BR_13).`);
    setDlg({ kind: 'suspend', inv });
  };

  const confirm = async () => {
    if (!dlg) return;
    setBusy(true);
    try {
      if (dlg.kind === 'suspend') {
        await managerApi.suspendService(dlg.inv, reason, actor);
        update(dlg.inv.id, { status: 'SUSPENDED', suspendedSince: '03/10' });
        toast(`Đã đình chỉ dịch vụ của ${dlg.inv.owner} · ghi Audit Log.`);
      } else {
        await managerApi.reactivateService(dlg.inv, actor);
        update(dlg.inv.id, { status: 'ACTIVE' });
        toast(`Đã kích hoạt lại dịch vụ cho ${dlg.inv.owner}.`);
      }
      setDlg(null);
    } finally { setBusy(false); }
  };

  const actions = (i: Invoice) => (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
      {i.status === 'OVERDUE' && i.overdueDays >= SUSPEND_AT && <button type="button" className="ht-btn ht-btn--danger ht-btn--sm" onClick={() => openSuspend(i)}>Đình chỉ</button>}
      {i.status === 'OVERDUE' && i.overdueDays < SUSPEND_AT && (
        <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" onClick={async () => { await managerApi.sendReminder(i, actor); toast(`Đã gửi nhắc thanh toán ${i.id} cho ${i.owner}.`); }}>Gửi nhắc</button>
      )}
      {i.status === 'SUSPENDED' && <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" disabled title="Chưa tất toán nợ, phí phạt và phí kích hoạt (BR_14)">Kích hoạt lại</button>}
      {i.status === 'REACTIVATION_PENDING' && <button type="button" className="ht-btn ht-btn--primary ht-btn--sm" onClick={() => setDlg({ kind: 'react', inv: i })}>Kích hoạt lại</button>}
    </div>
  );

  return (
    <div className="ht ht-page">
      <PageHeader
        title="Hóa đơn"
        sub="Theo dõi thu tiền, quá hạn và đình chỉ dịch vụ theo BR_12 · BR_13 · BR_14."
        actions={<button className="ht-btn ht-btn--secondary" onClick={() => toast('Đang xuất danh sách hóa đơn (Excel)…')}><Icon name="download" />Xuất Excel</button>}
      />

      <div className="ht-stats">
        <StatCard icon="card" tone="brand" value={summary.collectedSept.toLocaleString('vi-VN')} unit="₫" label="Đã thu (đã xác minh)" meta="tháng 09" />
        <StatCard icon="alarm" tone="danger" value={summary.overdue.toLocaleString('vi-VN')} unit="₫" label="Nợ quá hạn" meta={`${summary.overdueCount} hóa đơn`} metaTone="danger" alert />
        <StatCard icon="clock" tone="info" value={summary.pending.toLocaleString('vi-VN')} unit="₫" label="Chờ thanh toán" meta="hạn 10/10" />
        <StatCard icon="ban" tone="warning" value={suspendedOwners} label="Chủ ngựa bị đình chỉ" meta={`${reactPending} chờ kích hoạt`} />
      </div>

      <Tabs<Filter> value={filter} onChange={setFilter} items={[
        { value: 'all', label: 'Tất cả', count: items.length },
        { value: 'unpaid', label: 'Chờ thanh toán' },
        { value: 'overdue', label: 'Quá hạn' },
        { value: 'suspended', label: 'Đình chỉ' },
        { value: 'paid', label: 'Đã thanh toán' },
      ]} />

      <Panel
        headStyle={{ paddingBottom: 16 }}
        right={<>
          <div className="ht-search-input"><Icon name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mã hóa đơn, ngựa, chủ ngựa…" aria-label="Tìm hóa đơn" /></div>
          <div className="ht-od__legend" aria-hidden="true">
            <span><i style={{ background: 'var(--warning)' }} />Ân hạn 10 ngày</span>
            <span><i style={{ background: 'var(--danger)' }} />Tính phạt</span>
            <span><i style={{ background: 'var(--danger-ink)' }} />Từ ngày 25: đình chỉ</span>
          </div>
        </>}
        foot={<>
          <span>Tính theo đồng hồ demo <span className="ht-mono">03/10/2026</span> · quá hạn đếm từ ngày sau hạn thanh toán</span>
          <span>Phí phạt BR_12: <b style={{ color: 'var(--warning-ink)' }}>chờ cấu hình công thức</b></span>
        </>}
      >
        <table className="ht-table">
          <thead><tr><th>Mã HĐ</th><th>Ngựa · chủ ngựa</th><th>Kỳ</th><th>Hạn TT</th><th className="num">Số tiền</th><th>Quá hạn</th><th>Trạng thái</th><th style={{ textAlign: 'right' }}>Thao tác</th></tr></thead>
          <tbody>
            {list.map((i) => {
              const [tone, label] = BADGE[i.status];
              return (
                <tr key={i.id} className={i.status === 'SUSPENDED' ? 'is-danger' : undefined}>
                  <td className="id">{i.id}</td>
                  <td><span className="strong">{i.horse}</span><span className="sub">{i.owner}</span></td>
                  <td className="mono">{i.period}</td>
                  <td className="mono">{i.dueDate}</td>
                  <td className="num strong">{money(i.amount)}</td>
                  <td><OverdueMeter inv={i} /></td>
                  <td><Badge tone={tone}>{label}</Badge>{i.paidRef && i.status === 'PAID' && <span className="sub mono">{i.paidRef}</span>}</td>
                  <td>{actions(i)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 && <div className="ht-empty">Không có hóa đơn phù hợp.</div>}
      </Panel>

      {dlg?.kind === 'suspend' && (
        <Dialog open onClose={() => setDlg(null)} icon="ban" tone="danger" danger busy={busy}
          title={`Đình chỉ dịch vụ của ${dlg.inv.owner}?`}
          sub={`${dlg.inv.id} · ${dlg.inv.horse} · ${money(dlg.inv.amount)} · quá hạn ${dlg.inv.overdueDays} ngày.`}
          confirmLabel="Xác nhận đình chỉ" onConfirm={confirm} disabled={reason.trim().length < 10}>
          <Rules style={{ marginBottom: 14 }} items={[
            { ok: dlg.inv.overdueDays >= SUSPEND_AT, label: `Quá hạn ≥ ${SUSPEND_AT} ngày (BR_13)` },
            { ok: true, label: 'Đã gửi cảnh báo trước mốc đình chỉ' },
          ]} />
          <Callout tone="danger" style={{ marginBottom: 14 }}>Dịch vụ huấn luyện và chăm sóc của chủ ngựa tạm dừng. Chủ ngựa vẫn xem và thanh toán được hóa đơn.</Callout>
          <label className="ht-label" htmlFor="sus-reason" style={{ display: 'block', marginBottom: 6 }}>Lý do ghi nhật ký</label>
          <textarea id="sus-reason" className="ht-textarea" style={{ minHeight: 72 }} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Dialog>
      )}

      {dlg?.kind === 'react' && (
        <Dialog open onClose={() => setDlg(null)} icon="refresh" tone="brand" busy={busy}
          title={`Kích hoạt lại dịch vụ cho ${dlg.inv.owner}?`} sub={`${dlg.inv.id} · ${dlg.inv.horse} · thanh toán ${dlg.inv.paidRef}`}
          confirmLabel="Kích hoạt lại" onConfirm={confirm}>
          <Rules items={[
            { ok: true, label: <>Nợ gốc {money(dlg.inv.amount)} — VNPay đã xác minh qua callback</> },
            { ok: true, label: 'Phí phạt quá hạn đã thu' },
            { ok: true, label: 'Phí kích hoạt lại đã thu (BR_14)' },
            { ok: !items.some((x) => x.owner === dlg.inv.owner && (x.status === 'OVERDUE' || x.status === 'SUSPENDED')), label: 'Không còn hóa đơn quá hạn khác' },
          ]} />
        </Dialog>
      )}
    </div>
  );
};
