import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HealthStatus, HEALTH_LABEL, horseInitials } from '../../../api/trainerApi';
import { dueWithin7, isOpenProtocol, VET_ACTION_STATES, vetApi } from '../../../api/vetApi';
import { useFetch } from '../../../hooks/useFetch';
import { Icon } from '../../../components/ui/Icon';
import { PageHeader, Panel, StatCard, Tabs } from '../../../components/ui/Ht';
import { HorseBadges, LoadState } from '../../../components/trainer/TrainerParts';
import { ProtocolBadge } from '../../../components/vet/VetParts';
import { useDebounce } from '../../../hooks/useDebounce';

type HealthTab = 'ALL' | HealthStatus;

/* Sức khỏe đàn ngựa — tổng quan của Bác sĩ thú y: việc cần làm hôm nay + tình trạng từng ngựa. */
export const VetHerd: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useFetch(() => vetApi.getOverview());
  const [tab, setTab] = useState<HealthTab>('ALL');
  const [q, setQ] = useState('');
  const query = useDebounce(q); // filter after the user pauses typing

  const horses = useMemo(() => data?.horses ?? [], [data]);
  const list = useMemo(() => horses.filter((h) => (tab === 'ALL' || h.health === tab) &&
    `${h.name} ${h.owner} ${h.stall}`.toLowerCase().includes(query.trim().toLowerCase())), [horses, tab, query]);

  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const newCases = data.cases.filter((c) => c.status === 'NEW');
  const locked = horses.filter((h) => h.trainingLocked);
  const toAct = data.protocols.filter((p) => VET_ACTION_STATES.includes(p.state));
  const delayed = data.protocols.filter((p) => p.delayed && isOpenProtocol(p));
  const due7 = data.vaccinations.filter(dueWithin7);
  const exams = data.proposals.filter((p) => p.status === 'WAITING_VET_EXAM');
  const feeds = data.feedRequests.filter((f) => f.status === 'PENDING');
  const count = (s: HealthStatus) => horses.filter((h) => h.health === s).length;
  const openProto = (hid: string) => data.protocols.filter((p) => p.horseId === hid && isOpenProtocol(p)).sort((a, b) => b.version - a.version)[0];
  const openCase = (hid: string) => data.cases.find((c) => c.horseId === hid && c.status !== 'CLOSED');

  return (
    <div className="ht ht-page">
      <PageHeader title="Sức khỏe đàn ngựa" sub={`${horses.length} ngựa · ${locked.length} đang khóa huấn luyện · ${data.protocols.filter(isOpenProtocol).length} phác đồ đang mở`} />

      {delayed.map((p) => (
        <div key={p.id} className="ht-banner" role="alert">
          <Icon name="truck" />
          <div>
            <b>Lô hàng trễ — phác đồ <span className="ht-mono">{p.id}</span> ({p.horse}) cần thuốc từ <span className="ht-mono">{p.requiredBy}</span>, hàng về <span className="ht-mono">{p.wait?.eta ?? '—'}</span>.</b>
            <p>Đánh giá lại tình trạng ngựa: sửa phác đồ, dùng phương án thay thế hoặc tiếp tục chờ nếu vẫn an toàn (BR_07).</p>
          </div>
          <Link className="ht-more" to={`/vet/protocols/${p.id}`}>Đánh giá lại <Icon name="arrow" /></Link>
        </div>
      ))}

      <div className="ht-stats">
        <StatCard icon="clip" tone="danger" value={newCases.length} label="Ca khám mới" meta={newCases.length ? `ưu tiên: ${newCases.filter((c) => c.severity === 'HIGH').length} mức cao` : undefined} onClick={() => navigate('/vet/cases')} />
        <StatCard icon="file" tone="warning" value={toAct.length} label="Phác đồ cần bác sĩ xử lý" onClick={() => navigate('/vet/protocols')} />
        <StatCard icon="calendar" tone="info" value={due7.length} label="Tiêm / tẩy giun trong 7 ngày" onClick={() => navigate('/vet/vaccinations')} />
        <StatCard icon="trend" tone="gold" value={exams.length} label="Chờ khám trước thi đấu" onClick={() => navigate('/vet/race-exams')} />
      </div>

      <div className="ht-cols">
        <div>
          <Panel title="Đàn ngựa" right={
            <div className="ht-search-input"><Icon name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên, chủ ngựa, chuồng…" aria-label="Tìm ngựa" /></div>}>
            <div style={{ padding: '0 24px' }}>
              <Tabs<HealthTab> value={tab} onChange={setTab} items={[
                { value: 'ALL', label: 'Tất cả', count: horses.length },
                { value: 'INJURED', label: 'Chấn thương', count: count('INJURED') },
                { value: 'QUARANTINE', label: 'Cách ly', count: count('QUARANTINE') },
                { value: 'WATCH', label: 'Theo dõi', count: count('WATCH') },
                { value: 'HEALTHY', label: 'Khỏe mạnh', count: count('HEALTHY') },
              ]} />
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="ht-table">
                <thead><tr><th>Ngựa</th><th>Tình trạng</th><th>Ca đang mở</th><th>Phác đồ</th><th>Khẩu phần</th></tr></thead>
                <tbody>
                  {list.map((h) => {
                    const c = openCase(h.id);
                    const p = openProto(h.id);
                    return (
                      <tr key={h.id} className={h.trainingLocked ? 'is-danger' : undefined} style={{ cursor: 'pointer' }} tabIndex={0}
                        onClick={() => navigate(`/vet/horses/${h.id}`)} onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/vet/horses/${h.id}`); }}>
                        <td>
                          <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center' }}>
                            <i className="ht-avatar">{horseInitials(h.name)}</i>
                            <span><span className="strong">{h.name}</span><span className="sub mono">{h.stall}</span></span>
                          </span>
                        </td>
                        <td><HorseBadges horse={h} /></td>
                        <td>{c ? <><span className="ht-mono">#{c.id}</span><span className="sub">{c.type}</span></> : '—'}</td>
                        <td>{p ? <><span className="ht-mono">{p.id}</span><div style={{ marginTop: 4 }}><ProtocolBadge state={p.state} delayed={p.delayed} /></div></> : '—'}</td>
                        <td>{h.medicalDiet ? <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 13 }}>Y tế</span> : <span style={{ color: 'var(--muted)', fontSize: 13 }}>Thường</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {list.length === 0 && <div className="ht-empty">Không có ngựa phù hợp.</div>}
            </div>
          </Panel>
        </div>

        <div>
          <Panel as="h3" title="Ca mới chờ khám" right={<Link className="ht-more" to="/vet/cases">Hộp thư <Icon name="arrow" /></Link>}>
            <div className="ht-panel__body" style={{ display: 'grid', gap: 10 }}>
              {newCases.length ? newCases.map((c) => (
                <Link key={c.id} to={`/vet/cases?case=${c.id}`} className="ht-quote" style={{ color: 'inherit', textDecoration: 'none', display: 'block' }}>
                  <b>{c.horse}</b> · {c.type} <span className="ht-mono" style={{ float: 'right', color: 'var(--muted)' }}>#{c.id}</span>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.sender} · {c.at}</div>
                </Link>
              )) : <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>Không có ca mới.</p>}
            </div>
          </Panel>
          <Panel as="h3" title="Ngựa đang khóa huấn luyện" right={<span style={{ fontSize: 12, color: 'var(--muted)' }}>BR_01</span>}>
            <div className="ht-panel__body" style={{ display: 'grid', gap: 10 }}>
              {locked.length ? locked.map((h) => (
                <Link key={h.id} to={`/vet/horses/${h.id}`} className="ht-quote" style={{ color: 'inherit', textDecoration: 'none', display: 'block' }}>
                  <b>{h.name}</b> <span style={{ color: 'var(--muted)', fontSize: 12 }}>từ {h.lock?.at}</span>
                  <div style={{ fontSize: 12 }}>{h.lock?.reason}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Mở khi: {h.lock?.review}</div>
                </Link>
              )) : <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>Không có ngựa bị khóa.</p>}
            </div>
          </Panel>
          {feeds.length > 0 && (
            <Panel as="h3" title="Thức ăn đặc biệt chờ duyệt" right={<span style={{ fontSize: 12, color: 'var(--muted)' }}>BR_03</span>}>
              <div className="ht-panel__body" style={{ display: 'grid', gap: 10 }}>
                {feeds.map((f) => (
                  <Link key={f.id} to={`/vet/horses/${f.horseId}`} className="ht-quote" style={{ color: 'inherit', textDecoration: 'none', display: 'block' }}>
                    <b>{f.horse}</b> · {f.item}<div style={{ fontSize: 12, color: 'var(--muted)' }}>{f.by} · {f.at}</div>
                  </Link>
                ))}
              </div>
            </Panel>
          )}
          <Panel as="h3" title="Sức khỏe theo nhóm">
            <div className="ht-panel__body">
              <dl className="ht-kv">
                {(Object.keys(HEALTH_LABEL) as HealthStatus[]).map((s) => <React.Fragment key={s}><dt>{HEALTH_LABEL[s][0]}</dt><dd>{count(s)} ngựa</dd></React.Fragment>)}
              </dl>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};
