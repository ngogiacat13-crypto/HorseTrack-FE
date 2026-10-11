import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HealthStatus, HEALTH_LABEL, trainerApi, TrainingPlan, horseInitials } from '../../api/trainerApi';
import { useActor } from '../../auth/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { Icon } from '../../components/ui/Icon';
import { Badge, PageHeader, Panel, Tabs, Timeline } from '../../components/ui/Ht';
import { HorseBadges, LoadState } from '../../components/trainer/TrainerParts';

type HealthTab = 'ALL' | HealthStatus;

/* 1.1 Tổng quan đàn ngựa · 4.2 tình trạng khóa · 4.3 lịch tiêm sắp tới */
export const TrainerHerdOverview: React.FC = () => {
  const navigate = useNavigate();
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => trainerApi.getHerd(actor), [actor]);
  const [tab, setTab] = useState<HealthTab>('ALL');
  const [lockF, setLockF] = useState<'all' | 'locked' | 'free'>('all');
  const [breed, setBreed] = useState('');
  const [q, setQ] = useState('');

  const horses = useMemo(() => data?.horses ?? [], [data]);
  const activePlan = useMemo(() => {
    const m = new Map<string, TrainingPlan>();
    (data?.plans ?? []).filter((p) => p.status === 'ACTIVE' || p.status === 'PAUSED').forEach((p) => m.set(p.horseId, p));
    return m;
  }, [data]);

  const list = useMemo(() => horses.filter((h) =>
    (tab === 'ALL' || h.health === tab) &&
    (lockF === 'all' || (lockF === 'locked' ? h.trainingLocked : !h.trainingLocked)) &&
    (!breed || h.breed === breed) &&
    `${h.name} ${h.microchip} ${h.owner}`.toLowerCase().includes(q.trim().toLowerCase())), [horses, tab, lockF, breed, q]);

  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const count = (s: HealthStatus) => horses.filter((h) => h.health === s).length;
  const locked = horses.filter((h) => h.trainingLocked);
  const running = data.plans.filter((p) => p.status === 'ACTIVE').length;
  const pending = data.sessions.filter((s) => s.status === 'PAUSED_PENDING_TRAINER');
  const dueSoon = data.vaccinations.filter((v) => v.status === 'DUE_SOON' || v.status === 'POSTPONED');
  const breeds = [...new Set(horses.map((h) => h.breed))].sort();

  return (
    <div className="ht ht-page">
      <PageHeader
        title="Tổng quan đàn ngựa"
        sub={`${horses.length} ngựa · ${locked.length} đang bị khóa tập · ${running} có giáo án đang chạy`}
        actions={<Link className="ht-btn ht-btn--primary" to="/trainer/plans/new"><Icon name="calendar" />Tạo giáo án</Link>}
      />

      {pending.map((s) => (
        <div key={s.id} className="ht-banner" role="alert">
          <Icon name="alarm" />
          <div>
            <b>Phiên <span className="ht-mono">{s.id}</span> ({s.horseName}) tạm dừng lúc <span className="ht-mono">{s.pausedAt}</span> — chờ bạn quyết định (BR_02).</b>
            <p>{s.pausedReason} Mã phu {s.groom} đang chờ chỉ dẫn.</p>
          </div>
          <Link className="ht-more" to={`/trainer/sessions/${s.id}`}>Xử lý ngay <Icon name="arrow" /></Link>
        </div>
      ))}

      <Tabs<HealthTab> value={tab} onChange={setTab} items={[
        { value: 'ALL', label: 'Tất cả', count: horses.length },
        { value: 'HEALTHY', label: 'Khỏe mạnh', count: count('HEALTHY') },
        { value: 'WATCH', label: 'Theo dõi', count: count('WATCH') },
        { value: 'INJURED', label: 'Chấn thương', count: count('INJURED') },
        { value: 'QUARANTINE', label: 'Cách ly', count: count('QUARANTINE') },
      ]} />

      <div className="ht-cols">
        <div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="ht-select" value={lockF} onChange={(e) => setLockF(e.target.value as typeof lockF)} aria-label="Lọc khóa tập">
              <option value="all">Khóa tập: Tất cả</option><option value="locked">Đang khóa</option><option value="free">Được tập</option>
            </select>
            <select className="ht-select" value={breed} onChange={(e) => setBreed(e.target.value)} aria-label="Lọc giống">
              <option value="">Giống: Tất cả</option>{breeds.map((b) => <option key={b}>{b}</option>)}
            </select>
            <div className="ht-search-input" style={{ marginLeft: 'auto' }}>
              <Icon name="search" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên ngựa, microchip, chủ ngựa…" aria-label="Tìm ngựa" />
            </div>
          </div>

          <div className="ht-horse-grid">
            {list.map((h) => {
              const plan = activePlan.get(h.id);
              return (
                <article key={h.id} className={`ht-horse-card${h.trainingLocked ? ' ht-horse-card--locked' : ''}`}>
                  <div className="ht-horse-card__head">
                    <i className="ht-avatar ht-avatar--xl">{horseInitials(h.name)}</i>
                    <div>
                      <b>{h.name}</b>
                      <small>{h.breed}</small>
                      <span className="ht-mono">{h.sex} {h.age} tuổi · {h.microchip}</span>
                    </div>
                  </div>
                  <HorseBadges horse={h} />
                  <div className="ht-horse-card__meta">
                    <span>Chủ: <b>{h.owner}</b></span>
                    <span>
                      KH:{' '}
                      {h.trainingLocked ? <b style={{ color: 'var(--danger-ink)' }}>Tạm dừng do khóa tập</b>
                        : plan ? <b>{plan.type} · Giai đoạn {plan.currentPhase}{plan.status === 'PAUSED' && <span style={{ color: 'var(--warning-ink)' }}> · tạm dừng</span>}</b>
                        : <i>Chưa có giáo án</i>}
                    </span>
                  </div>
                  <div className="ht-horse-card__foot">
                    <Link className="ht-more" to={`/trainer/horses/${h.id}`}>Xem chi tiết <Icon name="arrow" /></Link>
                  </div>
                </article>
              );
            })}
          </div>
          {list.length === 0 && <div className="ht-empty">Không tìm thấy ngựa phù hợp bộ lọc.</div>}
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '16px 0 0' }}>Hiển thị {list.length} / {horses.length} ngựa</p>
        </div>

        <div>
          <Panel as="h3" title="Đang khóa huấn luyện" right={<Badge tone="neutral" plain style={{ fontFamily: 'var(--font-mono)' }}>BR_01</Badge>}
            foot={<span>Chỉ Bác sĩ thú y được mở khóa.</span>}>
            <ul className="ht-list">
              {locked.map((h) => (
                <li key={h.id} className="ht-list-row ht-list-row--danger" style={{ cursor: 'pointer' }} onClick={() => navigate(`/trainer/horses/${h.id}`)}>
                  <div className="r1"><span className="r2">{h.name}</span><Badge tone={HEALTH_LABEL[h.health][1]} plain>{HEALTH_LABEL[h.health][0]}</Badge></div>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{h.lock?.reason} · BS {h.lock?.by} · từ <span className="ht-mono">{h.lock?.at}</span></span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{h.lock?.review}</span>
                </li>
              ))}
              {locked.length === 0 && <li className="ht-empty" style={{ padding: 16 }}>Không có ngựa bị khóa.</li>}
            </ul>
          </Panel>

          <Panel as="h3" title="Lịch tiêm phòng 7 ngày tới" right={<span className="ht-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>chỉ xem</span>}>
            <div className="ht-panel__body">
              <Timeline items={dueSoon.map((v) => ({
                tone: v.status === 'POSTPONED' ? 'warning' : 'info',
                what: <><b>{v.horse}</b> · {v.type}{v.note && <> — {v.note}</>}</>,
                when: v.due,
              }))} />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};
