"use client";

import { useState, useEffect } from "react";

interface Category {
  id: string;
  name: string;
  logo: string | null;
}

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
  brand?: string | BrandObject;
  brandName?: string;
  price: number;
  wholesalePrice: number;
  retailPrice: number;
  images: string[];
  categoryId: string;
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

interface BrandProducts {
  [brand: string]: Product[];
}

interface CategoryWithBrands {
  category: Category;
  brands: BrandProducts;
}

interface ImportedProduct {
  id: string;
  productId: string;
  categoryId: string;
  brandName?: string;
}

export default function StoreFrontend() {
  const [categories, setCategories] = useState<CategoryWithBrands[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedBrand, setSelectedBrand] = useState<{ categoryId: string; brand: string } | null>(
    null
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get all imported data from localStorage
        const savedCategories = localStorage.getItem("wholesale_imported_categories");
        const savedProducts = localStorage.getItem("wholesale_imported_products");
        const hiddenCategories = localStorage.getItem("wholesale_hidden_categories");
        const hiddenProducts = localStorage.getItem("wholesale_hidden_products");

        const importedCategoryIds: string[] = savedCategories ? JSON.parse(savedCategories) : [];
        const importedProductsData: ImportedProduct[] = savedProducts
          ? JSON.parse(savedProducts)
          : [];
        const hiddenCategoryIds = new Set(hiddenCategories ? JSON.parse(hiddenCategories) : []);
        const hiddenProductIds = new Set(hiddenProducts ? JSON.parse(hiddenProducts) : []);

        // Filter out hidden categories
        const visibleCategoryIds = importedCategoryIds.filter(
          (id: string) => !hiddenCategoryIds.has(id)
        );

        if (visibleCategoryIds.length === 0) {
          setLoading(false);
          return;
        }

        // Get imported product IDs (not hidden)
        const importedProductIds = new Set(
          importedProductsData
            .filter((p) => !hiddenProductIds.has(p.productId || p.id))
            .map((p) => p.productId || p.id)
        );

        // Fetch categories
        const catRes = await fetch("/api/categories");
        const catData = await catRes.json();
        const allCategories = catData.categories || catData || [];

        // Filter to only imported and visible categories
        const importedCategories = allCategories.filter((cat: Category) =>
          visibleCategoryIds.includes(cat.id)
        );

        // Fetch products for each category and organize by brands
        const categoriesWithBrands: CategoryWithBrands[] = await Promise.all(
          importedCategories.map(async (category: Category) => {
            try {
              const prodRes = await fetch(`/api/products?categoryId=${category.id}`);
              const prodData = await prodRes.json();
              const allProducts = prodData.products || prodData || [];

              // Filter products: must be selected (imported)
              const products = allProducts.filter((p: Product) => importedProductIds.has(p.id));

              // Group products by brand
              const brandProducts: BrandProducts = {};
              products.forEach((product: Product) => {
                const brand = getBrandName(product);
                if (!brandProducts[brand]) {
                  brandProducts[brand] = [];
                }
                brandProducts[brand].push(product);
              });

              return {
                category,
                brands: brandProducts,
              };
            } catch {
              return { category, brands: {} };
            }
          })
        );

        // Filter out categories with no products
        const filteredCategories = categoriesWithBrands.filter(
          (c) => Object.keys(c.brands).length > 0
        );

        setCategories(filteredCategories);

        // Auto-expand first category and select first brand
        const firstCategory = filteredCategories[0];
        if (firstCategory) {
          setExpandedCategories(new Set([firstCategory.category.id]));
          const firstBrand = Object.keys(firstCategory.brands)[0];
          if (firstBrand) {
            setSelectedBrand({ categoryId: firstCategory.category.id, brand: firstBrand });
            setSelectedCategory(firstCategory.category.id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const selectBrand = (categoryId: string, brand: string) => {
    setSelectedBrand({ categoryId, brand });
    setSelectedCategory(categoryId);
  };

  const getSelectedProducts = (): Product[] => {
    if (!selectedBrand) return [];
    const category = categories.find((c) => c.category.id === selectedBrand.categoryId);
    if (!category) return [];
    return category.brands[selectedBrand.brand] || [];
  };

  const selectedProducts = getSelectedProducts();
  const currentCategory = categories.find((c) => c.category.id === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">My Store</h1>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <svg
                  className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2"
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
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  0
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-72 min-h-[calc(100vh-73px)] bg-white border-r border-gray-200 sticky top-[73px] overflow-y-auto">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Categories
            </h2>
            <nav className="space-y-1">
              {categories.length === 0 ? (
                <div className="text-center py-8">
                  <svg
                    className="w-12 h-12 text-gray-300 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  <p className="text-gray-500 text-sm">No products in store</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Add products from &quot;Manage Your Store&quot;
                  </p>
                </div>
              ) : (
                categories.map(({ category, brands }) => {
                  const isExpanded = expandedCategories.has(category.id);
                  const brandNames = Object.keys(brands).sort();
                  const totalProducts = Object.values(brands).reduce(
                    (sum, products) => sum + products.length,
                    0
                  );

                  return (
                    <div key={category.id}>
                      {/* Category Header */}
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                          selectedCategory === category.id
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {category.logo ? (
                            <img
                              src={category.logo}
                              alt={category.name}
                              className="w-8 h-8 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-bold text-gray-600">
                                {category.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div className="text-left">
                            <span className="font-medium block">{category.name}</span>
                            <span className="text-xs text-gray-500">
                              {brandNames.length} brands, {totalProducts} products
                            </span>
                          </div>
                        </div>
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {/* Brand Sub-menu */}
                      {isExpanded && (
                        <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-100 pl-4">
                          {brandNames.map((brand) => {
                            const isSelected =
                              selectedBrand?.categoryId === category.id &&
                              selectedBrand?.brand === brand;
                            const productCount = brands[brand]?.length ?? 0;

                            return (
                              <button
                                key={brand}
                                onClick={() => selectBrand(category.id, brand)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                                  isSelected
                                    ? "bg-gray-900 text-white"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                              >
                                <span className="font-medium">{brand}</span>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full ${
                                    isSelected ? "bg-white/20" : "bg-gray-100"
                                  }`}
                                >
                                  {productCount}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {selectedBrand ? (
            <>
              {/* Breadcrumb */}
              <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Home</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  <span>{currentCategory?.category.name}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  <span className="text-gray-900 font-medium">{selectedBrand.brand}</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mt-2">{selectedBrand.brand}</h2>
                <p className="text-gray-500 mt-1">{selectedProducts.length} products</p>
              </div>

              {/* Products Grid */}
              {selectedProducts.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <svg
                    className="w-16 h-16 text-gray-300 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Products</h3>
                  <p className="text-gray-500">
                    Add products from &quot;Manage Your Store&quot;.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {selectedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden group hover:shadow-lg transition-shadow"
                    >
                      {/* Product Image */}
                      <div className="aspect-square bg-gray-100 relative overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg
                              className="w-16 h-16 text-gray-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                        {/* Quick Actions */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors">
                            <svg
                              className="w-5 h-5 text-gray-900"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                          <button className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors">
                            <svg
                              className="w-5 h-5 text-gray-900"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                          {getBrandName(product)}
                        </p>
                        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                          {product.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-bold text-gray-900">
                            ₹
                            {(
                              product.retailPrice ||
                              product.wholesalePrice ||
                              product.price
                            )?.toLocaleString("en-IN") || "0"}
                          </p>
                          <button className="p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <svg
                  className="w-16 h-16 text-gray-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Yet</h3>
                <p className="text-gray-500">
                  Add products from &quot;Manage Your Store&quot; to see them here.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
