"use client";

import Link from "next/link";

interface StoreSidebarProps {
  categories: string[];
  brands: string[];
  username: string;
  currentCategory?: string;
  currentBrand?: string;
  currentFilter?: string;
  productCounts: {
    total: number;
    inStock: number;
    new: number;
    featured: number;
  };
}

export default function StoreSidebar({
  categories,
  brands,
  username,
  currentCategory,
  currentBrand,
  currentFilter,
  productCounts,
}: StoreSidebarProps) {
  const buildUrl = (params: {
    category?: string;
    brand?: string;
    filter?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params.category) searchParams.set("category", params.category);
    if (params.brand) searchParams.set("brand", params.brand);
    if (params.filter) searchParams.set("filter", params.filter);
    const query = searchParams.toString();
    return `/${username}${query ? `?${query}` : ""}`;
  };

  return (
    <div className="sticky top-24 space-y-6">
      {/* Quick Filters */}
      <div className="bg-luxury-dark rounded-xl p-4 border border-luxury-gray/30">
        <h3 className="font-serif text-white font-semibold mb-4">
          Quick Filters
        </h3>
        <div className="space-y-2">
          <Link
            href={buildUrl({})}
            className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
              !currentCategory && !currentBrand && !currentFilter
                ? "bg-luxury-gold text-black font-medium"
                : "text-gray-400 hover:bg-luxury-gray/30 hover:text-white"
            }`}
          >
            <span>All Products</span>
            <span className="text-sm opacity-75">{productCounts.total}</span>
          </Link>

          <Link
            href={buildUrl({ filter: "in_stock" })}
            className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
              currentFilter === "in_stock"
                ? "bg-luxury-gold text-black font-medium"
                : "text-gray-400 hover:bg-luxury-gray/30 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              In Stock
            </span>
            <span className="text-sm opacity-75">{productCounts.inStock}</span>
          </Link>

          <Link
            href={buildUrl({ filter: "new" })}
            className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
              currentFilter === "new"
                ? "bg-luxury-gold text-black font-medium"
                : "text-gray-400 hover:bg-luxury-gray/30 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-luxury-gold text-xs">NEW</span>
              New Arrivals
            </span>
            <span className="text-sm opacity-75">{productCounts.new}</span>
          </Link>

          <Link
            href={buildUrl({ filter: "featured" })}
            className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
              currentFilter === "featured"
                ? "bg-luxury-gold text-black font-medium"
                : "text-gray-400 hover:bg-luxury-gray/30 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-luxury-gold"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Featured
            </span>
            <span className="text-sm opacity-75">{productCounts.featured}</span>
          </Link>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="bg-luxury-dark rounded-xl p-4 border border-luxury-gray/30">
          <h3 className="font-serif text-white font-semibold mb-4">
            Categories
          </h3>
          <div className="space-y-1">
            {categories.map((category) => (
              <Link
                key={category}
                href={buildUrl({
                  category,
                  brand: currentBrand,
                })}
                className={`block px-3 py-2 rounded-lg transition-colors ${
                  currentCategory?.toLowerCase() === category.toLowerCase()
                    ? "bg-luxury-gold text-black font-medium"
                    : "text-gray-400 hover:bg-luxury-gray/30 hover:text-white"
                }`}
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Brands */}
      {brands.length > 0 && (
        <div className="bg-luxury-dark rounded-xl p-4 border border-luxury-gray/30">
          <h3 className="font-serif text-white font-semibold mb-4">Brands</h3>
          <div className="space-y-1">
            {brands.map((brand) => (
              <Link
                key={brand}
                href={buildUrl({
                  category: currentCategory,
                  brand,
                })}
                className={`block px-3 py-2 rounded-lg transition-colors ${
                  currentBrand?.toLowerCase() === brand.toLowerCase()
                    ? "bg-luxury-gold text-black font-medium"
                    : "text-gray-400 hover:bg-luxury-gray/30 hover:text-white"
                }`}
              >
                {brand}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* WhatsApp Help */}
      <div className="bg-green-600/10 border border-green-500/30 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <div>
            <h4 className="text-white font-medium text-sm">Need Help?</h4>
            <p className="text-green-400 text-xs">Chat with us on WhatsApp</p>
          </div>
        </div>
        <p className="text-gray-400 text-xs">
          Click any product to enquire directly via WhatsApp. We respond within minutes!
        </p>
      </div>
    </div>
  );
}
