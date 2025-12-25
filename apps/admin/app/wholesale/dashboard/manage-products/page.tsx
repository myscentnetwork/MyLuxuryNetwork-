"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import WholesaleLayout from "@/src/components/layouts/WholesaleLayout";

interface Category {
  id: string;
  name: string;
  logo: string | null;
  status: string;
  _count?: { products: number };
}

export default function ManageProducts() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [importedCategories, setImportedCategories] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState<string | null>(null);

  // Load imported categories from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("wholesale_imported_categories");
    if (saved) {
      setImportedCategories(new Set(JSON.parse(saved)));
    }
  }, []);

  // Save imported categories to localStorage
  useEffect(() => {
    if (importedCategories.size > 0) {
      localStorage.setItem("wholesale_imported_categories", JSON.stringify([...importedCategories]));
    }
  }, [importedCategories]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          const activeCategories = (data.categories || data || []).filter(
            (cat: Category) => cat.status === "active"
          );
          setCategories(activeCategories);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
      setLoading(false);
    };

    fetchCategories();
  }, []);

  const handleImportCategory = async (categoryId: string) => {
    setImporting(categoryId);
    await new Promise(resolve => setTimeout(resolve, 300));

    setImportedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
        // Also remove products from this category
        const savedProducts = localStorage.getItem("wholesale_imported_products");
        if (savedProducts) {
          const products = JSON.parse(savedProducts);
          const filtered = products.filter((p: { categoryId: string }) => p.categoryId !== categoryId);
          localStorage.setItem("wholesale_imported_products", JSON.stringify(filtered));
        }
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
    setImporting(null);
  };

  const handleImportAllCategories = async () => {
    setImporting("all");
    await new Promise(resolve => setTimeout(resolve, 500));

    const allIds = new Set(categories.map(c => c.id));
    setImportedCategories(allIds);
    localStorage.setItem("wholesale_imported_categories", JSON.stringify([...allIds]));
    setImporting(null);
  };

  const handleRemoveAllCategories = async () => {
    setImporting("remove-all");
    await new Promise(resolve => setTimeout(resolve, 300));

    setImportedCategories(new Set());
    localStorage.removeItem("wholesale_imported_categories");
    localStorage.removeItem("wholesale_imported_products");
    setImporting(null);
  };

  const importedCount = importedCategories.size;
  const totalCount = categories.length;

  if (loading) {
    return (
      <WholesaleLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-luxury-gold"></div>
        </div>
      </WholesaleLayout>
    );
  }

  return (
    <WholesaleLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Manage Your Store</h2>
            <p className="text-gray-400 mt-1">Import categories and select products for your store</p>
          </div>
          <div className="flex items-center gap-3">
            {importedCount > 0 && (
              <button
                onClick={handleRemoveAllCategories}
                disabled={importing !== null}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Remove All
              </button>
            )}
            <button
              onClick={handleImportAllCategories}
              disabled={importing !== null || importedCount === totalCount}
              className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {importing === "all" ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              )}
              IMPORT ALL CATEGORIES
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4 mb-8">
        <div className="flex items-center gap-8">
          <div>
            <p className="text-gray-400 text-sm">Total Categories</p>
            <p className="text-2xl font-bold text-white">{totalCount}</p>
          </div>
          <div className="w-px h-10 bg-luxury-gray"></div>
          <div>
            <p className="text-gray-400 text-sm">Imported Categories</p>
            <p className="text-2xl font-bold text-purple-400">{importedCount}</p>
          </div>
          <div className="w-px h-10 bg-luxury-gray"></div>
          <div className="flex-1">
            <p className="text-gray-400 text-sm mb-2">Import Progress</p>
            <div className="w-full bg-luxury-gray rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${totalCount > 0 ? (importedCount / totalCount) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-12 text-center mt-8">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-xl font-medium text-white mb-2">No Categories Available</h3>
          <p className="text-gray-400">Categories will appear here once added by admin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category) => {
            const isImported = importedCategories.has(category.id);
            const isProcessing = importing === category.id;

            return (
              <div
                key={category.id}
                className="group"
              >
                {/* Category Logo - Full Square */}
                <div className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all mb-4 relative ${
                  isImported ? "border-green-500" : "border-luxury-gray hover:border-purple-500"
                }`}>
                  {category.logo ? (
                    <img
                      src={category.logo}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                      <span className="text-6xl font-bold text-white">
                        {category.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Product count badge */}
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                    {category._count?.products || 0} items
                  </div>

                  {/* Imported checkmark */}
                  {isImported && (
                    <div className="absolute top-3 left-3 bg-green-500 text-white p-1.5 rounded-full">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Category Name */}
                <h3 className="text-white font-bold text-lg text-center mb-3">
                  {category.name}
                </h3>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {isImported ? (
                    <>
                      <Link
                        href={`/wholesale/dashboard/manage-products/${category.id}`}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-colors text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        SELECT PRODUCTS
                      </Link>
                      <button
                        onClick={() => handleImportCategory(category.id)}
                        disabled={isProcessing}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-medium transition-colors text-sm disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-400"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        REMOVE CATEGORY
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleImportCategory(category.id)}
                      disabled={isProcessing}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold transition-colors text-sm disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      )}
                      IMPORT {category.name.toUpperCase()}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </WholesaleLayout>
  );
}
