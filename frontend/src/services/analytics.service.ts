import { api } from './api';

export interface AnalyticsSummary {
  totalOrders: number;
  delivered: number;
  failed: number;
  pending: number;
  avgDeliveryTime: number;
  successRate: number;
  peakHour?: string;
  riderPerformance: Array<{ riderName: string; delivered: number; failed: number; avgTime: number; rating: number }>;
  zoneWiseSummary: Array<{ zone: string; totalOrders: number; successRate: number }>;
}

export const analyticsService = {
  getSummary: () => api.get<AnalyticsSummary>('/analytics/summary'),
};
