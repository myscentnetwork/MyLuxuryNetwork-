"use client";

import { useState } from "react";
import ProductCard from "./ProductCard";
import MobileFilterSheet from "./MobileFilterSheet";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  images: string[];
  category: string;
  brand: string;
  isNew: boolean;
  isFeatured: boolean;
  isOutOfStock: boolean;
}

interface ProductsSectionProps {
  products: Product[];
  username: string;
  whatsappNumber?: string;
  categories: string[];
  brands: string[];
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

export default function ProductsSection({
  products,
  username,
  whatsappNumber,
  categories,
  brands,
  currentCategory,
  currentBrand,
  currentFilter,
  productCounts,
}: ProductsSectionProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const hasFilters = currentCategory || currentBrand || currentFilter;

  return (
    <>
      {/* Active Filters */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-gray-400 text-sm">Filters:</span>
          {currentCategory && (
            <span className="inline-flex items-center gap-1 bg-luxury-gold/20 text-luxury-gold px-3 py-1 rounded-full text-sm">
              {currentCategory}
              <a
                href={`/${username}${currentBrand ? `?brand=${currentBrand}` : ""}${currentFilter ? `${currentBrand ? "&" : "?"}filter=${currentFilter}` : ""}`}
                className="hover:text-white"
              >
                ×
              </a>
            </span>
          )}
          {currentBrand && (
            <span className="inline-flex items-center gap-1 bg-luxury-gold/20 text-luxury-gold px-3 py-1 rounded-full text-sm">
              {currentBrand}
              <a
                href={`/${username}${currentCategory ? `?category=${currentCategory}` : ""}${currentFilter ? `${currentCategory ? "&" : "?"}filter=${currentFilter}` : ""}`}
                className="hover:text-white"
              >
                ×
              </a>
            </span>
          )}
          {currentFilter && (
            <span className="inline-flex items-center gap-1 bg-luxury-gold/20 text-luxury-gold px-3 py-1 rounded-full text-sm">
              {currentFilter === "new"
                ? "New Arrivals"
                : currentFilter === "featured"
                  ? "Featured"
                  : "In Stock"}
              <a
                href={`/${username}${currentCategory ? `?category=${currentCategory}` : ""}${currentBrand ? `${currentCategory ? "&" : "?"}brand=${currentBrand}` : ""}`}
                className="hover:text-white"
              >
                ×
              </a>
            </span>
          )}
          <a
            href={`/${username}`}
            className="text-gray-500 hover:text-luxury-gold text-sm ml-2"
          >
            Clear all
          </a>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-xl md:text-2xl font-bold text-white">
            {currentCategory ||
              currentBrand ||
              (currentFilter === "new"
                ? "New Arrivals"
                : currentFilter === "featured"
                  ? "Featured"
                  : currentFilter === "in_stock"
                    ? "In Stock"
                    : "All Products")}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {products.length} product{products.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Mobile Filter Button */}
        <button
          onClick={() => setIsFilterOpen(true)}
          className="lg:hidden flex items-center gap-2 px-4 py-2 bg-luxury-gray rounded-lg text-white text-sm"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filter
          {hasFilters && (
            <span className="w-5 h-5 bg-luxury-gold text-black text-xs rounded-full flex items-center justify-center font-bold">
              {(currentCategory ? 1 : 0) +
                (currentBrand ? 1 : 0) +
                (currentFilter ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* Products */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              sku={product.sku}
              price={product.price}
              image={product.images[0] || ""}
              category={product.category}
              brand={product.brand}
              username={username}
              whatsappNumber={whatsappNumber}
              isNew={product.isNew}
              isFeatured={product.isFeatured}
              isOutOfStock={product.isOutOfStock}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-luxury-dark/50 rounded-xl">
          <div className="text-luxury-gold text-5xl mb-4">📦</div>
          <h3 className="font-serif text-xl text-white mb-2">
            No products found
          </h3>
          <p className="text-gray-500 mb-4">
            {hasFilters ? "Try adjusting your filters" : "Check back soon!"}
          </p>
          {hasFilters && (
            <a
              href={`/${username}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-luxury-gold text-black rounded-lg font-medium hover:bg-yellow-500 transition-colors"
            >
              View All Products
            </a>
          )}
        </div>
      )}

      {/* Mobile Filter Sheet */}
      <MobileFilterSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        categories={categories}
        brands={brands}
        username={username}
        currentCategory={currentCategory}
        currentBrand={currentBrand}
        currentFilter={currentFilter}
        productCounts={productCounts}
      />
    </>
  );
}
