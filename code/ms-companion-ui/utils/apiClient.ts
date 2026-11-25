import { API_BASE_URL } from '@/constants/api';
import { getToken } from '@/utils/authStorage';

const REQUEST_TIMEOUT_MS = 15_000;

export type ProblemDetails = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string[]>;
};

export class ApiError extends Error {
  readonly status: number;
  readonly problem?: ProblemDetails;

  constructor(status: number, message: string, problem?: ProblemDetails) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }

  get fieldErrors(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, messages] of Object.entries(this.problem?.errors ?? {})) {
      const field = key.replace(/^\$\./, ''); // JSON binding errors are keyed "$.email"
      const name = field.charAt(0).toLowerCase() + field.slice(1);
      if (messages[0]) {
        result[name] = messages[0];
      }
    }
    return result;
  }
}

let unauthorizedHandler: (() => void) | undefined;

export function setUnauthorizedHandler(handler: (() => void) | undefined): void {
  unauthorizedHandler = handler;
}

type RequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  body?: unknown;
  headers?: Record<string, string>;
  /** Attach the stored JWT as a Bearer token. Defaults to true. */
  auth?: boolean;
};

export async function apiRequest<T>(
  path: string,
  { body, headers, auth = true, signal, ...init }: RequestOptions = {},
): Promise<T> {
  const token = auth ? await getToken() : null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const abortFromCaller = () => controller.abort();
  signal?.addEventListener('abort', abortFromCaller);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (signal?.aborted) {
      throw error; // cancelled by the caller — not a connectivity problem
    }
    throw new ApiError(0, `Could not reach the server at ${API_BASE_URL}.`);
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abortFromCaller);
  }

  if (!response.ok) {
    const problem = await readProblem(response);
    if (response.status === 401 && token) {
      unauthorizedHandler?.();
    }
    throw new ApiError(
      response.status,
      problem?.detail ?? problem?.title ?? `Request failed with status ${response.status}`,
      problem,
    );
  }

  // 204 No Content (typical for PUT/DELETE in ASP.NET Core) has no body to parse.
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

async function readProblem(response: Response): Promise<ProblemDetails | undefined> {
  try {
    const text = await response.text();
    return text ? (JSON.parse(text) as ProblemDetails) : undefined;
  } catch {
    return undefined;
  }
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
