import { be, beData, USE_BACKEND, type ApiResponse } from './beClient';

export interface AppNotification {
  id: number;
  purpose: string;
  title: string;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt?: string | null;
}

interface Page<T> {
  content: T[];
  totalElements: number;
  number: number;
  size: number;
}

export const notificationApi = {
  list: (page = 0, size = 20) =>
    USE_BACKEND
      ? beData(be.get<ApiResponse<Page<AppNotification>>>('/notifications', { params: { page, size } }))
      : Promise.resolve({ content: [] as AppNotification[], totalElements: 0, number: 0, size }),

  unreadCount: () =>
    USE_BACKEND
      ? beData(be.get<ApiResponse<{ count: number }>>('/notifications/unread-count')).then((d) => d?.count ?? 0)
      : Promise.resolve(0),

  markRead: (id: number) =>
    USE_BACKEND ? be.put(`/notifications/${id}/read`) : Promise.resolve(),

  markAllRead: () =>
    USE_BACKEND ? be.put('/notifications/read-all') : Promise.resolve(),
};
