import React, { useState } from 'react';
import type { AuthUser } from '../../../api/mockData';
import { authApi } from '../../../api/authApi';
import { USE_BACKEND } from '../../../api/beClient';
import { Avatar, Badge, Callout } from '../../../components/ui/Ht';
import { ROLE_LABEL } from '../../../components/layout/nav';

export const AvatarCard: React.FC<{ user: AuthUser; onUpdated: (patch: Partial<AuthUser>) => void }> = ({ user, onUpdated }) => {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pick = async (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 1024 * 1024) {
      setError('Ảnh PNG, JPEG hoặc WEBP, tối đa 1 MB.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      onUpdated(await authApi.updateAvatar(file));
    } catch (e) {
      setError((e as { message?: string }).message ?? 'Không cập nhật được ảnh.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="ht-card ht-profile-hero" data-testid="profile-card">
      <Avatar name={user.fullname} src={user.avatarUrl} size={112} />
      <h2>{user.fullname}</h2>
      <Badge tone="brand" plain>{ROLE_LABEL[user.role]}</Badge>
      <p className="ht-profile-username">@{user.username}</p>
      <span className="ht-profile-status"><i /> Tài khoản đang hoạt động</span>
      {USE_BACKEND && (
        <label className="ht-btn ht-btn--secondary ht-btn--sm" style={{ marginTop: 12 }}>
          {busy ? 'Đang tải…' : 'Đổi ảnh'}
          <input data-testid="profile-avatar" type="file" accept="image/png,image/jpeg,image/webp" hidden disabled={busy} onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
      )}
      {error && <Callout tone="danger" style={{ marginTop: 12 }}>{error}</Callout>}
    </section>
  );
};
