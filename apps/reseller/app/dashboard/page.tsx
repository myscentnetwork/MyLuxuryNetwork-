"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ResellerLayout from "@/components/ResellerLayout";
import { useProducts } from "@/hooks/useProducts";
import { useMyStore } from "@/hooks/useMyStore";
import { useAuth } from "@/contexts/AuthContext";

export default function ResellerDashboard() {
  const router = useRouter();
  const { reseller, isAuthenticated, loading: authLoading } = useAuth();
  const { products, loading: productsLoading } = useProducts();
  const { products: importedProducts, loading: storeLoading } = useMyStore();
  const [copied, setCopied] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const inStockCount = importedProducts.filter((p) => p.status === "in_stock").length;
  const outOfStockCount = importedProducts.filter((p) => p.status === "out_of_stock").length;

  const loading = authLoading || productsLoading || storeLoading;

  const storeUrl = reseller?.storeUrl || `http://localhost:3002/${reseller?.username || ""}`;

  const copyStoreUrl = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickActions = [
    {
      name: "Import Products",
      description: "Browse and add products to your store",
      href: "/dashboard/import",
      icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",
      color: "text-blue-400",
      bg: "bg-blue-500/20",
      count: products.length,
      countLabel: "Available"
    },
    {
      name: "My Store",
      description: "Manage your imported products",
      href: "/dashboard/store",
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
      color: "text-luxury-gold",
      bg: "bg-luxury-gold/20",
      count: importedProducts.length,
      countLabel: "Products"
    },
    {
      name: "Categories",
      description: "Manage your product categories",
      href: "/dashboard/categories",
      icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
      color: "text-purple-400",
      bg: "bg-purple-500/20",
      count: reseller?.categories?.length || 0,
      countLabel: "Selected"
    },
    {
      name: "Settings",
      description: "Configure your store settings",
      href: "/dashboard/settings",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
      color: "text-gray-400",
      bg: "bg-gray-500/20",
    },
  ];

  if (loading) {
    return (
      <ResellerLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-luxury-gold"></div>
        </div>
      </ResellerLayout>
    );
  }

  if (!reseller) {
    return null; // Will redirect to login
  }

  return (
    <ResellerLayout title="Dashboard">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-luxury-gold/20 to-luxury-gold/5 rounded-xl border border-luxury-gold/30 p-6 mb-6">
        <h3 className="text-xl font-bold text-white mb-2">Welcome back, {reseller.name}!</h3>
        <p className="text-gray-400">Manage your store, import products, and grow your business.</p>
      </div>

      {/* Store URL Card */}
      {reseller.username && (
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <h3 className="text-lg font-semibold text-white">Your Store URL</h3>
                {importedProducts.length > 0 && (
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                    {importedProducts.length} Products Listed
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm mb-4">Share this link with your customers to view your store</p>

              {/* URL Display */}
              <div className="flex items-center gap-2 bg-luxury-gray rounded-lg p-3">
                <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span className="text-luxury-gold font-mono text-sm flex-1 truncate">{storeUrl}</span>
                <button
                  onClick={copyStoreUrl}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                    copied
                      ? "bg-green-500/20 text-green-400"
                      : "bg-luxury-gold/20 text-luxury-gold hover:bg-luxury-gold/30"
                  }`}
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Visit Store Button */}
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-luxury-gold hover:bg-yellow-600 text-black font-medium px-5 py-3 rounded-lg transition-colors flex items-center gap-2 flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Visit Store
            </a>
          </div>

          {/* Store Info */}
          <div className="mt-4 pt-4 border-t border-luxury-gray flex flex-wrap gap-6">
            <div>
              <p className="text-gray-500 text-xs mb-1">Store Name</p>
              <p className="text-white font-medium">{reseller.shopName || reseller.name}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Username</p>
              <p className="text-gray-300">@{reseller.username}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Status</p>
              <span className={`inline-flex items-center gap-1.5 ${
                reseller.status === "active" ? "text-green-400" : "text-yellow-400"
              }`}>
                <span className={`w-2 h-2 rounded-full animate-pulse ${
                  reseller.status === "active" ? "bg-green-400" : "bg-yellow-400"
                }`}></span>
                {reseller.status === "active" ? "Live" : reseller.status}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* No Username Warning */}
      {!reseller.username && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <svg className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h4 className="text-yellow-400 font-medium mb-1">Setup Your Store</h4>
              <p className="text-gray-400 text-sm mb-3">You need to set a username to make your store public.</p>
              <Link
                href="/dashboard/settings"
                className="inline-flex items-center gap-2 text-luxury-gold hover:text-yellow-400 text-sm font-medium"
              >
                Go to Settings
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Available Products</p>
              <p className="text-2xl font-bold text-white mt-1">{products.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">My Store Products</p>
              <p className="text-2xl font-bold text-luxury-gold mt-1">{importedProducts.length}</p>
            </div>
            <div className="w-12 h-12 bg-luxury-gold/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">In Stock</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{inStockCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Out of Stock</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{outOfStockCount}</p>
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {quickActions.map((action) => (
          <Link
            key={action.name}
            href={action.href}
            className="bg-luxury-dark rounded-xl border border-luxury-gray p-6 hover:border-luxury-gold transition-colors group"
          >
            <div className={`w-12 h-12 ${action.bg} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <svg className={`w-6 h-6 ${action.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
              </svg>
            </div>
            <h4 className="text-white font-medium mb-1">{action.name}</h4>
            <p className="text-gray-500 text-sm mb-2">{action.description}</p>
            {action.count !== undefined && (
              <p className="text-luxury-gold text-sm font-medium">
                {action.count} {action.countLabel}
              </p>
            )}
          </Link>
        ))}
      </div>

      {/* Recently Imported Products */}
      <div className="bg-luxury-dark rounded-xl border border-luxury-gray overflow-hidden">
        <div className="px-6 py-4 border-b border-luxury-gray flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">My Products</h3>
          {importedProducts.length > 0 && (
            <Link href="/dashboard/store" className="text-luxury-gold hover:text-yellow-400 text-sm">
              View All
            </Link>
          )}
        </div>
        {importedProducts.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h4 className="text-white font-medium mb-2">No Products Imported Yet</h4>
            <p className="text-gray-500 mb-4">Start building your store by importing products.</p>
            <Link
              href="/dashboard/import"
              className="bg-luxury-gold hover:bg-yellow-600 text-black font-medium px-6 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import Products
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-luxury-gray">
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Product</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Brand</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Category</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {importedProducts.slice(0, 5).map((product) => (
                  <tr key={product.id} className="border-b border-luxury-gray hover:bg-luxury-gray/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg overflow-hidden">
                          {product.images[0] ? (
                            <img src={product.images[0]} alt={product.sku} className="w-full h-full object-contain" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <span className="text-white font-medium">{product.name || product.sku}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{product.brand}</td>
                    <td className="px-6 py-4 text-gray-300">{product.category}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs rounded-full ${
                        product.status === "in_stock"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}>
                        {product.status === "in_stock" ? "In Stock" : "Out of Stock"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ResellerLayout>
  );
}
