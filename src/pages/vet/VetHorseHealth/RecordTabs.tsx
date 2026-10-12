import React from 'react';
import { Link } from 'react-router-dom';
import { PROPOSAL_LABEL, RaceProposal, Vaccination } from '../../../api/trainerApi';
import { CASE_LABEL, dateKey, Protocol, SEVERITY_LABEL, VetCase } from '../../../api/vetApi';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Panel } from '../../../components/ui/Ht';
import { ProtocolBadge } from '../../../components/vet/VetParts';

/* The read-only tabs of the health record: cases & protocols, vaccinations, race exams. */

export const CasesTab: React.FC<{ cases: VetCase[]; protocols: Protocol[] }> = ({ cases, protocols }) => (
  <div style={{ display: 'grid', gap: 24 }}>
    <Panel title="Ca khám">
      <table className="ht-table">
        <thead><tr><th>Ca</th><th>Loại</th><th>Chẩn đoán</th><th>Mức</th><th>Ngày</th><th>Trạng thái</th></tr></thead>
        <tbody>
          {cases.map((c) => (
            <tr key={c.id}>
              <td className="id"><Link to={`/vet/cases?case=${c.id}`}>{c.id}</Link></td>
              <td className="strong">{c.type}</td><td>{c.exam?.diagnosis ?? <span style={{ color: 'var(--muted)' }}>Chưa khám</span>}</td>
              <td><Badge tone={SEVERITY_LABEL[c.severity][1]} plain>{SEVERITY_LABEL[c.severity][0]}</Badge></td>
              <td className="mono">{c.at}</td><td><Badge tone={CASE_LABEL[c.status][1]}>{CASE_LABEL[c.status][0]}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
      {cases.length === 0 && <div className="ht-empty">Chưa có ca khám.</div>}
    </Panel>
    <Panel title="Phác đồ điều trị">
      <table className="ht-table">
        <thead><tr><th>Mã</th><th>Chẩn đoán</th><th>Phiên bản</th><th>Ngày cần thuốc</th><th>Trạng thái</th></tr></thead>
        <tbody>
          {[...protocols].sort((a, b) => b.id.localeCompare(a.id)).map((p) => (
            <tr key={p.id}>
              <td className="id"><Link to={`/vet/protocols/${p.id}`}>{p.id}</Link></td><td className="strong">{p.diagnosis}</td>
              <td className="mono">v{p.version}{p.replaces && ` · thay ${p.replaces}`}</td><td className="mono">{p.requiredBy}</td>
              <td><ProtocolBadge state={p.state} delayed={p.delayed} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {protocols.length === 0 && <div className="ht-empty">Chưa có phác đồ.</div>}
    </Panel>
  </div>
);

const VAC_STATUS: Record<Vaccination['status'], [string, 'success' | 'warning' | 'info' | 'neutral']> = {
  DONE: ['Đã tiêm', 'success'], POSTPONED: ['Hoãn', 'warning'], DUE_SOON: ['Sắp đến hạn', 'info'], SCHEDULED: ['Đã lên lịch', 'neutral'],
};

export const VaccinesTab: React.FC<{ vaccinations: Vaccination[] }> = ({ vaccinations }) => (
  <Panel title="Tiêm phòng & tẩy giun" right={<Link className="ht-more" to="/vet/vaccinations">Lịch tiêm toàn đàn <Icon name="arrow" /></Link>}>
    <table className="ht-table">
      <thead><tr><th>Mã</th><th>Loại</th><th>Ngày dự kiến</th><th>Trạng thái</th><th>Thực hiện</th></tr></thead>
      <tbody>
        {[...vaccinations].sort((a, b) => dateKey(b.due).localeCompare(dateKey(a.due))).map((v) => (
          <tr key={v.id}>
            <td className="id">{v.id}</td><td className="strong">{v.type}{v.note && <span className="sub">{v.note}</span>}</td><td className="mono">{v.due}</td>
            <td><Badge tone={VAC_STATUS[v.status][1]}>{VAC_STATUS[v.status][0]}</Badge></td>
            <td>{v.doneAt ? <><span className="ht-mono">{v.doneAt}</span> · lô {v.lot}</> : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
    {vaccinations.length === 0 && <div className="ht-empty">Chưa có lịch tiêm.</div>}
  </Panel>
);

export const RacesTab: React.FC<{ proposals: RaceProposal[] }> = ({ proposals }) => (
  <Panel title="Khám trước thi đấu" right={<Link className="ht-more" to="/vet/race-exams">Yêu cầu khám <Icon name="arrow" /></Link>}>
    <table className="ht-table">
      <thead><tr><th>Mã</th><th>Trạng thái</th><th>Kết quả khám</th></tr></thead>
      <tbody>
        {proposals.map((p) => (
          <tr key={p.id}>
            <td className="id">{p.id}</td><td><Badge tone={PROPOSAL_LABEL[p.status][1]}>{PROPOSAL_LABEL[p.status][0]}</Badge></td>
            <td>{p.vetResult ? <><b style={{ color: p.vetResult.pass ? 'var(--success-ink)' : 'var(--danger-ink)' }}>{p.vetResult.pass ? 'ĐẠT' : 'KHÔNG ĐẠT'}</b> · {p.vetResult.note}</> : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
    {proposals.length === 0 && <div className="ht-empty">Chưa có đề xuất thi đấu.</div>}
  </Panel>
);
