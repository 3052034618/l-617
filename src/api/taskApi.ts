import apiClient from './client';
import type { SimulationTask, TaskParameters } from '@/types';

export interface TaskListResponse {
  list: SimulationTask[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateTaskParams {
  name: string;
  region: string;
  parameters: Partial<TaskParameters>;
  profileFileId?: string;
  surfaceFileId?: string;
}

export const taskApi = {
  getList(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    region?: string;
    search?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.pageSize) searchParams.append('pageSize', String(params.pageSize));
    if (params?.status) searchParams.append('status', params.status);
    if (params?.region) searchParams.append('region', params.region);
    if (params?.search) searchParams.append('search', params.search);

    const query = searchParams.toString();
    return apiClient.get<TaskListResponse>(`/tasks${query ? `?${query}` : ''}`);
  },

  getById(id: string) {
    return apiClient.get<SimulationTask>(`/tasks/${id}`);
  },

  getStatus(id: string) {
    return apiClient.get<{ status: string; progress: number; results?: unknown }>(`/tasks/${id}/status`);
  },

  create(data: CreateTaskParams) {
    return apiClient.post<SimulationTask>('/tasks', data);
  },

  update(id: string, data: Partial<SimulationTask>) {
    return apiClient.put<SimulationTask>(`/tasks/${id}`, data);
  },

  restart(id: string) {
    return apiClient.put<SimulationTask>(`/tasks/${id}/restart`, {});
  },

  pause(id: string) {
    return apiClient.put<SimulationTask>(`/tasks/${id}/pause`, {});
  },

  resume(id: string) {
    return apiClient.put<SimulationTask>(`/tasks/${id}/resume`, {});
  },

  remove(id: string) {
    return apiClient.delete<{ id: string }>(`/tasks/${id}`);
  },

  checkRegionPaused(region: string) {
    return apiClient.get<{ paused: boolean; reason?: string; deviationRecords?: unknown[] }>(
      `/tasks/check-region?region=${encodeURIComponent(region)}`
    );
  },
};

export default taskApi;
