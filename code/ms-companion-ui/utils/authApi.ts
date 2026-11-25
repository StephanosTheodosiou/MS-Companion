import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types/auth';
import { api } from '@/utils/apiClient';

/** Endpoints of `AuthController` (MSCompanion.Api/Controllers/AuthController.cs). */
export const authApi = {
  login: (request: LoginRequest) =>
    api.post<AuthResponse>('/api/auth/login', request, { auth: false }),

  register: (request: RegisterRequest) =>
    api.post<AuthResponse>('/api/auth/register', request, { auth: false }),

  me: () => api.get<User>('/api/auth/me'),
};
