"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import WholesaleLayout from "@/src/components/layouts/WholesaleLayout";

interface Product {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  retailPrice: number;
  wholesalePrice: number;
  status: string;
  images: string[];
}

export default function WholesaleDashboard() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [importedProducts, setImportedProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Fetch products
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

  const inStockCount = products.filter((p) => p.status === "in_stock").length;
  const outOfStockCount = products.filter((p) => p.status === "out_of_stock").length;

  const quickActions = [
    {
      name: "Import Products",
      description: "Browse and add products to your store",
      href: "/wholesale/dashboard/import",
      icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",
      color: "text-blue-400",
      bg: "bg-blue-500/20",
      count: products.length,
      countLabel: "Available"
    },
    {
      name: "My Store",
      description: "Manage your imported products",
      href: "/wholesale/dashboard/store",
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
      color: "text-luxury-gold",
      bg: "bg-luxury-gold/20",
      count: importedProducts.length,
      countLabel: "Products"
    },
    {
      name: "Categories",
      description: "Manage your product categories",
      href: "/wholesale/dashboard/categories",
      icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
      color: "text-purple-400",
      bg: "bg-purple-500/20",
      count: 0,
      countLabel: "Selected"
    },
    {
      name: "Settings",
      description: "Configure your store settings",
      href: "/wholesale/dashboard/settings",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
      color: "text-gray-400",
      bg: "bg-gray-500/20",
    },
  ];

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
      <h2 className="text-2xl font-bold text-white mb-6">Dashboard</h2>

      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-luxury-gold/20 to-luxury-gold/5 rounded-xl border border-luxury-gold/30 p-6 mb-6">
        <h3 className="text-xl font-bold text-white mb-2">Welcome back!</h3>
        <p className="text-gray-400">Manage your store, import products, and grow your business.</p>
      </div>

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

      {/* Products Table */}
      <div className="bg-luxury-dark rounded-xl border border-luxury-gray overflow-hidden">
        <div className="px-6 py-4 border-b border-luxury-gray flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Recent Products</h3>
          <Link href="/wholesale/dashboard/import" className="text-luxury-gold hover:text-yellow-400 text-sm">
            View All
          </Link>
        </div>
        {products.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h4 className="text-white font-medium mb-2">No Products Available</h4>
            <p className="text-gray-500 mb-4">Products will appear here once added by admin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-luxury-gray">
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Product</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">SKU</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Price</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 5).map((product) => (
                  <tr key={product.id} className="border-b border-luxury-gray hover:bg-luxury-gray/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg overflow-hidden relative">
                          {product.images?.[0] ? (
                            <Image src={product.images[0]} alt={product.sku} fill className="object-contain" />
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
                    <td className="px-6 py-4 text-gray-300">{product.sku}</td>
                    <td className="px-6 py-4 text-luxury-gold">₹{product.wholesalePrice || product.retailPrice}</td>
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
    </WholesaleLayout>
  );
}
