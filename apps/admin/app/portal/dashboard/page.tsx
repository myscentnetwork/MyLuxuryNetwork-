"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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

export default function PortalDashboard() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [userType, setUserType] = useState<UserType>("retailer");
  const [storeSlug, setStoreSlug] = useState<string>("");
  const [baseUrl, setBaseUrl] = useState<string>("");

  useEffect(() => {
    // Set base URL on client side
    setBaseUrl(window.location.origin);

    // Get user type from cookie
    const cookies = document.cookie.split(";").reduce((acc, cookie) => {
      const parts = cookie.trim().split("=");
      const key = parts[0];
      const value = parts.slice(1).join("=");
      if (key) acc[key] = value || "";
      return acc;
    }, {} as Record<string, string>);

    const type = cookies["user_type"] as UserType | undefined;
    const userId = cookies["user_id"] || "";

    if (type && ["wholesaler", "reseller", "retailer"].includes(type)) {
      setUserType(type);
    }

    // Fetch store info
    if (userId && type) {
      fetchStoreInfo(userId, type);
    }

    // Fetch products
    const fetchProducts = async (userType: string) => {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          const allProducts = Array.isArray(data) ? data : (data.products || []);
          // Filter products based on user type - only show products with their respective price set
          const filteredProducts = allProducts.filter((product: Product) => {
            if (userType === "wholesaler") return (product.wholesalePrice || 0) > 0;
            if (userType === "reseller") return (product.resellerPrice || 0) > 0;
            if (userType === "retailer") return (product.retailPrice || 0) > 0;
            return false;
          });
          setProducts(filteredProducts);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
      setLoading(false);
    };

    fetchProducts(type || "retailer");
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

  const inStockCount = products.filter((p) => p.status === "in_stock").length;
  const outOfStockCount = products.filter((p) => p.status === "out_of_stock").length;

  const config = USER_TYPE_CONFIG[userType];

  const quickActions = [
    {
      name: "Browse Products",
      description: "View all available products",
      href: "/portal/products",
      icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",
      color: "text-blue-400",
      bg: "bg-blue-500/20",
      count: products.length,
      countLabel: "Available",
    },
    {
      name: "My Store",
      description: "Manage your imported products",
      href: "/portal/store",
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
      color: "text-luxury-gold",
      bg: "bg-luxury-gold/20",
      count: 0,
      countLabel: "Products",
    },
    {
      name: "My Orders",
      description: "View your order history",
      href: "/portal/orders",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
      color: "text-green-400",
      bg: "bg-green-500/20",
      count: 0,
      countLabel: "Orders",
    },
    {
      name: "Settings",
      description: "Manage your account",
      href: "/portal/settings",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
      color: "text-gray-400",
      bg: "bg-gray-500/20",
    },
  ];

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
      <h2 className="text-2xl font-bold text-white mb-6">Dashboard</h2>

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
                <p className="text-sm text-gray-400">Your Store URL</p>
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

      {/* Welcome Message */}
      <div className={`bg-gradient-to-r ${config.bgColor} to-transparent rounded-xl border ${config.color.replace("text-", "border-")}/30 p-6 mb-6`}>
        <h3 className="text-xl font-bold text-white mb-2">Welcome back!</h3>
        <p className="text-gray-400">
          You are viewing prices as a <span className={`font-semibold ${config.color}`}>{config.label}</span>.
          {userType === "wholesaler" && " Enjoy the best wholesale rates!"}
          {userType === "reseller" && " Grow your business with reseller pricing!"}
          {userType === "retailer" && " Shop premium luxury products!"}
        </p>
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
              <p className="text-gray-400 text-sm">My Store</p>
              <p className="text-2xl font-bold text-luxury-gold mt-1">0</p>
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
          <div>
            <h3 className="text-lg font-semibold text-white">Recent Products</h3>
            <p className="text-sm text-gray-500">Showing {config.priceLabel}</p>
          </div>
          <Link href="/portal/products" className="text-luxury-gold hover:text-yellow-400 text-sm">
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
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Maximum Retail Price</th>
                  <th className={`text-left px-6 py-3 text-sm font-medium ${config.color}`}>
                    {userType === "wholesaler" ? "Wholesale Price" : userType === "reseller" ? "Reseller Price" : "Offer Price"}
                  </th>
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
                        <div>
                          <span className="text-white font-medium">{product.name || product.sku}</span>
                          <p className="text-xs text-gray-500">{product.brandName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 font-mono text-sm">{product.sku}</td>
                    <td className="px-6 py-4 text-gray-400 line-through">{formatPrice(product.mrp)}</td>
                    <td className={`px-6 py-4 font-semibold ${config.color}`}>
                      {formatPrice(getPrice(product))}
                    </td>
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
    </PortalLayout>
  );
}
