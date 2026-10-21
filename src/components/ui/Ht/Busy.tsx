import React from 'react';

export const Busy: React.FC<{ busy: boolean; label: string; children: React.ReactNode }> = ({ busy, label, children }) =>
  busy ? <><i className="ht-spinner" /><span>{label}</span></> : <>{children}</>;
