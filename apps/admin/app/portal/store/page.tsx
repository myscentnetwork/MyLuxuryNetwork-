"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import PortalLayout, { USER_TYPE_CONFIG, UserType } from "@/src/components/layouts/PortalLayout";

interface Product {
  id: string;
  name: string;
  sku: string;
  brandName: string;
  categoryName: string;
  mrp: number;
  retailPrice: number;
  resellerPrice: number;
  wholesalePrice: number;
  status: string;
  images: string[];
}

interface ImportedProduct {
  id: string;
  productId: string;
  sellingPrice: number | null;
  isVisible: boolean;
  product: Product;
}

export default function PortalStore() {
  const [loading, setLoading] = useState(true);
  const [importedProducts, setImportedProducts] = useState<ImportedProduct[]>([]);
  const [userType, setUserType] = useState<UserType>("retailer");
  const [userId, setUserId] = useState<string>("");
  const [storeSlug, setStoreSlug] = useState<string>("");
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Set base URL on client side
    setBaseUrl(window.location.origin);

    // Get user info from cookie
    const cookies = document.cookie.split(";").reduce((acc, cookie) => {
      const parts = cookie.trim().split("=");
      const key = parts[0];
      const value = parts.slice(1).join("=");
      if (key) acc[key] = value || "";
      return acc;
    }, {} as Record<string, string>);

    const type = cookies["user_type"] as UserType | undefined;
    const id = cookies["user_id"] || "";

    if (type && ["wholesaler", "reseller", "retailer"].includes(type)) {
      setUserType(type);
    }
    setUserId(id);

    if (id && type) {
      fetchImportedProducts(id, type);
      fetchStoreInfo(id, type);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchStoreInfo = async (id: string, type: string) => {
    try {
      let endpoint = "";
      if (type === "reseller") {
        endpoint = `/api/resellers/${id}`;
      } else if (type === "wholesaler") {
        endpoint = `/api/wholesalers/${id}`;
      } else if (type === "retailer") {
        endpoint = `/api/retailers/${id}`;
      }

      if (endpoint) {
        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          setStoreSlug(data.storeSlug || "");
        }
      }
    } catch (error) {
      console.error("Failed to fetch store info:", error);
    }
  };

  const fetchImportedProducts = async (id: string, type: string) => {
    try {
      let endpoint = "";
      if (type === "reseller") {
        endpoint = `/api/reseller/${id}/products`;
      } else if (type === "wholesaler") {
        endpoint = `/api/wholesaler/${id}/products`;
      } else if (type === "retailer") {
        endpoint = `/api/retailer/${id}/products`;
      }

      if (endpoint) {
        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          setImportedProducts(data.products || []);
        }
      }
    } catch (error) {
      console.error("Failed to fetch imported products:", error);
    }
    setLoading(false);
  };

  // Get price based on user type
  const getPrice = (product: Product) => {
    switch (userType) {
      case "wholesaler":
        return product.wholesalePrice;
      case "reseller":
        return product.resellerPrice || product.wholesalePrice;
      case "retailer":
      default:
        return product.retailPrice;
    }
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const config = USER_TYPE_CONFIG[userType];

  // Filter products based on search query
  const filteredProducts = importedProducts.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.product.name?.toLowerCase().includes(query) ||
      item.product.sku?.toLowerCase().includes(query) ||
      item.product.brandName?.toLowerCase().includes(query) ||
      item.product.categoryName?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-luxury-gold"></div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      {/* Store URL Banner */}
      {storeSlug && baseUrl && (
        <div className="bg-gradient-to-r from-luxury-gold/20 to-yellow-600/10 border border-luxury-gold/30 rounded-xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-luxury-gold/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Your Store Frontend URL</p>
                <a
                  href={`${baseUrl}/${storeSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-luxury-gold hover:text-yellow-400 font-medium flex items-center gap-2 transition-colors"
                >
                  {baseUrl}/{storeSlug}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
            <a
              href={`${baseUrl}/${storeSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-luxury-gold hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Store
            </a>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">My Store</h2>
          <p className="text-gray-400 text-sm mt-1">
            Manage your imported products
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {/* View Toggle */}
          <div className="flex items-center bg-luxury-gray rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-luxury-gold text-black"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Grid View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-luxury-gold text-black"
                  : "text-gray-400 hover:text-white"
              }`}
              title="List View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Products</p>
              <p className="text-2xl font-bold text-white mt-1">{importedProducts.length}</p>
            </div>
            <div className="w-12 h-12 bg-luxury-gold/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Visible Products</p>
              <p className="text-2xl font-bold text-green-400 mt-1">
                {importedProducts.filter(p => p.isVisible).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Hidden Products</p>
              <p className="text-2xl font-bold text-gray-400 mt-1">
                {importedProducts.filter(p => !p.isVisible).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      {importedProducts.length === 0 ? (
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-12 text-center">
          <svg className="w-20 h-20 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-xl font-bold text-white mb-2">Your Store is Empty</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Start by browsing our product catalog and importing products to your store with your desired markup.
          </p>
          <a
            href="/portal/products"
            className="inline-flex items-center gap-2 bg-luxury-gold hover:bg-yellow-600 text-black font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import Products
          </a>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-12 text-center">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-xl font-bold text-white mb-2">No Results Found</h3>
          <p className="text-gray-400">No products match your search "{searchQuery}"</p>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((item) => {
            const costPrice = getPrice(item.product);
            const sellingPrice = item.sellingPrice || item.product.mrp;
            const profit = sellingPrice - costPrice;
            const profitPercent = costPrice > 0 ? ((profit / costPrice) * 100).toFixed(1) : 0;

            return (
              <div
                key={item.id}
                className="bg-luxury-dark rounded-xl border border-luxury-gray overflow-hidden hover:border-luxury-gold/50 transition-colors"
              >
                {/* Product Image */}
                <div className="aspect-square bg-white relative">
                  {item.product.images?.[0] ? (
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.sku}
                      fill
                      className="object-contain p-2"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {/* Status Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.product.status === "in_stock"
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }`}>
                      {item.product.status === "in_stock" ? "In Stock" : "Out of Stock"}
                    </span>
                    {!item.isVisible && (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-500 text-white">
                        Hidden
                      </span>
                    )}
                  </div>
                </div>
                {/* Product Info */}
                <div className="p-4">
                  <p className="text-xs text-gray-500 mb-1">{item.product.brandName}</p>
                  <h3 className="text-white font-medium mb-1 line-clamp-2">
                    {item.product.name || item.product.sku}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono mb-3">{item.product.sku}</p>

                  {/* Pricing */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">MRP:</span>
                      <span className="text-gray-400 line-through text-sm">{formatPrice(item.product.mrp)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Your Cost:</span>
                      <span className={`text-sm ${config.color}`}>{formatPrice(costPrice)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Selling Price:</span>
                      <span className="text-luxury-gold font-semibold">{formatPrice(sellingPrice)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-luxury-gray">
                      <span className="text-xs text-gray-500">Your Profit:</span>
                      <span className="text-green-400 font-semibold">{formatPrice(profit)} ({profitPercent}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray overflow-hidden">
          <div className="px-6 py-4 border-b border-luxury-gray flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Imported Products</h3>
            <span className="text-sm text-gray-400">{filteredProducts.length} products</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-luxury-gray">
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Product</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">SKU</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">MRP</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Your Cost</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Your Selling Price</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Your Profit</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Visibility</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((item) => {
                  const costPrice = getPrice(item.product);
                  const sellingPrice = item.sellingPrice || item.product.mrp;
                  const profit = sellingPrice - costPrice;
                  const profitPercent = costPrice > 0 ? ((profit / costPrice) * 100).toFixed(1) : 0;

                  return (
                    <tr key={item.id} className="border-b border-luxury-gray hover:bg-luxury-gray/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white rounded-lg overflow-hidden relative flex-shrink-0">
                            {item.product.images?.[0] ? (
                              <Image
                                src={item.product.images[0]}
                                alt={item.product.sku}
                                fill
                                className="object-contain"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium">{item.product.name || item.product.sku}</p>
                            <p className="text-xs text-gray-500">{item.product.brandName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300 font-mono text-sm">{item.product.sku}</td>
                      <td className="px-6 py-4">
                        <span className="text-gray-400 line-through text-sm">{formatPrice(item.product.mrp)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={config.color}>{formatPrice(costPrice)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-luxury-gold font-semibold">
                          {formatPrice(sellingPrice)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-green-400 font-semibold">{formatPrice(profit)}</span>
                          <span className="text-xs text-green-400/70">({profitPercent}%)</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.product.status === "in_stock"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}>
                          {item.product.status === "in_stock" ? "In Stock" : "Out of Stock"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.isVisible
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}>
                          {item.isVisible ? "Visible" : "Hidden"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
