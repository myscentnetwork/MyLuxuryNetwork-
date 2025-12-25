"use client";

/**
 * @fileoverview Product management hook with CRUD operations
 * @module hooks/entities/useProducts
 *
 * Provides standardized CRUD operations for products using the factory pattern.
 * Products use a different status field (in_stock/out_of_stock) than other entities.
 */

import { useCrudFactory, CrudHookReturn } from "../common/useCrudFactory";
import { ADMIN_API_ENDPOINTS } from "@/src/constants";

// ============== TYPES ==============

export interface ProductSize {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name?: string;
  sku: string;
  description: string | null;
  video: string | null;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isHotSelling?: boolean;
  isRecommended?: boolean;
  status: "in_stock" | "out_of_stock";
  // Stock & Pricing
  stockQuantity: number;
  mrp: number;
  costPrice: number;
  wholesalePrice: number;
  resellerPrice: number;
  retailPrice: number;
  // Relations
  categoryId: string;
  brandId: string;
  categoryName: string;
  brandName: string;
  sizeIds: string[];
  sizes?: ProductSize[];
  images: string[];
  tags: string[];
  colours: string[];
  createdAt: string;
  updatedAt: string;
}

// ============== HOOK ==============

export interface UseProductsReturn extends Omit<CrudHookReturn<Product>, "items" | "fetchItems" | "createItem" | "updateItem" | "deleteItem"> {
  products: Product[];
  fetchProducts: () => Promise<void>;
  createProduct: (data: Partial<Product>) => Promise<Product>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
}

/**
 * Hook for managing product CRUD operations
 *
 * @returns Object with product state and operations
 *
 * @example
 * const { products, loading, createProduct, deleteProduct } = useProducts();
 */
export function useProducts(): UseProductsReturn {
  const crud = useCrudFactory<Product>({
    endpoint: ADMIN_API_ENDPOINTS.products,
    entityName: "Product",
    statusField: "status",
    activeValue: "in_stock",
    inactiveValue: "out_of_stock",
  });

  return {
    // State (renamed for API compatibility)
    products: crud.items,
    loading: crud.loading,
    error: crud.error,

    // Operations (renamed for API compatibility)
    fetchProducts: crud.fetchItems,
    createProduct: crud.createItem,
    updateProduct: crud.updateItem,
    deleteProduct: crud.deleteItem,
    toggleStatus: crud.toggleStatus,

    // Expose setters for advanced use cases
    setItems: crud.setItems,
    setError: crud.setError,
  };
}
