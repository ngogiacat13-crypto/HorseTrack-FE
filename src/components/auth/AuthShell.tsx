import React from 'react';
import { Link } from 'react-router-dom';
import { Icon, IconName } from '../ui/Icon';
import { BrandMark, DemoClock } from '../ui/Ht';

export interface AuthPoint { icon?: IconName; step?: number; active?: boolean; title: string; text: string }

interface Props {
  eyebrow: string;
  headline: string;
  lede?: string;
  points: AuthPoint[];
  foot: string;
  barRight: React.ReactNode;
  narrow?: boolean;
  logoHeight?: number;
  children: React.ReactNode;
}

/* Public pages: top bar + split shell (brand panel on the left, form on the right). */
export const AuthShell: React.FC<Props> = ({ eyebrow, headline, lede, points, foot, barRight, narrow, logoHeight = 72, children }) => (
  <div className="ht ht-auth" style={{ minHeight: '100vh' }}>
    <header className="ht-auth__bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link className="ht-brand" to="/"><BrandMark />HorseTrack</Link>
        <DemoClock />
      </div>
      {barRight}
    </header>
    <main className="ht-auth__main">
      <div className={`ht-auth__shell${narrow ? ' ht-auth__shell--narrow' : ''}`}>
        <aside className="ht-auth__aside">
          <div className="ht-auth__logo">
            <img src="/horsetrack-logo.png" alt="HorseTrack — Hệ thống quản lý ngựa đua" style={{ height: logoHeight }} />
          </div>
          <div>
            <div className="ht-auth__eyebrow">{eyebrow}</div>
            <h2 className="ht-auth__headline">{headline}</h2>
            {lede && <p className="ht-auth__lede">{lede}</p>}
          </div>
          <ul className="ht-auth__points">
            {points.map((p) => (
              <li key={p.title}>
                <span
                  className="ht-tile"
                  style={p.step ? { font: '700 13px/1 var(--font-sans)', ...(p.active ? { background: 'var(--accent)', color: 'var(--on-primary)' } : {}) } : undefined}
                >
                  {p.step ?? (p.icon && <Icon name={p.icon} />)}
                </span>
                <span><strong>{p.title}</strong>{p.text}</span>
              </li>
            ))}
          </ul>
          <div className="ht-auth__foot">{foot}</div>
        </aside>
        <section className="ht-auth__form">{children}</section>
      </div>
    </main>
  </div>
);
