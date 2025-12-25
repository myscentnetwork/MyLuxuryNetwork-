/**
 * API Types for MyLuxuryNetwork
 * Request/Response type definitions for API communication
 */

// ============== GENERIC API TYPES ==============
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  error: string;
  status: number;
  details?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ============== CRUD OPERATION TYPES ==============
export type CreateData<T> = Omit<T, "id" | "createdAt" | "updatedAt">;
export type UpdateData<T> = Partial<Omit<T, "id" | "createdAt" | "updatedAt">>;

// ============== UPLOAD TYPES ==============
export interface UploadResult {
  url: string;
  publicId?: string;
}

export interface UploadRequest {
  file: string; // Base64 encoded
  folder?: string;
  resourceType?: "image" | "video";
}

// ============== SKU GENERATION ==============
export interface GenerateSkuRequest {
  categoryId: string;
  brandId: string;
}

export interface GenerateSkuResponse {
  sku: string;
}

// ============== FETCH OPTIONS ==============
export interface FetchOptions extends RequestInit {
  timeout?: number;
}

// ============== HOOK STATE TYPES ==============
export interface UseEntityState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
}

export interface UseEntityActions<T> {
  fetch: () => Promise<void>;
  create: (data: Partial<T>) => Promise<T>;
  update: (id: string, data: Partial<T>) => Promise<T>;
  remove: (id: string) => Promise<void>;
  toggleStatus?: (id: string) => Promise<T | undefined>;
}

export type UseEntityReturn<T> = UseEntityState<T> & UseEntityActions<T> & {
  [key: string]: T[] | boolean | string | null | ((...args: unknown[]) => Promise<unknown>);
};
