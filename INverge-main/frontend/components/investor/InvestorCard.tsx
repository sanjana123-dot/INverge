import Link from 'next/link';
import { UserAvatar } from '@/components/user/UserAvatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DOMAINS } from '@/lib/utils';
import type { User } from '@/types';

interface InvestorCardProps {
  investor: User;
}

export function InvestorCard({ investor }: InvestorCardProps) {
  const interests = investor.investmentInterests?.filter(Boolean) ?? [];
  const domains = investor.domains ?? [];

  return (
    <Card className="flex h-full flex-col transition-all hover:border-violet-300 hover:shadow-md dark:hover:border-violet-700">
      <CardHeader>
        <div className="flex items-start gap-3">
          <UserAvatar name={investor.name} profilePicture={investor.profilePicture} />
          <div className="min-w-0 flex-1">
            <CardTitle className="line-clamp-1">{investor.name}</CardTitle>
            <p className="text-sm text-zinc-500">Investor</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <p className="mb-4 line-clamp-2 flex-1 text-sm text-zinc-600 dark:text-zinc-400">
          {investor.bio || investor.portfolioPreference || 'No bio provided yet.'}
        </p>

        {interests.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {interests.slice(0, 3).map((interest) => (
              <Badge key={interest} variant="secondary">
                {interest}
              </Badge>
            ))}
            {interests.length > 3 && (
              <Badge variant="secondary">+{interests.length - 3}</Badge>
            )}
          </div>
        )}

        {domains.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {domains.map((domain) => (
              <Badge key={domain}>
                {DOMAINS.find((d) => d.value === domain)?.label ?? domain}
              </Badge>
            ))}
          </div>
        )}

        <div className="mb-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span>Trust Score</span>
            <span className="font-semibold text-violet-600">
              {(investor.trustScore ?? 0).toFixed(1)}
            </span>
          </div>
          <Progress value={investor.trustScore ?? 0} />
        </div>

        <Button asChild size="sm" className="w-full">
          <Link href={`/users/${investor.id}`}>View profile</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
