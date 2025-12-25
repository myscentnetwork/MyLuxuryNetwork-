"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FaWhatsapp, FaChevronLeft, FaChevronRight, FaHeart, FaShare, FaCheck } from "react-icons/fa";
import { HiOutlineArrowLeft } from "react-icons/hi";

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
  sizes: string[];
  colours: { name: string; hexCode?: string }[];
}

interface StoreData {
  id: string;
  username: string;
  shopName: string;
  whatsappNumber: string;
  storeType: string;
}

interface RelatedProduct {
  id: string;
  name: string;
  sellingPrice: number;
  mrp: number;
  images: string[];
  brand: { name: string };
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const productId = params.id as string;

  const [store, setStore] = useState<StoreData | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColour, setSelectedColour] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch store and all products
        const [storeRes, productsRes] = await Promise.all([
          fetch(`/api/store/${slug}`),
          fetch(`/api/store/${slug}/products`),
        ]);

        if (!storeRes.ok) {
          throw new Error("Store not found");
        }

        const storeData = await storeRes.json();
        const productsData = await productsRes.json();

        setStore(storeData.store);

        const products = productsData.products || [];
        const foundProduct = products.find((p: Product) => p.id === productId);

        if (!foundProduct) {
          throw new Error("Product not found");
        }

        setProduct(foundProduct);

        // Get related products from same category
        const related = products
          .filter(
            (p: Product) =>
              p.id !== productId && p.category.id === foundProduct.category.id
          )
          .slice(0, 4);
        setRelatedProducts(related);

        // Set default selections
        if (foundProduct.sizes?.length > 0) {
          setSelectedSize(foundProduct.sizes[0]);
        }
        if (foundProduct.colours?.length > 0) {
          setSelectedColour(foundProduct.colours[0].name);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    if (slug && productId) {
      fetchData();
    }
  }, [slug, productId]);

  const getWhatsAppLink = () => {
    if (!store?.whatsappNumber || !product) return "#";
    const phone = store.whatsappNumber.replace(/\D/g, "");

    let message = `Hi, I'm interested in:\n\n`;
    message += `*${product.name}*\n`;
    message += `SKU: ${product.sku}\n`;
    message += `Price: Rs. ${product.sellingPrice.toLocaleString()}\n`;

    if (selectedSize) {
      message += `Size: ${selectedSize}\n`;
    }
    if (selectedColour) {
      message += `Colour: ${selectedColour}\n`;
    }

    message += `\nPlease confirm availability and share payment details.`;

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

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: `Check out ${product?.name} at ${store?.shopName}`,
          url: url,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const nextImage = () => {
    if (product && product.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product && product.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">
            Product Not Found
          </h1>
          <p className="text-neutral-600 mb-6">{error}</p>
          <Link
            href={`/${slug}/products`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            <HiOutlineArrowLeft className="w-5 h-5" />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const discount = calculateDiscount(product.mrp, product.sellingPrice);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-neutral-500">
            <Link href={`/${slug}`} className="hover:text-amber-600">
              Home
            </Link>
            <span>/</span>
            <Link
              href={`/${slug}/products`}
              className="hover:text-amber-600"
            >
              Products
            </Link>
            <span>/</span>
            <Link
              href={`/${slug}/products?category=${product.category.id}`}
              className="hover:text-amber-600"
            >
              {product.category.name}
            </Link>
            <span>/</span>
            <span className="text-neutral-900 line-clamp-1">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-sm">
              {product.images[currentImageIndex] ? (
                <Image
                  src={product.images[currentImageIndex]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
                  <span className="text-neutral-400 text-lg">No Image</span>
                </div>
              )}

              {/* Image Navigation */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                  >
                    <FaChevronLeft className="w-4 h-4 text-neutral-700" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                  >
                    <FaChevronRight className="w-4 h-4 text-neutral-700" />
                  </button>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNewArrival && (
                  <span className="px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-full">
                    NEW ARRIVAL
                  </span>
                )}
                {product.isBestSeller && (
                  <span className="px-3 py-1 bg-amber-500 text-white text-sm font-medium rounded-full">
                    BEST SELLER
                  </span>
                )}
                {discount > 0 && (
                  <span className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-full">
                    {discount}% OFF
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button
                  onClick={() => setWishlist(!wishlist)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                    wishlist
                      ? "bg-red-500 text-white"
                      : "bg-white/90 text-neutral-600 hover:text-red-500"
                  }`}
                >
                  <FaHeart className="w-5 h-5" />
                </button>
                <button
                  onClick={handleShare}
                  className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg text-neutral-600 hover:text-amber-600 transition-colors"
                >
                  {copied ? (
                    <FaCheck className="w-4 h-4 text-green-500" />
                  ) : (
                    <FaShare className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden ${
                      currentImageIndex === index
                        ? "ring-2 ring-amber-500"
                        : "ring-1 ring-neutral-200"
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} - ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8">
              {/* Brand */}
              <Link
                href={`/${slug}/products?brand=${product.brand.id}`}
                className="inline-block text-sm font-medium text-amber-600 hover:text-amber-700 mb-2"
              >
                {product.brand.name}
              </Link>

              {/* Title */}
              <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-2">
                {product.name}
              </h1>

              {/* SKU */}
              <p className="text-sm text-neutral-500 mb-4">SKU: {product.sku}</p>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl font-bold text-neutral-900">
                  {formatPrice(product.sellingPrice)}
                </span>
                {discount > 0 && (
                  <>
                    <span className="text-xl text-neutral-400 line-through">
                      {formatPrice(product.mrp)}
                    </span>
                    <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                      Save {formatPrice(product.mrp - product.sellingPrice)}
                    </span>
                  </>
                )}
              </div>

              {/* Sizes */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-neutral-900 mb-3">
                    Size
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          selectedSize === size
                            ? "border-amber-500 bg-amber-50 text-amber-700"
                            : "border-neutral-200 text-neutral-700 hover:border-neutral-300"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colours */}
              {product.colours && product.colours.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-neutral-900 mb-3">
                    Colour: {selectedColour}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {product.colours.map((colour) => (
                      <button
                        key={colour.name}
                        onClick={() => setSelectedColour(colour.name)}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          selectedColour === colour.name
                            ? "border-amber-500 ring-2 ring-amber-200"
                            : "border-neutral-200"
                        }`}
                        style={{
                          backgroundColor: colour.hexCode || "#e5e5e5",
                        }}
                        title={colour.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-neutral-900 mb-2">
                    Description
                  </h3>
                  <p className="text-neutral-600 text-sm leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* WhatsApp CTA */}
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors text-lg font-semibold shadow-lg shadow-green-500/30"
              >
                <FaWhatsapp className="w-6 h-6" />
                Buy on WhatsApp
              </a>

              <p className="text-center text-sm text-neutral-500 mt-3">
                Chat with us to confirm availability & place your order
              </p>

              {/* Store Info */}
              <div className="mt-6 pt-6 border-t border-neutral-100">
                <p className="text-sm text-neutral-600">
                  Sold by:{" "}
                  <Link
                    href={`/${slug}`}
                    className="font-medium text-amber-600 hover:text-amber-700"
                  >
                    {store?.shopName}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  href={`/${slug}/product/${relatedProduct.id}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="relative aspect-square overflow-hidden">
                    {relatedProduct.images[0] ? (
                      <Image
                        src={relatedProduct.images[0]}
                        alt={relatedProduct.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center">
                        <span className="text-neutral-400">No Image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-amber-600 font-medium mb-0.5">
                      {relatedProduct.brand.name}
                    </p>
                    <h3 className="font-medium text-sm text-neutral-800 line-clamp-2 mb-1">
                      {relatedProduct.name}
                    </h3>
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-neutral-900">
                        {formatPrice(relatedProduct.sellingPrice)}
                      </span>
                      {relatedProduct.mrp > relatedProduct.sellingPrice && (
                        <span className="text-xs text-neutral-400 line-through">
                          {formatPrice(relatedProduct.mrp)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
