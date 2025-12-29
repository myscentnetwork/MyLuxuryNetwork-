"use client";

/**
 * @fileoverview CRUD Hook Factory
 * @module hooks/common/useCrudFactory
 *
 * Enterprise CRUD hook factory with caching for fast navigation.
 * Provides standardized state management and CRUD operations.
 */

import { useState, useEffect, useCallback, useRef } from "react";

// ============== CACHE & REQUEST DEDUPLICATION ==============

// Global cache for API responses to speed up navigation
const apiCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 60000; // 60 seconds cache (increased for faster navigation)

// Pending requests map to prevent duplicate API calls
const pendingRequests = new Map<string, Promise<unknown>>();

function getCachedData<T>(key: string): T[] | null {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T[];
  }
  return null;
}

function setCachedData<T>(key: string, data: T[]): void {
  apiCache.set(key, { data, timestamp: Date.now() });
}

function invalidateCache(key: string): void {
  apiCache.delete(key);
}

// Invalidate all related caches (for cross-entity updates)
export function invalidateAllCaches(): void {
  apiCache.clear();
}

// ============== TYPES ==============

/**
 * Base entity interface - all entities must have an id
 */
export interface BaseEntity {
  id: string;
}

/**
 * Configuration options for the CRUD factory
 */
export interface CrudFactoryOptions<T> {
  /** API endpoint for the entity (e.g., '/api/brands') */
  endpoint: string;
  /** Entity name for error messages (e.g., 'Brand') */
  entityName: string;
  /** Optional transform function applied to fetched items */
  transform?: (item: T) => T;
  /** Field name used for status toggle (default: 'status') */
  statusField?: keyof T;
  /** Whether to fetch data on mount (default: true) */
  fetchOnMount?: boolean;
  /** Active status value (default: 'active') */
  activeValue?: string;
  /** Inactive status value (default: 'inactive') */
  inactiveValue?: string;
}

/**
 * CRUD state interface
 */
export interface CrudState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
}

/**
 * CRUD actions interface
 */
export interface CrudActions<T> {
  fetchItems: (forceRefresh?: boolean) => Promise<void>;
  createItem: (data: Partial<T>) => Promise<T>;
  updateItem: (id: string, data: Partial<T>) => Promise<T>;
  deleteItem: (id: string) => Promise<void>;
  toggleStatus: (id: string) => Promise<T | undefined>;
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

/**
 * Combined CRUD hook return type
 */
export type CrudHookReturn<T> = CrudState<T> & CrudActions<T>;

// ============== MAIN FACTORY ==============

/**
 * CRUD Hook Factory
 *
 * Creates a standardized CRUD hook for any entity type.
 * Provides consistent state management and API operations.
 *
 * @template T - Entity type extending BaseEntity
 * @param options - Configuration options
 * @returns Object containing state and CRUD operations
 */
export function useCrudFactory<T extends BaseEntity>(
  options: CrudFactoryOptions<T>
): CrudHookReturn<T> {
  const {
    endpoint,
    entityName,
    transform,
    statusField = "status" as keyof T,
    fetchOnMount = true,
    activeValue = "active",
    inactiveValue = "inactive",
  } = options;

  // ============== STATE ==============
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref to track if component is mounted (prevent state updates after unmount)
  const isMountedRef = useRef(true);
  // Ref to track if initial fetch has been done
  const hasFetchedRef = useRef(false);
  // Ref to store transform function to avoid dependency issues
  const transformRef = useRef(transform);
  transformRef.current = transform;

  // ============== FETCH ==============

  /**
   * Fetches all items from the API with caching and request deduplication
   */
  const fetchItems = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = getCachedData<T>(endpoint);
        if (cached) {
          if (isMountedRef.current) {
            setItems(cached);
            setLoading(false);
            setError(null);
          }
          return;
        }
      }

      if (isMountedRef.current) {
        setLoading(true);
      }

      // Check if there's already a pending request for this endpoint
      let pendingRequest = pendingRequests.get(endpoint);

      if (!pendingRequest || forceRefresh) {
        // Create new request
        pendingRequest = fetch(endpoint).then(async (res) => {
          if (!res.ok) throw new Error(`Failed to fetch ${entityName.toLowerCase()}s`);
          return res.json();
        });
        pendingRequests.set(endpoint, pendingRequest);
      }

      let data = await pendingRequest as T[];

      // Clean up pending request
      pendingRequests.delete(endpoint);

      // Apply transform if provided (using ref to avoid dependency issues)
      if (transformRef.current && Array.isArray(data)) {
        data = data.map(transformRef.current);
      }

      // Update cache
      setCachedData(endpoint, data);

