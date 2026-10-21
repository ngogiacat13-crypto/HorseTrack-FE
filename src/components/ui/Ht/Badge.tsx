import React from 'react';

export type Tone = 'success' | 'info' | 'warning' | 'danger' | 'neutral' | 'brand' | 'demo' | 'purple';
export const Badge: React.FC<{ tone: Tone; plain?: boolean; children: React.ReactNode; style?: React.CSSProperties }> = ({ tone, plain, children, style }) => (
  <span className={`ht-badge ht-badge--${tone}${plain ? ' ht-badge--plain' : ''}`} style={style}>{children}</span>
);
