import { api } from './api';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'client' | 'rider';
}

interface AuthResponse {
  token: string;
  user: { id: string; name: string; role: string; email: string };
}

export const authService = {
  login: (data: LoginPayload) => api.post<AuthResponse>('/auth/login', data),
  register: (data: RegisterPayload) => api.post<AuthResponse>('/auth/register', data),
};
