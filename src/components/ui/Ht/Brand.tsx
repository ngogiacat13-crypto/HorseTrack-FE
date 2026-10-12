import React from 'react';
import { Icon } from '../Icon';

/* ---------- Brand ---------- */
export const BrandMark: React.FC = () => <span className="ht-brand__mark">H<b>T</b></span>;
export const DemoClock: React.FC = () => (
  <span className="ht-clock"><Icon name="clock" /><span>Đồng hồ demo ·</span><strong>03/10/2026 10:30</strong></span>
);
