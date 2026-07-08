'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export function useAuthGuard() {
  const router = useRouter();
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);

  const isReady = hasHydrated && isAuthenticated && !!accessToken;

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated || !accessToken) {
      router.replace('/login');
    }
  }, [hasHydrated, isAuthenticated, accessToken, router]);

  return isReady;
}
