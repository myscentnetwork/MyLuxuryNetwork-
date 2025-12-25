/**
 * @fileoverview API Type Definitions
 * @module types/api
 *
 * Type definitions for API requests, responses, and error handling.
 */

// ============== API RESPONSE TYPES ==============

/**
 * Standard API success response
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * Standard API error response
 */
export interface ApiError {
  error: string;
  details?: string;
  status?: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============== CRUD OPERATION TYPES ==============

/**
 * Generic CRUD hook state
 */
export interface CrudState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
}

/**
 * Generic CRUD hook actions
 */
export interface CrudActions<T> {
  fetchItems: () => Promise<void>;
  createItem: (data: Partial<T>) => Promise<T | null>;
  updateItem: (id: string, data: Partial<T>) => Promise<T | null>;
  deleteItem: (id: string) => Promise<boolean>;
  toggleStatus: (id: string) => Promise<boolean>;
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

/**
 * Combined CRUD hook return type
 */
export type CrudHook<T> = CrudState<T> & CrudActions<T>;

// ============== REQUEST TYPES ==============

/**
 * Common query parameters for list endpoints
 */
export interface ListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * File upload request
 */
export interface FileUploadRequest {
  file: File;
  folder?: string;
}

/**
 * Bulk update request
 */
export interface BulkUpdateRequest<T> {
  ids: string[];
  data: Partial<T>;
}

// ============== HOOK FACTORY TYPES ==============

/**
 * Options for CRUD hook factory
 */
export interface CrudFactoryOptions<T> {
  /** API endpoint for the entity */
  endpoint: string;
  /** Entity name for error messages */
  entityName: string;
  /** Transform function for fetched data */
  transform?: (item: T) => T;
  /** Field name used for status toggle */
  statusField?: keyof T;
  /** Whether to fetch on mount */
  fetchOnMount?: boolean;
}

/**
 * Extended CRUD operations for specific entities
 */
export interface ExtendedCrudActions<T> extends CrudActions<T> {
  /** Duplicate an item */
  duplicateItem?: (id: string, fieldsToModify?: (keyof T)[]) => Promise<T | null>;
  /** Approve an item (for resellers, retailers, etc.) */
  approveItem?: (id: string) => Promise<boolean>;
  /** Reject an item */
  rejectItem?: (id: string) => Promise<boolean>;
}
