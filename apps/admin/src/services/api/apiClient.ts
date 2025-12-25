/**
 * @fileoverview API Client Service
 * @module services/api/apiClient
 *
 * Centralized API client with consistent error handling and typing.
 */

// ============== TYPES ==============

export interface ApiError {
  message: string;
  status: number;
  data?: unknown;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
}

export interface RequestConfig {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
}

// ============== ERROR HANDLING ==============

/**
 * Creates a standardized API error
 */
function createApiError(message: string, status: number, data?: unknown): ApiError {
  return { message, status, data };
}

// ============== API CLIENT ==============

/**
 * Makes an API request with standardized error handling
 *
 * @param endpoint - API endpoint path
 * @param config - Request configuration
 * @returns Promise with response data
 * @throws ApiError on failure
 *
 * @example
 * const products = await apiClient.get<Product[]>('/api/products');
 * await apiClient.post('/api/products', { name: 'New Product' });
 */
async function request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
  const { method = "GET", headers = {}, body } = config;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  const requestConfig: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && method !== "GET") {
    requestConfig.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(endpoint, requestConfig);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = null;
      }

      throw createApiError(
        errorData?.error || errorData?.message || `Request failed with status ${response.status}`,
        response.status,
        errorData
      );
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  } catch (error) {
    if ((error as ApiError).status) {
      throw error;
    }
    throw createApiError(
      error instanceof Error ? error.message : "Network error",
      0
    );
  }
}

/**
 * API Client with convenience methods for common HTTP verbs
 */
export const apiClient = {
  /**
   * GET request
   */
  get: <T>(endpoint: string, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: "GET", headers }),

  /**
   * POST request
   */
  post: <T>(endpoint: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: "POST", body, headers }),

  /**
   * PUT request
   */
  put: <T>(endpoint: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: "PUT", body, headers }),

  /**
   * PATCH request
   */
  patch: <T>(endpoint: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: "PATCH", body, headers }),

  /**
   * DELETE request
   */
  delete: <T>(endpoint: string, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: "DELETE", headers }),
};

/**
 * Type guard to check if an error is an API error
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    "status" in error
  );
}
