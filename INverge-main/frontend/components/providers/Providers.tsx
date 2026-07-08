'use client';

import { ThemeProvider } from 'next-themes';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getSocket } from '@/lib/socket';
import { useNotificationStore } from '@/store/notificationStore';
import { notificationService } from '@/services/notification.service';
import { AuthHydration } from '@/components/providers/AuthHydration';

export function Providers({ children }: { children: React.ReactNode }) {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const { isAuthenticated, accessToken } = useAuthStore();
  const setNotifications = useNotificationStore((s) => s.setNotifications);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const notificationsLoaded = useRef(false);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !accessToken) return;

    if (!notificationsLoaded.current) {
      notificationsLoaded.current = true;
      notificationService
        .getAll()
        .then(({ data }) => {
          const result = data.data!;
          setNotifications(result.notifications, result.unreadCount);
        })
        .catch(() => {
          notificationsLoaded.current = false;
        });
    }

    const socket = getSocket(accessToken);
    socket.on('notification:new', (notification) => {
      addNotification(notification);
    });

    return () => {
      socket.off('notification:new');
    };
  }, [hasHydrated, isAuthenticated, accessToken, setNotifications, addNotification]);

  useEffect(() => {
    if (!isAuthenticated) {
      notificationsLoaded.current = false;
    }
  }, [isAuthenticated]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthHydration>{children}</AuthHydration>
    </ThemeProvider>
  );
}
