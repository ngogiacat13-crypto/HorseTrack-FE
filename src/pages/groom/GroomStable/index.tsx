import React, { useState } from 'react';
import { groomApi } from '../../../api/groomApi';
import type { Stall } from '../../../api/trainerApi';
import type { VetHorse } from '../../../api/vetApi';
import { useActor } from '../../../auth/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Callout, PageHeader, Panel, StatCard } from '../../../components/ui/Ht';
import { HorseBadges, LoadState } from '../../../components/trainer/TrainerParts';
import { FeedRequestDialog } from './FeedRequestDialog';

const STALL: Record<Stall['status'], [string, 'success' | 'warning' | 'danger']> = { CLEAN: ['Sạch', 'success'], NEEDS_CLEANING: ['Cần dọn', 'warning'], MAINTENANCE: ['Bảo trì', 'danger'] };

/* 2.1 Sơ đồ chuồng · 2.2 Chi tiết chuồng / ngựa đang chăm · 2.3 Khẩu phần (chỉ xem, BR_03) */
export const GroomStable: React.FC = () => {
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => groomApi.getStable(actor), [actor]);
  const [sel, setSel] = useState<string | null>(null);
  const [feedFor, setFeedFor] = useState<VetHorse | null>(null);
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const { stalls, horses, tasks, feeds, groom } = data;
  const cur = stalls.find((s) => s.id === sel) ?? stalls.find((s) => s.status === 'NEEDS_CLEANING') ?? stalls[0];
  const horse = cur ? horses.find((h) => h.id === cur.horseId) : undefined;
  const stallTasks = cur ? tasks.filter((t) => t.stall === cur.id) : [];
  const count = (st: Stall['status']) => stalls.filter((s) => s.status === st).length;
  const zones = [...new Set(stalls.map((s) => s.zone))];
  const diet = horse?.medicalDiet;
  const pendingFeed = horse ? feeds.filter((f) => f.horseId === horse.id && f.status === 'PENDING') : [];

  return (
    <div className="ht ht-page">
      <PageHeader title="Sơ đồ chuồng trại" sub={`${zones.join(' và ')} · thông tin chăm sóc được phân công`} actions={<Badge tone="neutral">{stalls.length} chuồng</Badge>} />
      <div className="ht-stats">
        <StatCard icon="stable" tone="brand" value={stalls.length} label="Tổng số chuồng" />
        <StatCard icon="check" tone="info" value={count('CLEAN')} label="Sạch" />
        <StatCard icon="warn" tone="warning" value={count('NEEDS_CLEANING')} label="Cần dọn" />
        <StatCard icon="ban" tone="danger" value={count('MAINTENANCE')} label="Bảo trì" />
      </div>

      <div className="ht-cols">
        <div>
          {zones.map((z) => {
            const list = stalls.filter((s) => s.zone === z);
            return (
              <Panel key={z} title={z} sub={`${list.length} chuồng · ${list.filter((s) => s.status === 'CLEAN').length} sạch · ${list.filter((s) => s.status === 'NEEDS_CLEANING').length} cần dọn`}>
                <div className="ht-panel__body">
                  <div className="ht-stalls">
                    {list.map((s) => (
                      <button key={s.id} type="button" className="ht-stall" aria-pressed={cur?.id === s.id} onClick={() => setSel(s.id)}>
                        <span className="ht-mono">{s.id}</span>
                        <b>{s.horse ?? 'Trống'}</b>
                        <Badge tone={STALL[s.status][1]} plain>{STALL[s.status][0]}</Badge>
                        <small style={{ color: 'var(--muted)' }}>{cur?.id === s.id ? 'Đang xem chi tiết' : s.status === 'MAINTENANCE' ? 'Tạm ngưng sử dụng' : 'Thông tin chăm sóc'}</small>
                      </button>
                    ))}
                  </div>
                </div>
              </Panel>
            );
          })}
          <Callout tone="info" title="Phạm vi thông tin của Mã phu">Chỉ xem vị trí chuồng, khẩu phần và chỉ dẫn chăm sóc được giao. Không hiển thị hồ sơ khám, hóa đơn hoặc dữ liệu ngoài phạm vi phân công.</Callout>
        </div>

        {cur && (
          <div>
            <Panel as="h3" title={<>Chuồng <span className="ht-mono">{cur.id}</span></>} sub="Thông tin chỉ đọc" right={<Badge tone={STALL[cur.status][1]}>{STALL[cur.status][0]}</Badge>}>
              <div className="ht-panel__body" style={{ display: 'grid', gap: 12 }}>
                {horse ? <><b style={{ fontSize: 18 }}>{horse.name}</b><HorseBadges horse={horse} compact /></> : <p style={{ margin: 0, color: 'var(--muted)' }}>Chuồng trống.</p>}
                <dl className="ht-kv">
                  <dt>Khu chuồng</dt><dd>{cur.zone}</dd>
                  <dt>Người được giao</dt><dd>{cur.groom}{cur.groom === groom.name && ' (bạn)'}</dd>
                  <dt>Việc hôm nay</dt><dd>{stallTasks.length ? stallTasks.map((t) => `${t.title} ${t.time}${t.status === 'DONE' ? ' ✓' : ''}`).join(' · ') : '—'}</dd>
                </dl>
              </div>
            </Panel>

            {horse && (
              <Panel as="h3" title="Khẩu phần ăn" right={diet ? <Badge tone="danger" plain><Icon name="lock" size={12} />&nbsp;Bác sĩ chỉ định</Badge> : <Badge tone="neutral" plain>Khẩu phần thường</Badge>}>
                <div className="ht-panel__body" style={{ display: 'grid', gap: 10 }}>
                  {diet ? (
                    <>
                      <div className="ht-meals">
                        <div><span className="ht-overline">Sáng</span>{diet.morning || '—'}</div>
                        <div><span className="ht-overline">Trưa</span>{diet.noon || '—'}</div>
                        <div><span className="ht-overline">Chiều</span>{diet.evening || '—'}</div>
                      </div>
                      {diet.special && <div style={{ fontSize: 13 }}><b>Đặc biệt:</b> {diet.special}</div>}
                      <Callout tone="demo" icon="lock">Khẩu phần y tế — chỉ thực hiện, không tự sửa (BR_03).</Callout>
                    </>
                  ) : <p style={{ margin: 0, fontSize: 13 }}>Sáng: 3 kg cám + 2 kg cỏ khô · Trưa: 2 kg cỏ khô · Chiều: 2 kg cám + 1 kg cỏ khô</p>}
                  {pendingFeed.map((f) => <div key={f.id} style={{ fontSize: 13, color: 'var(--info-ink)' }}><Icon name="clock" size={13} /> Đề nghị “{f.item}” đang chờ Bác sĩ duyệt</div>)}
                  <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" onClick={() => setFeedFor(horse)}><Icon name="send" size={14} />Đề nghị chỉnh khẩu phần</button>
                </div>
              </Panel>
            )}
            {cur.status === 'MAINTENANCE' && <Callout tone="danger" title={`${cur.id} đang bảo trì`}>Chuồng trống, tạm ngưng sử dụng. Không bố trí ngựa vào chuồng cho đến khi bảo trì hoàn tất.</Callout>}
          </div>
        )}
      </div>
      {feedFor && <FeedRequestDialog horse={feedFor} onClose={() => setFeedFor(null)} onDone={() => { setFeedFor(null); reload(); }} />}
    </div>
  );
};
