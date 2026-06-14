import apiClient from './client';
import type { Alert, AdjustmentLog, MonitorData } from '@/types';

export interface AlertListParams {
  page?: number;
  pageSize?: number;
  level?: string;
  status?: string;
  type?: string;
  search?: string;
}

export interface AlertListResponse {
  list: Alert[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReviewAlertParams {
  action: 'adjust' | 'ignore';
  comment: string;
  adjustment?: {
    parameter: string;
    oldValue: number;
    newValue: number;
    reason: string;
  };
}

export const alertApi = {
  getList(params?: AlertListParams) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.pageSize) searchParams.append('pageSize', String(params.pageSize));
    if (params?.level) searchParams.append('level', params.level);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.type) searchParams.append('type', params.type);
    if (params?.search) searchParams.append('search', params.search);

    const query = searchParams.toString();
    return apiClient.get<AlertListResponse>(`/alerts${query ? `?${query}` : ''}`);
  },

  getById(id: string) {
    return apiClient.get<Alert & { adjustmentLogs?: AdjustmentLog[] }>(`/alerts/${id}`);
  },

  review(id: string, data: ReviewAlertParams) {
    return apiClient.put<{ alert: Alert; task?: unknown; adjustmentLog?: AdjustmentLog }>(
      `/alerts/${id}/review`,
      data
    );
  },

  resolve(id: string, comment?: string) {
    return apiClient.put<Alert>(`/alerts/${id}/resolve`, { comment });
  },

  getTaskAlerts(taskId: string) {
    return apiClient.get<Alert[]>(`/alerts/task/${taskId}`);
  },
};

export const monitorApi = {
  getRealtime(taskId: string) {
    return apiClient.get<MonitorData>(`/monitor/realtime?taskId=${taskId}`);
  },

  getHistory(taskId: string, limit?: number) {
    const query = limit ? `?taskId=${taskId}&limit=${limit}` : `?taskId=${taskId}`;
    return apiClient.get<MonitorData[]>(`/monitor/history${query}`);
  },
};

export default alertApi;
