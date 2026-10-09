import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './topbar.css';

const ROLE_LABEL: Record<string, string> = {
  ClubManager: 'QUẢN LÝ CLB',
  HeadTrainer: 'HLV TRƯỞNG',
  Veterinarian: 'BÁC SĨ THÚ Y',
  Groom: 'NGƯỜI CHĂM NGỰA',
  HorseOwner: 'CHỦ NGỰA',
  WarehouseManager: 'QUẢN LÝ KHO',
};

export const Topbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const initial = user?.fullname?.trim().charAt(0).toUpperCase() ?? 'U';
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      {/* LEFT */}
      <div className="topbar-left">
        <Link to="/" className="topbar-brand">
          <span className="topbar-brand-icon">🐴</span>
          <span className="topbar-brand-text">HorseTrack</span>
        </Link>

        <div className="topbar-demo-clock">
          <span className="clock-icon">⏱</span>
          <div className="clock-text">
            <span className="clock-label">Đồng hồ demo · 03/10/2026 10:30</span>
            <span className="clock-sub">Asia/Ho_Chi_Minh · chỉ khi trình diễn</span>
          </div>
        </div>

        <button className="topbar-time-btn" title="Tua thời gian">
          Tua thời gian
        </button>

        <input
          type="text"
          className="topbar-search"
          placeholder="Tìm ngựa, microchip, hóa đơn..."
        />
      </div>

      {/* RIGHT */}
      <div className="topbar-right">
        <button className="topbar-bell" title="Thông báo">
          🔔
          <span className="topbar-bell-badge">1</span>
        </button>

        <div className="topbar-user" ref={menuRef}>
          <button
            className="topbar-user-btn"
            onClick={() => setShowMenu((v) => !v)}
          >
            <div className="topbar-user-info">
              <div className="topbar-user-name">{user?.fullname}</div>
              <div className="topbar-user-role">
                {ROLE_LABEL[user?.role ?? ''] ?? user?.role}
              </div>
            </div>
            <div className="topbar-avatar">{initial}</div>
            <span className="topbar-chevron">▾</span>
          </button>

          {showMenu && (
            <div className="topbar-dropdown">
              <div className="topbar-dropdown-header">
                <div className="topbar-avatar topbar-avatar-lg">{initial}</div>
                <div>
                  <div className="name">{user?.fullname}</div>
                  <div className="email">{user?.email}</div>
                </div>
              </div>
              <div className="topbar-dropdown-divider" />
              <Link
                to="/profile"
                className="topbar-dropdown-item"
                onClick={() => setShowMenu(false)}
              >
                <span className="icon">👤</span> Hồ sơ cá nhân
              </Link>
              <Link
                to="/change-password"
                className="topbar-dropdown-item"
                onClick={() => setShowMenu(false)}
              >
                <span className="icon">🔒</span> Đổi mật khẩu
              </Link>
              <div className="topbar-dropdown-divider" />
              <button
                className="topbar-dropdown-item topbar-dropdown-item-danger"
                onClick={handleLogout}
              >
                <span className="icon">🚪</span> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
