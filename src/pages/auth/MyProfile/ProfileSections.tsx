import React from 'react';
import { Link } from 'react-router-dom';
import type { AuthUser } from '../../../api/mockData';
import { Icon } from '../../../components/ui/Icon';
import { ROLE_LABEL } from '../../../components/layout/nav';

/** Account details of the signed-in user (read-only). */
export const ProfileDetails: React.FC<{ user: AuthUser }> = ({ user }) => {
  const rows: [string, string, boolean?][] = [
    ['Họ và tên', user.fullname],
    ['Tên đăng nhập', user.username, true],
    ['Email', user.email],
    ['Số điện thoại', user.phone],
    ['Mã người dùng', user.userId, true],
    ['Vai trò', ROLE_LABEL[user.role]],
  ];
  return (
    <section className="ht-card">
      <div className="ht-card__title-row">
        <div>
          <h2 className="ht-card__title">Thông tin người dùng</h2>
          <p className="ht-card__sub">Dữ liệu lấy từ tài khoản đăng nhập hiện tại.</p>
        </div>
        <Icon name="usercircle" size={22} style={{ color: 'var(--primary-light)' }} />
      </div>
      <dl className="ht-profile-details">
        {rows.map(([label, value, mono]) => (
          <React.Fragment key={label}>
            <dt>{label}</dt>
            <dd className={mono ? 'ht-mono' : undefined}>{value}</dd>
          </React.Fragment>
        ))}
      </dl>
    </section>
  );
};

export const SecurityCard: React.FC = () => (
  <section className="ht-card ht-profile-security">
    <div>
      <h2 className="ht-card__title">Bảo mật tài khoản</h2>
      <p className="ht-card__sub">Bạn có thể cập nhật mật khẩu bất cứ lúc nào để bảo vệ tài khoản.</p>
    </div>
    <Link className="ht-btn ht-btn--secondary ht-btn--sm" to="/change-password">
      <Icon name="key" size={15} /> Đổi mật khẩu
    </Link>
  </section>
);
