import React from 'react';

/* ---------- Page header ---------- */
export const PageHeader: React.FC<{ title: React.ReactNode; sub?: React.ReactNode; actions?: React.ReactNode; crumbs?: React.ReactNode; badge?: React.ReactNode }> = ({ title, sub, actions, crumbs, badge }) => (
  <>
    {crumbs && <div className="ht-crumbs">{crumbs}</div>}
    <div className="ht-pagehead">
      <div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <h1 className="ht-page-title">{title}</h1>{badge}
        </div>
        {sub && <p className="ht-page-sub">{sub}</p>}
      </div>
      {actions && <div className="ht-actions">{actions}</div>}
    </div>
  </>
);
