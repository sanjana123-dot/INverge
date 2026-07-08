import type { ConnectionRequest, Endorsement } from '@/types';
import type { TrustScoreBreakdown } from '@/types';

export type DashboardCache = {
  trustData: { score: number; breakdown: TrustScoreBreakdown } | null;
  received: ConnectionRequest[];
  endorsements: Endorsement[];
  analytics: Record<string, unknown> | null;
};

const CACHE_TTL_MS = 60_000;
const INVALIDATE_EVENT = 'dashboard:invalidate';
let cache: { data: DashboardCache; at: number } | null = null;

export function getDashboardCache(): DashboardCache | null {
  if (!cache) return null;
  if (Date.now() - cache.at > CACHE_TTL_MS) {
    cache = null;
    return null;
  }
  return cache.data;
}

export function setDashboardCache(data: DashboardCache) {
  cache = { data, at: Date.now() };
}

export function invalidateDashboardCache() {
  cache = null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(INVALIDATE_EVENT));
  }
}

export function onDashboardCacheInvalidate(listener: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(INVALIDATE_EVENT, listener);
  return () => window.removeEventListener(INVALIDATE_EVENT, listener);
}
