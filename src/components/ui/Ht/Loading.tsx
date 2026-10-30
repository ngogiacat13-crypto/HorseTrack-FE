import React from 'react';

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

export const Loading: React.FC<{ label?: string }> = ({ label = 'Đang Tải' }) => (
  <div className="ht-loading" role="status" data-testid="loading">
    <div className="ht-loading__box">
      <div className="ht-loading__track">
        <div className="ht-loading__runner">
          <video className="ht-loading__horse" src="/horse-loader.mp4" autoPlay={!prefersReducedMotion()} loop muted playsInline preload="auto" aria-hidden="true" />
        </div>
      </div>
      <div className="ht-loading__bar"><div className="ht-loading__fill" /></div>
      <div className="ht-loading__text">
        {label}
        <span className="ht-loading__dot">.</span>
        <span className="ht-loading__dot">.</span>
        <span className="ht-loading__dot">.</span>
      </div>
    </div>
  </div>
);
