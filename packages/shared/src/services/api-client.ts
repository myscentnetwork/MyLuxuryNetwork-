/**
 * API Client Service
 * Centralized HTTP client with error handling and type safety
 */

import type { ApiError, FetchOptions } from "../types/api";

// ============== ERROR CLASS ==============
export class ApiClientError extends Error {
  public status: number;
  public details?: Record<string, string>;

  constructor(message: string, status: number, details?: Record<string, string>) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

// ============== DEFAULT CONFIG ==============
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

const DEFAULT_TIMEOUT = 30000; // 30 seconds

// ============== HELPER FUNCTIONS ==============
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    let details: Record<string, string> | undefined;

    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
      details = errorData.details;
    } catch {
      // Response is not JSON
    }

    throw new ApiClientError(errorMessage, response.status, details);
  }

  // Handle empty responses (e.g., 204 No Content)
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return {} as T;
  }

  return response.json();
}

function createAbortController(timeout: number): { controller: AbortController; timeoutId: NodeJS.Timeout } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  return { controller, timeoutId };
}

// ============== API CLIENT ==============
export const apiClient = {
  /**
   * GET request
   */
  async get<T>(url: string, options: FetchOptions = {}): Promise<T> {
    const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;
    const { controller, timeoutId } = createAbortController(timeout);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: DEFAULT_HEADERS,
        signal: controller.signal,
        ...fetchOptions,
      });
      return handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiClientError("Request timeout", 408);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  /**
   * POST request
   */
  async post<T, D = unknown>(url: string, data?: D, options: FetchOptions = {}): Promise<T> {
    const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;
    const { controller, timeoutId } = createAbortController(timeout);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: DEFAULT_HEADERS,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
        ...fetchOptions,
      });
      return handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiClientError("Request timeout", 408);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  /**
   * PUT request
   */
  async put<T, D = unknown>(url: string, data?: D, options: FetchOptions = {}): Promise<T> {
    const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;
    const { controller, timeoutId } = createAbortController(timeout);

    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: DEFAULT_HEADERS,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
        ...fetchOptions,
      });
      return handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiClientError("Request timeout", 408);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  /**
   * DELETE request
   */
  async delete<T = void>(url: string, options: FetchOptions = {}): Promise<T> {
    const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;
    const { controller, timeoutId } = createAbortController(timeout);

    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: DEFAULT_HEADERS,
        signal: controller.signal,
        ...fetchOptions,
      });
      return handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiClientError("Request timeout", 408);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },
};

// ============== TYPE EXPORTS ==============
export type { ApiError };
