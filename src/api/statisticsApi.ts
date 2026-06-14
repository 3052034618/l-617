import apiClient from './client';
import type { StatisticsOverview, TrendData, RegionStatus, Recommendation } from '@/types';

export const statisticsApi = {
  getOverview() {
    return apiClient.get<StatisticsOverview>('/statistics/overview');
  },

  getCompletionRate(days?: number) {
    const query = days ? `?days=${days}` : '';
    return apiClient.get<TrendData[]>(`/statistics/completion-rate${query}`);
  },

  getAccuracy(days?: number) {
    const query = days ? `?days=${days}` : '';
    return apiClient.get<TrendData[]>(`/statistics/accuracy${query}`);
  },

  getResources(days?: number) {
    const query = days ? `?days=${days}` : '';
    return apiClient.get<TrendData[]>(`/statistics/resources${query}`);
  },

  getRegions() {
    return apiClient.get<RegionStatus[]>('/statistics/regions');
  },

  getRegionDetail(region: string) {
    return apiClient.get<{
      region: RegionStatus;
      recentDeviations: Array<{ date: string; deviation: number; taskId: string }>;
      pauseReason?: string;
      pausedAt?: string;
    }>(`/statistics/regions/${encodeURIComponent(region)}`);
  },
};

export const recommendApi = {
  getBands(region?: string) {
    const query = region ? `?region=${encodeURIComponent(region)}` : '';
    return apiClient.get<Recommendation[]>(`/recommend/bands${query}`);
  },

  getParameters(surfaceType?: string) {
    const query = surfaceType ? `?surfaceType=${encodeURIComponent(surfaceType)}` : '';
    return apiClient.get<Recommendation[]>(`/recommend/parameters${query}`);
  },

  getHistory() {
    return apiClient.get<Recommendation[]>('/recommend/history');
  },

  applyRecommendation(id: string) {
    return apiClient.post<{ success: boolean; message: string }>(`/recommend/${id}/apply`, {});
  },
};

export default statisticsApi;
