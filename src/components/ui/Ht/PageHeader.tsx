import React from 'react';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

export const PageHeader: React.FC<{ title: React.ReactNode; docTitle?: string; sub?: React.ReactNode; actions?: React.ReactNode; crumbs?: React.ReactNode; badge?: React.ReactNode }> = ({ title, docTitle, sub, actions, crumbs, badge }) => {
  useDocumentTitle(docTitle ?? (typeof title === 'string' ? title : undefined));
  return (
    <>
      {crumbs && <div className="ht-crumbs">{crumbs}</div>}
      <div className="ht-pagehead">
        <div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <h1 className="ht-page-title" data-testid="page-title">{title}</h1>{badge}
          </div>
          {sub && <p className="ht-page-sub">{sub}</p>}
        </div>
        {actions && <div className="ht-actions">{actions}</div>}
      </div>
    </>
  );
};
