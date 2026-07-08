'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { startupService } from '@/services/startup.service';
import { ConnectionRequestCard } from '@/components/request/ConnectionRequestCard';
import { EndorsementForm } from '@/components/endorsement/EndorsementForm';
import { UserAvatar } from '@/components/user/UserAvatar';
import { TrustScoreCard } from '@/components/dashboard/TrustScoreCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DOMAINS, FUNDING_STAGES } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import type { Startup, TrustScoreBreakdown } from '@/types';

function founderBreakdown(founder: Startup['founder']): TrustScoreBreakdown | null {
  if (!founder) return null;
  const profileCompleteness = founder.profileCompleteness ?? 0;
  const responseRate = founder.responseRate ?? 0;
  const endorsements = founder.endorsementScore ?? 0;
  const activityConsistency = founder.activityScore ?? 0;

  return {
    profileCompleteness: {
      value: profileCompleteness,
      weight: 0.3,
      contribution: Math.round(profileCompleteness * 0.3),
    },
    responseRate: {
      value: responseRate,
      weight: 0.2,
      contribution: Math.round(responseRate * 0.2),
    },
    endorsements: {
      value: endorsements,
      weight: 0.3,
      contribution: Math.round(endorsements * 0.3),
    },
    activityConsistency: {
      value: activityConsistency,
      weight: 0.2,
      contribution: Math.round(activityConsistency * 0.2),
    },
  };
}

export default function StartupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const [startup, setStartup] = useState<Startup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    startupService
      .getById(id)
      .then(({ data }) => {
        if (!cancelled) setStartup(data.data ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    if (user?.id) {
      startupService.recordView(id).catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [id, user?.id]);

  if (loading) return <Skeleton className="h-96" />;
  if (!startup) return <p>Startup not found</p>;

  const domainLabel = DOMAINS.find((d) => d.value === startup.domain)?.label;
  const stageLabel = FUNDING_STAGES.find((s) => s.value === startup.fundingStage)?.label;
  const founder = startup.founder;
  const breakdown = founderBreakdown(founder);
  const canSendRequest =
    user?.role === 'INVESTOR' && user.id !== startup.founderId && Boolean(founder?.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{startup.startupName}</h1>
        <p className="text-zinc-500">
          {domainLabel} · {stageLabel}
        </p>
      </div>

      {founder && (
        <Card>
          <CardHeader>
            <CardTitle>Founder</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <UserAvatar name={founder.name ?? 'Founder'} profilePicture={founder.profilePicture} />
              <div>
                <p className="font-medium">{founder.name}</p>
                <p className="text-sm text-zinc-500">Founder</p>
              </div>
            </div>
            {founder.id && user?.id !== founder.id && (
              <Button asChild variant="outline">
                <Link href={`/users/${founder.id}`}>View personal profile</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <TrustScoreCard
        score={founder?.trustScore ?? 0}
        breakdown={breakdown}
        title="Founder trust score"
        description={`Trust score for ${founder?.name ?? 'this founder'}`}
      />

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{startup.description}</p>
          <div>
            <h4 className="mb-2 font-medium">Pitch</h4>
            <p className="text-zinc-600 dark:text-zinc-400">{startup.pitch}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{domainLabel}</Badge>
            <Badge variant="secondary">{stageLabel}</Badge>
            <Badge variant="secondary">Team: {startup.teamSize}</Badge>
          </div>
          {startup.pitchDeckUrl && (
            <a
              href={startup.pitchDeckUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-600 hover:underline"
            >
              View pitch deck (PDF)
            </a>
          )}
          {startup.websiteUrl && (
            <a
              href={startup.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-violet-600 hover:underline"
            >
              Visit website
            </a>
          )}
        </CardContent>
      </Card>

      {canSendRequest && founder?.id && user && (
        <ConnectionRequestCard
          receiverId={founder.id}
          receiverName={founder.name ?? 'Founder'}
          senderRole={user.role}
        />
      )}

      {user && founder?.id && user.id !== founder.id && (
        <EndorsementForm toUserId={founder.id} toUserName={founder.name ?? 'Founder'} />
      )}
    </div>
  );
}
