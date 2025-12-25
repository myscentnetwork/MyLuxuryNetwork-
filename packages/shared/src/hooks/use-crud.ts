/**
 * CRUD Hook Factory
 * Generic hook for creating entity CRUD operations
 * Reduces boilerplate across all entity hooks
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient, ApiClientError } from "../services/api-client";
import type { BaseEntity, ActiveStatus } from "../types/entities";

// ============== TYPES ==============
export interface UseCrudOptions<T> {
  /** API endpoint for the entity */
  endpoint: string;
  /** Entity name for error messages */
  entityName: string;
  /** Whether to fetch on mount */
  fetchOnMount?: boolean;
  /** Transform function for items after fetch */
  transform?: (items: T[]) => T[];
  /** Status field name for toggle (if entity has status) */
  statusField?: keyof T;
}

export interface UseCrudState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
}

export interface UseCrudActions<T> {
  fetch: () => Promise<void>;
  create: (data: Partial<T>) => Promise<T>;
  update: (id: string, data: Partial<T>) => Promise<T>;
  remove: (id: string) => Promise<void>;
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export interface UseCrudReturn<T> extends UseCrudState<T>, UseCrudActions<T> {}

// ============== HOOK FACTORY ==============
export function useCrud<T extends BaseEntity>(
  options: UseCrudOptions<T>
): UseCrudReturn<T> {
  const {
    endpoint,
    entityName,
    fetchOnMount = true,
    transform,
  } = options;

  // State
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all items
  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let data = await apiClient.get<T[]>(endpoint);
      if (transform) {
        data = transform(data);
      }
      setItems(data);
    } catch (err) {
      const message = err instanceof ApiClientError
        ? err.message
        : `Failed to fetch ${entityName}`;
      setError(message);
      console.error(`Error fetching ${entityName}:`, err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, entityName, transform]);

  // Create item
  const create = useCallback(async (data: Partial<T>): Promise<T> => {
    try {
      const newItem = await apiClient.post<T>(endpoint, data);
      setItems((prev) => [newItem, ...prev]);
      return newItem;
    } catch (err) {
      const message = err instanceof ApiClientError
        ? err.message
        : `Failed to create ${entityName}`;
      throw new Error(message);
    }
  }, [endpoint, entityName]);

  // Update item
  const update = useCallback(async (id: string, data: Partial<T>): Promise<T> => {
    try {
      const updated = await apiClient.put<T>(`${endpoint}/${id}`, data);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      return updated;
    } catch (err) {
      const message = err instanceof ApiClientError
        ? err.message
        : `Failed to update ${entityName}`;
      throw new Error(message);
    }
  }, [endpoint, entityName]);

  // Delete item
  const remove = useCallback(async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`${endpoint}/${id}`);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      const message = err instanceof ApiClientError
        ? err.message
        : `Failed to delete ${entityName}`;
      throw new Error(message);
    }
  }, [endpoint, entityName]);

  // Fetch on mount
  useEffect(() => {
    if (fetchOnMount) {
      fetch();
    }
  }, [fetch, fetchOnMount]);

  return {
    items,
    loading,
    error,
    fetch,
    create,
    update,
    remove,
    setItems,
    setError,
  };
}

// ============== STATUS TOGGLE HELPER ==============
export function createStatusToggle<T extends BaseEntity & { status: ActiveStatus }>(
  items: T[],
  update: (id: string, data: Partial<T>) => Promise<T>
) {
  return async (id: string): Promise<T | undefined> => {
    const item = items.find((i) => i.id === id);
    if (!item) return undefined;
    const newStatus: ActiveStatus = item.status === "active" ? "inactive" : "active";
    return update(id, { status: newStatus } as Partial<T>);
  };
}

// ============== DUPLICATE HELPER ==============
export function createDuplicator<T extends BaseEntity & { name: string }>(
  items: T[],
  create: (data: Partial<T>) => Promise<T>,
  getDataToDuplicate: (item: T) => Partial<T>
) {
  return async (id: string): Promise<T | undefined> => {
    const item = items.find((i) => i.id === id);
    if (!item) return undefined;
    const duplicateData = {
      ...getDataToDuplicate(item),
      name: `${item.name} (Copy)`,
    };
    return create(duplicateData);
  };
}