      if (isMountedRef.current) {
        setItems(data);
        setError(null);
      }
    } catch (err) {
      pendingRequests.delete(endpoint);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [endpoint, entityName]); // Removed transform from dependencies - using ref instead

  // ============== CREATE ==============

  /**
   * Creates a new item
   */
  const createItem = useCallback(
    async (data: Partial<T>): Promise<T> => {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create ${entityName.toLowerCase()}`);
      }

      let newItem = await res.json();

      // Apply transform if provided
      if (transform) {
        newItem = transform(newItem);
      }

      // Invalidate cache on create
      invalidateCache(endpoint);
      setItems((prev) => [newItem, ...prev]);
      return newItem;
    },
    [endpoint, entityName, transform]
  );

  // ============== UPDATE ==============

  /**
   * Updates an existing item
   */
  const updateItem = useCallback(
    async (id: string, data: Partial<T>): Promise<T> => {
      const res = await fetch(`${endpoint}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(`Failed to update ${entityName.toLowerCase()}`);
      }

      let updated = await res.json();

      // Apply transform if provided
      if (transform) {
        updated = transform(updated);
      }

      // Invalidate cache on update
      invalidateCache(endpoint);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      return updated;
    },
    [endpoint, entityName, transform]
  );

  // ============== DELETE ==============

  /**
   * Deletes an item
   */
  const deleteItem = useCallback(
    async (id: string): Promise<void> => {
      const res = await fetch(`${endpoint}/${id}`, { method: "DELETE" });

      if (!res.ok) {
        throw new Error(`Failed to delete ${entityName.toLowerCase()}`);
      }

      // Invalidate cache on delete
      invalidateCache(endpoint);
      setItems((prev) => prev.filter((item) => item.id !== id));
    },
    [endpoint, entityName]
  );

  // ============== TOGGLE STATUS ==============

  /**
   * Toggles the status of an item (active/inactive)
   */
  const toggleStatus = useCallback(
    async (id: string): Promise<T | undefined> => {
      const item = items.find((i) => i.id === id);
      if (!item) return;

      const currentStatus = item[statusField];
      const newStatus = currentStatus === activeValue ? inactiveValue : activeValue;

      return updateItem(id, { [statusField]: newStatus } as Partial<T>);
    },
    [items, statusField, activeValue, inactiveValue, updateItem]
  );

  // ============== EFFECTS ==============

  // Initial fetch effect - only runs once on mount
  useEffect(() => {
    isMountedRef.current = true;

    if (fetchOnMount && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchItems();
    }

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchOnMount]); // Removed fetchItems - it's stable now and we use hasFetchedRef to control

  // ============== RETURN ==============

  return {
    items,
    loading,
    error,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    toggleStatus,
    setItems,
    setError,
  };
}

// ============== HELPER FACTORIES ==============

/**
 * Creates a duplicator function for an entity
 *
 * @param crud - CRUD hook return object
 * @param fieldsToModify - Fields to modify when duplicating (will append " (Copy)")
 * @param fieldsToExclude - Fields to exclude from duplication
 * @returns Duplicate function
 *
 * @example
 * const duplicateBrand = createDuplicator(crud, ['name', 'slug']);
 */
export function createDuplicator<T extends BaseEntity>(
  crud: CrudHookReturn<T>,
  fieldsToModify: (keyof T)[] = [],
  fieldsToExclude: (keyof T)[] = ["id" as keyof T, "createdAt" as keyof T, "updatedAt" as keyof T]
): (id: string) => Promise<T | undefined> {
  return async (id: string) => {
    const item = crud.items.find((i) => i.id === id);
    if (!item) return;

    const duplicateData: Partial<T> = {};

    // Copy all fields except excluded ones
    for (const key of Object.keys(item) as (keyof T)[]) {
      if (!fieldsToExclude.includes(key)) {
        const value = item[key];
        // Modify specified string fields
        if (fieldsToModify.includes(key) && typeof value === "string") {
          duplicateData[key] = `${value} (Copy)` as T[keyof T];
        } else {
          duplicateData[key] = value;
        }
      }
    }

    return crud.createItem(duplicateData);
  };
}

/**
 * Creates approve/reject functions for entities with registration status
 *
 * @param endpoint - Base API endpoint
 * @param setItems - setState function for items
 * @param entityName - Entity name for error messages
 * @returns Object with approve and reject functions
 *
 * @example
 * const { approveItem, rejectItem } = createApprovalActions(
 *   '/api/resellers',
 *   setResellers,
 *   'Reseller'
 * );
 */
export function createApprovalActions<T extends BaseEntity>(
  endpoint: string,
  setItems: React.Dispatch<React.SetStateAction<T[]>>,
  entityName: string
): {
  approveItem: (id: string) => Promise<T>;
  rejectItem: (id: string) => Promise<T>;
} {
  const approveItem = async (id: string): Promise<T> => {
    const res = await fetch(`${endpoint}/${id}/approve`, {
      method: "POST",
    });

    if (!res.ok) {
      throw new Error(`Failed to approve ${entityName.toLowerCase()}`);
    }

    const updated = await res.json();
    setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
    return updated;
  };

  const rejectItem = async (id: string): Promise<T> => {
    const res = await fetch(`${endpoint}/${id}/reject`, {
      method: "POST",
    });

    if (!res.ok) {
      throw new Error(`Failed to reject ${entityName.toLowerCase()}`);
    }

    const updated = await res.json();
    setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
    return updated;
  };

  return { approveItem, rejectItem };
}
