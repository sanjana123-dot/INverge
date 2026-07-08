'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Briefcase, Building2, ExternalLink, User as UserIcon } from 'lucide-react';
import { userService } from '@/services/user.service';
import { endorsementService } from '@/services/endorsement.service';
import { useAuthStore } from '@/store/authStore';
import { UserAvatar } from '@/components/user/UserAvatar';
import { TrustScoreCard } from '@/components/dashboard/TrustScoreCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatExperienceDateRange } from '@/lib/experience';
import { DOMAINS } from '@/lib/utils';
import { ConnectionRequestCard } from '@/components/request/ConnectionRequestCard';
import {
  EndorsementForm,
  EndorsementProfileSection,
} from '@/components/endorsement/EndorsementForm';
import type { User, UserEndorsementSummary } from '@/types';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-zinc-100 py-3 last:border-0 dark:border-zinc-800">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <div className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{value}</div>
    </div>
  );
}

function websiteDisplayLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const currentUser = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<User | null>(null);
  const [endorsementSummary, setEndorsementSummary] = useState<UserEndorsementSummary | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([userService.getById(id), endorsementService.getForUser(id)])
      .then(([profileRes, endorsementRes]) => {
        if (!cancelled) {
          setProfile(profileRes.data.data ?? null);
          setEndorsementSummary(endorsementRes.data.data ?? null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    if (currentUser?.id && currentUser.id !== id) {
      userService.recordProfileView(id).catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [id, currentUser?.id]);

  if (loading) return <Skeleton className="mx-auto h-96 max-w-3xl" />;
  if (!profile) return <p className="text-zinc-500">User not found</p>;

  const isOwnProfile = currentUser?.id === profile.id;
  const canSendRequest =
    !isOwnProfile && currentUser && currentUser.role !== profile.role;
  const skills = profile.skills?.filter(Boolean) ?? [];
  const interests = profile.investmentInterests?.filter(Boolean) ?? [];
  const experiences = profile.experiences ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <UserAvatar name={profile.name} profilePicture={profile.profilePicture} />
          <div>
            <h1 className="text-3xl font-bold">{profile.name}</h1>
            <p className="capitalize text-zinc-500">{profile.role.toLowerCase()}</p>
          </div>
        </div>
        {profile.role === 'FOUNDER' && profile.startup && !isOwnProfile && (
          <Button asChild variant="outline">
            <Link href={`/startups/${profile.startup.id}`}>
              <Building2 className="mr-2 h-4 w-4" />
              View startup profile
            </Link>
          </Button>
        )}
        {isOwnProfile && (
          <Button asChild variant="outline">
            <Link href="/profile">
              <UserIcon className="mr-2 h-4 w-4" />
              Edit my profile
            </Link>
          </Button>
        )}
      </div>

      <TrustScoreCard
        score={profile.trustScore}
        breakdown={profile.trustScoreBreakdown}
        title="Trust Score"
        description={`${profile.name}'s credibility on INverge`}
      />

      <EndorsementProfileSection
        trustScore={profile.trustScore}
        summary={endorsementSummary}
      />

      <Card>
        <CardHeader>
          <CardTitle>Personal details</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailRow
            label="Bio"
            value={profile.bio ? <p className="whitespace-pre-wrap">{profile.bio}</p> : '—'}
          />
          <DetailRow
            label="Skills"
            value={
              skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                '—'
              )
            }
          />
          {profile.role === 'INVESTOR' && (
            <>
              <DetailRow
                label="Investment interests"
                value={
                  interests.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {interests.map((item) => (
                        <Badge key={item}>{item}</Badge>
                      ))}
                    </div>
                  ) : (
                    '—'
                  )
                }
              />
              <DetailRow
                label="Portfolio preference"
                value={
                  profile.portfolioPreference ? (
                    <p className="whitespace-pre-wrap">{profile.portfolioPreference}</p>
                  ) : (
                    '—'
                  )
                }
              />
            </>
          )}
          {profile._count && (
            <DetailRow
              label="Endorsements received"
              value={endorsementSummary?.totalCount ?? profile._count.endorsementsReceived}
            />
          )}
        </CardContent>
      </Card>

      {experiences.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {experiences.map((exp) => (
              <div
                key={exp.id}
                className="flex gap-3 border-b border-zinc-100 pb-4 last:border-0 last:pb-0 dark:border-zinc-800"
              >
                <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                <div>
                  <p className="font-medium">{exp.title}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{exp.company}</p>
                  <p className="text-xs text-zinc-500">
                    {formatExperienceDateRange(exp.startDate, exp.endDate)}
                    {exp.location ? ` · ${exp.location}` : ''}
                  </p>
                  {exp.description && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                      {exp.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {profile.role === 'FOUNDER' && profile.startup && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Startup</CardTitle>
            <Button asChild size="sm" variant="outline">
              <Link href={`/startups/${profile.startup.id}`}>View startup profile</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{profile.startup.startupName}</p>
            <p className="line-clamp-2 text-zinc-500">{profile.startup.description}</p>
            {profile.startup.websiteUrl && (
              <a
                href={profile.startup.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-violet-600 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                {websiteDisplayLabel(profile.startup.websiteUrl)}
              </a>
            )}
            <Badge variant="secondary">
              {DOMAINS.find((d) => d.value === profile.startup?.domain)?.label ??
                profile.startup.domain}
            </Badge>
          </CardContent>
        </Card>
      )}

      {canSendRequest && currentUser && (
        <ConnectionRequestCard
          receiverId={profile.id}
          receiverName={profile.name}
          senderRole={currentUser.role}
          title={
            currentUser.role === 'FOUNDER'
              ? `Connect with ${profile.name}`
              : `Send connection request`
          }
        />
      )}

      {!isOwnProfile && currentUser && (
        <EndorsementForm toUserId={profile.id} toUserName={profile.name} />
      )}
    </div>
  );
}
