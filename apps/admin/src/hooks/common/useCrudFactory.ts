"use client";

/**
 * @fileoverview CRUD Hook Factory
 * @module hooks/common/useCrudFactory
 *
 * Enterprise CRUD hook factory that eliminates duplication across entity hooks.
 * Provides standardized state management and CRUD operations.
 *
 * @example
 * ```typescript
 * // Basic usage
 * const crud = useCrudFactory<Brand>({
 *   endpoint: '/api/brands',
 *   entityName: 'Brand',
 * });
 *
 * // With transform
 * const crud = useCrudFactory<Product>({
 *   endpoint: '/api/products',
 *   entityName: 'Product',
 *   transform: (item) => ({ ...item, formattedPrice: formatPrice(item.price) }),
 * });
 * ```
 */

import { useState, useEffect, useCallback } from "react";

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
  fetchItems: () => Promise<void>;
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

  // ============== FETCH ==============

  /**
   * Fetches all items from the API
   */
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`Failed to fetch ${entityName.toLowerCase()}s`);
      let data = await res.json();

      // Apply transform if provided
      if (transform) {
        data = Array.isArray(data) ? data.map(transform) : data;
      }

      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [endpoint, entityName, transform]);

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

  useEffect(() => {
    if (fetchOnMount) {
      fetchItems();
    }
  }, [fetchItems, fetchOnMount]);

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
