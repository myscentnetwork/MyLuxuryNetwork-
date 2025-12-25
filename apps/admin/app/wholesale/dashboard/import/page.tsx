"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import WholesaleLayout from "@/src/components/layouts/WholesaleLayout";

interface Product {
  id: string;
  name: string;
  sku: string;
  brandName: string;
  categoryName: string;
  retailPrice: number;
  wholesalePrice: number;
  status: string;
  images: string[];
  sizes: { id: string; name: string }[];
}

export default function ImportProducts() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [importing, setImporting] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const unique = [...new Set(products.map((p) => p.categoryName).filter(Boolean))];
    return unique.sort();
  }, [products]);

  const brands = useMemo(() => {
    const unique = [...new Set(products.map((p) => p.brandName).filter(Boolean))];
    return unique.sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.sku?.toLowerCase().includes(search.toLowerCase()) ||
        product.brandName?.toLowerCase().includes(search.toLowerCase()) ||
        product.categoryName?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = categoryFilter === "all" || product.categoryName === categoryFilter;
      const matchesBrand = brandFilter === "all" || product.brandName === brandFilter;

      return matchesSearch && matchesCategory && matchesBrand;
    });
  }, [products, search, categoryFilter, brandFilter]);

  const handleImport = async (productId: string) => {
    setImporting(productId);
    // Simulate import - in real app would call API
    await new Promise(resolve => setTimeout(resolve, 500));

    if (importedIds.has(productId)) {
      setImportedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    } else {
      setImportedIds(prev => new Set(prev).add(productId));
    }
    setImporting(null);
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
      <h2 className="text-2xl font-bold text-white mb-6">Import Products</h2>

      {/* Stats Bar */}
      <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4 mb-6">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-gray-400 text-sm">Available Products</p>
            <p className="text-2xl font-bold text-white">{products.length}</p>
          </div>
          <div className="w-px h-10 bg-luxury-gray"></div>
          <div>
            <p className="text-gray-400 text-sm">Imported to Store</p>
            <p className="text-2xl font-bold text-luxury-gold">{importedIds.size}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search by SKU, brand, or category..."
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
            const imported = importedIds.has(product.id);
            return (
              <div
                key={product.id}
                className={`bg-luxury-dark rounded-xl border overflow-hidden transition-all ${
                  imported ? "border-luxury-gold" : "border-luxury-gray hover:border-gray-500"
                }`}
              >
                {/* Product Image */}
                <div className="aspect-square bg-white relative">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.sku} className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      product.status === "in_stock" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    }`}>
                      {product.status === "in_stock" ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>
                  {imported && (
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 text-xs rounded-full bg-luxury-gold text-black font-medium">Imported</span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <span className="text-gray-400 text-sm">{product.brandName}</span>
                  <h3 className="text-white font-medium mb-1">{product.sku}</h3>
                  <p className="text-gray-500 text-sm mb-2">{product.categoryName}</p>
                  <p className="text-luxury-gold font-bold mb-3">₹{product.wholesalePrice || product.retailPrice}</p>

                  <button
                    onClick={() => handleImport(product.id)}
                    disabled={importing === product.id}
                    className={`w-full py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                      imported
                        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        : "bg-luxury-gold hover:bg-yellow-600 text-black"
                    }`}
                  >
                    {importing === product.id ? "Processing..." : imported ? "Remove from Store" : "Add to My Store"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 text-center text-gray-500 text-sm">
        Showing {filteredProducts.length} of {products.length} products
      </div>
    </WholesaleLayout>
  );
}
