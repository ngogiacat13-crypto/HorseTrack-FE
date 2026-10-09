import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './sidebar.css';

interface MenuItem {
  path: string;
  icon: string;
  label: string;
  divider?: boolean; // Đường kẻ phân cách
}

const MENU_BY_ROLE: Record<string, MenuItem[]> = {
  ClubManager: [
    { path: '/manager', icon: '🏠', label: 'Tổng quan' },
    { path: '/manager/registrations', icon: '📋', label: 'Đăng ký ngựa' },
    { path: '/manager/protocols', icon: '💉', label: 'Phác đồ điều trị' },
    { path: '/manager/finance', icon: '📁', label: 'Tài chính' },
    { path: '/manager/audit-logs', icon: '🛡️', label: 'Nhật ký hệ thống' },
    { path: '/manager/reports', icon: '📄', label: 'Báo cáo' },
    { path: '/manager/messages', icon: '✉️', label: 'Tin nhắn' },
    { path: '/manager/inventory', icon: '📦', label: 'Kho vật tư' },
  ],
  HeadTrainer: [
    { path: '/trainer', icon: '🏠', label: 'Tổng quan' },
    { path: '/trainer/horses', icon: '🐴', label: 'Đàn ngựa' },
    { path: '/trainer/plans', icon: '📅', label: 'Giáo án huấn luyện' },
    { path: '/trainer/sessions', icon: '⏱️', label: 'Phiên tập' },
  ],
  Veterinarian: [
    { path: '/vet', icon: '🏠', label: 'Tổng quan' },
    { path: '/vet/cases', icon: '📋', label: 'Ca khám' },
    { path: '/vet/protocols', icon: '💉', label: 'Phác đồ' },
  ],
  Groom: [
    { path: '/groom', icon: '🏠', label: 'Công việc' },
    { path: '/groom/stable', icon: '🐴', label: 'Chuồng trại' },
  ],
  HorseOwner: [
    { path: '/owner', icon: '🏠', label: 'Tổng quan' },
    { path: '/owner/horses', icon: '🐴', label: 'Ngựa của tôi' },
    { path: '/owner/invoices', icon: '📄', label: 'Hóa đơn' },
  ],
  WarehouseManager: [
    { path: '/warehouse', icon: '🏠', label: 'Tồn kho' },
    { path: '/warehouse/requisitions', icon: '📤', label: 'Yêu cầu cấp phát' },
    { path: '/warehouse/shipments', icon: '📦', label: 'Đơn nhập hàng' },
  ],
};

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const menu = MENU_BY_ROLE[user.role] ?? [];

  return (
    <aside className="sidebar-icon-only">
      {/* Logo */}
      <div className="sidebar-logo-wrap">
        <div className="sidebar-logo-icon">🐴</div>
      </div>

      {/* Menu chính */}
      <nav className="sidebar-nav">
        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === `/${user.role.toLowerCase()}`}
            className={({ isActive }) => `sidebar-icon-btn ${isActive ? 'active' : ''}`}
            title={item.label}
          >
            <span className="sidebar-icon-emoji">{item.icon}</span>
            <span className="sidebar-tooltip">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom icons: Settings + Help */}
      <div className="sidebar-bottom">
        <button className="sidebar-icon-btn" title="Cài đặt">
          <span className="sidebar-icon-emoji">⚙️</span>
          <span className="sidebar-tooltip">Cài đặt</span>
        </button>
        <button className="sidebar-icon-btn" title="Trợ giúp">
          <span className="sidebar-icon-emoji">❓</span>
          <span className="sidebar-tooltip">Trợ giúp</span>
        </button>
      </div>
    </aside>
  );
};
