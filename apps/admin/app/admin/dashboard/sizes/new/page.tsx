"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/src/components/layouts/AdminLayout";

interface Category {
  id: string;
  name: string;
  status: string;
}

export default function AddSize() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<{ created: string[]; skipped: string[] } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.filter((c: Category) => c.status === "active"));
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Parse comma-separated sizes and show preview
  const parsedSizes = useMemo(() => {
    if (!input.trim()) return [];
    return input
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .filter((s, i, arr) => arr.indexOf(s) === i); // Remove duplicates
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedSizes.length === 0) {
      alert("Please enter at least one size");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/sizes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          names: parsedSizes,
          status: "active",
          categoryIds: selectedCategoryIds,
        }),
      });

      if (!res.ok) throw new Error("Failed to create sizes");

      const data = await res.json();

      // Show results if some were skipped
      if (data.skipped && data.skipped.length > 0) {
        setResults({
          created: data.created || [],
          skipped: data.skipped || [],
        });
        setSaving(false);
      } else {
        router.push("/admin/dashboard/sizes");
      }
    } catch (error) {
      alert("Failed to create sizes");
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Add Sizes"
      actions={
        <Link
          href="/admin/dashboard/sizes"
          className="bg-luxury-gray hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Sizes
        </Link>
      }
    >
      <div className="max-w-2xl">
        {results ? (
          // Show results after submission
          <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Sizes Added
            </h3>

            {results.created.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">Successfully created:</p>
                <div className="flex flex-wrap gap-2">
                  {results.created.map((size) => (
                    <span
                      key={size}
                      className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm"
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {results.skipped.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">Skipped (already exist):</p>
                <div className="flex flex-wrap gap-2">
                  {results.skipped.map((size) => (
                    <span
                      key={size}
                      className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm"
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => {
                  setInput("");
                  setResults(null);
                }}
                className="flex-1 bg-luxury-gold hover:bg-yellow-600 text-black font-medium py-3 rounded-lg transition-colors"
              >
                Add More Sizes
              </button>
              <Link
                href="/admin/dashboard/sizes"
                className="px-6 py-3 bg-luxury-gray hover:bg-gray-700 text-white rounded-lg transition-colors text-center"
              >
                View All Sizes
              </Link>
            </div>
          </div>
        ) : (
          // Input form
          <form onSubmit={handleSubmit} className="bg-luxury-dark rounded-xl border border-luxury-gray p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Size Names <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter sizes separated by commas (e.g., Small, Medium, Large)"
                  className="w-full px-4 py-3 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
                  required
                />
                <p className="mt-2 text-sm text-gray-500">
                  Separate multiple sizes with commas. Examples: XS, S, M, L, XL or UK6, UK7, UK8, UK9
                </p>
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Applicable Categories
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Select which categories these sizes apply to (optional)
                </p>
                {loadingCategories ? (
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-luxury-gold"></div>
                    Loading categories...
                  </div>
                ) : categories.length === 0 ? (
                  <p className="text-gray-500 text-sm">No categories available</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          selectedCategoryIds.includes(category.id)
                            ? "bg-luxury-gold text-black"
                            : "bg-luxury-gray text-gray-300 hover:bg-gray-700"
                        }`}
                      >
                        {category.name}
                        {selectedCategoryIds.includes(category.id) && (
                          <span className="ml-2">x</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {selectedCategoryIds.length > 0 && (
                  <p className="mt-2 text-sm text-luxury-gold">
                    {selectedCategoryIds.length} categor{selectedCategoryIds.length === 1 ? "y" : "ies"} selected
                  </p>
                )}
              </div>

              {/* Preview of sizes to be created */}
              {parsedSizes.length > 0 && (
                <div className="p-4 bg-luxury-gray/50 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400 mb-3">
                    {parsedSizes.length} size{parsedSizes.length > 1 ? "s" : ""} will be created:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {parsedSizes.map((size, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-luxury-gold/20 text-luxury-gold rounded-full text-sm font-medium"
                      >
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving || parsedSizes.length === 0}
                  className="flex-1 bg-luxury-gold hover:bg-yellow-600 text-black font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : parsedSizes.length > 1
                    ? `Add ${parsedSizes.length} Sizes`
                    : "Add Size"}
                </button>
                <Link
                  href="/admin/dashboard/sizes"
                  className="px-6 py-3 bg-luxury-gray hover:bg-gray-700 text-white rounded-lg transition-colors text-center"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
