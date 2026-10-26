import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { AuthUser } from '../../../api/mockData';
import { authApi } from '../../../api/authApi';
import { USE_BACKEND } from '../../../api/beClient';
import { Icon } from '../../../components/ui/Icon';
import { Callout } from '../../../components/ui/Ht';
import { ROLE_LABEL } from '../../../components/layout/nav';

export const ProfileDetails: React.FC<{ user: AuthUser; onUpdated: (patch: Partial<AuthUser>) => void }> = ({ user, onUpdated }) => {
  const [fullName, setFullName] = useState(user.fullname);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const save = async () => {
    setBusy(true);
    setError('');
    setSaved('');
    try {
      onUpdated(await authApi.updateProfile(fullName, phone));
      setSaved('Đã cập nhật thông tin cá nhân.');
    } catch (e) {
      setError((e as { message?: string }).message ?? 'Không lưu được hồ sơ.');
    } finally {
      setBusy(false);
    }
  };
  const rows: [string, string, boolean?][] = [
    ['Họ và tên', user.fullname],
    ['Tên đăng nhập', user.username, true],
    ['Email', user.email],
    ['Số điện thoại', user.phone],
    ['Mã người dùng', user.userId, true],
    ['Vai trò', ROLE_LABEL[user.role]],
  ];
  if (user.role !== 'HorseOwner' && user.role !== 'ClubManager') {
    rows.push(['Mã chứng chỉ / mã nhân viên', user.licenseNumber || 'Chưa cập nhật', true]);
    rows.push([user.role === 'Groom' ? 'Khu phụ trách' : 'Chuyên môn', user.specialization || 'Chưa cập nhật']);
    if (user.experienceYears != null) rows.push(['Kinh nghiệm', `${user.experienceYears} năm`]);
    if (user.clinicAffiliation) rows.push(['Phòng khám', user.clinicAffiliation]);
  }
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
      {USE_BACKEND && (
        <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
          <label className="ht-field">
            <span className="ht-label">Họ và tên</span>
            <input className="ht-input" data-testid="profile-fullname" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </label>
          <label className="ht-field">
            <span className="ht-label">Số điện thoại</span>
            <input className="ht-input" data-testid="profile-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0912345678" />
          </label>
          {error && <Callout tone="danger">{error}</Callout>}
          {saved && <Callout tone="success">{saved}</Callout>}
          <button type="button" className="ht-btn ht-btn--primary" data-testid="profile-save" disabled={busy} onClick={() => { void save(); }}>{busy ? 'Đang lưu…' : 'Lưu hồ sơ'}</button>
        </div>
      )}
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
