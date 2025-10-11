import { apiClient } from './client';
import { Race, PaginatedResponse } from '../types';

export interface GetRacesParams {
  page?: number;
  limit?: number;
  date?: string;
  track?: string;
  status?: string;
}

export const racesApi = {
  getRaces: async (params?: GetRacesParams): Promise<PaginatedResponse<Race>> => {
    return apiClient.get<PaginatedResponse<Race>>('/api/admin/races', { params });
  },

  getRace: async (id: number): Promise<Race> => {
    return apiClient.get<Race>(`/api/admin/races/${id}`);
  },

  createRace: async (data: Partial<Race>): Promise<Race> => {
    return apiClient.post<Race>('/api/admin/races', data);
  },

  updateRace: async (id: number, data: Partial<Race>): Promise<Race> => {
    return apiClient.patch<Race>(`/api/admin/races/${id}`, data);
  },

  deleteRace: async (id: number): Promise<void> => {
    return apiClient.delete<void>(`/api/admin/races/${id}`);
  },
};
