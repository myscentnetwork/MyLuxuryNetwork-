"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaTimes, FaShoppingCart, FaWhatsapp, FaHeart, FaRegHeart, FaChevronLeft, FaChevronRight, FaFire, FaUsers, FaShieldAlt } from "react-icons/fa";
import { HiLightningBolt } from "react-icons/hi";

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  mrp: number;
  sellingPrice: number;
  status: string;
  stockQuantity: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  brand: { id: string; name: string };
  category: { id: string; name: string };
  images: string[];
  sizes?: string[];
  colours?: { name: string; hexCode?: string }[];
}

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  formatPrice: (price: number) => string;
  isInCart: boolean;
  isFavourite: boolean;
  onAddToCart: () => void;
  onToggleFavourite: () => void;
  whatsappNumber?: string;
}

// Get a consistent "random" value based on product ID
const getProductHash = (id: string): number => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

// Strip HTML from description
const stripHtml = (html: string) => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
};

export default function QuickViewModal({
  product,
  isOpen,
  onClose,
  slug,
  formatPrice,
  isInCart,
  isFavourite,
  onAddToCart,
  onToggleFavourite,
  whatsappNumber,
}: QuickViewModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reset image index when product changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [product?.id]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const nextImage = useCallback(() => {
    if (product && product.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  }, [product]);

  const prevImage = useCallback(() => {
    if (product && product.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  }, [product]);

  const getWhatsAppLink = useCallback(() => {
    if (!whatsappNumber || !product) return "#";
    const phone = whatsappNumber.replace(/\D/g, "");
    const storeUrl = typeof window !== "undefined" ? window.location.origin : "";
    const productUrl = `${storeUrl}/${slug}/product/${product.id}`;
    const isInStock = product.status === "in_stock";

    let message = `${isInStock ? "🛒 *Book Order*" : "❓ *Product Enquiry*"}\n\n`;
    message += `*${product.name}*\n`;
    message += `━━━━━━━━━━━━━━━\n`;
    message += `📦 SKU: ${product.sku}\n`;
    message += `💰 Price: ₹${product.sellingPrice.toLocaleString()}\n`;
    message += `🔗 View: ${productUrl}\n\n`;
    message += isInStock ? `Please confirm availability.` : `Let me know when available.`;

    return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
  }, [whatsappNumber, product, slug]);

  if (!isOpen || !product) return null;

  const discount = product.mrp > product.sellingPrice
    ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)
    : 0;

  const isInStock = product.status === "in_stock";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-modal-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
        >
          <FaTimes className="w-5 h-5 text-neutral-600" />
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="relative w-full md:w-1/2 aspect-square md:aspect-auto md:min-h-[500px] bg-neutral-100">
            {product.images[currentImageIndex] ? (
              <Image
                src={product.images[currentImageIndex]}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-neutral-400">No Image</span>
              </div>
            )}

            {/* Image Navigation */}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                >
                  <FaChevronLeft className="w-4 h-4 text-neutral-700" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                >
                  <FaChevronRight className="w-4 h-4 text-neutral-700" />
                </button>

                {/* Image Dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {product.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        index === currentImageIndex
                          ? "bg-amber-500 w-6"
                          : "bg-white/70 hover:bg-white"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.isNewArrival && (
                <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full animate-pulse">
                  NEW
                </span>
              )}
              {product.isBestSeller && (
                <span className="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                  BEST SELLER
                </span>
              )}
              {discount > 0 && (
                <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                  {discount}% OFF
                </span>
              )}
            </div>

            {/* Favourite Button */}
            <button
              onClick={onToggleFavourite}
              className={`absolute top-4 right-16 md:right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                isFavourite
                  ? "bg-red-500 text-white"
                  : "bg-white/90 text-neutral-600 hover:text-red-500"
              }`}
            >
              {isFavourite ? (
                <FaHeart className="w-5 h-5" />
              ) : (
                <FaRegHeart className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Content Section */}
          <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto max-h-[50vh] md:max-h-[90vh]">
            {/* Brand */}
            <Link
              href={`/${slug}/products?brand=${product.brand.id}`}
              onClick={onClose}
              className="inline-block text-sm font-medium text-amber-600 hover:text-amber-700 mb-1"
            >
              {product.brand.name}
            </Link>

            {/* Title */}
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              {product.name}
            </h2>

            {/* SKU */}
            <p className="text-xs text-neutral-500 mb-3">SKU: {product.sku}</p>

            {/* Trust Indicators Row */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {/* Rating */}
              <div className="flex items-center gap-1">
                <div className="flex text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-xs text-neutral-500">
                  4.{(getProductHash(product.id) % 5) + 5}
                </span>
              </div>

              <span className="text-neutral-300">•</span>

              <span className="flex items-center gap-1 text-xs text-neutral-500">
                <FaUsers className="w-3 h-3" />
                {((getProductHash(product.id) % 150) + 50)}+ bought
              </span>

              <span className="text-neutral-300">•</span>

              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <FaShieldAlt className="w-3 h-3" />
                Verified
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-bold text-neutral-900">
                {formatPrice(product.sellingPrice)}
              </span>
              {discount > 0 && (
                <>
                  <span className="text-lg text-neutral-400 line-through">
                    {formatPrice(product.mrp)}
                  </span>
                  <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                    Save {formatPrice(product.mrp - product.sellingPrice)}
                  </span>
                </>
              )}
            </div>

            {/* Stock Status */}
            <div className="mb-4">
              {isInStock ? (
                product.stockQuantity <= 5 && product.stockQuantity > 0 ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded-full animate-pulse">
                    <FaFire className="w-4 h-4" />
                    Only few left - Order now!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    In Stock
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 text-sm font-medium rounded-full">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Last Purchased Indicator */}
            <div className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
              <HiLightningBolt className="w-4 h-4 text-amber-500" />
              <span>Last bought {(getProductHash(product.id) % 45) + 5} mins ago</span>
            </div>

            {/* Description */}
            <div className="mb-6">
              <p className="text-sm text-neutral-600 line-clamp-3">
                {stripHtml(product.description) || "Premium quality product from our collection."}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {isInStock ? (
                <button
                  onClick={onAddToCart}
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl transition-colors font-medium ${
                    isInCart
                      ? "bg-amber-500 text-white hover:bg-amber-600"
                      : "bg-neutral-100 text-neutral-700 hover:bg-amber-500 hover:text-white"
                  }`}
                >
                  <FaShoppingCart className="w-5 h-5" />
                  {isInCart ? "Added to Cart" : "Add to Cart"}
                </button>
              ) : (
                <button
                  disabled
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-neutral-100 text-neutral-400 cursor-not-allowed font-medium"
                >
                  <FaShoppingCart className="w-5 h-5" />
                  Out of Stock
                </button>
              )}

              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl transition-colors font-medium ${
                  isInStock
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-orange-500 text-white hover:bg-orange-600"
                }`}
              >
                <FaWhatsapp className="w-5 h-5" />
                {isInStock ? "Buy on WhatsApp" : "Enquire on WhatsApp"}
              </a>

              <Link
                href={`/${slug}/product/${product.id}`}
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full py-3 border border-neutral-200 rounded-xl text-neutral-700 hover:bg-neutral-50 transition-colors font-medium"
              >
                View Full Details
              </Link>
            </div>
          </div>
        </div>

        {/* Animation Styles */}
        <style jsx>{`
          @keyframes modal-in {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(20px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          .animate-modal-in {
            animation: modal-in 0.2s ease-out forwards;
          }
        `}</style>
      </div>
    </div>
  );
}
