import React from 'react';

/* ---------- Timeline ---------- */
export interface TimelineItem { tone?: 'danger' | 'warning' | 'success' | 'info'; what: React.ReactNode; when: string }
export const Timeline: React.FC<{ items: TimelineItem[] }> = ({ items }) => (
  <ul className="ht-timeline">
    {items.map((t, i) => (
      <li key={i}><i className={`dot${t.tone ? ' dot--' + t.tone : ''}`} /><div className="what">{t.what}</div><div className="when">{t.when}</div></li>
    ))}
  </ul>
);
