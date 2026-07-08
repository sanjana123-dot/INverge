import { api } from '@/lib/api';
import type {
  ApiResponse,
  Endorsement,
  EndorsementEligibility,
  UserEndorsementSummary,
} from '@/types';

export type EndorsementInput = {
  toUserId: string;
  connectionRequestId: string;
  categories: string[];
  message: string;
};

export const endorsementService = {
  getCategories: () =>
    api.get<ApiResponse<{ id: string; name: string }[]>>('/endorsements/categories'),

  create: (data: EndorsementInput) =>
    api.post<ApiResponse<Endorsement>>('/endorsements', data),

  update: (id: string, data: Pick<EndorsementInput, 'categories' | 'message'>) =>
    api.patch<ApiResponse<Endorsement>>(`/endorsements/${id}`, data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/endorsements/${id}`),

  getReceived: () => api.get<ApiResponse<Endorsement[]>>('/endorsements/received'),

  getGiven: () => api.get<ApiResponse<Endorsement[]>>('/endorsements/given'),

  getEligibility: (toUserId: string) =>
    api.get<ApiResponse<EndorsementEligibility>>(`/endorsements/eligibility/${toUserId}`),

  getForUser: (userId: string) =>
    api.get<ApiResponse<UserEndorsementSummary>>(`/users/${userId}/endorsements`),
};
