"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import WholesaleLayout from "@/src/components/layouts/WholesaleLayout";

interface BrandObject {
  id?: string;
  name: string;
  slug?: string;
  logo?: string | null;
  status?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  images: string[];
  wholesalePrice: number;
  retailPrice: number;
  status: string;
  stockQuantity: number;
  brandName?: string;
  brand?: string | BrandObject;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
  logo: string | null;
}

interface ImportedProduct {
  id: string;
  categoryId: string;
  productId: string;
  brandName: string;
}

interface BrandInfo {
  name: string;
  productCount: number;
  sampleImage: string | null;
  logo?: string | null;
}

// Helper function to extract brand name from product
const getBrandName = (product: Product): string => {
  if (typeof product.brand === "object" && product.brand?.name) {
    return product.brand.name;
  }
  if (typeof product.brand === "string" && product.brand.trim()) {
    return product.brand.trim();
  }
  if (product.brandName && product.brandName.trim()) {
    return product.brandName.trim();
  }
  return "Other";
};

export default function CategoryBrandsPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.categoryId as string;

  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [importedProducts, setImportedProducts] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [brands, setBrands] = useState<BrandInfo[]>([]);

  // Check if category is imported
  useEffect(() => {
    const savedCategories = localStorage.getItem("wholesale_imported_categories");
    if (savedCategories) {
      const categories = JSON.parse(savedCategories);
      if (!categories.includes(categoryId)) {
        router.push("/wholesale/dashboard/manage-products");
        return;
      }
    } else {
      router.push("/wholesale/dashboard/manage-products");
      return;
    }
  }, [categoryId, router]);

  // Load imported products from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("wholesale_imported_products");
    if (saved) {
      const allProducts: ImportedProduct[] = JSON.parse(saved);
      const categoryProducts = allProducts
        .filter((p) => p.categoryId === categoryId)
        .map((p) => p.productId || p.id);
      setImportedProducts(new Set(categoryProducts));
    }
  }, [categoryId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch category details
        const catRes = await fetch(`/api/categories/${categoryId}`);
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategory(catData);
        }

        // Fetch products for this category
        const prodRes = await fetch(`/api/products?categoryId=${categoryId}`);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          const productList = prodData.products || prodData || [];
          setProducts(productList);

          // Extract unique brands
          const brandMap = new Map<string, BrandInfo>();
          productList.forEach((product: Product) => {
            const brandName = getBrandName(product);
            const brandLogo = typeof product.brand === "object" ? product.brand?.logo : null;

            if (!brandMap.has(brandName)) {
              brandMap.set(brandName, {
                name: brandName,
                productCount: 1,
                sampleImage: product.images?.[0] || null,
                logo: brandLogo,
              });
            } else {
              const existing = brandMap.get(brandName)!;
              existing.productCount++;
              if (!existing.sampleImage && product.images?.[0]) {
                existing.sampleImage = product.images[0];
              }
              if (!existing.logo && brandLogo) {
                existing.logo = brandLogo;
              }
            }
          });

          const brandList = Array.from(brandMap.values()).sort((a, b) =>
            a.name.localeCompare(b.name)
          );
          setBrands(brandList);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
      setLoading(false);
    };

    if (categoryId) {
      fetchData();
    }
  }, [categoryId]);

  const saveImportedProducts = (productIds: Set<string>, brandName: string) => {
    const saved = localStorage.getItem("wholesale_imported_products");
    let allProducts: ImportedProduct[] = saved ? JSON.parse(saved) : [];

    // Remove products from this category for this brand
    allProducts = allProducts.filter(
      (p) => !(p.categoryId === categoryId && p.brandName === brandName)
    );

    // Add new products
    productIds.forEach((id) => {
      const product = products.find((p) => p.id === id);
      if (product) {
        allProducts.push({
          id,
          productId: id,
          categoryId,
          brandName: getBrandName(product),
        });
      }
    });

    localStorage.setItem("wholesale_imported_products", JSON.stringify(allProducts));
  };

  const handleSelectProduct = async (productId: string) => {
    setImporting(productId);
    await new Promise((resolve) => setTimeout(resolve, 200));

    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const brandName = getBrandName(product);

    setImportedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }

      // Save to localStorage
      const saved = localStorage.getItem("wholesale_imported_products");
      let allProducts: ImportedProduct[] = saved ? JSON.parse(saved) : [];

      if (newSet.has(productId)) {
        // Add product
        allProducts.push({
          id: productId,
          productId,
          categoryId,
          brandName,
        });
      } else {
        // Remove product
        allProducts = allProducts.filter((p) => p.productId !== productId && p.id !== productId);
      }

      localStorage.setItem("wholesale_imported_products", JSON.stringify(allProducts));
      return newSet;
    });
    setImporting(null);
  };

  const handleSelectAllProducts = async () => {
    if (!selectedBrand) return;
    setImporting("all");
    await new Promise((resolve) => setTimeout(resolve, 500));

    const brandProds = products.filter((p) => getBrandName(p) === selectedBrand);
    const newSet = new Set(importedProducts);
    brandProds.forEach((p) => newSet.add(p.id));
    setImportedProducts(newSet);
    saveImportedProducts(newSet, selectedBrand);
    setImporting(null);
  };

  const handleRemoveAllProducts = async () => {
    if (!selectedBrand) return;
    setImporting("remove-all");
    await new Promise((resolve) => setTimeout(resolve, 300));

    const brandProds = products.filter((p) => getBrandName(p) === selectedBrand);
    const newSet = new Set(importedProducts);
    brandProds.forEach((p) => newSet.delete(p.id));
    setImportedProducts(newSet);

    // Update localStorage
    const saved = localStorage.getItem("wholesale_imported_products");
    let allProducts: ImportedProduct[] = saved ? JSON.parse(saved) : [];
    const brandProdIds = new Set(brandProds.map((p) => p.id));
    allProducts = allProducts.filter((p) => !brandProdIds.has(p.productId || p.id));
    localStorage.setItem("wholesale_imported_products", JSON.stringify(allProducts));

    setImporting(null);
  };

  // Filter products by selected brand
  const brandProducts = selectedBrand
    ? products.filter((p) => getBrandName(p) === selectedBrand)
    : [];

  // Filter by search query
  const filteredProducts = brandProducts.filter((product) => {
    const query = searchQuery.toLowerCase();
    return (
      product.sku.toLowerCase().includes(query) ||
      (product.name && product.name.toLowerCase().includes(query))
    );
  });

  // Filter brands by search query when in brands view
  const filteredBrands = brands.filter(
    (brand) => brand.name && brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const brandSelectedCount = brandProducts.filter((p) => importedProducts.has(p.id)).length;
  const brandTotalCount = filteredProducts.length;

  // Get selected product count for each brand
  const getBrandSelectedCount = (brandName: string) => {
    return products.filter((p) => getBrandName(p) === brandName && importedProducts.has(p.id))
      .length;
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

  // STEP 2: Show Brands Grid (after importing category)
  if (!selectedBrand) {
    return (
      <WholesaleLayout>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-4">
          <Link
            href="/wholesale/dashboard/manage-products"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Manage Your Store
          </Link>
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-purple-400">{category?.name || "Category"}</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {category?.logo ? (
              <img
                src={category.logo}
                alt={category.name}
                className="w-16 h-16 rounded-xl object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl font-bold text-purple-400">
                  {category?.name?.charAt(0).toUpperCase() || "?"}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-white">{category?.name || "Category"}</h2>
              <p className="text-gray-400">Select a brand to view and add products</p>
            </div>
          </div>
          <Link
            href="/wholesale/dashboard/manage-products"
            className="flex items-center gap-2 px-4 py-3 bg-luxury-gray hover:bg-luxury-gray/70 text-gray-300 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Categories
          </Link>
        </div>

        {/* Stats Bar */}
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4 mb-6">
          <div className="flex items-center gap-8">
            <div>
              <p className="text-gray-400 text-sm">Total Brands</p>
              <p className="text-2xl font-bold text-white">{brands.length}</p>
            </div>
            <div className="w-px h-10 bg-luxury-gray"></div>
            <div>
              <p className="text-gray-400 text-sm">Total Products</p>
              <p className="text-2xl font-bold text-purple-400">{products.length}</p>
            </div>
            <div className="w-px h-10 bg-luxury-gray"></div>
            <div>
              <p className="text-gray-400 text-sm">Products in My Store</p>
              <p className="text-2xl font-bold text-green-400">{importedProducts.size}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-luxury-dark border border-luxury-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Brands Grid */}
        {filteredBrands.length === 0 ? (
          <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-12 text-center">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h4 className="text-white font-medium mb-2">
              {searchQuery ? "No brands match your search" : "No Brands Available"}
            </h4>
            <p className="text-gray-500">
              {searchQuery ? "Try a different search term" : "Brands will appear here once products are added."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredBrands.map((brand) => {
              const selectedCount = getBrandSelectedCount(brand.name);

              return (
                <div
                  key={brand.name}
                  onClick={() => {
                    setSelectedBrand(brand.name);
                    setSearchQuery("");
                  }}
                  className="group cursor-pointer"
                >
                  {/* Brand Image */}
                  <div className="aspect-square rounded-2xl overflow-hidden border-2 border-luxury-gray group-hover:border-purple-500 transition-all mb-4 relative">
                    {brand.logo || brand.sampleImage ? (
                      <img
                        src={brand.logo || brand.sampleImage || ""}
                        alt={brand.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                        <span className="text-5xl font-bold text-white">
                          {brand.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Product count badge */}
                    <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                      {brand.productCount} products
                    </div>

                    {/* Selected products badge */}
                    {selectedCount > 0 && (
                      <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {selectedCount} in store
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-purple-500 text-white px-6 py-3 rounded-xl font-semibold">
                        VIEW PRODUCTS
                      </span>
                    </div>
                  </div>

                  {/* Brand Name */}
                  <h3 className="text-white font-bold text-lg text-center">{brand.name}</h3>
                </div>
              );
            })}
          </div>
        )}
      </WholesaleLayout>
    );
  }

  // STEP 3: Show Products Grid (after selecting a brand)
  return (
    <WholesaleLayout>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-4">
        <Link
          href="/wholesale/dashboard/manage-products"
          className="text-gray-400 hover:text-white transition-colors"
        >
          Manage Your Store
        </Link>
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <button
          onClick={() => {
            setSelectedBrand(null);
            setSearchQuery("");
          }}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {category?.name || "Category"}
        </button>
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-green-400">{selectedBrand}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center">
            <span className="text-2xl font-bold text-green-400">
              {selectedBrand.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{selectedBrand}</h2>
            <p className="text-gray-400">{brandProducts.length} products available</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {brandSelectedCount > 0 && (
            <button
              onClick={handleRemoveAllProducts}
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
            onClick={handleSelectAllProducts}
            disabled={importing !== null || brandSelectedCount === brandTotalCount || brandTotalCount === 0}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {importing === "all" ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            )}
            ADD ALL TO STORE
          </button>
          <button
            onClick={() => {
              setSelectedBrand(null);
              setSearchQuery("");
            }}
            className="flex items-center gap-2 px-4 py-3 bg-luxury-gray hover:bg-luxury-gray/70 text-gray-300 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Brands
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4 mb-6">
        <div className="flex items-center gap-8">
          <div>
            <p className="text-gray-400 text-sm">Total Products</p>
            <p className="text-2xl font-bold text-white">{brandTotalCount}</p>
          </div>
          <div className="w-px h-10 bg-luxury-gray"></div>
          <div>
            <p className="text-gray-400 text-sm">Added to Store</p>
            <p className="text-2xl font-bold text-green-400">{brandSelectedCount}</p>
          </div>
          <div className="w-px h-10 bg-luxury-gray"></div>
          <div className="flex-1">
            <p className="text-gray-400 text-sm mb-2">Selection Progress</p>
            <div className="w-full bg-luxury-gray rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${brandTotalCount > 0 ? (brandSelectedCount / brandTotalCount) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by SKU or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-luxury-dark border border-luxury-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
          />
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-12 text-center">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h4 className="text-white font-medium mb-2">
            {searchQuery ? "No products match your search" : "No Products Available"}
          </h4>
          <p className="text-gray-500">
            {searchQuery ? "Try a different search term" : "Products will appear here once added by admin."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const isSelected = importedProducts.has(product.id);
            const isProcessing = importing === product.id;

            return (
              <div
                key={product.id}
                className={`bg-luxury-dark rounded-xl border-2 overflow-hidden transition-all group ${
                  isSelected ? "border-green-500" : "border-luxury-gray hover:border-purple-500"
                }`}
              >
                {/* Product Image */}
                <div className="aspect-square bg-white relative overflow-hidden">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.sku}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
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
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        product.status === "in_stock"
                          ? "bg-green-500/90 text-white"
                          : "bg-red-500/90 text-white"
                      }`}
                    >
                      {product.status === "in_stock" ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>

                  {/* Selected checkmark */}
                  {isSelected && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white p-1.5 rounded-full">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <p className="text-gray-400 text-xs mb-1">{getBrandName(product)}</p>
                  <h3 className="text-white font-medium mb-1 truncate">{product.name || product.sku}</h3>
                  <p className="text-gray-500 text-sm mb-3">SKU: {product.sku}</p>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-green-400 font-bold">
                        ₹{product.wholesalePrice?.toLocaleString("en-IN") || "0"}
                      </p>
                      <p className="text-gray-500 text-xs">Wholesale Price</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{product.stockQuantity || 0}</p>
                      <p className="text-gray-500 text-xs">In Stock</p>
                    </div>
                  </div>

                  {/* Select Button */}
                  <button
                    onClick={() => handleSelectProduct(product.id)}
                    disabled={isProcessing}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-colors text-sm disabled:opacity-50 ${
                      isSelected
                        ? "bg-red-500/20 hover:bg-red-500/30 text-red-400"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                  >
                    {isProcessing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div>
                    ) : isSelected ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        REMOVE FROM STORE
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        ADD TO MY STORE
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </WholesaleLayout>
  );
}
