import React, { useState } from 'react';
import type { FeedRequest } from '../../../api/vetApi';
import { FeedDecisionDialog } from './FeedDecisionDialog';

const approverOf = (f: FeedRequest) => f.approverName
  || (f.approverRole === 'Trainer' ? 'HLV phụ trách' : f.approverRole === 'Veterinarian' ? 'Bác sĩ thú y' : 'Bác sĩ');

export const canDecideFeed = (f: FeedRequest) => f.canDecide == null || f.canDecide === true;

export const FeedRequestList: React.FC<{ requests: FeedRequest[]; onChanged: () => void; empty?: string }> = ({ requests, onChanged, empty }) => {
  const [feedFor, setFeedFor] = useState<{ req: FeedRequest; approve: boolean } | null>(null);
  const pending = requests.filter((f) => f.status === 'PENDING');
  if (!pending.length) return empty ? <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>{empty}</p> : null;
  return (
    <>
      {pending.map((f) => (
        <div key={f.id} className="ht-quote" style={{ display: 'grid', gap: 8 }} data-testid={`diet-request-${f.id}`}>
          <span><b>{f.horse}</b> · <b>{f.item}</b> — {f.by} đề nghị lúc <span className="ht-mono">{f.at}</span></span>
          <span style={{ color: 'var(--muted)' }}>{f.reason}</span>
          {canDecideFeed(f) ? (
            <span style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="ht-btn ht-btn--primary ht-btn--sm" data-testid={`feed-approve-${f.id}`} onClick={() => setFeedFor({ req: f, approve: true })}>Duyệt</button>
              <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" data-testid={`feed-reject-${f.id}`} onClick={() => setFeedFor({ req: f, approve: false })}>Từ chối</button>
            </span>
          ) : <span style={{ fontSize: 13, color: 'var(--info-ink)' }}>Đang chờ {approverOf(f)} duyệt</span>}
        </div>
      ))}
      {feedFor && <FeedDecisionDialog request={feedFor.req} approve={feedFor.approve} onClose={() => setFeedFor(null)} onDone={() => { setFeedFor(null); onChanged(); }} />}
    </>
  );
};
