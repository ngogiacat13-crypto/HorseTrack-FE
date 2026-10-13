import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { ROLE_HOME } from '../../api/mockData';
import { Icon } from '../ui/Icon';
import { Avatar, BrandMark, DemoClock } from '../ui/Ht';
import { ROLE_LABEL, SEARCH_HINT } from './nav';

export const Topbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, []);

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
        <button type="button" className="ht-iconbtn ht-bell" aria-label="Thông báo (4 mới)">
          <Icon name="bell" size={18} /><span className="ht-count">4</span>
        </button>

        <div className="ht-usermenu" ref={menuRef}>
          <button type="button" className="ht-usermenu__btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            <span><b>{user.fullname}</b><small>{ROLE_LABEL[user.role]}</small></span>
            <Avatar name={user.fullname} src={user.avatarUrl} size={34} />
            <Icon name="down" size={14} style={{ color: 'var(--muted)' }} />
          </button>
          {open && (
            <div className="ht-menu" role="menu">
              <div className="ht-menu__head" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Avatar name={user.fullname} src={user.avatarUrl} size={40} />
                <span><b>{user.fullname}</b><small>{user.email}</small></span>
              </div>
              <Link role="menuitem" className="ht-menu__item" to="/my-profile" onClick={() => setOpen(false)}>
                <Icon name="usercircle" />Hồ sơ cá nhân
              </Link>
              <Link role="menuitem" className="ht-menu__item" to="/change-password" onClick={() => setOpen(false)}>
                <Icon name="key" />Đổi mật khẩu
              </Link>
              <button role="menuitem" type="button" className="ht-menu__item ht-menu__item--danger" onClick={() => { logout(); navigate('/login'); }}>
                <Icon name="logout" />Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
