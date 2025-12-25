"use client";

/**
 * @fileoverview Vendor management hook with CRUD operations
 * @module hooks/entities/useVendors
 *
 * Provides standardized CRUD operations for vendors using the factory pattern.
 */

import { useCrudFactory, CrudHookReturn } from "../common/useCrudFactory";
import { ADMIN_API_ENDPOINTS } from "@/src/constants";

// ============== TYPES ==============

export interface Vendor {
  id: string;
  name: string;
  phone: string | null;
  city: string | null;
  status: "active" | "inactive";
  categoryIds: string[];
  categoryNames: string[];
  billCount: number;
  createdAt: string;
}

// ============== HOOK ==============

export interface UseVendorsReturn extends Omit<CrudHookReturn<Vendor>, "items" | "fetchItems" | "createItem" | "updateItem" | "deleteItem"> {
  vendors: Vendor[];
  fetchVendors: () => Promise<void>;
  createVendor: (data: Partial<Vendor>) => Promise<Vendor>;
  updateVendor: (id: string, data: Partial<Vendor>) => Promise<Vendor>;
  deleteVendor: (id: string) => Promise<void>;
}

/**
 * Hook for managing vendor CRUD operations
 *
 * @returns Object with vendor state and operations
 *
 * @example
 * const { vendors, loading, createVendor, deleteVendor } = useVendors();
 */
export function useVendors(): UseVendorsReturn {
  const crud = useCrudFactory<Vendor>({
    endpoint: ADMIN_API_ENDPOINTS.vendors,
    entityName: "Vendor",
  });

  return {
    // State (renamed for API compatibility)
    vendors: crud.items,
    loading: crud.loading,
    error: crud.error,

    // Operations (renamed for API compatibility)
    fetchVendors: crud.fetchItems,
    createVendor: crud.createItem,
    updateVendor: crud.updateItem,
    deleteVendor: crud.deleteItem,
    toggleStatus: crud.toggleStatus,

    // Expose setters for advanced use cases
    setItems: crud.setItems,
    setError: crud.setError,
  };
}
