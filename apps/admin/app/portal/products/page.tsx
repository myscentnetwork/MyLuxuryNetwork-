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
  costPrice: number;
  status: string;
  images: string[];
  sizes: { id: string; name: string }[];
  tags: string[];
  colours: string[];
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  categoryId: string;
  brandId: string;
}

interface Category {
  id: string;
  name: string;
  logo: string | null;
  status: string;
  _count?: { products: number };
}

interface Brand {
  id: string;
  name: string;
  logo: string | null;
  status: string;
  categoryIds: string[];
  productCount?: number;
}

type ViewLevel = "categories" | "brands" | "products";

export default function PortalProducts() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [userType, setUserType] = useState<UserType>("retailer");
  const [userId, setUserId] = useState<string>("");

  // Navigation state
  const [viewLevel, setViewLevel] = useState<ViewLevel>("categories");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  // Search and view mode
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Import modal state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [markupType, setMarkupType] = useState<"percentage" | "fixed">("percentage");
  const [markupPercentage, setMarkupPercentage] = useState<string>("");
  const [markupFixed, setMarkupFixed] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [importedProductIds, setImportedProductIds] = useState<Set<string>>(new Set());

  // Auto-import state
  const [autoImportModalOpen, setAutoImportModalOpen] = useState(false);
  const [autoImportEnabled, setAutoImportEnabled] = useState(false);
  const [autoImportMarkupType, setAutoImportMarkupType] = useState<"percentage" | "fixed">("percentage");
  const [autoImportMarkupValue, setAutoImportMarkupValue] = useState<string>("");
  const [enablingAutoImport, setEnablingAutoImport] = useState(false);
  const [storeSlug, setStoreSlug] = useState<string>("");
  const [baseUrl, setBaseUrl] = useState<string>("");

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

    // Fetch data
    fetchData(id, type || "retailer");
  }, []);

  const fetchData = async (id: string, type: string) => {
    try {
      const [productsRes, categoriesRes, brandsRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
        fetch("/api/brands"),
      ]);

      if (productsRes.ok) {
        const data = await productsRes.json();
        const allProducts = Array.isArray(data) ? data : (data.products || []);
        // Filter products based on user type - only show products with their respective price set
        const filteredProducts = allProducts.filter((product: Product) => {
          if (type === "wholesaler") return product.wholesalePrice > 0;
          if (type === "reseller") return product.resellerPrice > 0;
          if (type === "retailer") return product.retailPrice > 0;
          return false;
        });
        setProducts(filteredProducts);
      }
      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        // Only show active categories
        const activeCategories = (Array.isArray(data) ? data : (data.categories || [])).filter(
          (c: Category) => c.status === "active"
        );
        setCategories(activeCategories);
      }
      if (brandsRes.ok) {
        const data = await brandsRes.json();
        // Only show active brands
        const activeBrands = (Array.isArray(data) ? data : (data.brands || [])).filter(
          (b: Brand) => b.status === "active"
        );
        setBrands(activeBrands);
      }

      // Fetch already imported products for all user types
      if (id && type) {
        let endpoint = "";
        if (type === "reseller") {
          endpoint = `/api/reseller/${id}/products`;
        } else if (type === "wholesaler") {
          endpoint = `/api/wholesaler/${id}/products`;
        } else if (type === "retailer") {
          endpoint = `/api/retailer/${id}/products`;
        }

        if (endpoint) {
          const importedRes = await fetch(endpoint);
          if (importedRes.ok) {
            const importedData = await importedRes.json();
            const importedIds = new Set<string>(
              (importedData.products || []).map((p: { productId: string }) => p.productId)
            );
            setImportedProductIds(importedIds);
          }
        }

        // Fetch auto-import settings
        const autoImportRes = await fetch("/api/portal/auto-import");
        if (autoImportRes.ok) {
          const autoImportData = await autoImportRes.json();
          if (autoImportData.settings) {
            setAutoImportEnabled(autoImportData.settings.autoImportEnabled || false);
            setAutoImportMarkupType(autoImportData.settings.autoImportMarkupType || "percentage");
            setAutoImportMarkupValue(autoImportData.settings.autoImportMarkupValue?.toString() || "");
          }
        }

        // Fetch store slug
        let storeEndpoint = "";
        if (type === "reseller") {
          storeEndpoint = `/api/resellers/${id}`;
        } else if (type === "wholesaler") {
          storeEndpoint = `/api/wholesalers/${id}`;
        } else if (type === "retailer") {
          storeEndpoint = `/api/retailers/${id}`;
        }
        if (storeEndpoint) {
          const storeRes = await fetch(storeEndpoint);
          if (storeRes.ok) {
            const storeData = await storeRes.json();
            setStoreSlug(storeData.storeSlug || "");
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
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

  // Calculate selling price with markup
  const calculateSellingPrice = () => {
    if (!selectedProduct) return 0;
    const basePrice = getPrice(selectedProduct);
    const percentageValue = parseFloat(markupPercentage) || 0;
    const fixedValue = parseFloat(markupFixed) || 0;
    if (markupType === "percentage") {
      return basePrice + (basePrice * percentageValue / 100);
    } else {
      return basePrice + fixedValue;
    }
  };

  // Calculate profit
  const calculateProfit = () => {
    if (!selectedProduct) return 0;
    const basePrice = getPrice(selectedProduct);
    return calculateSellingPrice() - basePrice;
  };

  // Get filtered categories based on search
  const getFilteredCategories = () => {
    if (!searchQuery) return categories;
    const query = searchQuery.toLowerCase();
    return categories.filter((category) =>
      category.name?.toLowerCase().includes(query)
    );
  };

  // Get brands for selected category
  const getCategoryBrands = () => {
    if (!selectedCategory) return [];
    let filtered = brands.filter((brand) => brand.categoryIds.includes(selectedCategory.id));

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((brand) =>
        brand.name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  // Get products for selected brand and category
  const getBrandProducts = () => {
    if (!selectedBrand || !selectedCategory) return [];
    let filtered = products.filter(
      (product) =>
        product.brandId === selectedBrand.id && product.categoryId === selectedCategory.id
    );

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name?.toLowerCase().includes(query) ||
          product.sku?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  // Get product count for a category
  const getCategoryProductCount = (categoryId: string) => {
    return products.filter((p) => p.categoryId === categoryId).length;
  };

  // Get product count for a brand within selected category
  const getBrandProductCount = (brandId: string) => {
    if (!selectedCategory) return 0;
    return products.filter(
      (p) => p.brandId === brandId && p.categoryId === selectedCategory.id
    ).length;
  };

  // Navigation handlers
  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    setSelectedBrand(null);
    setViewLevel("brands");
    setSearchQuery("");
  };

  const handleBrandClick = (brand: Brand) => {
    setSelectedBrand(brand);
    setViewLevel("products");
    setSearchQuery("");
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedBrand(null);
    setViewLevel("categories");
    setSearchQuery("");
  };

  const handleBackToBrands = () => {
    setSelectedBrand(null);
    setViewLevel("brands");
    setSearchQuery("");
  };

  // Import handlers
  const openImportModal = (product: Product) => {
    setSelectedProduct(product);
    setMarkupType("percentage");
    setMarkupPercentage("");
    setMarkupFixed("");
    setImportModalOpen(true);
  };

  const closeImportModal = () => {
    setImportModalOpen(false);
    setSelectedProduct(null);
    setMarkupPercentage("");
    setMarkupFixed("");
  };

  const handleImport = async () => {
    if (!selectedProduct) {
      alert("No product selected");
      return;
    }
    if (!userId) {
      alert("You must be logged in to import products. Please log in again.");
      return;
    }

    setImporting(true);
    try {
      let endpoint = "";
      if (userType === "reseller") {
        endpoint = `/api/reseller/${userId}/products`;
      } else if (userType === "wholesaler") {
        endpoint = `/api/wholesaler/${userId}/products`;
      } else if (userType === "retailer") {
        endpoint = `/api/retailer/${userId}/products`;
      }

      console.log("Importing product:", { userId, userType, endpoint, productId: selectedProduct.id });

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          sellingPrice: calculateSellingPrice(),
          markupType,
          markupValue: markupType === "percentage" ? (parseFloat(markupPercentage) || 0) : (parseFloat(markupFixed) || 0),
        }),
      });

      if (res.ok) {
        setImportedProductIds((prev) => new Set([...prev, selectedProduct.id]));
        closeImportModal();
        alert("Product imported successfully!");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to import product");
      }
    } catch (error) {
      console.error("Import error:", error);
      alert("Failed to import product");
    }
    setImporting(false);
  };

  // Auto-import handlers
  const openAutoImportModal = () => {
    setAutoImportModalOpen(true);
  };

  const closeAutoImportModal = () => {
    setAutoImportModalOpen(false);
  };

  const handleEnableAutoImport = async () => {
    if (!userId) {
      alert("You must be logged in. Please log in again.");
      return;
    }

    setEnablingAutoImport(true);
    try {
      const res = await fetch("/api/portal/auto-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markupType: autoImportMarkupType,
          markupValue: parseFloat(autoImportMarkupValue) || 0,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAutoImportEnabled(true);
        closeAutoImportModal();
        // Refresh imported products
        fetchData(userId, userType);
        alert(data.message || "Auto-import enabled successfully!");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to enable auto-import");
      }
    } catch (error) {
      console.error("Auto-import error:", error);
      alert("Failed to enable auto-import");
    }
    setEnablingAutoImport(false);
  };

  const handleDisableAutoImport = async () => {
    if (!confirm("Are you sure you want to disable auto-import? Previously imported products will remain in your store.")) {
      return;
    }

    try {
      const res = await fetch("/api/portal/auto-import", {
        method: "DELETE",
      });

      if (res.ok) {
        setAutoImportEnabled(false);
        alert("Auto-import disabled. Previously imported products remain in your store.");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to disable auto-import");
      }
    } catch (error) {
      console.error("Disable auto-import error:", error);
      alert("Failed to disable auto-import");
    }
  };

  // Calculate auto-import preview price
  const calculateAutoImportPreviewPrice = (basePrice: number) => {
    const markupVal = parseFloat(autoImportMarkupValue) || 0;
    if (autoImportMarkupType === "percentage") {
      return basePrice + (basePrice * markupVal / 100);
    } else {
      return basePrice + markupVal;
    }
  };

  const config = USER_TYPE_CONFIG[userType];

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

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <button
          onClick={handleBackToCategories}
          className={`${
            viewLevel === "categories"
              ? "text-luxury-gold font-medium"
              : "text-gray-400 hover:text-white"
          } transition-colors`}
        >
          Categories
        </button>
        {selectedCategory && (
          <>
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <button
              onClick={handleBackToBrands}
              className={`${
                viewLevel === "brands"
                  ? "text-luxury-gold font-medium"
                  : "text-gray-400 hover:text-white"
              } transition-colors`}
            >
              {selectedCategory.name}
            </button>
          </>
        )}
        {selectedBrand && (
          <>
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-luxury-gold font-medium">{selectedBrand.name}</span>
          </>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {viewLevel === "categories" && "Select Category"}
            {viewLevel === "brands" && `${selectedCategory?.name} - Select Brand`}
            {viewLevel === "products" && `${selectedBrand?.name} Products`}
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {viewLevel === "categories" && "Choose to import categories you want to sell on your store"}
            {viewLevel === "brands" && "Choose to import brands you want to sell on your store"}
            {viewLevel === "products" && (
              <>
                Showing {config.priceLabel} • {getBrandProducts().length} products
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-luxury-gray rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-luxury-gold text-black"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Grid view"
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
              title="List view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Back button for mobile */}
          {viewLevel !== "categories" && (
            <button
              onClick={viewLevel === "products" ? handleBackToBrands : handleBackToCategories}
              className="flex items-center gap-2 px-4 py-2 bg-luxury-gray hover:bg-luxury-gold/20 text-gray-300 hover:text-luxury-gold rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}
        </div>
      </div>

      {/* Auto-Import Banner */}
      <div className={`rounded-xl border p-4 mb-6 ${
        autoImportEnabled
          ? "bg-green-500/10 border-green-500/30"
          : "bg-luxury-dark border-luxury-gray"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${autoImportEnabled ? "bg-green-500/20" : "bg-luxury-gray"}`}>
              <svg className={`w-6 h-6 ${autoImportEnabled ? "text-green-400" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-medium">
                {autoImportEnabled ? "Auto-Import Enabled" : "Import All Products"}
              </h3>
              <p className="text-sm text-gray-400">
                {autoImportEnabled
                  ? `All existing products will be auto-imported and all new products will be added automatically in future. (Markup: ${autoImportMarkupType === "percentage" ? autoImportMarkupValue + "%" : "₹" + autoImportMarkupValue})`
                  : "Import entire catalogue with a single markup setting. New products will be added automatically."
                }
              </p>
              {!autoImportEnabled && (
                <p className="text-xs text-gray-500 mt-1">
                  Or browse categories below to manually import specific products.
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {autoImportEnabled ? (
              <>
                <button
                  onClick={openAutoImportModal}
                  className="px-4 py-2 bg-luxury-gray hover:bg-luxury-gold/20 text-gray-300 hover:text-luxury-gold rounded-lg transition-colors text-sm font-medium"
                >
                  Update Markup
                </button>
                <button
                  onClick={handleDisableAutoImport}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm font-medium"
                >
                  Disable
                </button>
              </>
            ) : (
              <button
                onClick={openAutoImportModal}
                className="px-6 py-2.5 bg-luxury-gold hover:bg-yellow-600 text-black rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import All Products
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4 mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder={
              viewLevel === "categories"
                ? "Search categories..."
                : viewLevel === "brands"
                ? "Search brands..."
                : "Search products by name or SKU..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 bg-luxury-gray border border-luxury-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Categories View */}
      {viewLevel === "categories" && (
        <>
          {categories.length === 0 ? (
            <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-12 text-center">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h4 className="text-white font-medium mb-2">No Categories Available</h4>
              <p className="text-gray-500">Categories will appear here once added by admin.</p>
            </div>
          ) : getFilteredCategories().length === 0 ? (
            <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-12 text-center">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h4 className="text-white font-medium mb-2">No Results Found</h4>
              <p className="text-gray-500">No categories match &quot;{searchQuery}&quot;</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {getFilteredCategories().map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category)}
                  className="group"
                >
                  {/* Square Logo */}
                  <div className="aspect-square relative overflow-hidden rounded-2xl">
                    {category.logo ? (
                      <Image
                        src={category.logo}
                        alt={category.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-luxury-gray to-luxury-dark rounded-2xl">
                        <span className="text-4xl font-bold text-luxury-gold">
                          {category.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Category Info */}
                  <div className="pt-3 text-center">
                    <h3 className="text-white font-medium text-sm truncate group-hover:text-luxury-gold transition-colors">{category.name}</h3>
                    <p className="text-gray-500 text-xs mt-1">
                      {getCategoryProductCount(category.id)} products
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* List View for Categories */
            <div className="bg-luxury-dark rounded-xl border border-luxury-gray overflow-hidden">
              <table className="w-full">
                <thead className="bg-luxury-gray/50">
                  <tr>
                    <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Category</th>
                    <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Products</th>
                    <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Status</th>
                    <th className="text-right px-6 py-4 text-gray-400 text-sm font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-luxury-gray">
                  {getFilteredCategories().map((category) => (
                    <tr
                      key={category.id}
                      className="hover:bg-luxury-gray/30 cursor-pointer transition-colors"
                      onClick={() => handleCategoryClick(category)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg overflow-hidden relative flex-shrink-0">
                            {category.logo ? (
                              <Image
                                src={category.logo}
                                alt={category.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-luxury-gray to-luxury-dark">
                                <span className="text-xl font-bold text-luxury-gold">
                                  {category.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="text-white font-medium">{category.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-400">{getCategoryProductCount(category.id)} products</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-luxury-gold hover:text-yellow-400 transition-colors">
                          View Brands →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Brands View */}
      {viewLevel === "brands" && (
        <>
          {getCategoryBrands().length === 0 && !searchQuery ? (
            <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-12 text-center">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <h4 className="text-white font-medium mb-2">No Brands in {selectedCategory?.name}</h4>
              <p className="text-gray-500 mb-4">No brands are associated with this category yet.</p>
              <button
                onClick={handleBackToCategories}
                className="inline-flex items-center gap-2 bg-luxury-gold hover:bg-yellow-600 text-black font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Categories
              </button>
            </div>
          ) : getCategoryBrands().length === 0 && searchQuery ? (
            <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-12 text-center">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h4 className="text-white font-medium mb-2">No Results Found</h4>
              <p className="text-gray-500">No brands match &quot;{searchQuery}&quot;</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {getCategoryBrands().map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => handleBrandClick(brand)}
                  className="group"
                >
                  {/* Square Logo */}
                  <div className="aspect-square relative overflow-hidden rounded-2xl">
                    {brand.logo ? (
                      <Image
                        src={brand.logo}
                        alt={brand.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-luxury-gray to-luxury-dark rounded-2xl">
                        <span className="text-4xl font-bold text-luxury-gold">
                          {brand.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Brand Info */}
                  <div className="pt-3 text-center">
                    <h3 className="text-white font-medium text-sm truncate group-hover:text-luxury-gold transition-colors">{brand.name}</h3>
                    <p className="text-gray-500 text-xs mt-1">
                      {getBrandProductCount(brand.id)} products
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* List View for Brands */
            <div className="bg-luxury-dark rounded-xl border border-luxury-gray overflow-hidden">
              <table className="w-full">
                <thead className="bg-luxury-gray/50">
                  <tr>
                    <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Brand</th>
                    <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Products</th>
                    <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Status</th>
                    <th className="text-right px-6 py-4 text-gray-400 text-sm font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-luxury-gray">
                  {getCategoryBrands().map((brand) => (
                    <tr
                      key={brand.id}
                      className="hover:bg-luxury-gray/30 cursor-pointer transition-colors"
                      onClick={() => handleBrandClick(brand)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg overflow-hidden relative flex-shrink-0">
                            {brand.logo ? (
                              <Image
                                src={brand.logo}
                                alt={brand.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-luxury-gray to-luxury-dark">
                                <span className="text-xl font-bold text-luxury-gold">
                                  {brand.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="text-white font-medium">{brand.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-400">{getBrandProductCount(brand.id)} products</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-luxury-gold hover:text-yellow-400 transition-colors">
                          View Products →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Products Grid */}
      {viewLevel === "products" && (
        <>
          {getBrandProducts().length === 0 ? (
            <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-12 text-center">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h4 className="text-white font-medium mb-2">
                {searchQuery ? "No Products Found" : `No Products in ${selectedBrand?.name}`}
              </h4>
              <p className="text-gray-500 mb-4">
                {searchQuery
                  ? "Try adjusting your search query."
                  : "No products are available for this brand yet."}
              </p>
              <button
                onClick={handleBackToBrands}
                className="inline-flex items-center gap-2 bg-luxury-gold hover:bg-yellow-600 text-black font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Brands
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {getBrandProducts().map((product) => {
                const isImported = importedProductIds.has(product.id);
                return (
                  <div
                    key={product.id}
                    className="bg-luxury-dark rounded-xl border border-luxury-gray overflow-hidden hover:border-luxury-gold transition-colors group"
                  >
                    {/* Product Image */}
                    <div className="aspect-square bg-white relative overflow-hidden">
                      {product.images?.[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.sku}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      {/* Status Badge */}
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          product.status === "in_stock"
                            ? "bg-green-500/90 text-white"
                            : "bg-red-500/90 text-white"
                        }`}>
                          {product.status === "in_stock" ? "In Stock" : "Out of Stock"}
                        </span>
                      </div>
                      {/* Imported Badge */}
                      {isImported && (
                        <div className="absolute top-2 left-2">
                          <span className="px-2 py-1 text-xs rounded-full bg-luxury-gold text-black font-medium">
                            Imported
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      {/* Brand & Category */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-500">{product.brandName}</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-xs text-gray-500">{product.categoryName}</span>
                      </div>

                      {/* Name / SKU */}
                      <h3 className="text-white font-medium mb-2 line-clamp-2">
                        {product.name || product.sku}
                      </h3>

                      {/* SKU */}
                      <p className="text-xs text-gray-500 font-mono mb-3">{product.sku}</p>

                      {/* Sizes */}
                      {product.sizes && product.sizes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {product.sizes.slice(0, 5).map((s) => (
                            <span
                              key={s.id}
                              className="px-2 py-0.5 text-xs bg-luxury-gray text-gray-400 rounded"
                            >
                              {s.name}
                            </span>
                          ))}
                          {product.sizes.length > 5 && (
                            <span className="px-2 py-0.5 text-xs bg-luxury-gray text-gray-400 rounded">
                              +{product.sizes.length - 5}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Pricing */}
                      <div className="border-t border-luxury-gray pt-3 space-y-1">
                        {/* MRP */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Maximum Retail Price</span>
                          <span className="text-xs text-gray-400 line-through">{formatPrice(product.mrp)}</span>
                        </div>
                        {/* User-specific price */}
                        <div className="flex items-center justify-between">
                          <span className={`text-xs ${config.color}`}>
                            {userType === "wholesaler" ? "Wholesale Price" : userType === "reseller" ? "Reseller Price" : "Offer Price"}
                          </span>
                          <span className={`text-lg font-bold ${config.color}`}>
                            {formatPrice(getPrice(product))}
                          </span>
                        </div>
                        {/* Discount */}
                        {product.mrp > 0 && getPrice(product) > 0 && product.mrp > getPrice(product) && (
                          <div className="flex justify-end">
                            <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded">
                              {Math.round(((product.mrp - getPrice(product)) / product.mrp) * 100)}% off
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Import Button */}
                      <button
                        onClick={() => openImportModal(product)}
                        disabled={isImported}
                        className={`w-full mt-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                          isImported
                            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                            : "bg-luxury-gold hover:bg-yellow-600 text-black"
                        }`}
                      >
                        {isImported ? (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Already Imported
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Import Product
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View for Products */
            <div className="bg-luxury-dark rounded-xl border border-luxury-gray overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-luxury-gray/50">
                    <tr>
                      <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Product</th>
                      <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">SKU</th>
                      <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">MRP</th>
                      <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Your Price</th>
                      <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Discount</th>
                      <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">Status</th>
                      <th className="text-right px-6 py-4 text-gray-400 text-sm font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-luxury-gray">
                    {getBrandProducts().map((product) => {
                      const isImported = importedProductIds.has(product.id);
                      const discount = product.mrp > 0 && getPrice(product) > 0 && product.mrp > getPrice(product)
                        ? Math.round(((product.mrp - getPrice(product)) / product.mrp) * 100)
                        : 0;
                      return (
                        <tr
                          key={product.id}
                          className="hover:bg-luxury-gray/30 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-lg overflow-hidden relative flex-shrink-0 bg-white">
                                {product.images?.[0] ? (
                                  <Image
                                    src={product.images[0]}
                                    alt={product.sku}
                                    fill
                                    className="object-contain"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                    <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-white font-medium line-clamp-1">{product.name || product.sku}</p>
                                <p className="text-xs text-gray-500">{product.brandName} • {product.categoryName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-400 font-mono text-sm">{product.sku}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-400 line-through">{formatPrice(product.mrp)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-bold ${config.color}`}>{formatPrice(getPrice(product))}</span>
                          </td>
                          <td className="px-6 py-4">
                            {discount > 0 && (
                              <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded">
                                {discount}% off
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                product.status === "in_stock"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-red-500/20 text-red-400"
                              }`}>
                                {product.status === "in_stock" ? "In Stock" : "Out of Stock"}
                              </span>
                              {isImported && (
                                <span className="px-2 py-1 text-xs rounded-full bg-luxury-gold/20 text-luxury-gold">
                                  Imported
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => openImportModal(product)}
                              disabled={isImported}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                                isImported
                                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                  : "bg-luxury-gold hover:bg-yellow-600 text-black"
                              }`}
                            >
                              {isImported ? "Imported" : "Import"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Import Modal */}
      {importModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-luxury-dark rounded-2xl border border-luxury-gray w-full max-w-lg overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-luxury-gray flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Import Product</h3>
              <button
                onClick={closeImportModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Product Info */}
              <div className="flex gap-4 mb-6">
                <div className="w-20 h-20 bg-white rounded-lg overflow-hidden relative flex-shrink-0">
                  {selectedProduct.images?.[0] ? (
                    <Image
                      src={selectedProduct.images[0]}
                      alt={selectedProduct.sku}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium">{selectedProduct.name || selectedProduct.sku}</h4>
                  <p className="text-gray-500 text-sm font-mono">{selectedProduct.sku}</p>
                  <p className="text-gray-400 text-sm mt-1">{selectedProduct.brandName}</p>
                </div>
              </div>

              {/* Price Info */}
              <div className="bg-luxury-gray rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400 text-sm">
                    Your Cost Price ({userType === "wholesaler" ? "Wholesale Price" : userType === "reseller" ? "Reseller Price" : "Offer Price"})
                  </span>
                  <span className={`font-bold ${config.color}`}>{formatPrice(getPrice(selectedProduct))}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">MRP</span>
                  <span className="text-gray-400 line-through">{formatPrice(selectedProduct.mrp)}</span>
                </div>
              </div>

              {/* Markup Type Selection */}
              <div className="mb-4">
                <label className="text-gray-400 text-sm mb-2 block">Add Markup</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMarkupType("percentage")}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      markupType === "percentage"
                        ? "bg-luxury-gold text-black"
                        : "bg-luxury-gray text-gray-400 hover:text-white"
                    }`}
                  >
                    Percentage (%)
                  </button>
                  <button
                    onClick={() => setMarkupType("fixed")}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      markupType === "fixed"
                        ? "bg-luxury-gold text-black"
                        : "bg-luxury-gray text-gray-400 hover:text-white"
                    }`}
                  >
                    Fixed Amount
                  </button>
                </div>
              </div>

              {/* Markup Input */}
              <div className="mb-6">
                {markupType === "percentage" ? (
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Markup Percentage</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={markupPercentage}
                        onChange={(e) => setMarkupPercentage(e.target.value)}
                        className="w-full px-4 py-3 bg-luxury-gray border border-luxury-gray rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                        placeholder="Enter percentage"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Fixed Markup Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={markupFixed}
                        onChange={(e) => setMarkupFixed(e.target.value)}
                        className="w-full px-4 py-3 pl-8 bg-luxury-gray border border-luxury-gray rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                        placeholder="Enter amount"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Calculated Prices */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300 text-sm">Your Selling Price</span>
                  <span className="text-2xl font-bold text-green-400">{formatPrice(calculateSellingPrice())}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Your Profit per Sale</span>
                  <span className="text-green-400 font-medium">+{formatPrice(calculateProfit())}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={closeImportModal}
                  className="flex-1 py-3 bg-luxury-gray text-gray-300 rounded-lg font-medium hover:bg-luxury-gray/70 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex-1 py-3 bg-luxury-gold text-black rounded-lg font-medium hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {importing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Import to My Store
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Import Modal */}
      {autoImportModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-luxury-dark rounded-2xl border border-luxury-gray w-full max-w-lg overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-luxury-gray flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {autoImportEnabled ? "Update Auto-Import Settings" : "Import All Products"}
              </h3>
              <button
                onClick={closeAutoImportModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Feature Description */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-gray-300">
                    <p className="font-medium text-blue-400 mb-1">How Auto-Import Works:</p>
                    <ul className="space-y-1 text-gray-400">
                      <li>• All {products.length} products will be imported to your store</li>
                      <li>• Your markup will be applied to set your selling price</li>
                      <li>• New products added by admin will be auto-imported</li>
                      <li>• Removed products will be auto-removed from your store</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-luxury-gray rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-luxury-gold">{products.length}</p>
                  <p className="text-sm text-gray-400">Total Products</p>
                </div>
                <div className="bg-luxury-gray rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-400">{products.length - importedProductIds.size}</p>
                  <p className="text-sm text-gray-400">New to Import</p>
                </div>
              </div>

              {/* Markup Type Selection */}
              <div className="mb-4">
                <label className="text-gray-400 text-sm mb-2 block">Set Markup for All Products</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAutoImportMarkupType("percentage")}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      autoImportMarkupType === "percentage"
                        ? "bg-luxury-gold text-black"
                        : "bg-luxury-gray text-gray-400 hover:text-white"
                    }`}
                  >
                    Percentage (%)
                  </button>
                  <button
                    onClick={() => setAutoImportMarkupType("fixed")}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      autoImportMarkupType === "fixed"
                        ? "bg-luxury-gold text-black"
                        : "bg-luxury-gray text-gray-400 hover:text-white"
                    }`}
                  >
                    Fixed Amount
                  </button>
                </div>
              </div>

              {/* Markup Input */}
              <div className="mb-6">
                {autoImportMarkupType === "percentage" ? (
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Markup Percentage</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={autoImportMarkupValue}
                        onChange={(e) => setAutoImportMarkupValue(e.target.value)}
                        className="w-full px-4 py-3 bg-luxury-gray border border-luxury-gray rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                        placeholder="Enter percentage"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Fixed Markup Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={autoImportMarkupValue}
                        onChange={(e) => setAutoImportMarkupValue(e.target.value)}
                        className="w-full px-4 py-3 pl-8 bg-luxury-gray border border-luxury-gray rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                        placeholder="Enter amount"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Preview Example */}
              {products.length > 0 && products[0] && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-400 mb-2">Example Preview (first product):</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium text-sm">{products[0].name || products[0].sku || "Product"}</p>
                      <p className="text-gray-400 text-xs">Base: {formatPrice(getPrice(products[0]))}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold">
                        {formatPrice(calculateAutoImportPreviewPrice(getPrice(products[0])))}
                      </p>
                      <p className="text-green-400 text-xs">
                        +{formatPrice(calculateAutoImportPreviewPrice(getPrice(products[0])) - getPrice(products[0]))} profit
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={closeAutoImportModal}
                  className="flex-1 py-3 bg-luxury-gray text-gray-300 rounded-lg font-medium hover:bg-luxury-gray/70 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEnableAutoImport}
                  disabled={enablingAutoImport}
                  className="flex-1 py-3 bg-luxury-gold text-black rounded-lg font-medium hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {enablingAutoImport ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                      {autoImportEnabled ? "Updating..." : "Importing..."}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {autoImportEnabled ? "Update Settings" : "Enable Auto-Import"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
