import React from 'react';
import { PROPOSAL_LABEL, RaceProposal, Tournament } from '../../../api/trainerApi';
import { Badge, Panel } from '../../../components/ui/Ht';

export const ProposalTable: React.FC<{ proposals: RaceProposal[]; tournaments: Tournament[]; selectedId?: string; onSelect: (id: string) => void }> = ({ proposals, tournaments, selectedId, onSelect }) => {
  const t = (id: string) => tournaments.find((x) => x.id === id);
  return (
    <Panel>
      <table className="ht-table">
        <thead><tr><th>Mã</th><th>Ngựa · chủ</th><th>Giải · ngày</th><th>Trạng thái</th><th>Tạo</th></tr></thead>
        <tbody>
          {proposals.map((x) => (
            <tr key={x.id} data-href tabIndex={0} className={selectedId === x.id ? 'is-selected' : undefined}
              onClick={() => onSelect(x.id)} onKeyDown={(e) => e.key === 'Enter' && onSelect(x.id)}>
              <td className="id">{x.id}</td>
              <td><span className="strong">{x.horseName}</span><span className="sub">{x.owner}</span></td>
              <td>{t(x.tournamentId)?.name}<span className="sub mono">{t(x.tournamentId)?.date} · {t(x.tournamentId)?.distance}</span></td>
              <td><Badge tone={PROPOSAL_LABEL[x.status][1]}>{PROPOSAL_LABEL[x.status][0]}</Badge>{x.result && <span className="sub">Hạng {x.result.rank} · <span className="ht-mono">{x.result.time}</span></span>}</td>
              <td className="mono">{x.createdAt.slice(0, 5)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {proposals.length === 0 && <div className="ht-empty">Chưa có đề xuất.</div>}
    </Panel>
  );
};
