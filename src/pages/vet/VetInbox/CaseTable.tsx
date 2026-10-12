import React from 'react';
import { VetCase, VetHorse } from '../../../api/vetApi';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Panel } from '../../../components/ui/Ht';
import { CaseSourceTag, SeverityTag } from '../../../components/vet/VetParts';

/* 1.1 — the inbox list. A locked horse shows "ĐÃ KHÓA" instead of the severity. */
export const CaseTable: React.FC<{ cases: VetCase[]; horses: VetHorse[]; selectedId?: string; onSelect: (id: string) => void }> = ({ cases, horses, selectedId, onSelect }) => (
  <Panel foot={<span style={{ fontSize: 12, color: 'var(--muted)' }}>{cases.length} ca · ưu tiên theo mức độ</span>}>
    <div style={{ overflowX: 'auto' }}>
      <table className="ht-table">
        <thead><tr><th>Ca</th><th>Ngựa</th><th>Nguồn</th><th>Loại</th><th>Mức</th><th>Ngày</th></tr></thead>
        <tbody>
          {cases.map((c) => {
            const locked = horses.find((x) => x.id === c.horseId)?.trainingLocked && c.status !== 'CLOSED';
            return (
              <tr key={c.id} className={selectedId === c.id ? 'is-selected' : undefined} onClick={() => onSelect(c.id)} style={{ cursor: 'pointer' }}
                tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onSelect(c.id); }} aria-selected={selectedId === c.id}>
                <td className="id">{c.id}</td>
                <td className="strong">{c.horse}</td>
                <td><CaseSourceTag source={c.source} /></td>
                <td>{c.type}</td>
                <td>{locked ? <Badge tone="danger" plain><Icon name="lock" size={12} />&nbsp;ĐÃ KHÓA</Badge> : <SeverityTag severity={c.severity} />}</td>
                <td className="mono">{c.at.slice(0, 5)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {cases.length === 0 && <div className="ht-empty">Không có ca nào ở mục này.</div>}
    </div>
  </Panel>
);
