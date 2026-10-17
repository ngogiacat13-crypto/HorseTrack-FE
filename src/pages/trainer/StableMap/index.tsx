import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Stall, trainerApi } from '../../../api/trainerApi';
import { useActor } from '../../../auth/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Callout, PageHeader, Panel, StatCard } from '../../../components/ui/Ht';
import { HorseBadges, LoadState } from '../../../components/trainer/TrainerParts';
import { useDebounce } from '../../../hooks/useDebounce';

const STALL_LABEL: Record<Stall['status'], [string, 'success' | 'warning' | 'danger']> = {
  CLEAN: ['Sạch', 'success'], NEEDS_CLEANING: ['Cần dọn', 'warning'], MAINTENANCE: ['Bảo trì', 'danger'],
};

/* Sơ đồ chuồng trại — HLV trưởng chỉ xem vị trí ngựa và tình trạng; vệ sinh do Mã phu cập nhật. */
export const StableMap: React.FC = () => {
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => trainerApi.getStable(actor), [actor]);
  const [sel, setSel] = useState('A-02');
  const [zone, setZone] = useState('');
  const [q, setQ] = useState('');
  const query = useDebounce(q); // filter after the user pauses typing

  const stalls = useMemo(() => data?.stalls ?? [], [data]);
  const visible = useMemo(() => stalls.filter((s) => (!zone || s.zone === zone) && `${s.id} ${s.horse ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())), [stalls, zone, query]);
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const horseOf = (s: Stall) => data.horses.find((h) => h.id === s.horseId);
  const zones = [...new Set(stalls.map((s) => s.zone))];
  const cur = stalls.find((s) => s.id === sel) ?? stalls[0];
  const curHorse = cur ? horseOf(cur) : undefined;
  const count = (st: Stall['status']) => stalls.filter((s) => s.status === st).length;

  return (
    <div className="ht ht-page">
      <PageHeader title="Sơ đồ chuồng trại" sub="Vị trí và tình trạng ngựa bạn phụ trách. Chuồng của ngựa HLV khác chỉ hiện là đã có ngựa. Trạng thái vệ sinh do Mã phu cập nhật." />

      <div className="ht-stats">
        <StatCard icon="stable" tone="brand" value={stalls.length} label="Tổng số chuồng" />
        <StatCard icon="check" tone="info" value={count('CLEAN')} label="Sạch" />
        <StatCard icon="warn" tone="warning" value={count('NEEDS_CLEANING')} label="Cần dọn" />
        <StatCard icon="lock" tone="danger" value={data.horses.filter((h) => h.trainingLocked).length} label="Ngựa đang khóa tập" />
      </div>

      <div className="ht-cols">
        <div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <select className="ht-select" value={zone} onChange={(e) => setZone(e.target.value)} aria-label="Khu chuồng">
              <option value="">Khu chuồng: Tất cả</option>{zones.map((z) => <option key={z}>{z}</option>)}
            </select>
            <div className="ht-search-input"><Icon name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mã chuồng hoặc tên ngựa…" aria-label="Tìm chuồng" /></div>
          </div>
          {zones.filter((z) => !zone || z === zone).map((z) => {
            const list = visible.filter((s) => s.zone === z);
            if (!list.length) return null;
            return (
              <Panel key={z} title={z} sub={`${list.length} chuồng · ${list.filter((s) => s.status === 'CLEAN').length} sạch`}>
                <div className="ht-panel__body">
                  <div className="ht-stalls">
                    {list.map((s) => {
                      const h = horseOf(s);
                      return (
                        <button key={s.id} type="button" className="ht-stall" aria-pressed={sel === s.id} onClick={() => setSel(s.id)}>
                          <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="ht-mono">{s.id}</span>
                            {h?.trainingLocked && <Icon name="lock" size={14} style={{ color: 'var(--danger-ink)' }} />}
                          </span>
                          <b style={s.otherTrainer ? { color: 'var(--muted)', fontWeight: 500 } : undefined}>{s.horse ?? (s.otherTrainer ? 'Ngựa HLV khác' : 'Trống')}</b>
                          <Badge tone={STALL_LABEL[s.status][1]} plain>{STALL_LABEL[s.status][0]}</Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>

        {cur && (
          <div>
            <Panel as="h3" title={<>Chuồng <span className="ht-mono">{cur.id}</span></>} sub="Chỉ xem" right={<Badge tone={STALL_LABEL[cur.status][1]}>{STALL_LABEL[cur.status][0]}</Badge>}>
              <div className="ht-panel__body" style={{ display: 'grid', gap: 12 }}>
                {curHorse ? (
                  <>
                    <div><b style={{ fontSize: 18 }}>{curHorse.name}</b><div style={{ fontSize: 13, color: 'var(--muted)' }}>{curHorse.breed} · {curHorse.sex} {curHorse.age} tuổi · chủ {curHorse.owner}</div></div>
                    <HorseBadges horse={curHorse} />
                    {curHorse.lock && <Callout tone="danger" icon="lock">Khóa tập: {curHorse.lock.reason} (BS {curHorse.lock.by}).</Callout>}
                    <Link className="ht-more" to={`/trainer/horses/${curHorse.id}`}>Mở hồ sơ ngựa <Icon name="arrow" /></Link>
                  </>
                ) : <p style={{ margin: 0, color: 'var(--muted)' }}>{cur.otherTrainer ? 'Chuồng có ngựa do HLV khác phụ trách — bạn không xem được thông tin ngựa này.' : 'Chuồng trống.'}</p>}
                <dl className="ht-kv">
                  <dt>Khu</dt><dd>{cur.zone}</dd>
                  <dt>Mã phu phụ trách</dt><dd>{cur.groom}</dd>
                </dl>
              </div>
            </Panel>
            {cur.status === 'MAINTENANCE' && <Callout tone="danger" title={`${cur.id} đang bảo trì`}>Không bố trí ngựa vào chuồng cho đến khi bảo trì hoàn tất.</Callout>}
          </div>
        )}
      </div>
    </div>
  );
};
