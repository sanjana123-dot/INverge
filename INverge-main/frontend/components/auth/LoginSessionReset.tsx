'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { clearAuthSession } from '@/lib/auth-session';

/**
 * Clears any stale session once when the login page opens (before sign-in).
 */
export function LoginSessionReset() {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const cleared = useRef(false);

  useEffect(() => {
    if (!hasHydrated || cleared.current) return;
    cleared.current = true;
    clearAuthSession();
  }, [hasHydrated]);

  return null;
}
