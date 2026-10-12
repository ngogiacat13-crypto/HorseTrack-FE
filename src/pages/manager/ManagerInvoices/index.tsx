import React, { useEffect, useMemo, useState } from 'react';
import { Invoice, managerApi } from '../../../api/managerApi';
import { Icon } from '../../../components/ui/Icon';
import { Loading, PageHeader, StatCard, Tabs, useToast } from '../../../components/ui/Ht';
import { InvoiceTable } from './InvoiceTable';
import { ReactivateDialog, SuspendDialog } from './InvoiceDialogs';

type Filter = 'all' | 'unpaid' | 'overdue' | 'suspended' | 'paid';
const isOverdue = (i: Invoice) => i.status === 'OVERDUE' || i.status === 'SUSPENDED';

/* 3.1 Danh sách hóa đơn · 3.2 Đình chỉ (BR_13) · 3.3 Kích hoạt lại (BR_14) */
export const ManagerInvoices: React.FC = () => {
  const toast = useToast();
  const [items, setItems] = useState<Invoice[] | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [dlg, setDlg] = useState<null | { kind: 'suspend' | 'react'; inv: Invoice }>(null);

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

  // Totals come from the invoice list itself — same "overdue" definition as the finance report.
  const total = (pred: (i: Invoice) => boolean) => items.filter(pred).reduce((s, i) => s + i.amount, 0);
  const update = (id: string, patch: Partial<Invoice>) => setItems((xs) => xs!.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  return (
    <div className="ht ht-page">
      <PageHeader title="Hóa đơn" sub="Theo dõi thu tiền, quá hạn và đình chỉ dịch vụ theo BR_12 · BR_13 · BR_14."
        actions={<button className="ht-btn ht-btn--secondary" onClick={() => toast('Đang xuất danh sách hóa đơn (Excel)…')}><Icon name="download" />Xuất Excel</button>} />

      <div className="ht-stats">
        <StatCard icon="card" tone="brand" value={total((i) => (i.status === 'PAID' || i.status === 'ACTIVE') && i.period === '09/2026').toLocaleString('vi-VN')} unit="₫" label="Đã thu (đã xác minh)" meta="tháng 09" />
        <StatCard icon="alarm" tone="danger" value={total(isOverdue).toLocaleString('vi-VN')} unit="₫" label="Nợ quá hạn" meta={`${items.filter(isOverdue).length} hóa đơn`} metaTone="danger" alert />
        <StatCard icon="clock" tone="info" value={total((i) => i.status === 'UNPAID').toLocaleString('vi-VN')} unit="₫" label="Chờ thanh toán" meta="hạn 10/10" />
        <StatCard icon="ban" tone="warning" value={new Set(items.filter((i) => i.status === 'SUSPENDED').map((i) => i.owner)).size} label="Chủ ngựa bị đình chỉ" meta={`${items.filter((i) => i.status === 'REACTIVATION_PENDING').length} chờ kích hoạt`} />
      </div>

      <Tabs<Filter> value={filter} onChange={setFilter} items={[
        { value: 'all', label: 'Tất cả', count: items.length },
        { value: 'unpaid', label: 'Chờ thanh toán' },
        { value: 'overdue', label: 'Quá hạn' },
        { value: 'suspended', label: 'Đình chỉ' },
        { value: 'paid', label: 'Đã thanh toán' },
      ]} />

      <InvoiceTable invoices={list} q={q} onSearch={setQ} onSuspend={(inv) => setDlg({ kind: 'suspend', inv })} onReactivate={(inv) => setDlg({ kind: 'react', inv })} />

      {dlg?.kind === 'suspend' && <SuspendDialog invoice={dlg.inv} onClose={() => setDlg(null)}
        onDone={() => { update(dlg.inv.id, { status: 'SUSPENDED', suspendedSince: '03/10' }); setDlg(null); }} />}
      {dlg?.kind === 'react' && <ReactivateDialog invoice={dlg.inv} otherOverdue={items.some((x) => x.owner === dlg.inv.owner && isOverdue(x))} onClose={() => setDlg(null)}
        onDone={() => { update(dlg.inv.id, { status: 'ACTIVE' }); setDlg(null); }} />}
    </div>
  );
};
