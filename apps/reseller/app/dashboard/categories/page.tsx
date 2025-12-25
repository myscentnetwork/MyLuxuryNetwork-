"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ResellerLayout from "@/components/ResellerLayout";
import { useMyCategories } from "@/hooks/useMyCategories";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function SelectCategories() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const {
    categories,
    selectedCategories,
    loading: categoriesLoading,
    saving,
    toggleCategory,
    selectAll,
    deselectAll,
  } = useMyCategories();

  const [searchTerm, setSearchTerm] = useState("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const loading = authLoading || categoriesLoading;

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <ResellerLayout title="Select Categories">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-luxury-gold"></div>
        </div>
      </ResellerLayout>
    );
  }

  return (
    <ResellerLayout title="Select Categories">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-luxury-gold/20 to-luxury-gold/5 rounded-xl border border-luxury-gold/30 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">
              Choose Your Product Categories
            </h2>
            <p className="text-gray-400">
              Select the categories you want to sell. Only products from selected categories
              will appear in your import list.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-luxury-gold font-bold text-2xl">
              {selectedCategories.length}
            </span>
            <span className="text-gray-400">/ {categories.length} selected</span>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={selectAll}
              disabled={saving || selectedCategories.length === categories.length}
              className="px-4 py-2 bg-luxury-gold text-black rounded-lg font-medium hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Select All"}
            </button>
            <button
              onClick={deselectAll}
              disabled={saving || selectedCategories.length === 0}
              className="px-4 py-2 bg-luxury-gray text-white rounded-lg font-medium hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-12 text-center">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-xl font-medium text-white mb-2">No Categories Found</h3>
          <p className="text-gray-400">
            {searchTerm ? "Try a different search term." : "No categories available yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => toggleCategory(category.id)}
              className={`relative bg-luxury-dark rounded-xl border-2 p-4 transition-all hover:shadow-lg ${
                category.isSelected
                  ? "border-luxury-gold bg-luxury-gold/10"
                  : "border-luxury-gray hover:border-gray-500"
              }`}
            >
              {/* Selected Checkmark */}
              {category.isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-luxury-gold rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {/* Category Logo */}
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-luxury-gray flex items-center justify-center overflow-hidden">
                {category.logo ? (
                  <img
                    src={category.logo}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl">
                    {category.name.toLowerCase().includes("perfume") ? "🧴" :
                     category.name.toLowerCase().includes("watch") ? "⌚" :
                     category.name.toLowerCase().includes("bag") ? "👜" :
                     category.name.toLowerCase().includes("jewel") ? "💎" :
                     category.name.toLowerCase().includes("shoe") ? "👟" :
                     category.name.toLowerCase().includes("cloth") ? "👔" :
                     "📦"}
                  </span>
                )}
              </div>

              {/* Category Name */}
              <h3 className={`font-medium text-center mb-1 ${
                category.isSelected ? "text-luxury-gold" : "text-white"
              }`}>
                {category.name}
              </h3>

              {/* Product Count */}
              <p className="text-gray-500 text-sm text-center">
                {category.productCount} products
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Continue Button */}
      {selectedCategories.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-luxury-dark border-t border-luxury-gray p-4 z-10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-white font-medium">
                {selectedCategories.length} categor{selectedCategories.length === 1 ? "y" : "ies"} selected
              </p>
              <p className="text-gray-400 text-sm">
                You can now import products from these categories
              </p>
            </div>
            <Link
              href="/dashboard/import"
              className="px-6 py-3 bg-luxury-gold text-black rounded-lg font-semibold hover:bg-yellow-500 transition-colors flex items-center gap-2"
            >
              Continue to Import Products
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      )}

      {/* Spacer for fixed bottom bar */}
      {selectedCategories.length > 0 && <div className="h-24"></div>}
    </ResellerLayout>
  );
}
