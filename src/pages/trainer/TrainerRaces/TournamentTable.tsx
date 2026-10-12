import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tournament } from '../../../api/trainerApi';
import { Badge, Panel } from '../../../components/ui/Ht';

/** 3.1 — tournaments entered by the Club Manager; the trainer proposes horses from here. */
export const TournamentTable: React.FC<{ tournaments: Tournament[] }> = ({ tournaments }) => {
  const navigate = useNavigate();
  return (
    <Panel sub="Do Quản lý CLB nhập/cập nhật. HLV chọn giải để đề xuất ngựa.">
      <table className="ht-table">
        <thead><tr><th>Giải đấu</th><th>Ngày · cự ly</th><th>Địa điểm</th><th>Hạn đăng ký</th><th>Điều kiện</th><th /></tr></thead>
        <tbody>
          {tournaments.map((x) => (
            <tr key={x.id}>
              <td><span className="strong">{x.name}</span><span className="sub">{x.organizer}</span></td>
              <td><span className="mono">{x.date}</span><span className="sub">{x.distance}</span></td>
              <td>{x.venue}</td>
              <td className="mono">{x.finished ? <Badge tone="neutral">Đã diễn ra</Badge> : x.deadline}</td>
              <td style={{ maxWidth: 240 }}>{x.conditions}<span className="sub">{x.source}</span></td>
              <td style={{ textAlign: 'right' }}>
                {!x.finished && <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" onClick={() => navigate(`/trainer/races/new?t=${x.id}`)}>Đề xuất ngựa</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
};
