'use client';

import { useEffect, useState } from 'react';
import { TrustScoreCard } from '@/components/dashboard/TrustScoreCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/authStore';
import { trustScoreService } from '@/services/trustScore.service';
import { requestService } from '@/services/request.service';
import { endorsementService } from '@/services/endorsement.service';
import { startupService } from '@/services/startup.service';
import { getDashboardCache, setDashboardCache, onDashboardCacheInvalidate } from '@/lib/dashboard-cache';
import { trustDataFromUser } from '@/lib/trustScore';
import type { ConnectionRequest, Endorsement, TrustScoreBreakdown } from '@/types';
import Link from 'next/link';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const [trustData, setTrustData] = useState<{
    score: number;
    breakdown: TrustScoreBreakdown;
  } | null>(null);
  const [received, setReceived] = useState<ConnectionRequest[]>([]);
  const [endorsements, setEndorsements] = useState<Endorsement[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [loadingTrust, setLoadingTrust] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingEndorsements, setLoadingEndorsements] = useState(true);
  const [trustError, setTrustError] = useState('');
  const [endorsementsError, setEndorsementsError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = () => {
      const cached = getDashboardCache();
      if (cached) {
        setTrustData(cached.trustData);
        setReceived(cached.received);
        setEndorsements(cached.endorsements);
        setAnalytics(cached.analytics);
        setLoadingTrust(false);
        setLoadingRequests(false);
        setLoadingEndorsements(false);
        return;
      }

      let nextTrust: typeof trustData = null;
      let nextReceived: ConnectionRequest[] = [];
      let nextEndorsements: Endorsement[] = [];
      let nextAnalytics: Record<string, unknown> | null = null;

      const loadTrust = async () => {
        setLoadingTrust(true);
        setTrustError('');
        try {
          const { data } = await trustScoreService.getMine();
          if (cancelled) return;
          const payload = data.data;
          nextTrust =
            payload ?
              {
                score: payload.trustScore ?? user?.trustScore ?? 0,
                breakdown: payload.breakdown as TrustScoreBreakdown,
              }
            : trustDataFromUser(user);
          setTrustData(nextTrust);
        } catch {
          if (!cancelled) {
            setTrustError('Trust score could not be refreshed.');
            setTrustData(trustDataFromUser(user));
          }
        } finally {
          if (!cancelled) setLoadingTrust(false);
        }
      };

      const loadRequests = async () => {
        setLoadingRequests(true);
        try {
          const { data } = await requestService.getReceived();
          if (cancelled) return;
          nextReceived =
            data.data?.filter((req) => req.status === 'PENDING').slice(0, 5) ?? [];
          setReceived(nextReceived);
        } catch {
          if (!cancelled) setReceived([]);
        } finally {
          if (!cancelled) setLoadingRequests(false);
        }
      };

      const loadEndorsements = async () => {
        setLoadingEndorsements(true);
        setEndorsementsError('');
        try {
          const { data } = await endorsementService.getReceived();
          if (cancelled) return;
          nextEndorsements = data.data?.slice(0, 3) ?? [];
          setEndorsements(nextEndorsements);
        } catch {
          if (!cancelled) {
            setEndorsementsError('Recent endorsements could not be loaded.');
            setEndorsements([]);
          }
        } finally {
          if (!cancelled) setLoadingEndorsements(false);
        }
      };

      const loadAnalytics = async () => {
        if (user?.role !== 'FOUNDER') return;
        try {
          const { data } = await startupService.analytics();
          if (cancelled) return;
          nextAnalytics = data.data ?? null;
          setAnalytics(nextAnalytics);
        } catch {
          /* no startup yet */
        }
      };

      void Promise.all([loadTrust(), loadRequests(), loadEndorsements(), loadAnalytics()]).then(
        () => {
          if (!cancelled) {
            setDashboardCache({
              trustData: nextTrust,
              received: nextReceived,
              endorsements: nextEndorsements,
              analytics: nextAnalytics,
            });
          }
        }
      );
    };

    loadDashboard();
    const unsubscribe = onDashboardCacheInvalidate(() => {
      if (!cancelled) loadDashboard();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [user?.id, user?.role, user?.trustScore]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.name}</h1>
        <p className="text-zinc-500 capitalize">{user?.role?.toLowerCase()} dashboard</p>
      </div>

      {trustError && <p className="text-sm text-amber-600">{trustError}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          {loadingTrust ?
            <Skeleton className="h-80" />
          : <TrustScoreCard
              score={trustData?.score ?? user?.trustScore ?? 0}
              breakdown={trustData?.breakdown}
            />
          }
        </div>

        <div className="space-y-6 lg:col-span-2">
          {user?.role === 'FOUNDER' && analytics && (
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Requests', value: analytics.requestsReceived },
                { label: 'Accepted', value: analytics.connectionsAccepted },
                { label: 'Endorsements', value: analytics.endorsements },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="pt-6">
                    <p className="text-sm text-zinc-500">{stat.label}</p>
                    <p className="text-3xl font-bold">{String(stat.value ?? 0)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Incoming requests</CardTitle>
              <Link href="/requests">
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loadingRequests ?
                <Skeleton className="h-32" />
              : received.length === 0 ?
                <p className="text-sm text-zinc-500">No pending requests yet.</p>
              : <ul className="space-y-3">
                  {received.map((req) => (
                    <li
                      key={req.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-100 p-3 dark:border-zinc-800"
                    >
                      <div>
                        <p className="font-medium">{req.sender?.name}</p>
                        <p className="text-sm text-zinc-500 line-clamp-1">{req.message}</p>
                      </div>
                      <Badge variant={req.status === 'PENDING' ? 'warning' : 'success'}>
                        {req.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              }
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent endorsements</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingEndorsements ?
                <Skeleton className="h-24" />
              : endorsementsError ?
                <p className="text-sm text-amber-600">{endorsementsError}</p>
              : endorsements.length === 0 ?
                <p className="text-sm text-zinc-500">No endorsements yet.</p>
              : <ul className="space-y-3">
                  {endorsements.map((e) => (
                    <li key={e.id} className="rounded-lg border border-zinc-100 p-3 dark:border-zinc-800">
                      <p className="text-sm font-medium">{e.fromUser?.name}</p>
                      {e.categories?.length > 0 && (
                        <p className="mt-1 text-xs text-violet-600">{e.categories.join(' · ')}</p>
                      )}
                      <p className="text-sm text-zinc-500">{e.message}</p>
                    </li>
                  ))}
                </ul>
              }
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
