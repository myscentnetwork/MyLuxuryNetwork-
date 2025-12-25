"use client";

/**
 * @fileoverview Brand management hook with CRUD operations
 * @module hooks/entities/useBrands
 *
 * Provides standardized CRUD operations for brands using the factory pattern.
 */

import { useCrudFactory, createDuplicator, CrudHookReturn } from "../common/useCrudFactory";
import { ADMIN_API_ENDPOINTS } from "@/src/constants";

// ============== TYPES ==============

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  status: "active" | "inactive";
  categoryIds: string[];
  productCount: number;
  createdAt: string;
}

// ============== HOOK ==============

export interface UseBrandsReturn extends Omit<CrudHookReturn<Brand>, "items" | "fetchItems" | "createItem" | "updateItem" | "deleteItem"> {
  brands: Brand[];
  fetchBrands: () => Promise<void>;
  createBrand: (data: Partial<Brand>) => Promise<Brand>;
  updateBrand: (id: string, data: Partial<Brand>) => Promise<Brand>;
  deleteBrand: (id: string) => Promise<void>;
  duplicateBrand: (id: string) => Promise<Brand | undefined>;
}

/**
 * Hook for managing brand CRUD operations
 *
 * @returns Object with brand state and operations
 *
 * @example
 * const { brands, loading, createBrand, deleteBrand } = useBrands();
 */
export function useBrands(): UseBrandsReturn {
  const crud = useCrudFactory<Brand>({
    endpoint: ADMIN_API_ENDPOINTS.brands,
    entityName: "Brand",
  });

  // Create duplicator for brand duplication
  const duplicateBrand = createDuplicator(crud, ["name", "slug"]);

  return {
    // State (renamed for API compatibility)
    brands: crud.items,
    loading: crud.loading,
    error: crud.error,

    // Operations (renamed for API compatibility)
    fetchBrands: crud.fetchItems,
    createBrand: crud.createItem,
    updateBrand: crud.updateItem,
    deleteBrand: crud.deleteItem,
    toggleStatus: crud.toggleStatus,
    duplicateBrand,

    // Expose setters for advanced use cases
    setItems: crud.setItems,
    setError: crud.setError,
  };
}
