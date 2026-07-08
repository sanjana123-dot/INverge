import { api } from '@/lib/api';
import type { ApiResponse, Startup } from '@/types';

export const startupService = {
  discover: (params: Record<string, string | number | undefined>) =>
    api.get<
      ApiResponse<{
        startups: Startup[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>
    >('/startups/discover', { params }),

  getById: (id: string) => api.get<ApiResponse<Startup>>(`/startups/${id}`),
  recordView: (id: string) =>
    api.post<ApiResponse<{ notified: boolean }>>(`/startups/${id}/view`),
  getMine: () => api.get<ApiResponse<Startup>>('/startups/founder/mine'),
  create: (data: Partial<Startup>) => api.post<ApiResponse<Startup>>('/startups', data),
  update: (data: Partial<Startup>) => api.patch<ApiResponse<Startup>>('/startups', data),
  save: (data: Partial<Startup>) => api.put<ApiResponse<Startup>>('/startups/founder/me', data),
  analytics: () => api.get<ApiResponse<Record<string, unknown>>>('/startups/founder/analytics'),
  uploadPitchDeck: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<
      ApiResponse<{ url: string; fileName?: string; savedToProfile?: boolean }>
    >('/upload/pitch-deck', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
