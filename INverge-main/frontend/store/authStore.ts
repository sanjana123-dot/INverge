import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
}

function writeTokens(accessToken: string, refreshToken: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }
}

function removeTokens() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}

/** Keeps axios token keys aligned with persisted zustand auth. */
export function syncPersistedAuth(state: AuthState): Partial<AuthState> | void {
  if (typeof window === 'undefined') return;

  if (state.isAuthenticated && state.accessToken && state.refreshToken) {
    writeTokens(state.accessToken, state.refreshToken);
    return;
  }

  const access = localStorage.getItem('accessToken');
  const refresh = localStorage.getItem('refreshToken');

  if (state.isAuthenticated && access && refresh) {
    return { accessToken: access, refreshToken: refresh };
  }

  if (state.isAuthenticated && (!access || !refresh)) {
    return {
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    };
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setHasHydrated: (value) => set({ _hasHydrated: value }),
      setAuth: (user, accessToken, refreshToken) => {
        writeTokens(accessToken, refreshToken);
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          _hasHydrated: true,
        });
      },
      setTokens: (accessToken, refreshToken) => {
        writeTokens(accessToken, refreshToken);
        set({ accessToken, refreshToken, isAuthenticated: true, _hasHydrated: true });
      },
      setUser: (user) => set({ user }),
      logout: () => {
        removeTokens();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'inverge-auth',
      skipHydration: true,
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
