"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FaWhatsapp, FaArrowRight } from "react-icons/fa";

interface StoreData {
  id: string;
  slug: string;
  shopName: string;
  storeBanner: string | null;
  whatsappNumber: string;
  storeType: string;
}

interface Category {
  id: string;
  name: string;
  logo: string | null;
  productCount: number;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
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

export default function StorefrontHome() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<StoreData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [storeRes, categoriesRes, brandsRes, productsRes] =
          await Promise.all([
            fetch(`/api/store/${slug}`),
            fetch(`/api/store/${slug}/categories`),
            fetch(`/api/store/${slug}/brands`),
            fetch(`/api/store/${slug}/products`),
          ]);

        const storeData = await storeRes.json();
        const categoriesData = await categoriesRes.json();
        const brandsData = await brandsRes.json();
        const productsData = await productsRes.json();

        setStore(storeData.store);
        setCategories(categoriesData.categories || []);
        setBrands(brandsData.brands || []);

        const products = productsData.products || [];
        setFeaturedProducts(
          products.filter((p: Product) => p.isFeatured).slice(0, 8)
        );
        setNewArrivals(
          products.filter((p: Product) => p.isNewArrival).slice(0, 8)
        );
      } catch (err) {
        console.error("Failed to fetch store data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug]);

  const getWhatsAppLink = (product?: Product) => {
    if (!store?.whatsappNumber) return "#";
    const phone = store.whatsappNumber.replace(/\D/g, "");
    let message = `Hi, I'm interested in products from ${store.shopName}`;
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        {store?.storeBanner && (
          <Image
            src={store.storeBanner}
            alt={store.shopName}
            fill
            className="object-cover opacity-40"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center max-w-3xl px-4">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
              {store?.shopName}
            </h1>
            <p className="text-lg md:text-xl text-neutral-200 mb-8">
              Discover our curated collection of premium products
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={`/${slug}/products`}
                className="px-8 py-3.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium inline-flex items-center gap-2"
              >
                Browse Products
                <FaArrowRight className="w-4 h-4" />
              </Link>
              {store?.whatsappNumber && (
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-3.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium inline-flex items-center gap-2"
                >
                  <FaWhatsapp className="w-5 h-5" />
                  Contact Us
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-neutral-900">
                  Shop by Category
                </h2>
                <p className="text-neutral-600 mt-2">
                  Explore our wide range of categories
                </p>
              </div>
              <Link
                href={`/${slug}/products`}
                className="text-amber-600 font-medium hover:text-amber-700 flex items-center gap-1"
              >
                View All
                <FaArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {categories.slice(0, 12).map((category) => (
                <Link
                  key={category.id}
                  href={`/${slug}/products?category=${category.id}`}
                  className="group"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200 group-hover:shadow-xl transition-all duration-300">
                    {category.logo ? (
                      <Image
                        src={category.logo}
                        alt={category.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-5xl font-bold text-neutral-300">
                          {category.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="mt-4 text-center">
                    <h3 className="font-semibold text-neutral-800 group-hover:text-amber-600 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-neutral-500">
                      {category.productCount} Products
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-16 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-neutral-900">
                  Featured Products
                </h2>
                <p className="text-neutral-600 mt-2">
                  Hand-picked products just for you
                </p>
              </div>
              <Link
                href={`/${slug}/products?featured=true`}
                className="text-amber-600 font-medium hover:text-amber-700 flex items-center gap-1"
              >
                View All
                <FaArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  slug={slug}
                  formatPrice={formatPrice}
                  calculateDiscount={calculateDiscount}
                  getWhatsAppLink={getWhatsAppLink}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Brands Section */}
      {brands.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-neutral-900">
                Our Brands
              </h2>
              <p className="text-neutral-600 mt-2">
                Trusted brands you know and love
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {brands.slice(0, 12).map((brand) => (
                <Link
                  key={brand.id}
                  href={`/${slug}/products?brand=${brand.id}`}
                  className="group"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-white border border-neutral-200 group-hover:shadow-xl group-hover:border-amber-400 transition-all duration-300">
                    {brand.logo ? (
                      <Image
                        src={brand.logo}
                        alt={brand.name}
                        fill
                        className="object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                        <span className="text-4xl font-bold text-neutral-300">
                          {brand.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 text-center">
                    <h3 className="font-semibold text-neutral-800 group-hover:text-amber-600 transition-colors">
                      {brand.name}
                    </h3>
                    <p className="text-sm text-neutral-500">
                      {brand.productCount} Products
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="py-16 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-neutral-900">
                  New Arrivals
                </h2>
                <p className="text-neutral-600 mt-2">
                  Fresh additions to our collection
                </p>
              </div>
              <Link
                href={`/${slug}/products`}
                className="text-amber-600 font-medium hover:text-amber-700 flex items-center gap-1"
              >
                View All
                <FaArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {newArrivals.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  slug={slug}
                  formatPrice={formatPrice}
                  calculateDiscount={calculateDiscount}
                  getWhatsAppLink={getWhatsAppLink}
                  showNewBadge
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Can&apos;t find what you&apos;re looking for?
          </h2>
          <p className="text-lg text-neutral-300 mb-8">
            Get in touch with us on WhatsApp and we&apos;ll help you find the
            perfect product
          </p>
          {store?.whatsappNumber && (
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors text-lg font-medium"
            >
              <FaWhatsapp className="w-6 h-6" />
              Chat with Us
            </a>
          )}
        </div>
      </section>
    </div>
  );
}

// Product Card Component
function ProductCard({
  product,
  slug,
  formatPrice,
  calculateDiscount,
  getWhatsAppLink,
  showNewBadge = false,
}: {
  product: Product;
  slug: string;
  formatPrice: (price: number) => string;
  calculateDiscount: (mrp: number, sellingPrice: number) => number;
  getWhatsAppLink: (product: Product) => string;
  showNewBadge?: boolean;
}) {
  const discount = calculateDiscount(product.mrp, product.sellingPrice);

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
      <Link href={`/${slug}/product/${product.id}`}>
        <div className="relative aspect-square overflow-hidden">
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

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {showNewBadge && product.isNewArrival && (
              <span className="px-2.5 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                NEW
              </span>
            )}
            {product.isBestSeller && (
              <span className="px-2.5 py-1 bg-amber-500 text-white text-xs font-medium rounded-full">
                BEST SELLER
              </span>
            )}
            {discount > 0 && (
              <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                -{discount}%
              </span>
            )}
          </div>

          {/* Quick Action */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <a
              href={getWhatsAppLink(product)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
            >
              <FaWhatsapp className="w-4 h-4" />
              Enquire Now
            </a>
          </div>
        </div>
      </Link>

      <div className="p-4">
        <p className="text-xs text-amber-600 font-medium mb-1">
          {product.brand.name}
        </p>
        <Link href={`/${slug}/product/${product.id}`}>
          <h3 className="font-medium text-neutral-800 hover:text-amber-600 transition-colors line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-neutral-900">
            {formatPrice(product.sellingPrice)}
          </span>
          {discount > 0 && (
            <span className="text-sm text-neutral-400 line-through">
              {formatPrice(product.mrp)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
