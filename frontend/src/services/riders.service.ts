import { api } from './api';

export interface RiderData {
  _id: string;
  name: string;
  email: string;
  status: 'available' | 'busy' | 'offline';
  activeOrders: number;
  totalDelivered: number;
  totalFailed: number;
  avgDeliveryTime: number;
}

interface LocationPayload {
  lat: number;
  lng: number;
  riderId: string;
}

export const ridersService = {
  getAll: () => api.get<RiderData[]>('/riders'),
  updateStatus: (id: string, status: string) => api.patch<RiderData>(`/riders/${id}/status`, { status }),
  updateLocation: (data: LocationPayload) => api.patch('/riders/location', data),
};
