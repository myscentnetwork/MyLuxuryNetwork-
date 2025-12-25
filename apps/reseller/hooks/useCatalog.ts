"use client";

import { useState, useEffect, useCallback } from "react";

export interface CatalogProduct {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  category: string;
  categoryId: string;
  brand: string;
  brandId: string;
  image: string | null;
  sizes: string[];
  status: string;
  isNew: boolean;
  isFeatured: boolean;
  isImported: boolean;
}

export interface CatalogFilters {
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
}

export interface CatalogPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface FetchOptions {
  categoryId?: string;
  brandId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useCatalog() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [filters, setFilters] = useState<CatalogFilters>({ categories: [], brands: [] });
  const [pagination, setPagination] = useState<CatalogPagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalog = useCallback(async (options: FetchOptions = {}) => {
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
        setProducts(data.products || []);
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
        setFilters(data.filters || { categories: [], brands: [] });
        setError(null);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to fetch catalog");
      }
    } catch (err) {
      console.error("Failed to fetch catalog:", err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  return {
    products,
    filters,
    pagination,
    loading,
    error,
    fetchCatalog,
    refresh: () => fetchCatalog(),
  };
}
