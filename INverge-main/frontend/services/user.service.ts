import { api } from '@/lib/api';
import type { ApiResponse, Experience, User } from '@/types';

export type ExperienceInput = {
  title: string;
  company: string;
  location?: string | null;
  startDate: string;
  endDate?: string | null;
  description?: string | null;
};

export const userService = {
  getMe: () => api.get<ApiResponse<User>>('/users/me'),
  getById: (id: string) => api.get<ApiResponse<User>>(`/users/${id}`),
  recordProfileView: (id: string) => api.post<ApiResponse<{ notified: boolean }>>(`/users/${id}/view`),
  updateProfile: (data: Partial<User>) =>
    api.patch<ApiResponse<{ user: User; trustScore: unknown }>>('/users/me', data),
  getStats: () => api.get<ApiResponse<Record<string, number>>>('/users/me/stats'),
  deleteAccount: (password: string) =>
    api.delete<ApiResponse<null>>('/users/me', { data: { password } }),
  getExperience: () => api.get<ApiResponse<Experience[]>>('/users/me/experience'),
  createExperience: (data: ExperienceInput) =>
    api.post<ApiResponse<Experience>>('/users/me/experience', data),
  updateExperience: (id: string, data: Partial<ExperienceInput>) =>
    api.patch<ApiResponse<Experience>>(`/users/me/experience/${id}`, data),
  deleteExperience: (id: string) =>
    api.delete<ApiResponse<null>>(`/users/me/experience/${id}`),
  discoverInvestors: (params: Record<string, string | number | undefined>) =>
    api.get<
      ApiResponse<{
        investors: User[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>
    >('/users/investors/discover', { params }),
  uploadProfilePicture: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<ApiResponse<{ url: string; user: Partial<User> }>>('/upload/profile-picture', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
