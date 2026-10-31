import React, { useEffect, useMemo, useState } from 'react';
import { Invoice, managerApi } from '../../../api/managerApi';
import { Icon } from '../../../components/ui/Icon';
import { Loading, PageHeader, StatCard, useToast } from '../../../components/ui/Ht';
import { InvoiceTable } from './InvoiceTable';
import { ReactivateDialog, SuspendDialog } from './InvoiceDialogs';
import { useDebounce } from '../../../hooks/useDebounce';
import { USE_BACKEND } from '../../../api/beClient';
import { BillingActions, CancelInvoiceDialog } from '../../../features/invoice-billing';
import { DEMO_NOW } from '../../../api/http';

type Filter = 'all' | 'unpaid' | 'overdue' | 'suspended' | 'paid' | 'refunded';
const isOverdue = (i: Invoice) => i.status === 'OVERDUE' || i.status === 'SUSPENDED';

const nextDue = (items: Invoice[]) => {
  const dues = items.filter((i) => i.status === 'UNPAID' && /^\d{2}\/\d{2}\/\d{4}$/.test(i.dueDate ?? '')).map((i) => i.dueDate.split('/').reverse().join('-')).sort();
  return dues.length ? `hạn sớm nhất ${dues[0].slice(8, 10)}/${dues[0].slice(5, 7)}` : `không có hạn tới ${DEMO_NOW.date.slice(0, 5)}`;
};

export const ManagerInvoices: React.FC = () => {
  const toast = useToast();
  const [items, setItems] = useState<Invoice[] | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const query = useDebounce(q);
  const [dlg, setDlg] = useState<null | { kind: 'suspend' | 'react' | 'cancel'; inv: Invoice }>(null);
  const reload = () => { managerApi.getInvoices().then(setItems); };

  useEffect(reload, []);

  const list = useMemo(() => (items ?? []).filter((i) => {
    const okF = filter === 'all'
      || (filter === 'suspended' && (i.status === 'SUSPENDED' || i.status === 'REACTIVATION_PENDING'))
      || (filter === 'paid' && (i.status === 'PAID' || i.status === 'ACTIVE'))
      || (filter === 'refunded' && i.status === 'REFUNDED')
      || (filter === 'overdue' && i.status === 'OVERDUE')
      || (filter === 'unpaid' && i.status === 'UNPAID');
    return okF && (i.id + i.horse + i.owner).toLowerCase().includes(query.trim().toLowerCase());
  }), [items, filter, query]);

  if (!items) return <div className="ht ht-page"><Loading /></div>;

  const total = (pred: (i: Invoice) => boolean) => items.filter(pred).reduce((s, i) => s + i.amount, 0);
  const update = (id: string, patch: Partial<Invoice>) => setItems((xs) => xs!.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  return (
    <div className="ht ht-page">
      <PageHeader title="Hóa đơn" sub="Theo dõi thu tiền, quá hạn và đình chỉ dịch vụ theo BR_12 · BR_13 · BR_14."
        actions={<>{USE_BACKEND && <BillingActions onChanged={reload} />}{!USE_BACKEND && <button className="ht-btn ht-btn--secondary" onClick={() => toast('Đang xuất danh sách hóa đơn (Excel)…')}><Icon name="download" />Xuất Excel</button>}</>} />

      <div className="ht-stats">
        <StatCard icon="card" tone="brand" value={total((i) => (i.status === 'PAID' || i.status === 'ACTIVE') && (USE_BACKEND || i.period === '09/2026')).toLocaleString('vi-VN')} unit="₫" label="Đã thu (đã xác minh)" meta={USE_BACKEND ? 'tất cả các kỳ' : 'tháng 09'} />
        <StatCard icon="alarm" tone="danger" value={total(isOverdue).toLocaleString('vi-VN')} unit="₫" label="Nợ quá hạn" meta={`${items.filter(isOverdue).length} hóa đơn`} metaTone="danger" alert />
        <StatCard icon="clock" tone="info" value={total((i) => i.status === 'UNPAID').toLocaleString('vi-VN')} unit="₫" label="Chờ thanh toán" meta={USE_BACKEND ? nextDue(items) : 'hạn 10/10'} />
        <StatCard icon="ban" tone="warning" value={new Set(items.filter((i) => i.status === 'SUSPENDED').map((i) => i.owner)).size} label="Chủ ngựa bị đình chỉ" meta={`${items.filter((i) => i.status === 'REACTIVATION_PENDING').length} chờ kích hoạt`} />
      </div>

      <div className="ht-tabs" role="tablist" aria-label="Lọc hóa đơn">
        {[
          { value: 'all' as const, label: 'Tất cả', count: items.length },
          { value: 'unpaid' as const, label: 'Chờ thanh toán' },
          { value: 'overdue' as const, label: 'Quá hạn' },
          { value: 'suspended' as const, label: 'Đình chỉ' },
          { value: 'paid' as const, label: 'Đã thanh toán' },
          { value: 'refunded' as const, label: 'Đã hoàn tiền', count: items.filter((i) => i.status === 'REFUNDED').length },
        ].map((item) => (
          <button key={item.value} type="button" role="tab" className="ht-tab" aria-selected={filter === item.value} data-testid={`manager-invoice-filter-${item.value}`} onClick={() => setFilter(item.value)}>
            {item.label}{item.count !== undefined && <span className="ht-tab__n">{item.count}</span>}
          </button>
        ))}
      </div>

      <InvoiceTable invoices={list} q={q} onSearch={setQ} onSuspend={(inv) => setDlg({ kind: 'suspend', inv })} onReactivate={(inv) => setDlg({ kind: 'react', inv })} onCancel={USE_BACKEND ? (inv) => setDlg({ kind: 'cancel', inv }) : undefined} />

      {dlg?.kind === 'cancel' && <CancelInvoiceDialog invoice={dlg.inv} onClose={() => setDlg(null)} onDone={() => { setDlg(null); reload(); }} />}

      {dlg?.kind === 'suspend' && <SuspendDialog invoice={dlg.inv} onClose={() => setDlg(null)}
        onDone={() => { update(dlg.inv.id, { status: 'SUSPENDED', suspendedSince: '03/10' }); setDlg(null); }} />}
      {dlg?.kind === 'react' && <ReactivateDialog invoice={dlg.inv} otherOverdue={items.some((x) => x.owner === dlg.inv.owner && isOverdue(x))} onClose={() => setDlg(null)}
        onDone={() => { update(dlg.inv.id, { status: 'ACTIVE' }); setDlg(null); }} />}
    </div>
  );
};
