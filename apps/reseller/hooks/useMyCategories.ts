"use client";

import { useState, useEffect, useCallback } from "react";

interface Category {
  id: string;
  name: string;
  logo: string | null;
  productCount: number;
  isSelected: boolean;
}

export function useMyCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/categories");

      if (response.status === 401) {
        setError("Not authenticated");
        setCategories([]);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
        setError(null);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to fetch categories");
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Toggle single category
  const toggleCategory = useCallback(async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const newSelected = !category.isSelected;

    // Calculate new selected category IDs
    let newCategoryIds: string[];
    if (newSelected) {
      newCategoryIds = [...categories.filter(c => c.isSelected).map(c => c.id), categoryId];
    } else {
      newCategoryIds = categories.filter(c => c.isSelected && c.id !== categoryId).map(c => c.id);
    }

    // Optimistic update
    setCategories(prev =>
      prev.map(c =>
        c.id === categoryId ? { ...c, isSelected: newSelected } : c
      )
    );

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryIds: newCategoryIds }),
      });

      if (!response.ok) {
        // Revert on error
        setCategories(prev =>
          prev.map(c =>
            c.id === categoryId ? { ...c, isSelected: !newSelected } : c
          )
        );
      }
    } catch (err) {
      console.error("Failed to toggle category:", err);
      // Revert on error
      setCategories(prev =>
        prev.map(c =>
          c.id === categoryId ? { ...c, isSelected: !newSelected } : c
        )
      );
    }
  }, [categories]);

  // Select all categories
  const selectAll = useCallback(async () => {
    setSaving(true);
    const allCategoryIds = categories.map(c => c.id);

    // Optimistic update
    setCategories(prev => prev.map(c => ({ ...c, isSelected: true })));

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryIds: allCategoryIds }),
      });

      if (!response.ok) {
        // Revert on error
        await fetchCategories();
      }
    } catch (err) {
      console.error("Failed to select all:", err);
      await fetchCategories();
    } finally {
      setSaving(false);
    }
  }, [categories, fetchCategories]);

  // Deselect all categories
  const deselectAll = useCallback(async () => {
    setSaving(true);

    // Optimistic update
    setCategories(prev => prev.map(c => ({ ...c, isSelected: false })));

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryIds: [] }),
      });

      if (!response.ok) {
        // Revert on error
        await fetchCategories();
      }
    } catch (err) {
      console.error("Failed to deselect all:", err);
      await fetchCategories();
    } finally {
      setSaving(false);
    }
  }, [fetchCategories]);

  // Save selected categories
  const saveCategories = useCallback(async (categoryIds: string[]) => {
    setSaving(true);
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryIds }),
      });

      if (response.ok) {
        await fetchCategories();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to save categories:", err);
      return false;
    } finally {
      setSaving(false);
    }
  }, [fetchCategories]);

  const selectedCategories = categories.filter(c => c.isSelected);
  const selectedCategoryIds = selectedCategories.map(c => c.id);

  return {
    categories,
    selectedCategories,
    selectedCategoryIds,
    loading,
    saving,
    error,
    toggleCategory,
    selectAll,
    deselectAll,
    saveCategories,
    refresh: fetchCategories,
  };
}
