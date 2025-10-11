import { apiClient } from './client';
import { User, PaginatedResponse } from '../types';

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

export const usersApi = {
  getUsers: async (params?: GetUsersParams): Promise<PaginatedResponse<User>> => {
    return apiClient.get<PaginatedResponse<User>>('/api/admin/users', { params });
  },

  getUser: async (id: number): Promise<User> => {
    return apiClient.get<User>(`/api/admin/users/${id}`);
  },

  updateUser: async (id: number, data: Partial<User>): Promise<User> => {
    return apiClient.patch<User>(`/api/admin/users/${id}`, data);
  },

  deleteUser: async (id: number): Promise<void> => {
    return apiClient.delete<void>(`/api/admin/users/${id}`);
  },

  blockUser: async (id: number): Promise<User> => {
    return apiClient.patch<User>(`/api/admin/users/${id}/block`);
  },

  unblockUser: async (id: number): Promise<User> => {
    return apiClient.patch<User>(`/api/admin/users/${id}/unblock`);
  },
};
