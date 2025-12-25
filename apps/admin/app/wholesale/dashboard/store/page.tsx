"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import WholesaleLayout from "@/src/components/layouts/WholesaleLayout";

interface Category {
  id: string;
  name: string;
  logo: string | null;
  status: string;
}

interface BrandObject {
  id?: string;
  name: string;
  slug?: string;
  logo?: string | null;
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
  brand?: string | BrandObject;
  brandName?: string;
  categoryName: string;
  categoryId: string;
}

interface ImportedProduct {
  id: string;
  categoryId: string;
  productId?: string;
  brandName?: string;
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

export default function MyStore() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());
  const [hiddenProducts, setHiddenProducts] = useState<Set<string>>(new Set());
  const [brands, setBrands] = useState<BrandInfo[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get imported categories from localStorage
        const savedCategories = localStorage.getItem("wholesale_imported_categories");
        const savedProducts = localStorage.getItem("wholesale_imported_products");
        const savedHiddenCats = localStorage.getItem("wholesale_hidden_categories");
        const savedHiddenProds = localStorage.getItem("wholesale_hidden_products");

        if (savedHiddenCats) {
          setHiddenCategories(new Set(JSON.parse(savedHiddenCats)));
        }
        if (savedHiddenProds) {
          setHiddenProducts(new Set(JSON.parse(savedHiddenProds)));
        }

        if (!savedCategories) {
          setLoading(false);
          return;
        }

        const importedCatIds: string[] = JSON.parse(savedCategories);

        // Fetch all categories
        const catRes = await fetch("/api/categories");
        if (catRes.ok) {
          const catData = await catRes.json();
          const allCategories = catData.categories || catData || [];
          const myCats = allCategories.filter((c: Category) => importedCatIds.includes(c.id));
          setCategories(myCats);
        }

        // Fetch all products
        if (savedProducts) {
          const importedProds: ImportedProduct[] = JSON.parse(savedProducts);
          if (importedProds.length > 0) {
            const prodRes = await fetch("/api/products");
            if (prodRes.ok) {
              const prodData = await prodRes.json();
              const allProducts = prodData.products || prodData || [];
              const importedIds = new Set(importedProds.map((p) => p.productId || p.id));
              const myProducts = allProducts.filter((p: Product) => importedIds.has(p.id));
              setProducts(myProducts);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // Extract brands when category is selected
  useEffect(() => {
    if (selectedCategory) {
      const categoryProducts = products.filter(
        (p) => p.categoryId === selectedCategory && !hiddenProducts.has(p.id)
      );

      const brandMap = new Map<string, BrandInfo>();
      categoryProducts.forEach((product) => {
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

      const brandList = Array.from(brandMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      setBrands(brandList);
    } else {
      setBrands([]);
    }
  }, [selectedCategory, products, hiddenProducts]);

  const getProductCountForCategory = (categoryId: string, includeHidden: boolean = false) => {
    return products.filter((p) => {
      const matchesCategory = p.categoryId === categoryId;
      const isHidden = hiddenProducts.has(p.id);
      return matchesCategory && (includeHidden || !isHidden);
    }).length;
  };

  const getBrandCountForCategory = (categoryId: string) => {
    const categoryProducts = products.filter(
      (p) => p.categoryId === categoryId && !hiddenProducts.has(p.id)
    );
    const brandSet = new Set(categoryProducts.map((p) => getBrandName(p)));
    return brandSet.size;
  };

  const getBrandProducts = (brandName: string) => {
    return products.filter((p) => {
      const matchesCategory = p.categoryId === selectedCategory;
      const matchesBrand = getBrandName(p) === brandName;
      const isHidden = hiddenProducts.has(p.id);

      if (!showArchived && isHidden) return false;
      if (showArchived && !isHidden) return false;

      if (!searchQuery) return matchesCategory && matchesBrand;

      const query = searchQuery.toLowerCase();
      const matchesSearch =
        p.sku.toLowerCase().includes(query) ||
        (p.name && p.name.toLowerCase().includes(query));

      return matchesCategory && matchesBrand && matchesSearch;
    });
  };

  const handleHideProduct = (productId: string) => {
    setHiddenProducts((prev) => {
      const newSet = new Set(prev);
      newSet.add(productId);
      localStorage.setItem("wholesale_hidden_products", JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const handleUnhideProduct = (productId: string) => {
    setHiddenProducts((prev) => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      localStorage.setItem("wholesale_hidden_products", JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const handleHideCategory = (categoryId: string) => {
    setHiddenCategories((prev) => {
      const newSet = new Set(prev);
      newSet.add(categoryId);
      localStorage.setItem("wholesale_hidden_categories", JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const handleUnhideCategory = (categoryId: string) => {
    setHiddenCategories((prev) => {
      const newSet = new Set(prev);
      newSet.delete(categoryId);
      localStorage.setItem("wholesale_hidden_categories", JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const visibleCategories = categories.filter((c) => !hiddenCategories.has(c.id));
  const archivedCategories = categories.filter((c) => hiddenCategories.has(c.id));
  const displayCategories = showArchived ? archivedCategories : visibleCategories;

  const selectedCategoryData = categories.find((c) => c.id === selectedCategory);
  const brandProducts = selectedBrand ? getBrandProducts(selectedBrand) : [];

  const totalVisibleProducts = products.filter((p) => !hiddenProducts.has(p.id)).length;
  const totalArchivedProducts = products.filter((p) => hiddenProducts.has(p.id)).length;

  // Filter brands by search when in brands view
  const filteredBrands = brands.filter(
    (brand) => brand.name && brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <WholesaleLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-luxury-gold"></div>
        </div>
      </WholesaleLayout>
    );
  }

  // VIEW 1: Categories Grid
  if (!selectedCategory) {
    return (
      <WholesaleLayout>
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">My Store</h2>
              <p className="text-gray-400 mt-1">
                Your {showArchived ? "archived" : "active"} categories and products
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowArchived(!showArchived);
                  setSearchQuery("");
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  showArchived
                    ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                    : "bg-luxury-gray text-gray-400 hover:bg-luxury-gray/70"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                {showArchived ? "View Active" : `Archived (${archivedCategories.length + totalArchivedProducts})`}
              </button>
              <Link
                href="/wholesale/dashboard/manage-products"
                className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add More Products
              </Link>
            </div>
          </div>
        </div>

        {categories.length === 0 ? (
          <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-12 text-center">
            <svg className="w-20 h-20 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-xl font-medium text-white mb-2">No Categories in Your Store</h3>
            <p className="text-gray-400 mb-6">Start by importing categories and selecting products.</p>
            <Link
              href="/wholesale/dashboard/manage-products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import Categories
            </Link>
          </div>
        ) : (
          <>
            {/* Stats Bar */}
            <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4 mb-8">
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-gray-400 text-sm">Active Categories</p>
                  <p className="text-2xl font-bold text-purple-400">{visibleCategories.length}</p>
                </div>
                <div className="w-px h-10 bg-luxury-gray"></div>
                <div>
                  <p className="text-gray-400 text-sm">Active Products</p>
                  <p className="text-2xl font-bold text-luxury-gold">{totalVisibleProducts}</p>
                </div>
                <div className="w-px h-10 bg-luxury-gray"></div>
                <div>
                  <p className="text-gray-400 text-sm">Archived</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {archivedCategories.length + totalArchivedProducts}
                  </p>
                </div>
                <div className="w-px h-10 bg-luxury-gray"></div>
                <div>
                  <p className="text-gray-400 text-sm">In Stock</p>
                  <p className="text-2xl font-bold text-green-400">
                    {products.filter((p) => p.status === "in_stock" && !hiddenProducts.has(p.id)).length}
                  </p>
                </div>
              </div>
            </div>

            {/* Categories Grid */}
            <h3 className="text-lg font-semibold text-white mb-4">
              {showArchived ? "Archived Categories" : "Your Categories"}
            </h3>

            {displayCategories.length === 0 ? (
              <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-12 text-center">
                <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <h4 className="text-white font-medium mb-2">
                  {showArchived ? "No Archived Categories" : "All Categories are Archived"}
                </h4>
                <p className="text-gray-500">
                  {showArchived ? "Hidden categories will appear here." : "Click 'Archived' to view hidden categories."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {displayCategories.map((category) => {
                  const productCount = getProductCountForCategory(category.id, showArchived);
                  const brandCount = getBrandCountForCategory(category.id);
                  const isHidden = hiddenCategories.has(category.id);

                  return (
                    <div key={category.id} className="group">
                      <button
                        onClick={() => {
                          setSelectedCategory(category.id);
                          setSearchQuery("");
                        }}
                        className={`w-full aspect-square rounded-2xl overflow-hidden border-2 transition-all mb-4 relative ${
                          isHidden
                            ? "border-yellow-500/50 opacity-75"
                            : "border-luxury-gray hover:border-luxury-gold"
                        }`}
                      >
                        {category.logo ? (
                          <img
                            src={category.logo}
                            alt={category.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${
                            isHidden
                              ? "bg-gradient-to-br from-yellow-500/20 to-yellow-600/10"
                              : "bg-gradient-to-br from-luxury-gold/30 to-luxury-gold/10"
                          }`}>
                            <span className={`text-6xl font-bold ${isHidden ? "text-yellow-400" : "text-luxury-gold"}`}>
                              {category.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}

                        {/* Badges */}
                        <div className="absolute top-3 right-3 flex flex-col gap-1">
                          <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                            isHidden ? "bg-yellow-500 text-black" : "bg-luxury-gold text-black"
                          }`}>
                            {brandCount} brands
                          </div>
                          <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                            {productCount} products
                          </div>
                        </div>

                        {isHidden && (
                          <div className="absolute top-3 left-3 bg-yellow-500/90 text-black px-2 py-1 rounded-full text-xs font-bold">
                            ARCHIVED
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className={`px-6 py-3 rounded-xl font-bold ${
                            isHidden ? "bg-yellow-500 text-black" : "bg-luxury-gold text-black"
                          }`}>
                            VIEW BRANDS
                          </span>
                        </div>
                      </button>

                      <h3 className="text-white font-bold text-lg text-center mb-3">
                        {category.name}
                      </h3>

                      {isHidden ? (
                        <button
                          onClick={() => handleUnhideCategory(category.id)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl font-medium transition-colors text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Restore Category
                        </button>
                      ) : (
                        <button
                          onClick={() => handleHideCategory(category.id)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-xl font-medium transition-colors text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                          Archive Category
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </WholesaleLayout>
    );
  }

  // VIEW 2: Brands Grid (when category is selected)
  if (!selectedBrand) {
    return (
      <WholesaleLayout>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-4">
          <button
            onClick={() => {
              setSelectedCategory(null);
              setSearchQuery("");
            }}
            className="text-gray-400 hover:text-white transition-colors"
          >
            My Store
          </button>
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-luxury-gold">{selectedCategoryData?.name || "Category"}</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {selectedCategoryData?.logo ? (
              <img
                src={selectedCategoryData.logo}
                alt={selectedCategoryData.name}
                className="w-16 h-16 rounded-xl object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-luxury-gold/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl font-bold text-luxury-gold">
                  {selectedCategoryData?.name?.charAt(0).toUpperCase() || "?"}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-white">{selectedCategoryData?.name || "Category"}</h2>
              <p className="text-gray-400">{brands.length} brands in your store</p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setSearchQuery("");
            }}
            className="flex items-center gap-2 px-4 py-3 bg-luxury-gray hover:bg-luxury-gray/70 text-gray-300 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Categories
          </button>
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
              className="w-full pl-10 pr-4 py-3 bg-luxury-dark border border-luxury-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-luxury-gold"
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
              {searchQuery ? "No brands match your search" : "No Brands in Store"}
            </h4>
            <p className="text-gray-500">
              {searchQuery ? "Try a different search term" : "Add products to see brands here."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredBrands.map((brand) => (
              <div
                key={brand.name}
                onClick={() => {
                  setSelectedBrand(brand.name);
                  setSearchQuery("");
                }}
                className="group cursor-pointer"
              >
                <div className="aspect-square rounded-2xl overflow-hidden border-2 border-luxury-gray group-hover:border-luxury-gold transition-all mb-4 relative">
                  {brand.logo || brand.sampleImage ? (
                    <img
                      src={brand.logo || brand.sampleImage || ""}
                      alt={brand.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-luxury-gold/30 to-luxury-gold/10 flex items-center justify-center">
                      <span className="text-5xl font-bold text-luxury-gold">
                        {brand.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                    {brand.productCount} products
                  </div>

                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-luxury-gold text-black px-6 py-3 rounded-xl font-bold">
                      VIEW PRODUCTS
                    </span>
                  </div>
                </div>

                <h3 className="text-white font-bold text-lg text-center">{brand.name}</h3>
              </div>
            ))}
          </div>
        )}
      </WholesaleLayout>
    );
  }

  // VIEW 3: Products Grid (when brand is selected)
  return (
    <WholesaleLayout>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-4">
        <button
          onClick={() => {
            setSelectedCategory(null);
            setSelectedBrand(null);
            setSearchQuery("");
          }}
          className="text-gray-400 hover:text-white transition-colors"
        >
          My Store
        </button>
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
          {selectedCategoryData?.name || "Category"}
        </button>
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-luxury-gold">{selectedBrand}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-luxury-gold/20 rounded-xl flex items-center justify-center">
            <span className="text-2xl font-bold text-luxury-gold">
              {selectedBrand.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{selectedBrand}</h2>
            <p className="text-gray-400">{brandProducts.length} products</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              showArchived
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-luxury-gray text-gray-400"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            {showArchived ? "View Active" : "View Archived"}
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
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-luxury-dark border border-luxury-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-luxury-gold"
          />
        </div>
      </div>

      {/* Products Grid */}
      {brandProducts.length === 0 ? (
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-12 text-center">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h4 className="text-white font-medium mb-2">
            {searchQuery ? "No products match your search" : showArchived ? "No Archived Products" : "No Active Products"}
          </h4>
          <p className="text-gray-500">
            {searchQuery ? "Try a different search term" : showArchived ? "Hidden products will appear here." : "All products are archived."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {brandProducts.map((product) => {
            const isHidden = hiddenProducts.has(product.id);

            return (
              <div
                key={product.id}
                className={`bg-luxury-dark rounded-xl border overflow-hidden transition-all group ${
                  isHidden
                    ? "border-yellow-500/50 opacity-90"
                    : "border-luxury-gray hover:border-luxury-gold"
                }`}
              >
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

                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      product.status === "in_stock"
                        ? "bg-green-500/90 text-white"
                        : "bg-red-500/90 text-white"
                    }`}>
                      {product.status === "in_stock" ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>

                  {isHidden && (
                    <div className="absolute top-2 left-2 bg-yellow-500/90 text-black px-2 py-1 rounded-full text-xs font-bold">
                      ARCHIVED
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <p className="text-gray-400 text-xs mb-1">{getBrandName(product)}</p>
                  <h3 className="text-white font-medium mb-1 truncate">
                    {product.name || product.sku}
                  </h3>
                  <p className="text-gray-500 text-sm mb-3">SKU: {product.sku}</p>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-luxury-gold font-bold">
                        ₹{product.wholesalePrice?.toLocaleString("en-IN") || "0"}
                      </p>
                      <p className="text-gray-500 text-xs">Wholesale Price</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{product.stockQuantity || 0}</p>
                      <p className="text-gray-500 text-xs">In Stock</p>
                    </div>
                  </div>

                  {isHidden ? (
                    <button
                      onClick={() => handleUnhideProduct(product.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl font-medium transition-colors text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Restore Product
                    </button>
                  ) : (
                    <button
                      onClick={() => handleHideProduct(product.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-xl font-medium transition-colors text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                      Archive Product
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </WholesaleLayout>
  );
}
