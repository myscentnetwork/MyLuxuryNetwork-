"use client";

import { useEffect, useState, useCallback } from "react";
import { FaShoppingCart, FaTimes, FaWhatsapp } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";

interface CartItem {
  productId: string;
  quantity: number;
}

interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  images: string[];
}

interface ExitIntentPopupProps {
  slug: string;
  cart: CartItem[];
  products: Product[];
  whatsappNumber?: string;
}

export default function ExitIntentPopup({
  slug,
  cart,
  products,
  whatsappNumber
}: ExitIntentPopupProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  // Check if popup was dismissed recently (within 1 hour)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissedAt = localStorage.getItem(`exit_popup_dismissed_${slug}`);
      if (dismissedAt) {
        const hourAgo = Date.now() - 60 * 60 * 1000;
        if (parseInt(dismissedAt) > hourAgo) {
          setHasShown(true);
        }
      }
    }
  }, [slug]);

  const handleExitIntent = useCallback((e: MouseEvent) => {
    // Only trigger when mouse leaves from the top of the viewport
    if (e.clientY <= 0 && !hasShown && cart.length > 0) {
      setShowPopup(true);
      setHasShown(true);
    }
  }, [hasShown, cart.length]);

  useEffect(() => {
    document.addEventListener("mouseleave", handleExitIntent);
    return () => {
      document.removeEventListener("mouseleave", handleExitIntent);
    };
  }, [handleExitIntent]);

  const handleClose = () => {
    setShowPopup(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(`exit_popup_dismissed_${slug}`, Date.now().toString());
    }
  };

  const cartProducts = cart.map(item => {
    const product = products.find(p => p.id === item.productId);
    return { ...item, product };
  }).filter(item => item.product);

  const cartTotal = cartProducts.reduce((total, item) => {
    return total + (item.product?.sellingPrice || 0) * item.quantity;
  }, 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (!showPopup || cart.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Popup */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-bounce-in">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700 transition-colors z-10"
        >
          <FaTimes className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-8 text-center text-white">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
            <FaShoppingCart className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Wait! Don&apos;t Leave Yet!</h2>
          <p className="text-white/90">You have items waiting in your cart</p>
        </div>

        {/* Cart Items Preview */}
        <div className="px-6 py-4">
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {cartProducts.slice(0, 3).map((item) => (
              <div key={item.productId} className="flex items-center gap-3">
                {item.product?.images[0] && (
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800 truncate">
                    {item.product?.name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Qty: {item.quantity} × {formatPrice(item.product?.sellingPrice || 0)}
                  </p>
                </div>
              </div>
            ))}
            {cartProducts.length > 3 && (
              <p className="text-xs text-neutral-500 text-center">
                +{cartProducts.length - 3} more items
              </p>
            )}
          </div>

          {/* Total */}
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Cart Total:</span>
              <span className="text-xl font-bold text-neutral-900">{formatPrice(cartTotal)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 space-y-3">
          <Link
            href={`/${slug}/products`}
            onClick={handleClose}
            className="flex items-center justify-center gap-2 w-full py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors font-semibold"
          >
            <FaShoppingCart className="w-5 h-5" />
            Complete Your Order
          </Link>

          {whatsappNumber && (
            <a
              href={`https://api.whatsapp.com/send?phone=${whatsappNumber.replace(/\D/g, "")}&text=${encodeURIComponent(`Hi! I have ${cart.length} items in my cart worth ${formatPrice(cartTotal)}. Can you help me complete my order?`)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClose}
              className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-semibold"
            >
              <FaWhatsapp className="w-5 h-5" />
              Order via WhatsApp
            </a>
          )}

          <button
            onClick={handleClose}
            className="w-full py-2 text-neutral-500 hover:text-neutral-700 transition-colors text-sm"
          >
            No thanks, I&apos;ll continue browsing
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          50% {
            transform: scale(1.02);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
