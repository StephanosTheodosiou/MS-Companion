import { API_BASE_URL } from '@/constants/api';
import { getToken } from '@/utils/authStorage';

/** Thrown for any non-2xx response so screens can branch on `error.status` (e.g. 401 → login). */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type RequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  body?: unknown;
  headers?: Record<string, string>;
  /** Attach the stored JWT as a Bearer token. Defaults to true. */
  auth?: boolean;
};

/**
 * Single place for talking to the API: base URL, JSON encoding, auth header and error handling.
 * Feature modules build on this, e.g. `utils/medicationsApi.ts`:
 *
 *   export const getMedications = () => api.get<MedicationDto[]>('/api/medications');
 */
export async function apiRequest<T>(
  path: string,
  { body, headers, auth = true, ...init }: RequestOptions = {},
): Promise<T> {
  const token = auth ? await getToken() : null;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new ApiError(response.status, text || `Request failed with status ${response.status}`);
  }

  // 204 No Content (typical for PUT/DELETE in ASP.NET Core) has no body to parse.
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
  delete: <T = void>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};
