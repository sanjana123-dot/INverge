'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { StartupCard } from '@/components/startup/StartupCard';
import { InvestorCard } from '@/components/investor/InvestorCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { startupService } from '@/services/startup.service';
import { userService } from '@/services/user.service';
import { useAuthStore } from '@/store/authStore';
import { DOMAINS, FUNDING_STAGES, INVESTOR_DISCOVERY_DOMAINS, cn } from '@/lib/utils';
import { getApiError } from '@/lib/api';
import type { Startup, User } from '@/types';
import { Search, X } from 'lucide-react';

function StartupDiscover() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState('');
  const [fundingStage, setFundingStage] = useState('');
  const [minTrustScore, setMinTrustScore] = useState(0);
  const [sortBy, setSortBy] = useState('trustScore');
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const { data } = await startupService.discover({
        search: search || undefined,
        domain: domain || undefined,
        fundingStage: fundingStage || undefined,
        minTrustScore: minTrustScore || undefined,
        sortBy,
        page: 1,
        limit: 12,
      });
      if (requestId !== requestIdRef.current) return;
      setStartups(data.data?.startups ?? []);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [search, domain, fundingStage, minTrustScore, sortBy]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search, domain, fundingStage, minTrustScore, sortBy, load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Discover startups</h1>
        <p className="text-zinc-500">Browse trust-scored founders and ventures</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search startups, founders..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
        </div>
        <select
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
        >
          <option value="">All domains</option>
          {DOMAINS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          value={fundingStage}
          onChange={(e) => setFundingStage(e.target.value)}
        >
          <option value="">All stages</option>
          {FUNDING_STAGES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="trustScore">Trust score</option>
          <option value="newest">Newest</option>
          <option value="recentActivity">Recent activity</option>
          <option value="endorsements">Endorsements</option>
        </select>
        <Button onClick={load}>Search</Button>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-zinc-500">Min trust score: {minTrustScore}</label>
        <input
          type="range"
          min={0}
          max={100}
          value={minTrustScore}
          onChange={(e) => setMinTrustScore(Number(e.target.value))}
          className="w-full accent-violet-600"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : startups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <p className="text-zinc-500">No startups match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {startups.map((s) => (
            <StartupCard key={s.id} startup={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function InvestorDiscover() {
  const [investors, setInvestors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [interest, setInterest] = useState('');
  const [sortBy, setSortBy] = useState('trustScore');
  const [refreshToken, setRefreshToken] = useState(0);
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const trimmedName = name.trim();
    const trimmedInterest = interest.trim();
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setError('');

    try {
      const { data } = await userService.discoverInvestors({
        name: trimmedName || undefined,
        domain: domain || undefined,
        interest: trimmedInterest || undefined,
        sortBy,
        page: 1,
        limit: 12,
      });

      if (requestId !== requestIdRef.current) return;
      setInvestors(data.data?.investors ?? []);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setInvestors([]);
      setError(getApiError(err));
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [name, domain, interest, sortBy]);

  useEffect(() => {
    void load();
    // Auto-refresh when browse filters change; name/interest search uses the Search button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, sortBy, refreshToken]);

  const clearFilters = () => {
    setName('');
    setDomain('');
    setInterest('');
    setRefreshToken((token) => token + 1);
  };

  const hasActiveFilters = Boolean(name.trim() || domain || interest.trim());

  const toggleDomainFilter = (value: string) => {
    setDomain((current) => (current === value ? '' : value));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Discover investors</h1>
        <p className="text-zinc-500">Browse trust-scored investors by domain and interest</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative lg:col-span-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Investor name"
            className="pl-9"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void load()}
          />
        </div>
        <select
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
        >
          <option value="">All domains</option>
          {DOMAINS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
        <Input
          placeholder="Interest"
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void load()}
        />
        <select
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="trustScore">Highest trust</option>
          <option value="recentActivity">Most active</option>
          <option value="newest">Recently joined</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-zinc-500">Filters:</span>
        {INVESTOR_DISCOVERY_DOMAINS.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => toggleDomainFilter(d.value)}
            className={cn(
              'rounded-full border px-3 py-1 text-sm transition-colors',
              domain === d.value
                ? 'border-violet-600 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                : 'border-zinc-200 text-zinc-600 hover:border-violet-300 dark:border-zinc-700 dark:text-zinc-400'
            )}
          >
            {d.label}
          </button>
        ))}
        <Button size="sm" onClick={() => void load()}>
          Search
        </Button>
        {hasActiveFilters && (
          <Button size="sm" variant="ghost" onClick={clearFilters}>
            <X className="mr-1 h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <p className="text-xs text-zinc-500">
          {name.trim() || interest.trim()
            ? 'Name and interest search runs across all investors. Domain filters apply when browsing without a search term.'
            : 'Showing investors matching the selected domain.'}
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : investors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <p className="text-zinc-500">No investors match your filters.</p>
          {hasActiveFilters && (
            <Button variant="ghost" className="mt-2" onClick={clearFilters}>
              Clear filters and show all investors
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {investors.map((investor) => (
            <InvestorCard key={investor.id} investor={investor} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DiscoverPage() {
  const user = useAuthStore((s) => s.user);

  if (user?.role === 'FOUNDER') {
    return <InvestorDiscover />;
  }

  return <StartupDiscover />;
}
