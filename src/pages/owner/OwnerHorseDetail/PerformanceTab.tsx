import React from 'react';
import { Link } from 'react-router-dom';
import type { RaceResult } from '../../../api/ownerApi';
import { PROPOSAL_LABEL, type RaceProposal, type Tournament } from '../../../api/trainerApi';
import { PATH } from '../../../routers/routerPath';
import { Badge, Panel, StatCard, money } from '../../../components/ui/Ht';

type Stats = { starts: number; wins: number; top3: number; best: number | null };

export const PerformanceTab: React.FC<{ results: RaceResult[]; stats: Stats; proposals: { proposal: RaceProposal; tournament?: Tournament }[] }> = ({ results, stats, proposals }) => {
  const hasPrize = results.some((r) => r.prize != null);
  const totalPrize = results.reduce((sum, r) => sum + (r.prize ?? 0), 0);
  return (
    <>
      <div className="ht-stats">
        <StatCard icon="trend" tone="brand" value={stats.starts} label="Số lần thi đấu" />
        <StatCard icon="check" tone="gold" value={stats.wins} label="Về nhất" />
        <StatCard icon="chart" tone="info" value={stats.top3} label="Top 3" meta={stats.starts ? `${Math.round((stats.top3 / stats.starts) * 100)}% số lần đua` : undefined} />
        <StatCard icon="pulse" tone="warning" value={stats.best ?? '—'} label="Thứ hạng tốt nhất" />
        {hasPrize && <StatCard icon="card" tone="gold" value={money(totalPrize)} label="Tổng tiền thưởng" />}
      </div>
      <Panel title="Lịch sử thi đấu" sub="Kết quả được nhập sau mỗi giải (cân ngựa, thi đấu diễn ra ngoài hệ thống)">
        <div style={{ overflowX: 'auto' }}>
          <table className="ht-table" data-testid="owner-race-results">
            <thead><tr><th>Ngày</th><th>Giải</th><th>Cự ly</th><th>Hạng</th><th>Thời gian</th>{hasPrize && <th>Tiền thưởng</th>}</tr></thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.date + r.race}>
                  <td className="ht-mono">{r.date}</td><td>{r.race}</td><td>{r.distance}</td>
                  <td><Badge tone={r.rank === 1 ? 'success' : r.rank <= 3 ? 'info' : 'neutral'}>{r.field > 1 ? `${r.rank}/${r.field}` : `Hạng ${r.rank}`}</Badge></td>
                  <td className="ht-mono">{r.time}</td>
                  {hasPrize && <td className="ht-mono">{r.prize ? money(r.prize) : '—'}</td>}
                </tr>
              ))}
              {results.length === 0 && <tr><td colSpan={hasPrize ? 6 : 5} className="ht-empty">Chưa có kết quả thi đấu.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Đề xuất thi đấu" right={<Link className="ht-more" to={PATH.owner.raceEntries}>Mở trang đề xuất →</Link>}>
        <div style={{ overflowX: 'auto' }}>
          <table className="ht-table">
            <thead><tr><th>Mã</th><th>Giải</th><th>Ngày</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {proposals.map(({ proposal: p, tournament: t }) => (
                <tr key={p.id}><td className="ht-mono">{p.id}</td><td>{t?.name ?? p.tournamentId}</td><td className="ht-mono">{t?.date ?? '—'}</td><td><Badge tone={PROPOSAL_LABEL[p.status][1]}>{PROPOSAL_LABEL[p.status][0]}</Badge></td></tr>
              ))}
              {proposals.length === 0 && <tr><td colSpan={4} className="ht-empty">Chưa có đề xuất.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
};
