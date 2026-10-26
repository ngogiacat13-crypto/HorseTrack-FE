import React from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { Icon } from '../../../components/ui/Icon';
import { PageHeader } from '../../../components/ui/Ht';
import { AvatarCard } from './AvatarCard';
import { ProfileDetails, SecurityCard } from './ProfileSections';

export const MyProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  if (!user) return null;

  return (
    <div className="ht ht-page">
      <PageHeader
        crumbs={<>Tài khoản <Icon name="chev" size={14} /><b>Hồ sơ cá nhân</b></>}
        title="Hồ sơ cá nhân"
        sub="Thông tin tài khoản và ảnh đại diện của bạn trong hệ thống HorseTrack."
      />
      <div className="ht-profile-layout">
        <AvatarCard user={user} onUpdated={updateUser} />
        <ProfileDetails user={user} onUpdated={updateUser} />
        <SecurityCard />
      </div>
    </div>
  );
};
