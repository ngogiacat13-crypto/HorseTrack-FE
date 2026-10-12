import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { Icon } from '../../../components/ui/Icon';
import { Badge, PageHeader } from '../../../components/ui/Ht';
import { ROLE_LABEL } from '../../../components/layout/nav';

const initialsOf = (fullname: string) => fullname.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase();

export const MyProfile: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const details = [
    ['Họ và tên', user.fullname],
    ['Tên đăng nhập', user.username],
    ['Email', user.email],
    ['Số điện thoại', user.phone],
    ['Mã người dùng', user.userId],
  ];

  return (
    <div className="ht ht-page">
      <PageHeader
        crumbs={<>Tài khoản <Icon name="chev" size={14} /><b>Hồ sơ cá nhân</b></>}
        title="Hồ sơ cá nhân"
        sub="Thông tin tài khoản đang được sử dụng trong hệ thống HorseTrack."
      />

      <div className="ht-profile-layout">
        <section className="ht-card ht-profile-hero">
          <i className="ht-avatar ht-avatar--profile">{initialsOf(user.fullname)}</i>
          <h2>{user.fullname}</h2>
          <Badge tone="brand" plain>{ROLE_LABEL[user.role]}</Badge>
          <p className="ht-profile-username">@{user.username}</p>
          <span className="ht-profile-status"><i /> Tài khoản đang hoạt động</span>
        </section>

        <section className="ht-card">
          <div className="ht-card__title-row">
            <div>
              <h2 className="ht-card__title">Thông tin người dùng</h2>
              <p className="ht-card__sub">Dữ liệu lấy từ tài khoản đăng nhập hiện tại.</p>
            </div>
            <Icon name="usercircle" size={22} style={{ color: 'var(--primary-light)' }} />
          </div>
          <dl className="ht-profile-details">
            {details.map(([label, value]) => (
              <React.Fragment key={label}>
                <dt>{label}</dt>
                <dd className={label === 'Tên đăng nhập' || label === 'Mã người dùng' ? 'ht-mono' : undefined}>{value}</dd>
              </React.Fragment>
            ))}
            <dt>Vai trò</dt>
            <dd>{ROLE_LABEL[user.role]}</dd>
          </dl>
        </section>

        <section className="ht-card ht-profile-security">
          <div>
            <h2 className="ht-card__title">Bảo mật tài khoản</h2>
            <p className="ht-card__sub">Bạn có thể cập nhật mật khẩu bất cứ lúc nào để bảo vệ tài khoản.</p>
          </div>
          <Link className="ht-btn ht-btn--secondary ht-btn--sm" to="/change-password">
            <Icon name="key" size={15} /> Đổi mật khẩu
          </Link>
        </section>
      </div>
    </div>
  );
};
