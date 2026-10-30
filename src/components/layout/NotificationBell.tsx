import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationApi, type AppNotification } from '../../api/notificationApi';
import { USE_BACKEND } from '../../api/beClient';
import { useClickOutside } from '../../hooks/useClickOutside';
import { Icon } from '../ui/Icon';

const POLL_MS = 45000;

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useClickOutside(wrapRef, () => setOpen(false), open);

  const refreshCount = useCallback(() => {
    if (!USE_BACKEND) return;
    notificationApi.unreadCount().then(setUnread).catch(() => {});
  }, []);

  useEffect(() => {
    refreshCount();
    if (!USE_BACKEND) return;
    const t = window.setInterval(refreshCount, POLL_MS);
    return () => window.clearInterval(t);
  }, [refreshCount]);

  const openPanel = async () => {
    const next = !open;
    setOpen(next);
    if (!next || !USE_BACKEND) return;
    setLoading(true);
    try {
      const page = await notificationApi.list(0, 20);
      setItems(page.content ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const onItem = async (n: AppNotification) => {
    if (!n.read) {
      const marked = await notificationApi.markRead(n.id).then(() => true, () => false);
      if (marked) {
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
        setUnread((c) => Math.max(0, c - 1));
      }
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const markAll = async () => {
    try {
      await notificationApi.markAllRead();
      setItems((prev) => prev.map((x) => ({ ...x, read: true })));
      setUnread(0);
    } catch {
      return;
    }
  };

  return (
    <div className="ht-notif" ref={wrapRef}>
      <button
        type="button"
        className="ht-iconbtn ht-bell"
        data-testid="notifications-btn"
        aria-label={unread > 0 ? `Thông báo (${unread} mới)` : 'Thông báo'}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={openPanel}
      >
        <Icon name="bell" size={18} />
        {USE_BACKEND && unread > 0 && <span className="ht-count">{unread > 99 ? '99+' : unread}</span>}
        {!USE_BACKEND && <span className="ht-count">4</span>}
      </button>

      {open && (
        <div className="ht-notif__panel" role="dialog" aria-label="Thông báo" data-testid="notifications-panel">
          <div className="ht-notif__head">
            <b>Thông báo</b>
            {unread > 0 && (
              <button type="button" className="ht-notif__all" onClick={markAll}>
                Đánh dấu đã đọc
              </button>
            )}
          </div>
          <div className="ht-notif__list">
            {loading && <p className="ht-notif__empty">Đang tải…</p>}
            {!loading && items.length === 0 && <p className="ht-notif__empty">Chưa có thông báo.</p>}
            {!loading &&
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={`ht-notif__item${n.read ? '' : ' ht-notif__item--unread'}`}
                  onClick={() => onItem(n)}
                >
                  <span className="ht-notif__title">{n.title}</span>
                  <span className="ht-notif__msg">{n.message}</span>
                  {n.createdAt && <span className="ht-notif__time">{n.createdAt}</span>}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
