import { api } from './api';

export interface OrderData {
  _id: string;
  pickupAddress: string;
  dropAddress: string;
  packageDetails: string;
  priority: 'normal' | 'urgent';
  status: 'pending' | 'assigned' | 'picked_up' | 'delivered' | 'failed';
  clientId: string;
  riderId?: { _id: string; name: string; status: string } | string;
  proofPhoto?: string;
  failureReason?: string;
  handoverNote?: string;
  timeTaken?: number;
  assignedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateOrderPayload {
  pickupAddress: string;
  dropAddress: string;
  packageDetails: string;
  priority: 'normal' | 'urgent';
}

interface UpdateStatusPayload {
  status: string;
  proofPhoto?: string;
  failureReason?: string;
}

export interface ClientStatsData {
  total: number;
  waitingPickup: number;
  waitingDelivery: number;
  failed: number;
}

export interface RiderStatsData {
  total: number;
  delivered: number;
  failed: number;
  performance: number;
}

export const ordersService = {
  create: (data: CreateOrderPayload) => api.post<OrderData>('/orders', data),
  getAll: (params?: Record<string, string>) => api.get<OrderData[]>('/orders', { params }),
  getMy: (clientId: string) => api.get<OrderData[]>('/orders/my', { params: { clientId } }),
  getAssigned: () => api.get<OrderData[]>('/orders/assigned'),
  getMyStats: (clientId: string) => api.get<ClientStatsData>('/orders/my/stats', { params: { clientId } }),
  getAssignedStats: () => api.get<RiderStatsData>('/orders/assigned/stats'),
  updateStatus: (id: string, data: UpdateStatusPayload) => api.patch<OrderData>(`/orders/${id}/status`, data),
};
