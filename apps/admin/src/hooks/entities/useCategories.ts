"use client";

/**
 * @fileoverview Category management hook with CRUD operations
 * @module hooks/entities/useCategories
 *
 * Provides standardized CRUD operations for categories using the factory pattern.
 */

import { useCrudFactory, CrudHookReturn } from "../common/useCrudFactory";
import { ADMIN_API_ENDPOINTS } from "@/src/constants";

// ============== TYPES ==============

export interface Category {
  id: string;
  name: string;
  logo: string | null;
  status: "active" | "inactive";
  sizeIds: string[];
  createdAt: string;
}

// ============== HOOK ==============

export interface UseCategoriesReturn extends Omit<CrudHookReturn<Category>, "items" | "fetchItems" | "createItem" | "updateItem" | "deleteItem"> {
  categories: Category[];
  fetchCategories: () => Promise<void>;
  createCategory: (data: Partial<Category>) => Promise<Category>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
}

/**
 * Hook for managing category CRUD operations
 *
 * @returns Object with category state and operations
 *
 * @example
 * const { categories, loading, createCategory, deleteCategory } = useCategories();
 */
export function useCategories(): UseCategoriesReturn {
  const crud = useCrudFactory<Category>({
    endpoint: ADMIN_API_ENDPOINTS.categories,
    entityName: "Category",
  });

  return {
    // State (renamed for API compatibility)
    categories: crud.items,
    loading: crud.loading,
    error: crud.error,

    // Operations (renamed for API compatibility)
    fetchCategories: crud.fetchItems,
    createCategory: crud.createItem,
    updateCategory: crud.updateItem,
    deleteCategory: crud.deleteItem,
    toggleStatus: crud.toggleStatus,

    // Expose setters for advanced use cases
    setItems: crud.setItems,
    setError: crud.setError,
  };
}
