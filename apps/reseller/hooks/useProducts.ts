"use client";

import { useState, useEffect, useCallback } from "react";

export interface ProductSize {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  video?: string | null;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  status: string;
  categoryId: string;
  brandId: string;
  categoryName: string;
  brandName: string;
  brandLogo: string | null;
  sizes: ProductSize[];
  images: string[];
  tags: string[];
  colours: string[];
}

interface FetchOptions {
  categoryId?: string;
  brandId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    categories: { id: string; name: string }[];
    brands: { id: string; name: string }[];
  }>({ categories: [], brands: [] });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchProducts = useCallback(async (options: FetchOptions = {}) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (options.categoryId) params.set("categoryId", options.categoryId);
      if (options.brandId) params.set("brandId", options.brandId);
      if (options.search) params.set("search", options.search);
      if (options.page) params.set("page", options.page.toString());
      if (options.limit) params.set("limit", options.limit.toString());

      const response = await fetch(`/api/catalog?${params.toString()}`);

      if (response.status === 401) {
        setError("Not authenticated");
        setProducts([]);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        // Transform catalog products to match expected format
        const transformedProducts = (data.products || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          description: p.description,
          isFeatured: p.isFeatured,
          isNewArrival: p.isNew,
          isBestSeller: false,
          status: p.status === "in_stock" ? "in_stock" : "out_of_stock",
          categoryId: p.categoryId,
          brandId: p.brandId,
          categoryName: p.category,
          brandName: p.brand,
          brandLogo: null,
          sizes: p.sizes?.map((s: string) => ({ id: s, name: s })) || [],
          images: p.image ? [p.image] : [],
          tags: [],
          colours: [],
          isImported: p.isImported,
        }));
        setProducts(transformedProducts);
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
        setFilters(data.filters || { categories: [], brands: [] });
        setError(null);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to fetch products");
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    filters,
    pagination,
    fetchProducts,
    refresh: () => fetchProducts(),
  };
}
