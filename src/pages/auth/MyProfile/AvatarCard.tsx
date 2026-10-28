import React from 'react';
import type { AuthUser } from '../../../api/mockData';
import { Avatar, Badge } from '../../../components/ui/Ht';
import { ROLE_LABEL } from '../../../components/layout/nav';

export const AvatarCard: React.FC<{ user: AuthUser }> = ({ user }) => (
    <section className="ht-card ht-profile-hero" data-testid="profile-card">
      <Avatar name={user.fullname} src={user.avatarUrl} size={112} />
      <h2>{user.fullname}</h2>
      <Badge tone="brand" plain>{ROLE_LABEL[user.role]}</Badge>
      <p className="ht-profile-username">@{user.username}</p>
      <span className="ht-profile-status"><i /> Tài khoản đang hoạt động</span>
    </section>
  );
