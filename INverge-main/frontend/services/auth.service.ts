import { api } from '@/lib/api';
import type { ApiResponse, User } from '@/types';

export const authService = {
  signup: (data: {
    name: string;
    email: string;
    password: string;
    role: 'FOUNDER' | 'INVESTOR';
  }) =>
    api.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>(
      '/auth/signup',
      data
    ),

  login: (email: string, password: string) =>
    api.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>(
      '/auth/login',
      { email, password }
    ),

  logout: (refreshToken?: string) =>
    api.post('/auth/logout', { refreshToken }),

  forgotPassword: (email: string) =>
    api.post<ApiResponse<{ resetToken: string; resetUrl: string }>>('/auth/forgot-password', {
      email,
    }),

  resetPassword: (token: string, password: string) =>
    api.post<ApiResponse<null>>('/auth/reset-password', { token, password }),
};
