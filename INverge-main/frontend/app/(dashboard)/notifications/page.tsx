'use client';

import { useEffect } from 'react';
import { notificationService } from '@/services/notification.service';
import { useNotificationStore } from '@/store/notificationStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

export default function NotificationsPage() {
  const { notifications, setNotifications, markAsRead, markAllAsRead } =
    useNotificationStore();

  useEffect(() => {
    if (notifications.length > 0) return;
    notificationService.getAll().then(({ data }) => {
      const result = data.data!;
      setNotifications(result.notifications, result.unreadCount);
    });
  }, [notifications.length, setNotifications]);

  const handleMarkAll = async () => {
    await notificationService.markAllAsRead();
    markAllAsRead();
  };

  const handleMarkOne = async (id: string) => {
    await notificationService.markAsRead(id);
    markAsRead(id);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <Button variant="outline" size="sm" onClick={handleMarkAll}>
          Mark all read
        </Button>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-zinc-500">
            No notifications yet.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li key={n.id}>
              <Card
                className={`cursor-pointer transition-colors ${
                  !n.read ? 'border-violet-200 bg-violet-50/50 dark:border-violet-800 dark:bg-violet-900/10' : ''
                }`}
                onClick={() => !n.read && handleMarkOne(n.id)}
              >
                <CardContent className="py-4">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="font-medium">{n.title}</p>
                      <p className="text-sm text-zinc-500">{n.body}</p>
                    </div>
                    <span className="shrink-0 text-xs text-zinc-400">
                      {formatDate(n.createdAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
