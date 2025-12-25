"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ResellerLayout from "@/components/ResellerLayout";
import { useProducts } from "@/hooks/useProducts";
import { useMyStore } from "@/hooks/useMyStore";
import { useMyCategories } from "@/hooks/useMyCategories";
import { useAuth } from "@/contexts/AuthContext";

export default function ImportProducts() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { products, loading: productsLoading } = useProducts();
  const { importProducts, removeProduct, isImported, refresh: refreshStore } = useMyStore();
  const { selectedCategories, selectedCategoryIds, loading: categoriesLoading } = useMyCategories();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [importing, setImporting] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const loading = authLoading || productsLoading || categoriesLoading;

  // Filter products by selected categories first
  const availableProducts = useMemo(() => {
    if (selectedCategoryIds.length === 0) {
      return []; // No categories selected, no products available
    }
    return products.filter(p => selectedCategoryIds.includes(p.categoryId));
  }, [products, selectedCategoryIds]);

  // Get unique categories and brands from available products
  const categories = useMemo(() => {
    const unique = [...new Set(availableProducts.map((p) => p.categoryName))];
    return unique.sort();
  }, [availableProducts]);

  const brands = useMemo(() => {
    const unique = [...new Set(availableProducts.map((p) => p.brandName))];
    return unique.sort();
  }, [availableProducts]);

  // Further filter by search and filters
  const filteredProducts = useMemo(() => {
    return availableProducts.filter((product) => {
      const matchesSearch =
        product.sku.toLowerCase().includes(search.toLowerCase()) ||
        product.brandName.toLowerCase().includes(search.toLowerCase()) ||
        product.categoryName.toLowerCase().includes(search.toLowerCase()) ||
        product.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory = categoryFilter === "all" || product.categoryName === categoryFilter;
      const matchesBrand = brandFilter === "all" || product.brandName === brandFilter;

      return matchesSearch && matchesCategory && matchesBrand;
    });
  }, [availableProducts, search, categoryFilter, brandFilter]);

  const handleImport = async (productId: string) => {
    setImporting(productId);
    try {
      if (isImported(productId)) {
        // Find the reseller product ID for this product
        await removeProduct(productId);
      } else {
        await importProducts([productId]);
      }
      await refreshStore();
    } catch (err) {
      console.error("Failed to import/remove product:", err);
    } finally {
      setImporting(null);
    }
  };

  const importedCount = availableProducts.filter((p) => isImported(p.id)).length;

  if (loading) {
    return (
      <ResellerLayout title="Import Products">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-luxury-gold"></div>
        </div>
      </ResellerLayout>
    );
  }

  // Show message if no categories selected
  if (selectedCategoryIds.length === 0) {
    return (
      <ResellerLayout title="Import Products">
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-luxury-gold/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Select Categories First</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Before importing products, you need to choose which categories you want to sell.
            This helps you focus on products relevant to your store.
          </p>
          <Link
            href="/dashboard/categories"
            className="inline-flex items-center gap-2 px-6 py-3 bg-luxury-gold text-black rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Select Categories
          </Link>
        </div>
      </ResellerLayout>
    );
  }

  return (
    <ResellerLayout title="Import Products">
      {/* Stats Bar */}
      <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-gray-400 text-sm">Available Products</p>
              <p className="text-2xl font-bold text-white">{availableProducts.length}</p>
            </div>
            <div className="w-px h-10 bg-luxury-gray"></div>
            <div>
              <p className="text-gray-400 text-sm">Imported to Store</p>
              <p className="text-2xl font-bold text-luxury-gold">{importedCount}</p>
            </div>
            <div className="w-px h-10 bg-luxury-gray"></div>
            <div>
              <p className="text-gray-400 text-sm">Categories</p>
              <p className="text-2xl font-bold text-white">{selectedCategories.length}</p>
            </div>
          </div>
          <Link
            href="/dashboard/categories"
            className="flex items-center gap-2 px-4 py-2 bg-luxury-gray text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Manage Categories
          </Link>
        </div>
      </div>

      {/* Selected Categories Pills */}
      <div className="mb-6">
        <p className="text-gray-400 text-sm mb-2">Showing products from:</p>
        <div className="flex flex-wrap gap-2">
          {selectedCategories.map(cat => (
            <span
              key={cat.id}
              className="px-3 py-1 bg-luxury-gold/20 text-luxury-gold rounded-full text-sm font-medium"
            >
              {cat.name}
            </span>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search by SKU, brand, category, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 bg-luxury-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-luxury-gold"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="px-4 py-2 bg-luxury-gray border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-luxury-gold"
          >
            <option value="all">All Brands</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-12 text-center">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="text-xl font-medium text-white mb-2">No Products Found</h3>
          <p className="text-gray-400">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const imported = isImported(product.id);
            return (
              <div
                key={product.id}
                className={`bg-luxury-dark rounded-xl border overflow-hidden transition-all ${
                  imported ? "border-luxury-gold" : "border-luxury-gray hover:border-gray-500"
                }`}
              >
                {/* Product Image */}
                <div className="aspect-square bg-white relative">
                  {product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.sku}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      product.status === "in_stock"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}>
                      {product.status === "in_stock" ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>
                  {/* Imported Badge */}
                  {imported && (
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 text-xs rounded-full bg-luxury-gold text-black font-medium">
                        Imported
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {product.brandLogo ? (
                      <img src={product.brandLogo} alt={product.brandName} className="w-6 h-6 object-contain" />
                    ) : null}
                    <span className="text-gray-400 text-sm">{product.brandName}</span>
                  </div>
                  <h3 className="text-white font-medium mb-1">{product.sku}</h3>
                  <p className="text-gray-500 text-sm mb-3">{product.categoryName}</p>

                  {/* Sizes */}
                  {product.sizes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {product.sizes.slice(0, 4).map((size) => (
                        <span key={size.id} className="px-2 py-0.5 bg-luxury-gray text-gray-300 text-xs rounded">
                          {size.name}
                        </span>
                      ))}
                      {product.sizes.length > 4 && (
                        <span className="px-2 py-0.5 bg-luxury-gray text-gray-400 text-xs rounded">
                          +{product.sizes.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Import Button */}
                  <button
                    onClick={() => handleImport(product.id)}
                    disabled={importing === product.id}
                    className={`w-full py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                      imported
                        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        : "bg-luxury-gold hover:bg-yellow-600 text-black"
                    }`}
                  >
                    {importing === product.id
                      ? "Processing..."
                      : imported
                        ? "Remove from Store"
                        : "Add to My Store"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 text-center text-gray-500 text-sm">
        Showing {filteredProducts.length} of {availableProducts.length} products
      </div>
    </ResellerLayout>
  );
}
