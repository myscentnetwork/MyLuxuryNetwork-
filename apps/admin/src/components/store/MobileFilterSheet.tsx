"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  brands: string[];
  username: string;
  currentCategory?: string;
  currentBrand?: string;
  currentFilter?: string;
  productCounts: {
    total: number;
    inStock: number;
    new: number;
    featured: number;
  };
}

export default function MobileFilterSheet({
  isOpen,
  onClose,
  categories,
  brands,
  username,
  currentCategory,
  currentBrand,
  currentFilter,
  productCounts,
}: MobileFilterSheetProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(currentCategory || "");
  const [selectedBrand, setSelectedBrand] = useState(currentBrand || "");
  const [selectedFilter, setSelectedFilter] = useState(currentFilter || "");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    setSelectedCategory(currentCategory || "");
    setSelectedBrand(currentBrand || "");
    setSelectedFilter(currentFilter || "");
  }, [currentCategory, currentBrand, currentFilter]);

  const buildUrl = (params: {
    category?: string;
    brand?: string;
    filter?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params.category) searchParams.set("category", params.category);
    if (params.brand) searchParams.set("brand", params.brand);
    if (params.filter) searchParams.set("filter", params.filter);
    const query = searchParams.toString();
    return `/${username}${query ? `?${query}` : ""}`;
  };

  const applyFilters = () => {
    const url = buildUrl({
      category: selectedCategory || undefined,
      brand: selectedBrand || undefined,
      filter: selectedFilter || undefined,
    });
    router.push(url);
    onClose();
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedBrand("");
    setSelectedFilter("");
    router.push(`/${username}`);
    onClose();
  };

  const hasFilters = selectedCategory || selectedBrand || selectedFilter;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
        <div className="bg-luxury-dark rounded-t-2xl max-h-[85vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-luxury-gray/30">
            <h2 className="font-serif text-lg font-semibold text-white">
              Filters
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-luxury-gray/30 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Quick Filters */}
            <div>
              <h3 className="text-gray-400 text-sm font-medium mb-3">
                Quick Filters
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedFilter("")}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    !selectedFilter
                      ? "bg-luxury-gold text-black"
                      : "bg-luxury-gray/30 text-gray-400"
                  }`}
                >
                  All ({productCounts.total})
                </button>
                <button
                  onClick={() =>
                    setSelectedFilter(
                      selectedFilter === "in_stock" ? "" : "in_stock"
                    )
                  }
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedFilter === "in_stock"
                      ? "bg-luxury-gold text-black"
                      : "bg-luxury-gray/30 text-gray-400"
                  }`}
                >
                  In Stock ({productCounts.inStock})
                </button>
                <button
                  onClick={() =>
                    setSelectedFilter(selectedFilter === "new" ? "" : "new")
                  }
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedFilter === "new"
                      ? "bg-luxury-gold text-black"
                      : "bg-luxury-gray/30 text-gray-400"
                  }`}
                >
                  New ({productCounts.new})
                </button>
                <button
                  onClick={() =>
                    setSelectedFilter(
                      selectedFilter === "featured" ? "" : "featured"
                    )
                  }
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedFilter === "featured"
                      ? "bg-luxury-gold text-black"
                      : "bg-luxury-gray/30 text-gray-400"
                  }`}
                >
                  Featured ({productCounts.featured})
                </button>
              </div>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div>
                <h3 className="text-gray-400 text-sm font-medium mb-3">
                  Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() =>
                        setSelectedCategory(
                          selectedCategory === category ? "" : category
                        )
                      }
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === category
                          ? "bg-luxury-gold text-black"
                          : "bg-luxury-gray/30 text-gray-400"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Brands */}
            {brands.length > 0 && (
              <div>
                <h3 className="text-gray-400 text-sm font-medium mb-3">
                  Brands
                </h3>
                <div className="flex flex-wrap gap-2">
                  {brands.map((brand) => (
                    <button
                      key={brand}
                      onClick={() =>
                        setSelectedBrand(selectedBrand === brand ? "" : brand)
                      }
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedBrand === brand
                          ? "bg-luxury-gold text-black"
                          : "bg-luxury-gray/30 text-gray-400"
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-luxury-gray/30 space-y-3">
            <button
              onClick={applyFilters}
              className="w-full py-3 bg-luxury-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
            >
              Apply Filters
            </button>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="w-full py-3 bg-transparent text-gray-400 font-medium rounded-lg border border-luxury-gray/30 hover:border-gray-500 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
