"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { FaWhatsapp, FaChevronLeft, FaChevronRight, FaHeart, FaRegHeart, FaShare, FaCheck, FaShoppingCart, FaMinus, FaPlus, FaFire, FaUsers, FaShieldAlt, FaClock } from "react-icons/fa";
import { HiOutlineArrowLeft, HiLightningBolt, HiTrendingUp } from "react-icons/hi";

// Indian cities for FOMO messages
const INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune",
  "Ahmedabad", "Jaipur", "Lucknow", "Surat", "Chandigarh", "Indore", "Nagpur"
];

// Get a consistent "random" value based on product ID for stable renders
const getProductHash = (id: string): number => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

// Countdown Timer Component
function CountdownTimer({ productId }: { productId: string }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const hash = getProductHash(productId);
    const hoursOffset = (hash % 12) + 1;
    const now = new Date();
    const endTime = new Date(now.getTime() + hoursOffset * 60 * 60 * 1000);

    const updateTimer = () => {
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ hours: hoursOffset, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [productId]);

  return (
    <div className="flex items-center gap-2">
      <FaClock className="w-4 h-4 text-red-500" />
      <span className="font-mono font-bold text-red-600 text-lg">
        {String(timeLeft.hours).padStart(2, '0')}:
        {String(timeLeft.minutes).padStart(2, '0')}:
        {String(timeLeft.seconds).padStart(2, '0')}
      </span>
    </div>
  );
}

