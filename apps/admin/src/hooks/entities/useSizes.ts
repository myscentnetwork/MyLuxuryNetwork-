"use client";

/**
 * @fileoverview Size management hook with CRUD operations
 * @module hooks/entities/useSizes
 *
 * Provides standardized CRUD operations for sizes using the factory pattern.
 */

import { useCrudFactory, CrudHookReturn } from "../common/useCrudFactory";
import { ADMIN_API_ENDPOINTS } from "@/src/constants";

// ============== TYPES ==============

export interface Size {
  id: string;
  name: string;
  status: "active" | "inactive";
  createdAt: string;
}

// ============== HOOK ==============

export interface UseSizesReturn extends Omit<CrudHookReturn<Size>, "items" | "fetchItems" | "createItem" | "updateItem" | "deleteItem"> {
  sizes: Size[];
  fetchSizes: () => Promise<void>;
  createSize: (data: Partial<Size>) => Promise<Size>;
  updateSize: (id: string, data: Partial<Size>) => Promise<Size>;
  deleteSize: (id: string) => Promise<void>;
}

/**
 * Hook for managing size CRUD operations
 *
 * @returns Object with size state and operations
 *
 * @example
 * const { sizes, loading, createSize, deleteSize } = useSizes();
 */
export function useSizes(): UseSizesReturn {
  const crud = useCrudFactory<Size>({
    endpoint: ADMIN_API_ENDPOINTS.sizes,
    entityName: "Size",
  });

  return {
    // State (renamed for API compatibility)
    sizes: crud.items,
    loading: crud.loading,
    error: crud.error,

    // Operations (renamed for API compatibility)
    fetchSizes: crud.fetchItems,
    createSize: crud.createItem,
    updateSize: crud.updateItem,
    deleteSize: crud.deleteItem,
    toggleStatus: crud.toggleStatus,

    // Expose setters for advanced use cases
    setItems: crud.setItems,
    setError: crud.setError,
  };
}
