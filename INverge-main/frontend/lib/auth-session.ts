import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { disconnectSocket } from '@/lib/socket';

/** Clears tokens and persisted auth state (single source of truth for sign-out). */
export function clearAuthSession() {
  useAuthStore.getState().logout();
}

/** Signs out via API, disconnects socket, clears session, and redirects to login. */
export async function performLogout(redirect: (path: string) => void) {
  const { refreshToken } = useAuthStore.getState();
  try {
    await authService.logout(refreshToken ?? undefined);
  } catch {
    /* ignore */
  }
  disconnectSocket();
  clearAuthSession();
  redirect('/login');
}

export function isPublicAuthPath(pathname: string) {
  return (
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password'
  );
}

export function isAuthApiUrl(url?: string) {
  if (!url) return false;
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/signup') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/logout') ||
    url.includes('/auth/forgot-password') ||
    url.includes('/auth/reset-password')
  );
}

export function redirectToLoginIfNeeded() {
  if (typeof window === 'undefined') return;
  if (isPublicAuthPath(window.location.pathname)) return;
  window.location.href = '/login';
}
