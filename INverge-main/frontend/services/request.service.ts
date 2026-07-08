import { api } from '@/lib/api';
import type { ApiResponse, ConnectionRequest } from '@/types';

export const requestService = {
  create: (data: { receiverId: string; message: string; intent: string }) =>
    api.post<ApiResponse<ConnectionRequest>>('/requests', data),
  getSent: () => api.get<ApiResponse<ConnectionRequest[]>>('/requests/sent'),
  getReceived: () => api.get<ApiResponse<ConnectionRequest[]>>('/requests/received'),
  respond: (id: string, status: 'ACCEPTED' | 'REJECTED') =>
    api.patch<ApiResponse<ConnectionRequest>>(`/requests/${id}/respond`, { status }),
};
