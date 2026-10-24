import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { ROLE_HOME } from '../../api/mockData';
import { Icon } from '../ui/Icon';
import { Avatar, BrandMark, DemoClock } from '../ui/Ht';
import { USE_BACKEND } from '../../api/beClient';
import { ROLE_LABEL, SEARCH_HINT } from './nav';

export const Topbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setOpen(false), open);

  if (!user) return null;

  return (
    <header className="ht-app__bar">
      <Link className="ht-brand" to={ROLE_HOME[user.role]}><BrandMark />HorseTrack</Link>
      <DemoClock />
      <label className="ht-search">
        <Icon name="search" />
        <input type="search" placeholder={SEARCH_HINT[user.role] ?? 'Tìm kiếm…'} aria-label="Tìm kiếm" />
      </label>

      <div className="ht-user">
        <button type="button" className="ht-iconbtn ht-bell" data-testid="notifications-btn" aria-label={USE_BACKEND ? 'Thông báo' : 'Thông báo (4 mới)'}>
          <Icon name="bell" size={18} />{!USE_BACKEND && <span className="ht-count">4</span>}
        </button>

        <div className="ht-usermenu" ref={menuRef}>
          <button type="button" className="ht-usermenu__btn" data-testid="user-menu-btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            <span><b>{user.fullname}</b><small>{ROLE_LABEL[user.role]}</small></span>
            <Avatar name={user.fullname} src={user.avatarUrl} size={34} />
            <Icon name="down" size={14} style={{ color: 'var(--muted)' }} />
          </button>
          {open && (
            <div className="ht-menu" role="menu">
              <div className="ht-menu__head" data-testid="user-menu-head">
                <Avatar name={user.fullname} src={user.avatarUrl} size={40} />
                <span className="ht-menu__who">
                  <b title={user.fullname}>{user.fullname}</b>
                  <small title={user.email}>{user.email}</small>
                  <em>{ROLE_LABEL[user.role]}</em>
                </span>
              </div>
              <Link role="menuitem" className="ht-menu__item" data-testid="menu-my-profile" to="/my-profile" onClick={() => setOpen(false)}>
                <Icon name="usercircle" />Hồ sơ cá nhân
              </Link>
              <Link role="menuitem" className="ht-menu__item" data-testid="menu-change-password" to="/change-password" onClick={() => setOpen(false)}>
                <Icon name="key" />Đổi mật khẩu
              </Link>
              <button role="menuitem" type="button" className="ht-menu__item ht-menu__item--danger" data-testid="logout-btn" onClick={() => { logout(); navigate('/login'); }}>
                <Icon name="logout" />Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
