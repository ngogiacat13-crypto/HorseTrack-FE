import React from 'react';
import { Avatar, Callout, Dialog } from '../../../components/ui/Ht';

export const AvatarDialog: React.FC<{ name: string; src: string | null; busy: boolean; error: string; onClose: () => void; onConfirm: () => void }> = ({ name, src, busy, error, onClose, onConfirm }) => (
  <Dialog open onClose={onClose} icon={src ? 'usercircle' : 'x'} tone={src ? 'brand' : 'danger'} danger={!src} busy={busy} busyLabel="Đang lưu…"
    title={src ? 'Xem trước ảnh đại diện' : 'Gỡ ảnh đại diện?'}
    sub={src ? 'Ảnh đã được cắt vuông ở giữa. Đây là cách ảnh hiện trên thanh trên cùng và trong danh sách người dùng.' : 'Hệ thống sẽ hiện chữ cái đầu tên của bạn thay cho ảnh.'}
    confirmLabel={src ? 'Lưu ảnh đại diện' : 'Gỡ ảnh'} onConfirm={onConfirm}>
    {error && <Callout tone="danger" style={{ marginBottom: 14 }}>{error}</Callout>}
    <div className="ht-avatar-preview">
      <Avatar name={name} src={src} size={120} />
      <Avatar name={name} src={src} size={40} />
      <Avatar name={name} src={src} size={28} />
    </div>
  </Dialog>
);
