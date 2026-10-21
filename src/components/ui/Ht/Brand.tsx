import React from 'react';
import { USE_BACKEND } from '../../../api/beClient';
import { DEMO_NOW } from '../../../api/http';
import { Icon } from '../Icon';

export const BrandMark: React.FC = () => <span className="ht-brand__mark">H<b>T</b></span>;
export const DemoClock: React.FC = () => (
  <span className="ht-clock"><Icon name="clock" /><span>{USE_BACKEND ? 'Hôm nay ·' : 'Đồng hồ demo ·'}</span><strong>{USE_BACKEND ? `${DEMO_NOW.date} ${DEMO_NOW.time}` : '03/10/2026 10:30'}</strong></span>
);
