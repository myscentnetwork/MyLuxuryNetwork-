"use client";

import { useState, useEffect, useCallback } from "react";

export interface ImportedProduct {
  id: string;
  productId: string;
  name: string;
  sku: string;
  description: string | null;
  category: string;
  categoryId: string;
  brand: string;
  brandId: string;
  brandLogo: string | null;
  images: string[];
  sizes: { id: string; name: string }[];
  colours: string[];
  tags: string[];
  status: string;
  isNew: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  sellingPrice: number | null;
  isVisible: boolean;
  displayOrder: number;
}

export function useMyStore() {
  const [products, setProducts] = useState<ImportedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch imported products from database
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products");

      if (response.status === 401) {
        setError("Not authenticated");
        setProducts([]);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setError(null);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to fetch products");
      }
    } catch (err) {
      console.error("Failed to fetch imported products:", err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Import products from catalog
  const importProducts = useCallback(async (productIds: string[], sellingPrice?: number) => {
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds, sellingPrice }),
      });

      if (response.ok) {
        const data = await response.json();
        await fetchProducts(); // Refresh the list
        return { success: true, ...data };
      } else {
        const data = await response.json();
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error("Failed to import products:", err);
      return { success: false, error: "Network error" };
    }
  }, [fetchProducts]);

  // Update product (price, visibility, order)
  const updateProduct = useCallback(async (
    productId: string,
    updates: { sellingPrice?: number; isVisible?: boolean; displayOrder?: number }
  ) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        // Update local state
        setProducts(prev => prev.map(p =>
          p.id === productId ? { ...p, ...updates } : p
        ));
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error("Failed to update product:", err);
      return { success: false, error: "Network error" };
    }
  }, []);

  // Remove product from catalog
  const removeProduct = useCallback(async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProducts(prev => prev.filter(p => p.id !== productId));
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error("Failed to remove product:", err);
      return { success: false, error: "Network error" };
    }
  }, []);

  // Check if a product is imported (by original product ID)
  const isImported = useCallback((productId: string) => {
    return products.some(p => p.productId === productId);
  }, [products]);

  // Get imported product IDs (original product IDs)
  const importedProductIds = products.map(p => p.productId);

  return {
    products,
    importedProductIds,
    loading,
    error,
    importProducts,
    updateProduct,
    removeProduct,
    isImported,
    refresh: fetchProducts,
  };
}
