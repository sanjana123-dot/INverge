'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { TrustScoreBreakdown } from '@/types';

interface TrustScoreCardProps {
  score: number;
  breakdown?: TrustScoreBreakdown | null;
  title?: string;
  description?: string;
}

export function TrustScoreCard({
  score,
  breakdown,
  title = 'Trust Score',
  description = 'Your credibility on INverge',
}: TrustScoreCardProps) {
  const items = breakdown
    ? [
        { label: 'Profile completeness', ...breakdown.profileCompleteness },
        { label: 'Response rate', ...breakdown.responseRate },
        { label: 'Endorsements', ...breakdown.endorsements },
        { label: 'Activity consistency', ...breakdown.activityConsistency },
      ]
    : [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-violet-600 to-indigo-700 text-white">
        <CardTitle className="text-white">{title}</CardTitle>
        <CardDescription className="text-violet-100">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-6 flex items-end gap-2">
          <span className="text-5xl font-bold text-violet-600 dark:text-violet-400">
            {score.toFixed(1)}
          </span>
          <span className="mb-2 text-lg text-zinc-500">/ 100</span>
        </div>
        <Progress value={score} className="mb-6 h-3" />
        {items.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Breakdown</p>
            {items.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="font-medium">{item.value}%</span>
                </div>
                <Progress value={item.value} className="h-1.5" />
                <p className="text-xs text-zinc-400">
                  Weight {(item.weight * 100).toFixed(0)}% · contributes ~{item.contribution} pts
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
