import { api } from '@/lib/api';
import type { ApiResponse, Message } from '@/types';

export const messageService = {
  send: (receiverId: string, content: string) =>
    api.post<ApiResponse<Message>>('/messages', { receiverId, content }),
  getConversation: (userId: string, page = 1) =>
    api.get<ApiResponse<{ messages: Message[]; total: number }>>('/messages', {
      params: { userId, page },
    }),
  getConversations: () =>
    api.get<
      ApiResponse<
        Array<{
          partner: { id: string; name: string; profilePicture: string | null };
          lastMessage: Message;
          unreadCount: number;
        }>
      >
    >('/messages/conversations'),
};
