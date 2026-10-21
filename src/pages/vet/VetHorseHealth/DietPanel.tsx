import React, { useState } from 'react';
import { FeedRequest, VetHorse } from '../../../api/vetApi';
import { Icon } from '../../../components/ui/Icon';
import { Panel } from '../../../components/ui/Ht';
import { DietDialog } from './DietDialog';
import { FeedDecisionDialog } from './FeedDecisionDialog';

export const DietPanel: React.FC<{ horse: VetHorse; pendingFeeds: FeedRequest[]; onChanged: () => void }> = ({ horse, pendingFeeds, onChanged }) => {
  const [dietOpen, setDietOpen] = useState(false);
  const [feedFor, setFeedFor] = useState<{ req: FeedRequest; approve: boolean } | null>(null);
  const diet = horse.medicalDiet;

  return (
    <Panel as="h3" title="Khẩu phần y tế" right={<button type="button" className="ht-more" onClick={() => setDietOpen(true)}>{diet ? 'Sửa' : 'Chỉ định'} <Icon name="arrow" /></button>}>
      <div className="ht-panel__body" style={{ display: 'grid', gap: 10 }}>
        {diet ? (
          <>
            <div className="ht-meals">
              <div><span className="ht-overline">Sáng</span>{diet.morning || '—'}</div>
              <div><span className="ht-overline">Trưa</span>{diet.noon || '—'}</div>
              <div><span className="ht-overline">Chiều</span>{diet.evening || '—'}</div>
            </div>
            {diet.special && <div style={{ fontSize: 13 }}><b>Đặc biệt:</b> {diet.special}</div>}
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{diet.note} · BS {diet.by} · {diet.at}</div>
          </>
        ) : <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>Khẩu phần thường. Chỉ định khẩu phần y tế khi ngựa bị khóa hoặc đang điều trị (BR_03).</p>}
        {pendingFeeds.map((f) => (
          <div key={f.id} className="ht-quote" style={{ display: 'grid', gap: 8 }}>
            <span><b>{f.item}</b> — {f.by} đề nghị lúc <span className="ht-mono">{f.at}</span></span>
            <span style={{ color: 'var(--muted)' }}>{f.reason}</span>
            <span style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="ht-btn ht-btn--primary ht-btn--sm" onClick={() => setFeedFor({ req: f, approve: true })}>Duyệt</button>
              <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" onClick={() => setFeedFor({ req: f, approve: false })}>Từ chối</button>
            </span>
          </div>
        ))}
      </div>
      {dietOpen && <DietDialog horse={horse} onClose={() => setDietOpen(false)} onDone={() => { setDietOpen(false); onChanged(); }} />}
      {feedFor && <FeedDecisionDialog request={feedFor.req} approve={feedFor.approve} onClose={() => setFeedFor(null)} onDone={() => { setFeedFor(null); onChanged(); }} />}
    </Panel>
  );
};
