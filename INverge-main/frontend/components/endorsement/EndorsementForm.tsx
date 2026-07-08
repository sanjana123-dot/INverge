'use client';

import { useEffect, useState } from 'react';
import { endorsementService } from '@/services/endorsement.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ENDORSEMENT_CATEGORIES } from '@/lib/endorsementCategories';
import { getApiError } from '@/lib/api';
import { invalidateDashboardCache } from '@/lib/dashboard-cache';
import { cn } from '@/lib/utils';
import type { EndorsementEligibility } from '@/types';

interface EndorsementFormProps {
  toUserId: string;
  toUserName: string;
}

export function EndorsementForm({ toUserId, toUserName }: EndorsementFormProps) {
  const [eligibility, setEligibility] = useState<EndorsementEligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const existing = eligibility?.existingEndorsement;
  const isEditing = Boolean(existing);

  useEffect(() => {
    let cancelled = false;

    endorsementService
      .getEligibility(toUserId)
      .then(({ data }) => {
        if (cancelled) return;
        const payload = data.data;
        setEligibility(payload ?? null);
        if (payload?.existingEndorsement) {
          setCategories(payload.existingEndorsement.categories ?? []);
          setMessage(payload.existingEndorsement.message ?? '');
        }
      })
      .catch(() => {
        if (!cancelled) setEligibility(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [toUserId]);

  const toggleCategory = (category: string) => {
    setCategories((current) =>
      current.includes(category)
        ? current.filter((c) => c !== category)
        : [...current, category]
    );
    if (error) setError('');
  };

  const trimmedLength = message.trim().length;
  const canSubmit =
    categories.length > 0 &&
    trimmedLength >= 10 &&
    !submitting &&
    !success &&
    eligibility?.canEndorse &&
    eligibility.connectionRequestId;

  const handleSubmit = async () => {
    if (!eligibility?.connectionRequestId) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (isEditing && existing) {
        await endorsementService.update(existing.id, {
          categories,
          message: message.trim(),
        });
        setSuccess(`Endorsement updated for ${toUserName}.`);
      } else {
        await endorsementService.create({
          toUserId,
          connectionRequestId: eligibility.connectionRequestId,
          categories,
          message: message.trim(),
        });
        setSuccess(`Endorsement sent to ${toUserName}!`);
      }
      invalidateDashboardCache();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  if (!eligibility?.canEndorse) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Endorse {toUserName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500">
            Endorsements unlock after you have an accepted connection with {toUserName}. Send a
            connection request above — once they accept, you can endorse traits like reliability,
            vision, or domain expertise.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? `Update endorsement for ${toUserName}` : `Endorse ${toUserName}`}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-zinc-500">
          Endorsements are credibility signals earned through an accepted connection. Select at
          least one trait that reflects your real interaction.
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-emerald-600">{success}</p>}

        <div>
          <p className="mb-2 text-sm font-medium">Endorsement categories</p>
          <div className="flex flex-wrap gap-2">
            {ENDORSEMENT_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                disabled={Boolean(success)}
                onClick={() => toggleCategory(category)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition-colors',
                  categories.includes(category)
                    ? 'border-violet-600 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                    : 'border-zinc-200 text-zinc-600 hover:border-violet-300 dark:border-zinc-700 dark:text-zinc-400'
                )}
              >
                {category}
              </button>
            ))}
          </div>
          {categories.length === 0 && (
            <p className="mt-2 text-xs text-zinc-500">Select at least one category.</p>
          )}
        </div>

        <div className="space-y-1">
          <Textarea
            placeholder="Describe your experience working with this person (min 10 characters)..."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (error) setError('');
            }}
            rows={4}
            disabled={Boolean(success)}
          />
          <p className="text-xs text-zinc-500">
            {trimmedLength}/10 characters minimum
            {trimmedLength > 0 && trimmedLength < 10
              ? ` — add ${10 - trimmedLength} more`
              : ''}
          </p>
        </div>

        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {submitting
            ? 'Saving…'
            : success
              ? isEditing
                ? 'Updated'
                : 'Sent'
              : isEditing
                ? 'Update endorsement'
                : 'Send endorsement'}
        </Button>
      </CardContent>
    </Card>
  );
}

interface EndorsementProfileSectionProps {
  trustScore: number;
  summary: {
    totalCount: number;
    topTraits: { name: string; count: number }[];
    endorsements: {
      id: string;
      message: string;
      categories: string[];
      createdAt: string;
      endorser: { id: string; name: string; role: string; profilePicture?: string | null };
    }[];
  } | null;
}

export function EndorsementProfileSection({ trustScore, summary }: EndorsementProfileSectionProps) {
  if (!summary) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Endorsements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Trust Score</p>
            <p className="text-2xl font-bold text-violet-600">{trustScore.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Endorsements
            </p>
            <p className="text-2xl font-bold">{summary.totalCount}</p>
          </div>
        </div>

        {summary.topTraits.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">Top endorsed traits</p>
            <ul className="space-y-1.5">
              {summary.topTraits.map((trait) => (
                <li
                  key={trait.name}
                  className="flex items-center justify-between text-sm text-zinc-700 dark:text-zinc-300"
                >
                  <span>{trait.name}</span>
                  <span className="font-semibold text-violet-600">{trait.count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {summary.endorsements.length > 0 && (
          <div className="space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            {summary.endorsements.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-zinc-100 p-3 dark:border-zinc-800"
              >
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{item.endorser.name}</p>
                  <Badge variant="secondary" className="capitalize">
                    {item.endorser.role.toLowerCase()}
                  </Badge>
                </div>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {item.categories.map((category) => (
                    <Badge key={category} variant="secondary">
                      {category}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.message}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
