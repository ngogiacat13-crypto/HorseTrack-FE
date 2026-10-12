import React from 'react';

/* ---------- Loading ---------- */
export const Loading: React.FC<{ label?: string }> = ({ label = 'Đang tải…' }) => (
  <div className="ht-loading" role="status"><i className="ht-spinner" />{label}</div>
);
