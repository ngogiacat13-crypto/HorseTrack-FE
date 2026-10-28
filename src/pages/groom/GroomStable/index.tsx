import React, { useMemo, useState } from 'react';
import { groomApi } from '../../../api/groomApi';
import type { Stall } from '../../../api/trainerApi';
import type { VetHorse } from '../../../api/vetApi';
import { useActor } from '../../../auth/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { useDebounce } from '../../../hooks/useDebounce';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Callout, PageHeader, Panel, StatCard } from '../../../components/ui/Ht';
import { HorseBadges, LoadState } from '../../../components/trainer/TrainerParts';
import { FeedRequestDialog } from './FeedRequestDialog';
import { USE_BACKEND } from '../../../api/beClient';
import { NutritionPlanPanel } from '../../../features/nutrition-plan';

const STALL: Record<Stall['status'], [string, 'success' | 'warning' | 'danger']> = { CLEAN: ['Sạch', 'success'], NEEDS_CLEANING: ['Cần dọn', 'warning'], MAINTENANCE: ['Bảo trì', 'danger'] };

export const GroomStable: React.FC = () => {
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => groomApi.getStable(actor), [actor]);
  const [sel, setSel] = useState('');
  const [zone, setZone] = useState('');
  const [q, setQ] = useState('');
  const [feedFor, setFeedFor] = useState<VetHorse | null>(null);
  const query = useDebounce(q);
  const stalls = data?.stalls ?? [];
  const visible = useMemo(() => stalls.filter((s) => (!zone || s.zone === zone) && `${s.id} ${s.horse ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())), [stalls, zone, query]);
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const { horses, tasks, feeds, groom } = data;
  const zones = [...new Set(stalls.map((s) => s.zone))];
  const cur = stalls.find((s) => s.id === sel) ?? visible[0] ?? stalls[0];
  const horseOf = (s: Stall) => horses.find((h) => h.id === s.horseId);
  const horse = cur ? horseOf(cur) : undefined;
  const stallTasks = cur ? tasks.filter((t) => t.stall === cur.id) : [];
  const count = (st: Stall['status']) => stalls.filter((s) => s.status === st).length;
  const diet = horse?.medicalDiet;
  const pendingFeed = horse ? feeds.filter((f) => f.horseId === horse.id && f.status === 'PENDING') : [];
  const approver = (f: { approverName?: string | null; approverRole?: string | null }) => f.approverName || (f.approverRole === 'Trainer' ? 'HLV phụ trách' : f.approverRole === 'Veterinarian' ? 'Bác sĩ thú y' : 'Bác sĩ');
  const feedRequest = horse && <>{pendingFeed.map((f) => <div key={f.id} style={{ fontSize: 13, color: 'var(--info-ink)' }}><Icon name="clock" size={13} /> Đề nghị “{f.item}” đang chờ {approver(f)} duyệt</div>)}<button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" data-testid="feed-request-btn" onClick={() => setFeedFor(horse)}><Icon name="send" size={14} />Đề nghị chỉnh khẩu phần</button></>;

  return (
    <div className="ht ht-page">
      <PageHeader title="Sơ đồ chuồng trại" sub={`${zones.join(' và ')} · vị trí và tình trạng ngựa được phân công`} actions={<Badge tone="neutral">{stalls.length} chuồng</Badge>} />
      <div className="ht-stats">
        <StatCard icon="stable" tone="brand" value={stalls.length} label="Tổng số chuồng" />
        <StatCard icon="check" tone="info" value={count('CLEAN')} label="Sạch" />
        <StatCard icon="warn" tone="warning" value={count('NEEDS_CLEANING')} label="Cần dọn" />
        <StatCard icon="lock" tone="danger" value={horses.filter((h) => h.trainingLocked).length} label="Ngựa đang khóa tập" />
      </div>
      <div className="ht-cols">
        <div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <select className="ht-select" value={zone} onChange={(e) => setZone(e.target.value)} aria-label="Khu chuồng"><option value="">Khu chuồng: Tất cả</option>{zones.map((z) => <option key={z}>{z}</option>)}</select>
            <div className="ht-search-input"><Icon name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mã chuồng hoặc tên ngựa…" aria-label="Tìm chuồng" /></div>
          </div>
          {zones.filter((z) => !zone || z === zone).map((z) => {
            const list = visible.filter((s) => s.zone === z);
            if (!list.length) return null;
            return <Panel key={z} title={z} sub={`${list.length} chuồng · ${list.filter((s) => s.status === 'CLEAN').length} sạch`}>
              <div className="ht-panel__body"><div className="ht-stalls">{list.map((s) => { const h = horseOf(s); return <button key={s.id} type="button" className="ht-stall" aria-pressed={cur?.id === s.id} onClick={() => setSel(s.id)}><span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span className="ht-mono">{s.id}</span>{h?.trainingLocked && <Icon name="lock" size={14} style={{ color: 'var(--danger-ink)' }} />}</span><b>{s.horse ?? 'Trống'}</b><Badge tone={STALL[s.status][1]} plain>{STALL[s.status][0]}</Badge></button>; })}</div></div>
            </Panel>;
          })}
          <Callout tone="info" title="Phạm vi thông tin của Mã phu">Chỉ xem vị trí chuồng, khẩu phần và chỉ dẫn chăm sóc của các ngựa được giao.</Callout>
        </div>
        {cur && <div>
          <Panel as="h3" title={<>Chuồng <span className="ht-mono">{cur.id}</span></>} sub="Thông tin chỉ đọc" right={<Badge tone={STALL[cur.status][1]}>{STALL[cur.status][0]}</Badge>}>
            <div className="ht-panel__body" style={{ display: 'grid', gap: 12 }}>
              {horse ? <><div><b style={{ fontSize: 18 }}>{horse.name}</b><div style={{ fontSize: 13, color: 'var(--muted)' }}>{horse.breed} · {horse.sex === '♂' ? 'Đực' : 'Cái'} · {horse.age} tuổi · chủ {horse.owner}</div></div><HorseBadges horse={horse} /></> : <p style={{ margin: 0, color: 'var(--muted)' }}>Chuồng trống.</p>}
              <dl className="ht-kv"><dt>Khu</dt><dd>{cur.zone}</dd><dt>Mã phu phụ trách</dt><dd>{cur.groom}{cur.groom === groom.name && ' (bạn)'}</dd><dt>Việc hôm nay</dt><dd>{stallTasks.length ? stallTasks.map((t) => `${t.title} ${t.time}${t.status === 'DONE' ? ' ✓' : ''}`).join(' · ') : '—'}</dd></dl>
              {horse?.lock && <Callout tone="danger" icon="lock">Khóa tập: {horse.lock.reason} (BS {horse.lock.by}).</Callout>}
            </div>
          </Panel>
          {horse && !USE_BACKEND && <Panel as="h3" title="Khẩu phần ăn" right={diet ? <Badge tone="danger" plain><Icon name="lock" size={12} />&nbsp;Bác sĩ chỉ định</Badge> : <Badge tone="neutral" plain>Khẩu phần thường</Badge>}><div className="ht-panel__body" style={{ display: 'grid', gap: 10 }}>
            {diet ? <><div className="ht-meals"><div><span className="ht-overline">Sáng</span>{diet.morning || '—'}</div><div><span className="ht-overline">Trưa</span>{diet.noon || '—'}</div><div><span className="ht-overline">Chiều</span>{diet.evening || '—'}</div></div>{diet.special && <div><b>Đặc biệt:</b> {diet.special}</div>}<Callout tone="demo" icon="lock">Khẩu phần y tế — chỉ thực hiện, không tự sửa (BR_03).</Callout></> : <p style={{ margin: 0, fontSize: 13 }}>Sáng: 3 kg cám + 2 kg cỏ khô · Trưa: 2 kg cỏ khô · Chiều: 2 kg cám + 1 kg cỏ khô</p>}
            {feedRequest}
          </div></Panel>}
          {horse && USE_BACKEND && <NutritionPlanPanel key={`${horse.id}-${pendingFeed.length}`} horseId={horse.id} horseName={horse.name} locked={horse.trainingLocked} role="Groom">{feedRequest}</NutritionPlanPanel>}
          {cur.status === 'MAINTENANCE' && <Callout tone="danger" title={`${cur.id} đang bảo trì`}>Không bố trí ngựa vào chuồng cho đến khi bảo trì hoàn tất.</Callout>}
        </div>}
      </div>
      {feedFor && <FeedRequestDialog horse={feedFor} onClose={() => setFeedFor(null)} onDone={() => { setFeedFor(null); reload(); }} />}
    </div>
  );
};
