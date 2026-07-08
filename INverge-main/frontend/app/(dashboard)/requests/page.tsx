'use client';

import { useEffect, useState } from 'react';
import { requestService } from '@/services/request.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { ConnectionRequest, RequestStatus } from '@/types';
import { getApiError } from '@/lib/api';
import { invalidateDashboardCache } from '@/lib/dashboard-cache';

export default function RequestsPage() {
  const [received, setReceived] = useState<ConnectionRequest[]>([]);
  const [sent, setSent] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const load = async () => {
    const [r, s] = await Promise.all([
      requestService.getReceived(),
      requestService.getSent(),
    ]);
    setReceived(r.data.data ?? []);
    setSent(s.data.data ?? []);
  };

  useEffect(() => {
    load()
      .catch(() => setError('Could not load requests.'))
      .finally(() => setLoading(false));
  }, []);

  const respond = async (id: string, status: 'ACCEPTED' | 'REJECTED') => {
    if (respondingId) return;

    setRespondingId(id);
    setError('');

    const previous = received;
    setReceived((current) =>
      current.map((req) => (req.id === id ? { ...req, status: status as RequestStatus } : req))
    );

    try {
      await requestService.respond(id, status);
      invalidateDashboardCache();
    } catch (err) {
      setReceived(previous);
      setError(getApiError(err));
    } finally {
      setRespondingId(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Connection requests</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Received</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {received.length === 0 ? (
            <p className="text-sm text-zinc-500">No received requests.</p>
          ) : (
            received.map((req) => (
              <div
                key={req.id}
                className="rounded-lg border border-zinc-100 p-4 dark:border-zinc-800"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium">{req.sender?.name}</p>
                  <Badge variant="secondary">{req.intent}</Badge>
                </div>
                <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">{req.message}</p>
                {req.status === 'PENDING' ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={respondingId === req.id}
                      onClick={() => respond(req.id, 'ACCEPTED')}
                    >
                      {respondingId === req.id ? 'Saving…' : 'Accept'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={respondingId === req.id}
                      onClick={() => respond(req.id, 'REJECTED')}
                    >
                      Reject
                    </Button>
                  </div>
                ) : (
                  <Badge variant={req.status === 'ACCEPTED' ? 'success' : 'secondary'}>
                    {req.status}
                  </Badge>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sent.length === 0 ? (
            <p className="text-sm text-zinc-500">No sent requests.</p>
          ) : (
            sent.map((req) => (
              <div
                key={req.id}
                className="rounded-lg border border-zinc-100 p-4 dark:border-zinc-800"
              >
                <p className="font-medium">{req.receiver?.name}</p>
                <p className="text-sm text-zinc-500">{req.message}</p>
                <Badge
                  className="mt-2"
                  variant={
                    req.status === 'PENDING'
                      ? 'warning'
                      : req.status === 'ACCEPTED'
                        ? 'success'
                        : 'secondary'
                  }
                >
                  {req.status}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
