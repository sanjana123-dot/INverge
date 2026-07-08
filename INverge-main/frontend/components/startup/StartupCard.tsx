import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { Startup } from '@/types';
import { DOMAINS, FUNDING_STAGES } from '@/lib/utils';

interface StartupCardProps {
  startup: Startup;
}

export function StartupCard({ startup }: StartupCardProps) {
  const domainLabel = DOMAINS.find((d) => d.value === startup.domain)?.label ?? startup.domain;
  const stageLabel =
    FUNDING_STAGES.find((s) => s.value === startup.fundingStage)?.label ?? startup.fundingStage;
  const founderId = startup.founder?.id ?? startup.founderId;

  return (
    <Card className="flex h-full flex-col transition-all hover:border-violet-300 hover:shadow-md dark:hover:border-violet-700">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-1">{startup.startupName}</CardTitle>
          <Badge>{domainLabel}</Badge>
        </div>
        <p className="text-sm text-zinc-500">
          by {startup.founder?.name ?? 'Founder'} · {stageLabel}
        </p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <p className="mb-4 line-clamp-2 flex-1 text-sm text-zinc-600 dark:text-zinc-400">
          {startup.description}
        </p>
        <div className="mb-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span>Trust Score</span>
            <span className="font-semibold text-violet-600">
              {(startup.founder?.trustScore ?? 0).toFixed(1)}
            </span>
          </div>
          <Progress value={startup.founder?.trustScore ?? 0} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {founderId && (
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href={`/users/${founderId}`}>View profile</Link>
            </Button>
          )}
          <Button asChild size="sm" className="w-full">
            <Link href={`/startups/${startup.id}`}>View startup</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
