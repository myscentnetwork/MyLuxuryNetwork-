"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ResellerLayout from "@/components/ResellerLayout";
import { useMyStore } from "@/hooks/useMyStore";
import { useAuth } from "@/contexts/AuthContext";

export default function MyStore() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { products, removeProduct, loading: storeLoading } = useMyStore();
  const [search, setSearch] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Filter imported products by search
  const filteredProducts = useMemo(() => {
    if (!search) return products;
    return products.filter((product) =>
      (product.name || product.sku).toLowerCase().includes(search.toLowerCase()) ||
      product.brand.toLowerCase().includes(search.toLowerCase()) ||
      product.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  const loading = authLoading || storeLoading;

  const handleRemove = async (productId: string) => {
    setRemoving(productId);
    try {
      await removeProduct(productId);
    } catch (err) {
      console.error("Failed to remove product:", err);
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <ResellerLayout title="My Store">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-luxury-gold"></div>
        </div>
      </ResellerLayout>
    );
  }

  return (
    <ResellerLayout
      title="My Store"
      actions={
        <Link
          href="/dashboard/import"
          className="bg-luxury-gold hover:bg-yellow-600 text-black font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Import More Products
        </Link>
      }
    >
      {/* Stats */}
      <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-4 mb-6">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-gray-400 text-sm">Products in My Store</p>
            <p className="text-2xl font-bold text-luxury-gold">{products.length}</p>
          </div>
          <div className="w-px h-10 bg-luxury-gray"></div>
          <div>
            <p className="text-gray-400 text-sm">In Stock</p>
            <p className="text-2xl font-bold text-green-400">
              {products.filter((p) => p.status === "in_stock").length}
            </p>
          </div>
          <div className="w-px h-10 bg-luxury-gray"></div>
          <div>
            <p className="text-gray-400 text-sm">Out of Stock</p>
            <p className="text-2xl font-bold text-red-400">
              {products.filter((p) => p.status === "out_of_stock" || p.status === "deleted").length}
            </p>
          </div>
          <div className="w-px h-10 bg-luxury-gray"></div>
          <div>
            <p className="text-gray-400 text-sm">Visible</p>
            <p className="text-2xl font-bold text-blue-400">
              {products.filter((p) => p.isVisible).length}
            </p>
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="bg-luxury-dark rounded-xl border border-luxury-gray p-12 text-center">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-xl font-medium text-white mb-2">Your Store is Empty</h3>
          <p className="text-gray-400 mb-6">Start importing products to build your store catalog.</p>
          <Link
            href="/dashboard/import"
            className="bg-luxury-gold hover:bg-yellow-600 text-black font-medium px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import Products
          </Link>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search your products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-md px-4 py-2 bg-luxury-gray border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
            />
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`bg-luxury-dark rounded-xl border overflow-hidden hover:border-luxury-gold transition-colors ${
                  product.isVisible ? "border-luxury-gray" : "border-red-500/30"
                }`}
              >
                {/* Product Image */}
                <div className="aspect-square bg-white relative">
                  {product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.sku}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      product.status === "in_stock"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}>
                      {product.status === "in_stock" ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>
                  {/* Visibility Badge */}
                  {!product.isVisible && (
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">
                        Hidden
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {product.brandLogo ? (
                      <img src={product.brandLogo} alt={product.brand} className="w-6 h-6 object-contain" />
                    ) : null}
                    <span className="text-gray-400 text-sm">{product.brand}</span>
                  </div>
                  <h3 className="text-white font-medium mb-1">{product.name || product.sku}</h3>
                  <p className="text-gray-500 text-sm mb-3">{product.category}</p>

                  {/* Sizes */}
                  {product.sizes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {product.sizes.slice(0, 4).map((size) => (
                        <span key={size.id} className="px-2 py-0.5 bg-luxury-gray text-gray-300 text-xs rounded">
                          {size.name}
                        </span>
                      ))}
                      {product.sizes.length > 4 && (
                        <span className="px-2 py-0.5 bg-luxury-gray text-gray-400 text-xs rounded">
                          +{product.sizes.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Price if set */}
                  {product.sellingPrice && (
                    <p className="text-luxury-gold font-semibold mb-3">
                      ${product.sellingPrice.toFixed(2)}
                    </p>
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemove(product.id)}
                    disabled={removing === product.id}
                    className="w-full py-2 rounded-lg font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  >
                    {removing === product.id ? "Removing..." : "Remove from Store"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && search && (
            <div className="text-center text-gray-400 mt-8">
              No products match your search.
            </div>
          )}

          <div className="mt-6 text-center text-gray-500 text-sm">
            Showing {filteredProducts.length} of {products.length} products in your store
          </div>
        </>
      )}
    </ResellerLayout>
  );
}
