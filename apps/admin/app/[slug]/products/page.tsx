"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { FaWhatsapp, FaTh, FaList, FaFilter, FaTimes } from "react-icons/fa";
import { HiOutlineSearch, HiX, HiChevronDown } from "react-icons/hi";

interface Category {
  id: string;
  name: string;
  productCount: number;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  mrp: number;
  sellingPrice: number;
  status: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  brand: { id: string; name: string };
  category: { id: string; name: string };
  images: string[];
}

interface StoreData {
  whatsappNumber: string;
  shopName: string;
}

export default function ProductsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get("brand") || "");
  const [sortBy, setSortBy] = useState("featured");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedCategory) queryParams.set("category", selectedCategory);
      if (selectedBrand) queryParams.set("brand", selectedBrand);
      if (searchQuery) queryParams.set("search", searchQuery);

      const res = await fetch(
        `/api/store/${slug}/products?${queryParams.toString()}`
      );
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  }, [slug, selectedCategory, selectedBrand, searchQuery]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [storeRes, categoriesRes, brandsRes] = await Promise.all([
          fetch(`/api/store/${slug}`),
          fetch(`/api/store/${slug}/categories`),
          fetch(`/api/store/${slug}/brands`),
        ]);

        const storeData = await storeRes.json();
        const categoriesData = await categoriesRes.json();
        const brandsData = await brandsRes.json();

        setStore(storeData.store);
        setCategories(categoriesData.categories || []);
        setBrands(brandsData.brands || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };

    if (slug) {
      fetchInitialData();
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      fetchProducts();
    }
  }, [slug, fetchProducts]);

  const handleFilterChange = (type: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(type, value);
    } else {
      params.delete(type);
    }

    if (type === "category") {
      setSelectedCategory(value);
    } else if (type === "brand") {
      setSelectedBrand(value);
    }

    router.push(`/${slug}/products?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery) {
      params.set("search", searchQuery);
    } else {
      params.delete("search");
    }
    router.push(`/${slug}/products?${params.toString()}`);
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedBrand("");
    setSearchQuery("");
    router.push(`/${slug}/products`);
  };

  const getWhatsAppLink = (product?: Product) => {
    if (!store?.whatsappNumber) return "#";
    const phone = store.whatsappNumber.replace(/\D/g, "");
    let message = `Hi, I'm browsing your catalogue.`;
    if (product) {
      message = `Hi, I'm interested in:\n\n*${product.name}*\nSKU: ${product.sku}\nPrice: Rs. ${product.sellingPrice.toLocaleString()}\n\nPlease share more details.`;
    }
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const calculateDiscount = (mrp: number, sellingPrice: number) => {
    if (mrp <= sellingPrice) return 0;
    return Math.round(((mrp - sellingPrice) / mrp) * 100);
  };

  // Sort products
  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.sellingPrice - b.sellingPrice;
      case "price-high":
        return b.sellingPrice - a.sellingPrice;
      case "best-sellers":
        // Best sellers first, then by name
        if (a.isBestSeller && !b.isBestSeller) return -1;
        if (!a.isBestSeller && b.isBestSeller) return 1;
        return a.name.localeCompare(b.name);
      case "new-arrival":
        // New arrivals first, then by name
        if (a.isNewArrival && !b.isNewArrival) return -1;
        if (!a.isNewArrival && b.isNewArrival) return 1;
        return a.name.localeCompare(b.name);
      case "featured":
      default:
        // Featured first, then by name
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return a.name.localeCompare(b.name);
    }
  });

  // Filter by price range
  const filteredProducts = sortedProducts.filter(
    (p) => p.sellingPrice >= priceRange[0] && p.sellingPrice <= priceRange[1]
  );

  const hasActiveFilters = selectedCategory || selectedBrand || searchQuery;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Page Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
            <Link href={`/${slug}`} className="hover:text-amber-600">
              Home
            </Link>
            <span>/</span>
            <span className="text-neutral-900">Products</span>
            {selectedCategory && (
              <>
                <span>/</span>
                <span className="text-neutral-900">
                  {categories.find((c) => c.id === selectedCategory)?.name}
                </span>
              </>
            )}
          </nav>
          <h1 className="text-3xl font-bold text-neutral-900">
            {selectedCategory
              ? categories.find((c) => c.id === selectedCategory)?.name
              : selectedBrand
                ? brands.find((b) => b.id === selectedBrand)?.name
                : "All Products"}
          </h1>
          <p className="text-neutral-600 mt-2">
            {filteredProducts.length} products found
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-28">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-neutral-900">Filters</h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-amber-600 hover:text-amber-700"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Search */}
              <form onSubmit={handleSearch} className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full px-4 py-2.5 pr-10 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-amber-600"
                  >
                    <HiOutlineSearch className="w-5 h-5" />
                  </button>
                </div>
              </form>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="font-medium text-neutral-900 mb-3">Categories</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <button
                    onClick={() => handleFilterChange("category", "")}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      !selectedCategory
                        ? "bg-amber-50 text-amber-700 font-medium"
                        : "text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleFilterChange("category", category.id)}
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCategory === category.id
                          ? "bg-amber-50 text-amber-700 font-medium"
                          : "text-neutral-600 hover:bg-neutral-50"
                      }`}
                    >
                      {category.name}
                      <span className="text-neutral-400 ml-2">
                        ({category.productCount})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Brands */}
              <div className="mb-6">
                <h3 className="font-medium text-neutral-900 mb-3">Brands</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <button
                    onClick={() => handleFilterChange("brand", "")}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      !selectedBrand
                        ? "bg-amber-50 text-amber-700 font-medium"
                        : "text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    All Brands
                  </button>
                  {brands.map((brand) => (
                    <button
                      key={brand.id}
                      onClick={() => handleFilterChange("brand", brand.id)}
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedBrand === brand.id
                          ? "bg-amber-50 text-amber-700 font-medium"
                          : "text-neutral-600 hover:bg-neutral-50"
                      }`}
                    >
                      {brand.name}
                      <span className="text-neutral-400 ml-2">
                        ({brand.productCount})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="font-medium text-neutral-900 mb-3">
                  Price Range
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) =>
                      setPriceRange([Number(e.target.value), priceRange[1]])
                    }
                    placeholder="Min"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-neutral-400">-</span>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([priceRange[0], Number(e.target.value)])
                    }
                    placeholder="Max"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Mobile Filter Toggle */}
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-lg text-neutral-700"
                >
                  <FaFilter className="w-4 h-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                  )}
                </button>

                {/* Sort & View */}
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <label className="sr-only">Sort products</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none w-full sm:w-56 px-4 py-2.5 pr-10 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-neutral-800 font-medium text-sm cursor-pointer shadow-sm hover:border-neutral-400 transition-colors"
                    >
                      <option value="featured">Sort by: Featured</option>
                      <option value="best-sellers">Sort by: Best Sellers</option>
                      <option value="new-arrival">Sort by: New Arrivals</option>
                      <option value="price-low">Sort by: Price (Low to High)</option>
                      <option value="price-high">Sort by: Price (High to Low)</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none bg-white pl-1">
                      <HiChevronDown className="w-5 h-5 text-neutral-500" />
                    </div>
                  </div>

                  <div className="flex items-center bg-neutral-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === "grid"
                          ? "bg-white text-amber-600 shadow-sm"
                          : "text-neutral-600 hover:text-neutral-900"
                      }`}
                    >
                      <FaTh className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === "list"
                          ? "bg-white text-amber-600 shadow-sm"
                          : "text-neutral-600 hover:text-neutral-900"
                      }`}
                    >
                      <FaList className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Filters */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-neutral-100">
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm">
                      Search: {searchQuery}
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          const params = new URLSearchParams(searchParams.toString());
                          params.delete("search");
                          router.push(`/${slug}/products?${params.toString()}`);
                        }}
                        className="ml-1 hover:text-amber-900"
                      >
                        <HiX className="w-4 h-4" />
                      </button>
                    </span>
                  )}
                  {selectedCategory && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm">
                      {categories.find((c) => c.id === selectedCategory)?.name}
                      <button
                        onClick={() => handleFilterChange("category", "")}
                        className="ml-1 hover:text-amber-900"
                      >
                        <HiX className="w-4 h-4" />
                      </button>
                    </span>
                  )}
                  {selectedBrand && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm">
                      {brands.find((b) => b.id === selectedBrand)?.name}
                      <button
                        onClick={() => handleFilterChange("brand", "")}
                        className="ml-1 hover:text-amber-900"
                      >
                        <HiX className="w-4 h-4" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl shadow-sm">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-neutral-100 flex items-center justify-center">
                  <HiOutlineSearch className="w-10 h-10 text-neutral-400" />
                </div>
                <h3 className="text-xl font-bold text-neutral-800 mb-2">
                  No products found
                </h3>
                <p className="text-neutral-600 mb-6">
                  Try adjusting your search or filters
                </p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : viewMode === "grid" ? (
              /* Grid View */
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredProducts.map((product) => (
                  <ProductGridCard
                    key={product.id}
                    product={product}
                    slug={slug}
                    formatPrice={formatPrice}
                    calculateDiscount={calculateDiscount}
                    getWhatsAppLink={getWhatsAppLink}
                    onBrandClick={(brandId) => setSelectedBrand(brandId)}
                  />
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <ProductListCard
                    key={product.id}
                    product={product}
                    slug={slug}
                    formatPrice={formatPrice}
                    calculateDiscount={calculateDiscount}
                    getWhatsAppLink={getWhatsAppLink}
                    onBrandClick={(brandId) => setSelectedBrand(brandId)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200">
              <h2 className="font-bold text-lg">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 text-neutral-600 hover:text-neutral-900"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(100vh-140px)]">
              {/* Search */}
              <form onSubmit={(e) => { handleSearch(e); setMobileFiltersOpen(false); }} className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full px-4 py-2.5 pr-10 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                  >
                    <HiOutlineSearch className="w-5 h-5" />
                  </button>
                </div>
              </form>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="font-medium text-neutral-900 mb-3">Categories</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => { handleFilterChange("category", ""); setMobileFiltersOpen(false); }}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
                      !selectedCategory
                        ? "bg-amber-50 text-amber-700 font-medium"
                        : "text-neutral-600"
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => { handleFilterChange("category", category.id); setMobileFiltersOpen(false); }}
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
                        selectedCategory === category.id
                          ? "bg-amber-50 text-amber-700 font-medium"
                          : "text-neutral-600"
                      }`}
                    >
                      {category.name} ({category.productCount})
                    </button>
                  ))}
                </div>
              </div>

              {/* Brands */}
              <div className="mb-6">
                <h3 className="font-medium text-neutral-900 mb-3">Brands</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => { handleFilterChange("brand", ""); setMobileFiltersOpen(false); }}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
                      !selectedBrand
                        ? "bg-amber-50 text-amber-700 font-medium"
                        : "text-neutral-600"
                    }`}
                  >
                    All Brands
                  </button>
                  {brands.map((brand) => (
                    <button
                      key={brand.id}
                      onClick={() => { handleFilterChange("brand", brand.id); setMobileFiltersOpen(false); }}
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
                        selectedBrand === brand.id
                          ? "bg-amber-50 text-amber-700 font-medium"
                          : "text-neutral-600"
                      }`}
                    >
                      {brand.name} ({brand.productCount})
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-neutral-200">
              <button
                onClick={() => { clearFilters(); setMobileFiltersOpen(false); }}
                className="w-full py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Grid Card Component
function ProductGridCard({
  product,
  slug,
  formatPrice,
  calculateDiscount,
  getWhatsAppLink,
  onBrandClick,
}: {
  product: Product;
  slug: string;
  formatPrice: (price: number) => string;
  calculateDiscount: (mrp: number, sellingPrice: number) => number;
  getWhatsAppLink: (product: Product) => string;
  onBrandClick: (brandId: string) => void;
}) {
  const discount = calculateDiscount(product.mrp, product.sellingPrice);

  return (
    <div className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col">
      <div className="relative aspect-square overflow-hidden">
        <Link href={`/${slug}/product/${product.id}`} className="block absolute inset-0">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center">
              <span className="text-neutral-400">No Image</span>
            </div>
          )}
        </Link>

        {/* Badges - Left side */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
          {product.isNewArrival && (
            <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded">
              NEW
            </span>
          )}
          {product.isBestSeller && (
            <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-medium rounded">
              BEST
            </span>
          )}
        </div>

        {/* Discount Badge - Right side */}
        {discount > 0 && (
          <div className="absolute top-2 right-2 z-10 pointer-events-none">
            <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
              {discount}% OFF
            </span>
          </div>
        )}
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <button
          onClick={() => onBrandClick(product.brand.id)}
          className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-1 text-left hover:text-amber-700 hover:underline transition-colors"
        >
          {product.brand.name}
        </button>
        <Link href={`/${slug}/product/${product.id}`}>
          <h3 className="font-semibold text-sm text-neutral-800 hover:text-amber-600 transition-colors line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>
        <div className="mt-2 space-y-1">
          {discount > 0 ? (
            <>
              <p className="text-xs text-neutral-500">
                Maximum Retail Price: <span className="line-through">{formatPrice(product.mrp)}</span>
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-neutral-600">Offer Price:</span>
                <span className="text-lg font-bold text-green-600">
                  {formatPrice(product.sellingPrice)}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-neutral-900">
                {formatPrice(product.sellingPrice)}
              </span>
            </div>
          )}
        </div>

        {/* Enquire Button - Always visible at bottom */}
        <a
          href={getWhatsAppLink(product)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2 mt-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
        >
          <FaWhatsapp className="w-4 h-4" />
          Enquire
        </a>
      </div>
    </div>
  );
}

// List Card Component
function ProductListCard({
  product,
  slug,
  formatPrice,
  calculateDiscount,
  getWhatsAppLink,
  onBrandClick,
}: {
  product: Product;
  slug: string;
  formatPrice: (price: number) => string;
  calculateDiscount: (mrp: number, sellingPrice: number) => number;
  getWhatsAppLink: (product: Product) => string;
  onBrandClick: (brandId: string) => void;
}) {
  const discount = calculateDiscount(product.mrp, product.sellingPrice);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex flex-col sm:flex-row">
        <Link
          href={`/${slug}/product/${product.id}`}
          className="relative w-full sm:w-48 md:w-56 aspect-square sm:aspect-auto flex-shrink-0"
        >
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center">
              <span className="text-neutral-400">No Image</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-1">
            {product.isNewArrival && (
              <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded">
                NEW
              </span>
            )}
            {product.isBestSeller && (
              <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-medium rounded">
                BEST
              </span>
            )}
            {discount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded">
                -{discount}%
              </span>
            )}
          </div>
        </Link>

        <div className="flex-1 p-4 sm:p-5 flex flex-col">
          <div className="flex-1">
            <p className="text-xs text-amber-600 font-medium mb-1">
              <button
                onClick={() => onBrandClick(product.brand.id)}
                className="hover:text-amber-700 hover:underline transition-colors"
              >
                {product.brand.name}
              </button>
              <span className="text-neutral-400"> • </span>
              {product.category.name}
            </p>
            <Link href={`/${slug}/product/${product.id}`}>
              <h3 className="font-semibold text-neutral-900 hover:text-amber-600 transition-colors mb-2">
                {product.name}
              </h3>
            </Link>
            <p className="text-sm text-neutral-600 line-clamp-2 mb-3">
              {product.description || "Premium quality product from our collection."}
            </p>
            <p className="text-xs text-neutral-500">SKU: {product.sku}</p>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
            <div className="space-y-1">
              {discount > 0 && (
                <p className="text-xs text-neutral-500">
                  Maximum Retail Price: <span className="line-through">{formatPrice(product.mrp)}</span>
                </p>
              )}
              <div className="flex items-baseline gap-2">
                {discount > 0 && <span className="text-xs text-neutral-600">Offer Price:</span>}
                <span className={`text-xl font-bold ${discount > 0 ? 'text-green-600' : 'text-neutral-900'}`}>
                  {formatPrice(product.sellingPrice)}
                </span>
              </div>
            </div>
            <a
              href={getWhatsAppLink(product)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
            >
              <FaWhatsapp className="w-4 h-4" />
              Enquire Now
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
