import React, { useState } from 'react';
import { USE_BACKEND } from '../../api/beClient';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { Icon } from '../../components/ui/Icon';
import { Badge, Callout, Loading, PageHeader, Panel } from '../../components/ui/Ht';
import { EMPTY_FILTER, PURPOSE_LABEL, STATUS_LABEL, emailLogsApi, type EmailLogFilter, type EmailStatus } from './emailLogsApi';

export const EmailLogs: React.FC = () => {
  const [f, setF] = useState<EmailLogFilter>(EMPTY_FILTER);
  const toEmail = useDebounce(f.toEmail);
  const query = { ...f, toEmail };
  const { data, loading, error, reload } = useFetch(() => emailLogsApi.list(query), [f.status, f.purpose, toEmail, f.fromDate, f.toDate, f.page]);
  const set = <K extends keyof EmailLogFilter>(k: K, v: EmailLogFilter[K]) => setF((x) => ({ ...x, [k]: v, page: k === 'page' ? (v as number) : 0 }));

  return (
    <div className="ht ht-page">
      <PageHeader title="Nhật ký email" sub="Mọi email hệ thống gửi (OTP, tài khoản nhân viên, hóa đơn, thông báo…) và kết quả gửi thành công hay lỗi." />
      {!USE_BACKEND && <Callout tone="info" style={{ marginBottom: 16 }}>Nhật ký email chỉ có khi chạy với server.</Callout>}
      <Panel headStyle={{ paddingBottom: 16, justifyContent: 'flex-start', flexWrap: 'wrap' }} right={<>
        <div className="ht-search-input"><Icon name="search" /><input value={f.toEmail} onChange={(e) => set('toEmail', e.target.value)} placeholder="Tìm theo email người nhận…" aria-label="Tìm email" data-testid="email-log-search" /></div>
        <select className="ht-select" value={f.status} onChange={(e) => set('status', e.target.value as '' | EmailStatus)} aria-label="Lọc trạng thái" data-testid="email-log-status">
          <option value="">Mọi trạng thái</option>
          {(Object.keys(STATUS_LABEL) as EmailStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s][0]}</option>)}
        </select>
        <select className="ht-select" value={f.purpose} onChange={(e) => set('purpose', e.target.value)} aria-label="Lọc mục đích" data-testid="email-log-purpose">
          <option value="">Mọi loại email</option>
          {Object.entries(PURPOSE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input type="date" className="ht-select" value={f.fromDate} onChange={(e) => set('fromDate', e.target.value)} aria-label="Từ ngày" data-testid="email-log-from" />
        <input type="date" className="ht-select" value={f.toDate} onChange={(e) => set('toDate', e.target.value)} aria-label="Đến ngày" data-testid="email-log-to" />
      </>}>
        {error && <Callout tone="danger" style={{ margin: 16 }}><span style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>{error}<button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" onClick={reload} data-testid="email-log-retry">Thử lại</button></span></Callout>}
        {!data && loading ? <Loading /> : (
          <table className="ht-table" data-testid="email-log-table">
            <thead><tr><th>Thời gian</th><th>Người nhận</th><th>Loại</th><th>Tiêu đề</th><th>Kết quả</th></tr></thead>
            <tbody>
              {(data?.items ?? []).map((l) => (
                <tr key={l.id}>
                  <td className="mono" style={{ whiteSpace: 'nowrap' }}>{l.sentAt}</td>
                  <td><span className="strong">{l.to}</span><span className="sub">{l.userName}</span></td>
                  <td>{PURPOSE_LABEL[l.purpose] ?? l.purpose}</td>
                  <td style={{ maxWidth: 360 }}>{l.subject}</td>
                  <td>
                    <Badge tone={STATUS_LABEL[l.status][1]}>{STATUS_LABEL[l.status][0]}</Badge>
                    {l.error && <span className="sub" style={{ color: 'var(--danger-ink)', maxWidth: 260 }}>{l.error}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {data && data.items.length === 0 && <div className="ht-empty" data-testid="email-log-empty">Không có email nào phù hợp.</div>}
        {data && data.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{data.total} email · trang {data.page + 1}/{data.pages}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" disabled={data.page === 0} onClick={() => set('page', data.page - 1)} data-testid="email-log-prev">Trước</button>
              <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" disabled={data.page + 1 >= data.pages} onClick={() => set('page', data.page + 1)} data-testid="email-log-next">Sau</button>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
};
