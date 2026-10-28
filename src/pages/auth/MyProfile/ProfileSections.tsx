import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { AuthUser } from '../../../api/mockData';
import { authApi } from '../../../api/authApi';
import { USE_BACKEND } from '../../../api/beClient';
import { Icon } from '../../../components/ui/Icon';
import { Callout, PHONE_RE, normalizePhone } from '../../../components/ui/Ht';
import { ROLE_LABEL } from '../../../components/layout/nav';

const LICENSE_RE = /^[A-Za-z0-9][A-Za-z0-9\-_/.]{1,49}$/;

export const ProfileDetails: React.FC<{ user: AuthUser; onUpdated: (patch: Partial<AuthUser>) => void }> = ({ user, onUpdated }) => {
  const isTrainer = user.role === 'HeadTrainer';
  const isVet = user.role === 'Veterinarian';
  const [fullName, setFullName] = useState(user.fullname);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [license, setLicense] = useState(user.licenseNumber ?? '');
  const [experience, setExperience] = useState(user.experienceYears != null ? String(user.experienceYears) : '');
  const [clinic, setClinic] = useState(user.clinicAffiliation ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const save = async () => {
    setBusy(true);
    setError('');
    setSaved('');
    const phoneValue = phone.trim();
    const licenseValue = license.trim();
    const clinicValue = clinic.trim();
    if (phoneValue && !PHONE_RE.test(normalizePhone(phoneValue))) {
      setError('Số điện thoại không hợp lệ (ví dụ 0912345678)');
      setBusy(false);
      return;
    }
    if ((isTrainer || isVet) && licenseValue && !LICENSE_RE.test(licenseValue)) {
      setError('Mã chứng chỉ 2-50 ký tự, chỉ gồm chữ, số và - _ / .');
      setBusy(false);
      return;
    }
    let experienceYears: number | undefined;
    if (isTrainer && experience.trim()) {
      const years = Number(experience);
      if (!Number.isInteger(years) || years < 0 || years > 60) {
        setError('Số năm kinh nghiệm từ 0 đến 60.');
        setBusy(false);
        return;
      }
      experienceYears = years;
    }
    if (isVet && clinicValue.length > 150) {
      setError('Tên phòng khám tối đa 150 ký tự.');
      setBusy(false);
      return;
    }
    try {
      onUpdated(await authApi.updateProfile({
        fullName,
        phone: phoneValue ? normalizePhone(phoneValue) : '',
        licenseNumber: (isTrainer || isVet) && licenseValue ? licenseValue : undefined,
        experienceYears,
        clinicAffiliation: isVet && clinicValue ? clinicValue : undefined,
      }));
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
  if (isTrainer || isVet) {
    rows.push(['Mã chứng chỉ / mã nhân viên', user.licenseNumber || 'Chưa cập nhật', true]);
  }
  if (user.role === 'Groom') {
    rows.push(['Khu phụ trách', user.specialization || 'Chưa cập nhật']);
  }
  if (isTrainer || isVet) {
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
          {(isTrainer || isVet) && (
            <label className="ht-field">
              <span className="ht-label">Mã chứng chỉ / mã nhân viên</span>
              <input className="ht-input" data-testid="profile-license" value={license} onChange={(e) => setLicense(e.target.value)} placeholder="Để trống nếu giữ nguyên" />
            </label>
          )}
          {isTrainer && (
            <label className="ht-field">
              <span className="ht-label">Số năm kinh nghiệm</span>
              <input className="ht-input" data-testid="profile-experience" inputMode="numeric" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="Để trống nếu giữ nguyên" />
            </label>
          )}
          {isVet && (
            <label className="ht-field">
              <span className="ht-label">Phòng khám</span>
              <input className="ht-input" data-testid="profile-clinic" value={clinic} onChange={(e) => setClinic(e.target.value)} placeholder="Để trống nếu giữ nguyên" />
            </label>
          )}
          {error && <Callout tone="danger" testId="profile-save-error">{error}</Callout>}
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
