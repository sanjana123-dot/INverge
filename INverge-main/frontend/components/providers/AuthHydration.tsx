'use client';

import { useEffect, useState } from 'react';
import { syncPersistedAuth, useAuthStore } from '@/store/authStore';

/**
 * Rehydrates persisted auth once on the client so it cannot race with login/signup.
 */
export function AuthHydration({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const finish = () => {
      if (cancelled || useAuthStore.getState()._hasHydrated) return;
      const state = useAuthStore.getState();
      const patch = syncPersistedAuth(state);
      if (patch) {
        useAuthStore.setState(patch);
      }
      useAuthStore.setState({ _hasHydrated: true });
      setReady(true);
    };

    const unsub = useAuthStore.persist.onFinishHydration(finish);
    void useAuthStore.persist.rehydrate();

    const fallback = window.setTimeout(finish, 3000);

    return () => {
      cancelled = true;
      unsub();
      window.clearTimeout(fallback);
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