// Cart item interface
interface CartItem {
  productId: string;
  quantity: number;
  addedAt: string;
}

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
  const [copied, setCopied] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Track scroll for sticky bar
  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar when scrolled past 500px
      setShowStickyBar(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cart and Favourites state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favourites, setFavourites] = useState<string[]>([]);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });

  // Show toast message
  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: "", visible: false }), 3000);
  }, []);

  // Load cart and favourites from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem(`cart_${slug}`);
      const savedFavourites = localStorage.getItem(`favourites_${slug}`);
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (e) {
          console.error("Failed to parse cart:", e);
        }
      }
      if (savedFavourites) {
        try {
          setFavourites(JSON.parse(savedFavourites));
        } catch (e) {
          console.error("Failed to parse favourites:", e);
        }
      }
    }
  }, [slug]);

  // Listen for cart updates from other components
  useEffect(() => {
    const handleCartUpdate = (e: CustomEvent<{ slug: string; cart: CartItem[] }>) => {
      if (e.detail.slug === slug) {
        setCart(e.detail.cart);
      }
    };

    const handleFavouritesUpdate = (e: CustomEvent<{ slug: string; favourites: string[] }>) => {
      if (e.detail.slug === slug) {
        setFavourites(e.detail.favourites);
      }
    };

    window.addEventListener("cartUpdated", handleCartUpdate as EventListener);
    window.addEventListener("favouritesUpdated", handleFavouritesUpdate as EventListener);
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate as EventListener);
      window.removeEventListener("favouritesUpdated", handleFavouritesUpdate as EventListener);
    };
  }, [slug]);

  // Save cart to localStorage and dispatch event
  const saveCart = useCallback((newCart: CartItem[]) => {
    setCart(newCart);
    if (typeof window !== "undefined") {
      localStorage.setItem(`cart_${slug}`, JSON.stringify(newCart));
      window.dispatchEvent(new CustomEvent("cartUpdated", {
        detail: { slug, cart: newCart }
      }));
    }
  }, [slug]);

  // Save favourites to localStorage and dispatch event
  const saveFavourites = useCallback((newFavourites: string[]) => {
    setFavourites(newFavourites);
    if (typeof window !== "undefined") {
      localStorage.setItem(`favourites_${slug}`, JSON.stringify(newFavourites));
      window.dispatchEvent(new CustomEvent("favouritesUpdated", {
        detail: { slug, favourites: newFavourites }
      }));
    }
  }, [slug]);

  // Get cart item for current product
  const cartItem = cart.find(item => item.productId === productId);
  const cartQuantity = cartItem?.quantity || 0;
  const isFavourite = favourites.includes(productId);

  // Add to cart handler
  const handleAddToCart = useCallback(() => {
    if (!product) return;

    const maxQty = product.stockQuantity || 0;
    if (cartQuantity + 1 > maxQty) {
      showToast("You cannot add more quantity of this product at the moment");
      return;
    }

    if (cartItem) {
      const newCart = cart.map(item =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      saveCart(newCart);
    } else {
      const newCart = [...cart, { productId, quantity: 1, addedAt: new Date().toISOString() }];
      saveCart(newCart);
    }
  }, [cart, cartItem, cartQuantity, product, productId, saveCart, showToast]);

  // Update cart quantity
  const updateQuantity = useCallback((newQuantity: number) => {
    if (!product) return;

    if (newQuantity <= 0) {
      const newCart = cart.filter(item => item.productId !== productId);
      saveCart(newCart);
    } else {
      const maxQty = product.stockQuantity || 0;
      if (newQuantity > maxQty) {
        showToast("You cannot add more quantity of this product at the moment");
        return;
      }
      const newCart = cart.map(item =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      );
      saveCart(newCart);
    }
  }, [cart, product, productId, saveCart, showToast]);

  // Toggle favourite
  const handleToggleFavourite = useCallback(() => {
    if (isFavourite) {
      saveFavourites(favourites.filter(id => id !== productId));
    } else {
      saveFavourites([...favourites, productId]);
    }
  }, [favourites, isFavourite, productId, saveFavourites]);

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

        // Save to recently viewed
        if (typeof window !== "undefined") {
          const key = `recently_viewed_${slug}`;
          const stored = localStorage.getItem(key);
          let recentlyViewed: string[] = [];
          if (stored) {
            try {
              recentlyViewed = JSON.parse(stored);
            } catch (e) {
              console.error("Failed to parse recently viewed:", e);
            }
          }
          // Remove if already exists, then add to front
          recentlyViewed = recentlyViewed.filter(id => id !== productId);
          recentlyViewed.unshift(productId);
          // Keep only last 10
          recentlyViewed = recentlyViewed.slice(0, 10);
          localStorage.setItem(key, JSON.stringify(recentlyViewed));
        }

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
    const storeUrl = typeof window !== "undefined" ? window.location.origin : "";
    const productUrl = `${storeUrl}/${slug}/product/${product.id}`;
    const imageUrl = product.images?.[0] || "";
    const isInStock = product.status === "in_stock";

    let message = `${isInStock ? "🛒 *Book Order*" : "❓ *Product Enquiry*"}\n\n`;
    message += `*${product.name}*\n`;
    message += `━━━━━━━━━━━━━━━\n`;
    message += `📦 SKU: ${product.sku}\n`;
    message += `🏷️ Brand: ${product.brand.name}\n`;
    message += `📂 Category: ${product.category.name}\n`;
    message += `💰 Price: ₹${product.sellingPrice.toLocaleString()}\n`;
    if (product.mrp > product.sellingPrice) {
      message += `🏷️ MRP: ₹${product.mrp.toLocaleString()} (${Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)}% off)\n`;
    }
    if (selectedSize) {
      message += `📏 Size: ${selectedSize}\n`;
    }
    if (selectedColour) {
      message += `🎨 Colour: ${selectedColour}\n`;
    }
    message += `📊 Status: ${isInStock ? "✅ Available" : "⚠️ Out of Stock"}\n`;
    message += `━━━━━━━━━━━━━━━\n\n`;
    if (imageUrl) {
      message += `🖼️ Product Image:\n${imageUrl}\n\n`;
    }
    message += `🔗 View Product:\n${productUrl}\n\n`;
    message += `🏪 Store: @${slug}\n\n`;
    message += isInStock ? `Please confirm availability and share payment details.` : `Please let me know when this product is back in stock.`;

    return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
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
                  onClick={handleToggleFavourite}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${
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
              <div className="flex items-baseline gap-3 mb-4">
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

              {/* Stock Status */}
              <div className="mb-4">
                {product.status === "in_stock" ? (
                  product.stockQuantity <= 5 && product.stockQuantity > 0 ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded-full animate-pulse">
                      <FaFire className="w-4 h-4" />
                      Only {product.stockQuantity} left - Order now!
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      In Stock - Available for Order
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 text-sm font-medium rounded-full">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Trust & Urgency Indicators */}
              <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100 space-y-3">
                {/* Star Rating & Reviews */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm font-medium text-neutral-700">
                      4.{(getProductHash(productId) % 5) + 5}
                    </span>
                    <span className="text-sm text-neutral-500">
                      ({(getProductHash(productId) % 50) + 20} reviews)
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                    <FaShieldAlt className="w-3 h-3" />
                    Verified Seller
                  </span>
                </div>

                {/* Buyers Count */}
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <FaUsers className="w-4 h-4 text-amber-500" />
                  <span className="font-medium">{((getProductHash(productId) % 150) + 100)}+ customers</span>
                  <span>bought this product</span>
                </div>

                {/* Last Purchased */}
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <HiLightningBolt className="w-4 h-4 text-amber-500" />
                  <span>Last purchased <strong>{(getProductHash(productId) % 45) + 5} minutes ago</strong></span>
                </div>

                {/* Trending in City */}
                {(getProductHash(productId) % 3 === 0) && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">
                    <HiTrendingUp className="w-4 h-4" />
                    <span>Trending in <strong>{INDIAN_CITIES[getProductHash(productId) % INDIAN_CITIES.length]}</strong></span>
                  </div>
                )}

                {/* Countdown Timer for Discounted Products */}
                {discount > 0 && (
                  <div className="flex items-center justify-between bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                    <span className="text-sm text-red-600 font-medium">Offer ends in:</span>
                    <CountdownTimer productId={productId} />
                  </div>
                )}

                {/* Price May Increase Warning */}
                {discount > 0 && (
                  <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg">
                    <HiTrendingUp className="w-4 h-4" />
                    <span>Price may increase after the offer ends!</span>
                  </div>
                )}

                {/* Trust Badges */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-amber-200">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white text-neutral-600 text-xs font-medium rounded-full shadow-sm">
                    <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7h2.05a1 1 0 01.95.68l1.68 5.05a1 1 0 010 .632l-.68 2.04a1 1 0 01-.95.68H13a1 1 0 01-1-1V8a1 1 0 011-1z" />
                    </svg>
                    Fast Delivery
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white text-neutral-600 text-xs font-medium rounded-full shadow-sm">
                    <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    100% Authentic
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white text-neutral-600 text-xs font-medium rounded-full shadow-sm">
                    <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Top Rated
                  </span>
                  {product.isBestSeller && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full shadow-sm">
                      <FaFire className="w-3.5 h-3.5" />
                      Selling Fast
                    </span>
                  )}
                </div>
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
                  <div
                    className="text-neutral-600 text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-2 prose-strong:text-neutral-700"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                </div>
              )}

              {/* Add to Cart Section */}
              {product.status === "in_stock" ? (
                <div className="space-y-4">
                  {cartQuantity > 0 ? (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden">
                        <button
                          onClick={() => updateQuantity(cartQuantity - 1)}
                          className="w-12 h-12 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors"
                        >
                          <FaMinus className="w-3 h-3" />
                        </button>
                        <span className="w-16 h-12 flex items-center justify-center font-semibold text-lg">
                          {cartQuantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(cartQuantity + 1)}
                          className="w-12 h-12 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors"
                        >
                          <FaPlus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex-1 text-center">
                        <p className="text-sm text-neutral-500">Subtotal</p>
                        <p className="text-xl font-bold text-neutral-900">
                          {formatPrice(product.sellingPrice * cartQuantity)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleAddToCart}
                      className="flex items-center justify-center gap-3 w-full py-4 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors text-lg font-semibold shadow-lg shadow-amber-500/30"
                    >
                      <FaShoppingCart className="w-5 h-5" />
                      Add to Cart
                    </button>
                  )}

                  {/* WhatsApp CTA */}
                  <a
                    href={getWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full py-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors text-lg font-semibold shadow-lg shadow-green-500/30"
                  >
                    <FaWhatsapp className="w-6 h-6" />
                    {cartQuantity > 0 ? "Buy on WhatsApp" : "Enquire on WhatsApp"}
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    disabled
                    className="flex items-center justify-center gap-3 w-full py-4 bg-neutral-200 text-neutral-400 rounded-xl cursor-not-allowed text-lg font-semibold"
                  >
                    <FaShoppingCart className="w-5 h-5" />
                    Out of Stock
                  </button>

                  {/* WhatsApp CTA for Enquiry */}
                  <a
                    href={getWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full py-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors text-lg font-semibold shadow-lg shadow-orange-500/30"
                  >
                    <FaWhatsapp className="w-6 h-6" />
                    Enquire on WhatsApp
                  </a>
                </div>
              )}

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

      {/* Sticky Buy Bar */}
      {product && showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 z-[90] bg-white border-t border-neutral-200 shadow-2xl transform transition-transform duration-300">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* Product Info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {product.images[0] && (
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="font-semibold text-neutral-900 text-sm truncate">{product.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-green-600">{formatPrice(product.sellingPrice)}</span>
                    {product.mrp > product.sellingPrice && (
                      <span className="text-xs text-neutral-400 line-through">{formatPrice(product.mrp)}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {product.status === "in_stock" ? (
                  <>
                    {cartQuantity > 0 ? (
                      <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(cartQuantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:bg-neutral-100"
                        >
                          <FaMinus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-8 h-8 flex items-center justify-center font-semibold text-sm">
                          {cartQuantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(cartQuantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:bg-neutral-100"
                        >
                          <FaPlus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleAddToCart}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium text-sm"
                      >
                        <FaShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </button>
                    )}
                    <a
                      href={getWhatsAppLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-sm"
                    >
                      <FaWhatsapp className="w-4 h-4" />
                      <span className="hidden sm:inline">Buy Now</span>
                    </a>
                  </>
                ) : (
                  <a
                    href={getWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm"
                  >
                    <FaWhatsapp className="w-4 h-4" />
                    Enquire
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] animate-fade-in">
          <div className="bg-neutral-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
