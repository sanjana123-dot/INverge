import type { User, TrustScoreBreakdown } from '@/types';

export function buildTrustBreakdownFromUser(user: User): TrustScoreBreakdown {
  const profileCompleteness = user.profileCompleteness ?? 0;
  const responseRate = user.responseRate ?? 0;
  const endorsements = user.endorsementScore ?? 0;
  const activityConsistency = user.activityScore ?? 0;

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

export function trustDataFromUser(user: User | null) {
  if (!user) return null;
  return {
    score: user.trustScore ?? 0,
    breakdown: buildTrustBreakdownFromUser(user),
  };
}
