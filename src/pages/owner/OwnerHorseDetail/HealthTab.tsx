import React, { useState } from 'react';
import type { Vaccination } from '../../../api/trainerApi';
import { CASE_LABEL, type Protocol, type VetCase, type VetHorse } from '../../../api/vetApi';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Callout, Panel, Timeline } from '../../../components/ui/Ht';
import { InjuryMap } from '../../../components/vet/InjuryMap';
import { ProtocolBadge, ProtocolPath } from '../../../components/vet/VetParts';

export const HealthTab: React.FC<{ horse: VetHorse; protocols: Protocol[]; cases: VetCase[]; vaccinations: Vaccination[] }> = ({ horse: h, protocols, cases, vaccinations }) => {
  const [sel, setSel] = useState<string | null>(null);
  return (
    <div className="ht-cols">
      <div>
        <Panel title="Sơ đồ chấn thương" sub={h.injuries.length ? `${h.injuries.length} vị trí do Bác sĩ thú y ghi nhận` : 'Chưa ghi nhận chấn thương'}
          right={<span style={{ fontSize: 12, color: 'var(--muted)', display: 'inline-flex', gap: 6, alignItems: 'center' }}><Icon name="lock" size={12} />Chỉ xem</span>}>
          <div className="ht-panel__body"><InjuryMap injuries={h.injuries} horseName={h.name} selectedId={sel} onSelect={setSel} /></div>
        </Panel>
        <Panel title="Phác đồ điều trị" sub="Bác sĩ thú y lập và xác nhận — chủ ngựa theo dõi trạng thái">
          <div className="ht-panel__body" style={{ display: 'grid', gap: 16 }}>
            {protocols.map((p) => (
              <div key={p.id} className="ht-report">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <b><span className="ht-mono">{p.id}</span> · {p.diagnosis}</b><ProtocolBadge state={p.state} delayed={p.delayed} />
                </div>
                <small style={{ color: 'var(--muted)' }}>BS {p.vet} · lập {p.createdAt} · {p.phases.length} giai đoạn: {p.phases.map((ph) => ph.name).join(' → ')}</small>
                <ProtocolPath protocol={p} />
                {p.outcome && <div style={{ fontSize: 13 }}><b>Kết quả:</b> {p.outcome}</div>}
              </div>
            ))}
            {protocols.length === 0 && <div className="ht-empty">Chưa có phác đồ điều trị.</div>}
          </div>
        </Panel>
      </div>
      <div>
        {h.trainingLocked && <Callout tone="danger" icon="lock" title="Đang khóa huấn luyện">BS {h.lock?.by} khóa lúc {h.lock?.at}: {h.lock?.reason}. Dự kiến đánh giá lại {h.lock?.review}.</Callout>}
        {h.medicalDiet && <Callout tone="demo" icon="heart" title="Chế độ ăn y tế">Bác sĩ đang chỉ định khẩu phần riêng{h.medicalDiet.special ? `: ${h.medicalDiet.special}` : ''}.</Callout>}
        <Panel as="h3" title="Ca khám">
          <div className="ht-panel__body" style={{ display: 'grid', gap: 10 }}>
            {cases.map((c) => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13 }}>
                <span><span className="ht-mono">{c.id}</span> · {c.type}<br /><small style={{ color: 'var(--muted)' }}>{c.at}</small></span>
                <Badge tone={CASE_LABEL[c.status][1]} plain>{CASE_LABEL[c.status][0]}</Badge>
              </div>
            ))}
            {cases.length === 0 && <span style={{ color: 'var(--muted)', fontSize: 13 }}>Chưa có ca khám.</span>}
          </div>
        </Panel>
        <Panel as="h3" title="Lịch sử y tế">
          <div className="ht-panel__body">
            <Timeline items={h.medicalHistory.map((m) => ({ tone: m.tone, what: m.title, when: m.date }))} />
          </div>
        </Panel>
        <Panel as="h3" title="Tiêm phòng & tẩy giun">
          <div className="ht-panel__body" style={{ display: 'grid', gap: 8, fontSize: 13 }}>
            {vaccinations.map((v) => (
              <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span>{v.type}</span>
                <span className="ht-mono" style={{ color: v.status === 'DONE' ? 'var(--muted)' : undefined }}>{v.status === 'DONE' ? `xong ${v.doneAt ?? ''}` : `hạn ${v.due}`}</span>
              </div>
            ))}
            {vaccinations.length === 0 && <span style={{ color: 'var(--muted)' }}>Chưa có lịch.</span>}
          </div>
        </Panel>
      </div>
    </div>
  );
};
