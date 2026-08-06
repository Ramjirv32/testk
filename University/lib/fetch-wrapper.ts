/**
 * Fetch wrapper to handle API calls with better error handling and CORS support
 */

export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

export interface FetchResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  raw?: Response;
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRIES = 0;

/**
 * Make an API call with timeout, retry, and better error handling
 */
export async function apiFetch<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResponse<T>> {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    ...fetchOptions
  } = options;

  let lastError: any;
  let attempt = 0;

  while (attempt <= retries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle response
      if (response.ok) {
        try {
          const data = await response.json();
          return { ok: true, status: response.status, data, raw: response };
        } catch {
          // Response is ok but not JSON
          return { ok: true, status: response.status, raw: response };
        }
      } else {
        try {
          const error = await response.json();
          return {
            ok: false,
            status: response.status,
            error: error.message || `HTTP ${response.status}`,
            raw: response,
          };
        } catch {
          return {
            ok: false,
            status: response.status,
            error: `HTTP ${response.status}: ${response.statusText}`,
            raw: response,
          };
        }
      }
    } catch (err: any) {
      lastError = err;
      attempt++;

      // Don't retry on abort or other client errors
      if (err.name === 'AbortError') {
        return {
          ok: false,
          status: 0,
          error: `Request timeout after ${timeout}ms`,
        };
      }

      // Retry on network errors
      if (attempt <= retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
    }
  }

  return {
    ok: false,
    status: 0,
    error: lastError?.message || 'Failed to fetch',
  };
}

/**
 * Helper for GET requests
 */
export function get<T = any>(url: string, options?: FetchOptions) {
  return apiFetch<T>(url, {
    method: 'GET',
    ...options,
  });
}

/**
 * Helper for POST requests
 */
export function post<T = any>(url: string, body?: any, options?: FetchOptions) {
  return apiFetch<T>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });
}

/**
 * Helper for PATCH requests
 */
export function patch<T = any>(url: string, body?: any, options?: FetchOptions) {
  return apiFetch<T>(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });
}

/**
 * Helper for DELETE requests
 */
export function deleteFetch<T = any>(url: string, options?: FetchOptions) {
  return apiFetch<T>(url, {
    method: 'DELETE',
    ...options,
  });
}
