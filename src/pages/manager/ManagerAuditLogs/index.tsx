import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AuditArea, AuditLog, managerApi } from '../../../api/managerApi';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Callout, Loading, PageHeader, Panel, useToast } from '../../../components/ui/Ht';

const AREA_TONE: Record<AuditArea, React.ComponentProps<typeof Badge>['tone']> = { reg: 'success', med: 'warning', train: 'danger', fin: 'info', acct: 'neutral' };
const AREA_LABEL: Record<AuditArea, string> = { reg: 'Hồ sơ ngựa', med: 'Y tế · kho', train: 'Phiên tập', fin: 'Tài chính', acct: 'Tài khoản' };

export const ManagerAuditLogs: React.FC = () => {
  const toast = useToast();
  const [data, setData] = useState<{ total: number; items: AuditLog[] } | null>(null);
  const [q, setQ] = useState('');
  const [who, setWho] = useState('');
  const [area, setArea] = useState<'' | AuditArea>('');
  const [logins, setLogins] = useState(false);
  const [sel, setSel] = useState<AuditLog | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { managerApi.getAuditLogs().then((items) => setData({ total: items.length, items })); }, []);
  useEffect(() => {
    if (!sel) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSel(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sel]);

  const people = useMemo(() => Array.from(new Set((data?.items ?? []).map((l) => l.who))), [data]);
  const list = useMemo(() => (data?.items ?? []).filter((l) =>
    (logins || !l.isLogin) && (!who || l.who === who) && (!area || l.area === area) &&
    (l.object + l.action + l.label).toLowerCase().includes(q.trim().toLowerCase())), [data, q, who, area, logins]);

  if (!data) return <div className="ht ht-page"><Loading /></div>;

  return (
    <div className="ht ht-page">
      <PageHeader
        title="Nhật ký hệ thống"
        sub="Mọi thao tác quản trị và thay đổi trạng thái quan trọng (BR_10). Chỉ đọc — không thể sửa hoặc xóa."
        actions={<button className="ht-btn ht-btn--secondary" onClick={() => toast('Đang xuất nhật ký 30 ngày (CSV)…')}><Icon name="download" />Xuất CSV</button>}
      />

      <Panel
        headStyle={{ paddingBottom: 16, flexWrap: 'wrap' }}
        right={<>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: 1 }}>
            <div className="ht-search-input"><Icon name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mã đối tượng: REG-0016, PD-0011, INV-0042…" aria-label="Tìm trong nhật ký" /></div>
            <select className="ht-select" value={who} onChange={(e) => setWho(e.target.value)} aria-label="Người thực hiện">
              <option value="">Mọi người thực hiện</option>{people.map((p) => <option key={p}>{p}</option>)}
            </select>
            <select className="ht-select" value={area} onChange={(e) => setArea(e.target.value as AuditArea | '')} aria-label="Nhóm">
              <option value="">Mọi nhóm</option>{(Object.keys(AREA_LABEL) as AuditArea[]).map((a) => <option key={a} value={a}>{AREA_LABEL[a]}</option>)}
            </select>
            <select className="ht-select" aria-label="Thời gian"><option>30 ngày qua</option><option>7 ngày qua</option><option>Hôm nay</option></select>
          </div>
          <label className="ht-check"><input type="checkbox" checked={logins} onChange={(e) => setLogins(e.target.checked)} /> Hiện đăng nhập</label>
        </>}
        foot={<>
          <span>Hiển thị {list.length} sự kiện · tổng <span className="ht-mono">{data.total}</span> bản ghi trong 30 ngày</span>
          <div style={{ display: 'flex', gap: 6 }}><button className="ht-btn ht-btn--secondary ht-btn--sm" disabled>Trước</button><button className="ht-btn ht-btn--secondary ht-btn--sm">Sau</button></div>
        </>}
      >
        <table className="ht-table">
          <thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Hành động</th><th>Đối tượng</th><th>IP</th><th /></tr></thead>
          <tbody>
            {list.map((l) => {
              const [date, time] = l.at.split(' ');
              return (
                <tr key={l.id} data-href tabIndex={0} className={sel?.id === l.id ? 'is-selected' : undefined}
                  onClick={() => setSel(l)} onKeyDown={(e) => e.key === 'Enter' && setSel(l)}>
                  <td className="mono">{date.slice(0, 5)} {time.slice(0, 5)}</td>
                  <td><span className="strong">{l.who}</span><span className="sub">{l.role}</span></td>
                  <td><Badge tone={AREA_TONE[l.area]} plain>{l.label}</Badge><span className="sub mono">{l.action}</span></td>
                  <td className="mono">{l.object}</td>
                  <td className="mono" style={{ color: 'var(--muted)' }}>{l.ip}</td>
                  <td style={{ textAlign: 'right', color: 'var(--muted)' }}><Icon name="chev" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 && <div className="ht-empty">Không có sự kiện phù hợp.</div>}
      </Panel>

      {sel && (
        <aside className="ht-drawer" role="dialog" aria-labelledby="audit-title">
          <div className="ht-drawer__head">
            <div><div className="ht-overline">LOG {sel.id}</div><h2 id="audit-title">{sel.label}</h2></div>
            <button ref={closeRef} type="button" className="ht-iconbtn" aria-label="Đóng" onClick={() => setSel(null)}><Icon name="x" /></button>
          </div>
          <div className="ht-drawer__body">
            <dl className="ht-kv" style={{ gridTemplateColumns: '110px 1fr' }}>
              <dt>Thời gian</dt><dd className="ht-mono">{sel.at}</dd>
              <dt>Thực hiện</dt><dd>{sel.who} · <span style={{ color: 'var(--muted)' }}>{sel.role}</span></dd>
              <dt>Đối tượng</dt><dd className="ht-mono">{sel.object}</dd>
              <dt>Hành động</dt><dd className="ht-mono">{sel.action}</dd>
              <dt>IP</dt><dd className="ht-mono">{sel.ip}</dd>
            </dl>
            {sel.from && (
              <div>
                <div className="ht-overline" style={{ marginBottom: 8 }}>Thay đổi trạng thái</div>
                <pre className="ht-code"><span className="ht-diff-del">{sel.from}</span>{'\n'}<span className="ht-diff-add">→ {sel.to}</span></pre>
              </div>
            )}
            {sel.reason && (
              <div>
                <div className="ht-overline" style={{ marginBottom: 8 }}>Lý do · ghi chú</div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: '21px' }}>{sel.reason}</p>
              </div>
            )}
            <Callout tone="info" icon="lock">Bản ghi nhật ký không thể sửa hoặc xóa.</Callout>
          </div>
        </aside>
      )}
    </div>
  );
};
