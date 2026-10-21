import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Icon } from '../ui/Icon';
import { USE_BACKEND } from '../../api/beClient';
import { NAV_BY_ROLE } from './nav';

const navTestId = (path: string) => `nav-${path.replace(/^\//, '').replace(/\//g, '-')}`;

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;
  const groups = NAV_BY_ROLE[user.role] ?? [];

  return (
    <nav className="ht-side" aria-label="Điều hướng" data-testid="sidebar">
      {groups.map((g) => (
        <React.Fragment key={g.title}>
          <div className="ht-side__group">{g.title}</div>
          {g.items.map((it) => (
            <NavLink key={it.path} to={it.path} end={it.end} className="ht-side__item" data-testid={navTestId(it.path)}>
              <Icon name={it.icon} />
              <span>{it.label}</span>
              {it.count && !USE_BACKEND ? <span className={`ht-count${it.tone ? ' ht-count--' + it.tone : ''}`}>{it.count}</span> : null}
            </NavLink>
          ))}
        </React.Fragment>
      ))}
      <span className="ht-side__spacer" />
      <NavLink to="/my-profile" className="ht-side__item" data-testid="nav-my-profile"><Icon name="usercircle" /><span>Hồ sơ cá nhân</span></NavLink>
      <NavLink to="/change-password" className="ht-side__item" data-testid="nav-change-password"><Icon name="key" /><span>Đổi mật khẩu</span></NavLink>
    </nav>
  );
};
