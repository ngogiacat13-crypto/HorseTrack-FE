import React, { useRef, useState } from 'react';
import type { AuthUser } from '../../../api/mockData';
import { authApi } from '../../../api/authApi';
import { addAudit } from '../../../api/managerApi';
import { useActor, useAuth } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { AVATAR_MAX_MB, AVATAR_TYPES, toSquareAvatar } from '../../../utils/image';
import { Icon } from '../../../components/ui/Icon';
import { Avatar, Badge, Callout } from '../../../components/ui/Ht';
import { ROLE_LABEL } from '../../../components/layout/nav';
import { AvatarDialog } from './AvatarDialog';

export const AvatarCard: React.FC<{ user: AuthUser }> = ({ user }) => {
  const { updateUser } = useAuth();
  const actor = useActor();
  const input = useRef<HTMLInputElement>(null);
  const { busy, error, setError, run } = useAction();
  const [pickError, setPickError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState<string | null | undefined>(undefined);

  const pick = async (file?: File) => {
    setPickError('');
    if (!file) return;
    try {
      setPending(await toSquareAvatar(file));
      setError('');
    } catch (e) {
      setPickError((e as Error).message);
    }
  };

  const save = async () => {
    const next = pending ?? null;
    const ok = await run(async () => {
      const u = await authApi.updateAvatar(user.userId, next);
      updateUser({ avatarUrl: u.avatarUrl });
      await addAudit(actor, { action: next ? 'UPDATE_AVATAR' : 'REMOVE_AVATAR', label: next ? 'Đổi ảnh đại diện' : 'Gỡ ảnh đại diện', object: user.username, area: 'acct' });
    }, next ? 'Đã cập nhật ảnh đại diện.' : 'Đã gỡ ảnh đại diện.');
    if (ok) setPending(undefined);
  };

  return (
    <section className="ht-card ht-profile-hero">
      <div className={`ht-avatar-edit${dragging ? ' is-drop' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files[0]); }}>
        <Avatar name={user.fullname} src={user.avatarUrl} size={112} />
        <button type="button" className="ht-avatar-edit__btn" onClick={() => input.current?.click()} aria-label="Đổi ảnh đại diện" title="Đổi ảnh đại diện">
          <Icon name="usercircle" size={16} />
        </button>
      </div>
      <input ref={input} type="file" accept={AVATAR_TYPES.join(',')} hidden
        onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />

      <h2>{user.fullname}</h2>
      <Badge tone="brand" plain>{ROLE_LABEL[user.role]}</Badge>
      <p className="ht-profile-username">@{user.username}</p>
      <span className="ht-profile-status"><i /> Tài khoản đang hoạt động</span>

      <div className="ht-avatar-actions">
        <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" onClick={() => input.current?.click()}>
          <Icon name="usercircle" size={15} />{user.avatarUrl ? 'Đổi ảnh' : 'Tải ảnh lên'}
        </button>
        {user.avatarUrl && <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" onClick={() => setPending(null)}>Gỡ ảnh</button>}
      </div>
      <p className="ht-avatar-hint">JPG, PNG hoặc WEBP · tối đa {AVATAR_MAX_MB} MB · có thể kéo thả ảnh vào khung tròn</p>
      {pickError && <Callout tone="danger" style={{ marginTop: 12, textAlign: 'left' }}>{pickError}</Callout>}

      {pending !== undefined && (
        <AvatarDialog name={user.fullname} src={pending} busy={busy} error={error} onClose={() => setPending(undefined)} onConfirm={save} />
      )}
    </section>
  );
};
