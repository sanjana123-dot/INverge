import { api } from '@/lib/api';
import type { ApiResponse, Notification } from '@/types';

export const notificationService = {
  getAll: (page = 1) =>
    api.get<
      ApiResponse<{
        notifications: Notification[];
        unreadCount: number;
        total: number;
      }>
    >('/notifications', { params: { page } }),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};
