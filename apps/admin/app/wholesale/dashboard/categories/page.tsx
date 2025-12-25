"use client";

import { useState, useEffect } from "react";
import WholesaleLayout from "@/src/components/layouts/WholesaleLayout";

interface Category {
  id: string;
  name: string;
  thumbnail: string | null;
  _count?: { products: number };
}

export default function Categories() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || data || []);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
      setLoading(false);
    };

    fetchCategories();
  }, []);

  const toggleCategory = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Select Categories</h2>
        <span className="text-luxury-gold">{selectedIds.size} selected</span>
      </div>

      <p className="text-gray-400 mb-6">Choose the product categories you want to sell in your store.</p>

      {categories.length === 0 ? (
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-12 text-center">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-xl font-medium text-white mb-2">No Categories Available</h3>
          <p className="text-gray-400">Categories will appear here once added by admin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((category) => {
            const isSelected = selectedIds.has(category.id);
            return (
              <button
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "bg-luxury-gold/20 border-luxury-gold"
                    : "bg-luxury-dark border-luxury-gray hover:border-gray-500"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    isSelected ? "bg-luxury-gold" : "bg-luxury-gray"
                  }`}>
                    {category.thumbnail ? (
                      <img src={category.thumbnail} alt={category.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <svg className={`w-6 h-6 ${isSelected ? "text-black" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-medium ${isSelected ? "text-luxury-gold" : "text-white"}`}>{category.name}</h3>
                    <p className="text-gray-500 text-sm">{category._count?.products || 0} products</p>
                  </div>
                  {isSelected && (
                    <svg className="w-5 h-5 text-luxury-gold" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </WholesaleLayout>
  );
}
