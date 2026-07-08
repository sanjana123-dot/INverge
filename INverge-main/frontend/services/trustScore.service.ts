import { api } from '@/lib/api';
import type { ApiResponse, TrustScoreBreakdown } from '@/types';

export const trustScoreService = {
  getMine: () =>
    api.get<
      ApiResponse<{
        trustScore: number;
        breakdown: TrustScoreBreakdown;
      }>
    >('/trust-score'),
  refresh: () =>
    api.post<
      ApiResponse<{
        trustScore: number;
        breakdown: TrustScoreBreakdown;
      }>
    >('/trust-score/refresh'),
  getHistory: () => api.get<ApiResponse<unknown[]>>('/trust-score/history'),
  getActivity: () => api.get<ApiResponse<unknown[]>>('/trust-score/activity'),
};
