"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback, useMemo } from "react";
import { FaWhatsapp, FaTh, FaList, FaFilter, FaTimes, FaHeart, FaRegHeart, FaShoppingCart, FaCheck, FaFire, FaClock, FaUsers, FaMapMarkerAlt, FaShieldAlt, FaEye } from "react-icons/fa";
import { HiOutlineSearch, HiX, HiChevronDown, HiLightningBolt, HiTrendingUp } from "react-icons/hi";
import QuickViewModal from "../components/QuickViewModal";

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
    // Create a consistent end time based on product ID (cycles every 24 hours)
    const hash = getProductHash(productId);
    const hoursOffset = (hash % 12) + 1; // 1-12 hours
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
    <div className="flex items-center gap-1 text-xs">
      <FaClock className="w-3 h-3 text-red-500" />
      <span className="font-mono font-bold text-red-600">
        {String(timeLeft.hours).padStart(2, '0')}:
        {String(timeLeft.minutes).padStart(2, '0')}:
        {String(timeLeft.seconds).padStart(2, '0')}
      </span>
    </div>
  );
}

// Cart Preview Slide-in Component
function CartPreviewSlideIn({
  isVisible,
  cart,
  products,
  formatPrice,
  slug,
  onClose,
}: {
  isVisible: boolean;
  cart: CartItem[];
  products: Product[];
  formatPrice: (price: number) => string;
  slug: string;
  onClose: () => void;
}) {
  const lastAddedItem = cart[cart.length - 1];
  const lastProduct = lastAddedItem
    ? products.find((p) => p.id === lastAddedItem.productId)
    : null;

  const cartTotal = cart.reduce((total, item) => {
    const product = products.find((p) => p.id === item.productId);
    return total + (product?.sellingPrice || 0) * item.quantity;
  }, 0);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (!isVisible || !lastProduct) return null;

  return (
    <div className="fixed bottom-20 right-4 z-[100] animate-slide-in-right">
      <div className="bg-white rounded-xl shadow-2xl border border-neutral-200 w-80 overflow-hidden">
        {/* Header */}
        <div className="bg-green-500 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaCheck className="w-4 h-4" />
            <span className="font-medium text-sm">Added to Cart!</span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
          >
            <FaTimes className="w-3 h-3" />
          </button>
        </div>

        {/* Product Preview */}
        <div className="p-4">
          <div className="flex gap-3">
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              {lastProduct.images[0] ? (
                <Image
                  src={lastProduct.images[0]}
                  alt={lastProduct.name}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                  <span className="text-xs text-neutral-400">No Image</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-800 truncate">
                {lastProduct.name}
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Qty: {lastAddedItem.quantity}
              </p>
              <p className="text-sm font-bold text-amber-600 mt-1">
                {formatPrice(lastProduct.sellingPrice)}
              </p>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="mt-4 pt-3 border-t border-neutral-100">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">
                Cart ({totalItems} {totalItems === 1 ? "item" : "items"})
              </span>
              <span className="font-bold text-neutral-900">
                {formatPrice(cartTotal)}
              </span>
            </div>
          </div>

          {/* View Cart Button */}
          <Link
            href={`/${slug}/products`}
            onClick={onClose}
            className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium text-sm"
          >
            <FaShoppingCart className="w-4 h-4" />
            View Cart
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Recently Viewed Section Component
function RecentlyViewedSection({
  slug,
  products,
  formatPrice,
}: {
  slug: string;
  products: Product[];
  formatPrice: (price: number) => string;
}) {
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`recently_viewed_${slug}`);
      if (stored) {
        try {
          setRecentlyViewed(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse recently viewed:", e);
        }
      }
    }
  }, [slug]);

  const recentProducts = recentlyViewed
    .map(id => products.find(p => p.id === id))
    .filter((p): p is Product => p !== undefined)
    .slice(0, 6);

  if (recentProducts.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <FaClock className="w-4 h-4 text-amber-500" />
        <h3 className="font-bold text-neutral-900">Recently Viewed</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-neutral-300">
        {recentProducts.map((product) => (
          <Link
            key={product.id}
            href={`/${slug}/product/${product.id}`}
            className="flex-shrink-0 w-24 group"
          >
            <div className="relative w-24 h-24 rounded-lg overflow-hidden mb-2">
              {product.images[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                  <span className="text-xs text-neutral-400">No Image</span>
                </div>
              )}
            </div>
            <p className="text-xs text-neutral-700 line-clamp-2 group-hover:text-amber-600 transition-colors">
              {product.name}
            </p>
            <p className="text-xs font-bold text-amber-600 mt-0.5">
              {formatPrice(product.sellingPrice)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Flash Sale Banner Component
function FlashSaleBanner() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // End of day countdown
    const updateTimer = () => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ hours: 23, minutes: 59, seconds: 59 });
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
  }, []);

  return (
    <div className="bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white py-3 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-center">
          {/* Animated icons */}
          <div className="flex items-center gap-2">
            <HiLightningBolt className="w-5 h-5 animate-pulse" />
            <span className="font-bold text-lg">FLASH SALE!</span>
            <HiLightningBolt className="w-5 h-5 animate-pulse" />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm sm:text-base">Up to 50% OFF on selected items</span>
            <span className="hidden sm:inline text-white/70">|</span>
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
              <FaClock className="w-4 h-4" />
              <span className="font-mono font-bold">
                {String(timeLeft.hours).padStart(2, '0')}:
                {String(timeLeft.minutes).padStart(2, '0')}:
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Scrolling promo text on mobile */}
          <div className="sm:hidden text-xs text-white/80 animate-pulse">
            Limited time offer - Shop now!
          </div>
        </div>
      </div>
    </div>
  );
}

// Cart item interface
interface CartItem {
  productId: string;
  quantity: number;
  addedAt: string;
}

interface Category {
  id: string;
  name: string;
  brandCount: number;
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
  stockQuantity: number;
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
  const [showFavouritesOnly, setShowFavouritesOnly] = useState(false);

  // Cart and Favourites state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favourites, setFavourites] = useState<string[]>([]);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });

  // Animation states
  const [shakeButton, setShakeButton] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCartPreview, setShowCartPreview] = useState(false);

  // Quick View modal state
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Show toast message
  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: "", visible: false }), 3000);
  }, []);

  // Trigger confetti effect
  const triggerConfetti = useCallback(() => {
    setShowConfetti(true);
    // Create confetti pieces
    const colors = ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];
    const container = document.createElement('div');
    container.id = 'confetti-container';
    document.body.appendChild(container);

    for (let i = 0; i < 30; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = `${Math.random() * 100}vw`;
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = `${Math.random() * 0.5}s`;
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
      container.appendChild(piece);
    }

    setTimeout(() => {
      container.remove();
      setShowConfetti(false);
    }, 3000);
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

  // Listen for cart updates from layout (e.g., when clearing cart)
  useEffect(() => {
    const handleCartUpdate = (e: CustomEvent<{ slug: string; cart: CartItem[] }>) => {
      if (e.detail.slug === slug) {
        setCart(e.detail.cart);
      }
    };

    window.addEventListener("cartUpdated", handleCartUpdate as EventListener);
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate as EventListener);
    };
  }, [slug]);

  // Save cart to localStorage and dispatch event for other components
  const saveCart = useCallback((newCart: CartItem[]) => {
    setCart(newCart);
    if (typeof window !== "undefined") {
      localStorage.setItem(`cart_${slug}`, JSON.stringify(newCart));
      // Dispatch custom event for same-tab sync
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
      // Dispatch custom event for same-tab sync
      window.dispatchEvent(new CustomEvent("favouritesUpdated", {
        detail: { slug, favourites: newFavourites }
      }));
    }
  }, [slug]);

  // Add to cart handler with stock validation
  const handleAddToCart = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.productId === productId);
    const currentQty = existingItem?.quantity || 0;
    const maxQty = product?.stockQuantity || 0;

    // Check if adding one more would exceed available stock
    if (currentQty + 1 > maxQty) {
      showToast("You cannot add more quantity of this product at the moment");
      // Shake the button to indicate error
      setShakeButton(productId);
      setTimeout(() => setShakeButton(null), 500);
      return;
    }

    if (existingItem) {
      // Increase quantity
      const newCart = cart.map(item =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      saveCart(newCart);
    } else {
      // Add new item - trigger confetti!
      const newCart = [...cart, { productId, quantity: 1, addedAt: new Date().toISOString() }];
      saveCart(newCart);
      triggerConfetti();
    }

    // Show cart preview
    setShowCartPreview(true);
    setTimeout(() => setShowCartPreview(false), 4000);

    // Shake button for feedback
    setShakeButton(productId);
    setTimeout(() => setShakeButton(null), 500);
  }, [cart, saveCart, products, showToast, triggerConfetti]);

  // Remove from cart handler
  const handleRemoveFromCart = useCallback((productId: string) => {
    const newCart = cart.filter(item => item.productId !== productId);
    saveCart(newCart);
  }, [cart, saveCart]);

  // Toggle favourite handler
  const handleToggleFavourite = useCallback((productId: string) => {
    if (favourites.includes(productId)) {
      saveFavourites(favourites.filter(id => id !== productId));
    } else {
      saveFavourites([...favourites, productId]);
    }
  }, [favourites, saveFavourites]);

  // Check if product is in cart
  const isInCart = useCallback((productId: string) => {
    return cart.some(item => item.productId === productId);
  }, [cart]);

  // Check if product is favourited
  const isFavourite = useCallback((productId: string) => {
    return favourites.includes(productId);
  }, [favourites]);

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
    const storeUrl = typeof window !== "undefined" ? window.location.origin : "";

    let message = `Hi, I'm browsing your catalogue.`;
    if (product) {
      const productUrl = `${storeUrl}/${slug}/product/${product.id}`;
      const imageUrl = product.images?.[0] || "";
      const isInStock = product.status === "in_stock";

      message = `${isInStock ? "🛒 *Book Order*" : "❓ *Product Enquiry*"}\n\n`;
      message += `*${product.name}*\n`;
      message += `━━━━━━━━━━━━━━━\n`;
      message += `📦 SKU: ${product.sku}\n`;
      message += `🏷️ Brand: ${product.brand.name}\n`;
      message += `📂 Category: ${product.category.name}\n`;
      message += `💰 Price: ₹${product.sellingPrice.toLocaleString()}\n`;
      if (product.mrp > product.sellingPrice) {
        message += `🏷️ MRP: ₹${product.mrp.toLocaleString()} (${Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)}% off)\n`;
      }
      message += `📊 Status: ${isInStock ? "✅ Available" : "⚠️ Out of Stock"}\n`;
      message += `━━━━━━━━━━━━━━━\n\n`;
      if (imageUrl) {
        message += `🖼️ Product Image:\n${imageUrl}\n\n`;
      }
      message += `🔗 View Product:\n${productUrl}\n\n`;
      message += `🏪 Store: @${slug}\n\n`;
      message += isInStock ? `Please confirm availability and share payment details.` : `Please let me know when this product is back in stock.`;
    }
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

  // Strip HTML tags from description for list view
  const stripHtml = (html: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
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

  // Filter by price range and favourites
  const filteredProducts = sortedProducts.filter((p) => {
    const priceMatch = p.sellingPrice >= priceRange[0] && p.sellingPrice <= priceRange[1];
    const favouriteMatch = showFavouritesOnly ? favourites.includes(p.id) : true;
    return priceMatch && favouriteMatch;
  });

  const hasActiveFilters = selectedCategory || selectedBrand || searchQuery || showFavouritesOnly;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Flash Sale Banner */}
      <FlashSaleBanner />

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
                        ({category.brandCount} {category.brandCount === 1 ? "brand" : "brands"})
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

                {/* Favourites Toggle */}
                <button
                  onClick={() => setShowFavouritesOnly(!showFavouritesOnly)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    showFavouritesOnly
                      ? "bg-red-500 text-white"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  }`}
                >
                  <FaHeart className="w-4 h-4" />
                  <span className="hidden sm:inline">Favourites</span>
                  {favourites.length > 0 && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                      showFavouritesOnly ? "bg-white text-red-500" : "bg-red-500 text-white"
                    }`}>
                      {favourites.length}
                    </span>
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

            {/* Recently Viewed Section */}
            <RecentlyViewedSection
              slug={slug}
              products={products}
              formatPrice={formatPrice}
            />

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
                    isInCart={isInCart(product.id)}
                    isFavourite={isFavourite(product.id)}
                    onAddToCart={() => handleAddToCart(product.id)}
                    onRemoveFromCart={() => handleRemoveFromCart(product.id)}
                    onToggleFavourite={() => handleToggleFavourite(product.id)}
                    isShaking={shakeButton === product.id}
                    onQuickView={() => setQuickViewProduct(product)}
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
                    stripHtml={stripHtml}
                    getWhatsAppLink={getWhatsAppLink}
                    onBrandClick={(brandId) => setSelectedBrand(brandId)}
                    isInCart={isInCart(product.id)}
                    isFavourite={isFavourite(product.id)}
                    onAddToCart={() => handleAddToCart(product.id)}
                    onRemoveFromCart={() => handleRemoveFromCart(product.id)}
                    onToggleFavourite={() => handleToggleFavourite(product.id)}
                    isShaking={shakeButton === product.id}
                    onQuickView={() => setQuickViewProduct(product)}
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
                      {category.name} ({category.brandCount} {category.brandCount === 1 ? "brand" : "brands"})
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

      {/* Cart Preview Slide-in */}
      <CartPreviewSlideIn
        isVisible={showCartPreview}
        cart={cart}
        products={products}
        formatPrice={formatPrice}
        slug={slug}
        onClose={() => setShowCartPreview(false)}
      />

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

      {/* Custom Animations CSS */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        @keyframes confetti-fall {
          0% { transform: translateY(-100%) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .confetti-piece {
          position: fixed;
          top: 0;
          width: 10px;
          height: 10px;
          animation: confetti-fall 3s ease-out forwards;
          pointer-events: none;
          z-index: 9999;
        }
      `}</style>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={quickViewProduct !== null}
        onClose={() => setQuickViewProduct(null)}
        slug={slug}
        formatPrice={formatPrice}
        isInCart={quickViewProduct ? isInCart(quickViewProduct.id) : false}
        isFavourite={quickViewProduct ? isFavourite(quickViewProduct.id) : false}
        onAddToCart={() => {
          if (quickViewProduct) {
            handleAddToCart(quickViewProduct.id);
          }
        }}
        onToggleFavourite={() => {
          if (quickViewProduct) {
            handleToggleFavourite(quickViewProduct.id);
          }
        }}
        whatsappNumber={store?.whatsappNumber}
      />

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
  isInCart,
  isFavourite,
  onAddToCart,
  onRemoveFromCart,
  onToggleFavourite,
  isShaking,
  onQuickView,
}: {
  product: Product;
  slug: string;
  formatPrice: (price: number) => string;
  calculateDiscount: (mrp: number, sellingPrice: number) => number;
  getWhatsAppLink: (product: Product) => string;
  onBrandClick: (brandId: string) => void;
  isInCart: boolean;
  isFavourite: boolean;
  onAddToCart: () => void;
  onRemoveFromCart: () => void;
  onToggleFavourite: () => void;
  isShaking?: boolean;
  onQuickView?: () => void;
}) {
  const discount = calculateDiscount(product.mrp, product.sellingPrice);
  const isInStock = product.status === "in_stock";

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

        {/* Favourite Button - Top Left */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavourite();
          }}
          className={`absolute top-2 left-2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            isFavourite
              ? "bg-red-500 text-white"
              : "bg-white/90 text-neutral-600 hover:bg-red-50 hover:text-red-500"
          }`}
        >
          {isFavourite ? (
            <FaHeart className="w-4 h-4" />
          ) : (
            <FaRegHeart className="w-4 h-4" />
          )}
        </button>

        {/* Badges - Below Favourite Button */}
        <div className="absolute top-12 left-2 flex flex-col gap-1 z-10 pointer-events-none">
          {product.isNewArrival && (
            <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded animate-pulse shadow-lg shadow-blue-500/50">
              NEW
            </span>
          )}
          {product.isBestSeller && (
            <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-medium rounded shadow-lg shadow-amber-500/50">
              BEST
            </span>
          )}
          {/* Back in Stock badge for certain products */}
          {isInStock && (getProductHash(product.id) % 5 === 0) && (
            <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded animate-pulse shadow-lg shadow-green-500/50">
              BACK IN STOCK
            </span>
          )}
        </div>

        {/* Discount Badge - Top Right */}
        {discount > 0 && (
          <div className="absolute top-2 right-2 z-10 pointer-events-none">
            <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
              {discount}% OFF
            </span>
          </div>
        )}

        {/* Quick View Button - Appears on Hover */}
        {onQuickView && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView();
            }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-4 py-2 bg-white/95 backdrop-blur-sm text-neutral-700 rounded-full shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-amber-500 hover:text-white font-medium text-sm"
          >
            <FaEye className="w-3.5 h-3.5" />
            Quick View
          </button>
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

        {/* Trust & Urgency Indicators */}
        <div className="mt-1.5 mb-1 space-y-1.5">
          {/* Star Rating & Buyers Count */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-neutral-500">4.{(getProductHash(product.id) % 5) + 5}</span>
            </div>
            {/* Buyers count badge */}
            <span className="inline-flex items-center gap-0.5 text-xs text-neutral-500">
              <FaUsers className="w-2.5 h-2.5" />
              {((getProductHash(product.id) % 150) + 50)}+ bought
            </span>
          </div>

          {/* Countdown Timer for discounted products */}
          {discount > 0 && (
            <div className="flex items-center justify-between bg-red-50 px-2 py-1 rounded">
              <span className="text-xs text-red-600 font-medium">Offer ends in:</span>
              <CountdownTimer productId={product.id} />
            </div>
          )}

          {/* Last purchased indicator */}
          <div className="flex items-center gap-1 text-xs text-neutral-500">
            <HiLightningBolt className="w-3 h-3 text-amber-500" />
            <span>Last bought {(getProductHash(product.id) % 45) + 5} mins ago</span>
          </div>

          {/* Trending in city */}
          {(getProductHash(product.id) % 3 === 0) && (
            <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              <HiTrendingUp className="w-3 h-3" />
              <span>Trending in {INDIAN_CITIES[getProductHash(product.id) % INDIAN_CITIES.length]}</span>
            </div>
          )}

          {/* Stock & Urgency */}
          <div className="flex flex-wrap gap-1">
            {isInStock ? (
              <>
                {product.stockQuantity <= 5 && product.stockQuantity > 0 ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded animate-pulse">
                    <FaFire className="w-3 h-3" />
                    Only few left!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    In Stock
                  </span>
                )}
              </>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Out of Stock
              </span>
            )}
            {/* Verified Seller badge */}
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
              <FaShieldAlt className="w-3 h-3" />
              Verified
            </span>
            {product.isBestSeller && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                <FaFire className="w-3 h-3" />
                Selling Fast
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1">
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
              {/* Price may increase warning */}
              <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                <HiTrendingUp className="w-3 h-3" />
                <span>Price may increase soon!</span>
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

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          {/* Add to Cart Button */}
          {isInStock ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                if (isInCart) {
                  onRemoveFromCart();
                } else {
                  onAddToCart();
                }
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all text-sm font-medium ${
                isInCart
                  ? "bg-amber-500 text-white hover:bg-amber-600"
                  : "bg-neutral-100 text-neutral-700 hover:bg-amber-500 hover:text-white"
              } ${isShaking ? "animate-shake" : ""}`}
            >
              {isInCart ? (
                <>
                  <FaCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">In Cart</span>
                </>
              ) : (
                <>
                  <FaShoppingCart className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Add</span>
                </>
              )}
            </button>
          ) : (
            <button
              disabled
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium bg-neutral-100 text-neutral-400 cursor-not-allowed"
            >
              <FaShoppingCart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unavailable</span>
            </button>
          )}

          {/* WhatsApp Button */}
          <a
            href={getWhatsAppLink(product)}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors text-sm font-medium ${
              isInStock
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-orange-500 text-white hover:bg-orange-600"
            }`}
          >
            <FaWhatsapp className="w-4 h-4" />
            <span className="hidden sm:inline">{isInStock ? "Book" : "Enquire"}</span>
          </a>
        </div>
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
  stripHtml,
  getWhatsAppLink,
  onBrandClick,
  isInCart,
  isFavourite,
  onAddToCart,
  onRemoveFromCart,
  onToggleFavourite,
  isShaking,
  onQuickView,
}: {
  product: Product;
  slug: string;
  formatPrice: (price: number) => string;
  calculateDiscount: (mrp: number, sellingPrice: number) => number;
  stripHtml: (html: string) => string;
  getWhatsAppLink: (product: Product) => string;
  onBrandClick: (brandId: string) => void;
  isInCart: boolean;
  isFavourite: boolean;
  onAddToCart: () => void;
  onRemoveFromCart: () => void;
  onToggleFavourite: () => void;
  isShaking?: boolean;
  onQuickView?: () => void;
}) {
  const discount = calculateDiscount(product.mrp, product.sellingPrice);
  const isInStock = product.status === "in_stock";

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex flex-col sm:flex-row">
        <div className="relative w-full sm:w-48 md:w-56 aspect-square sm:aspect-auto flex-shrink-0">
          <Link
            href={`/${slug}/product/${product.id}`}
            className="block absolute inset-0"
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
          </Link>

          {/* Favourite Button - Top Left */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavourite();
            }}
            className={`absolute top-2 left-2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isFavourite
                ? "bg-red-500 text-white"
                : "bg-white/90 text-neutral-600 hover:bg-red-50 hover:text-red-500"
            }`}
          >
            {isFavourite ? (
              <FaHeart className="w-4 h-4" />
            ) : (
              <FaRegHeart className="w-4 h-4" />
            )}
          </button>

          {/* Badges - Below Favourite Button */}
          <div className="absolute top-12 left-2 flex flex-wrap gap-1 z-10 pointer-events-none max-w-[calc(100%-1rem)]">
            {product.isNewArrival && (
              <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded animate-pulse">
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
            {/* Back in Stock badge */}
            {isInStock && (getProductHash(product.id) % 5 === 0) && (
              <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded animate-pulse">
                BACK
              </span>
            )}
          </div>

          {/* Quick View Button */}
          {onQuickView && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView();
              }}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-sm text-neutral-700 rounded-full shadow-lg hover:bg-amber-500 hover:text-white transition-all font-medium text-xs"
            >
              <FaEye className="w-3 h-3" />
              Quick View
            </button>
          )}
        </div>

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
              <h3 className="font-semibold text-neutral-900 hover:text-amber-600 transition-colors mb-1">
                {product.name}
              </h3>
            </Link>
            {/* Trust & Urgency Indicators */}
            <div className="mb-2 space-y-2">
              {/* First row: Rating, buyers, stock status */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Star Rating */}
                <div className="flex items-center gap-1">
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs text-neutral-500">4.{(getProductHash(product.id) % 5) + 5}</span>
                </div>

                {/* Buyers count */}
                <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
                  <FaUsers className="w-3 h-3" />
                  {((getProductHash(product.id) % 150) + 50)}+ bought
                </span>

                {/* Stock Status */}
                {isInStock ? (
                  <>
                    {product.stockQuantity <= 5 && product.stockQuantity > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full animate-pulse">
                        <FaFire className="w-3 h-3" />
                        Only few left!
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        In Stock
                      </span>
                    )}
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Out of Stock
                  </span>
                )}

                {/* Verified Seller */}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                  <FaShieldAlt className="w-3 h-3" />
                  Verified
                </span>

                {/* Selling Fast Badge */}
                {product.isBestSeller && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                    <FaFire className="w-3 h-3" />
                    Selling Fast
                  </span>
                )}

                {/* Fast Delivery */}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7h2.05a1 1 0 01.95.68l1.68 5.05a1 1 0 010 .632l-.68 2.04a1 1 0 01-.95.68H13a1 1 0 01-1-1V8a1 1 0 011-1z" />
                  </svg>
                  Fast Delivery
                </span>
              </div>

              {/* Second row: Timer, last purchased, trending */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Countdown Timer for discounted products */}
                {discount > 0 && (
                  <div className="flex items-center gap-2 bg-red-50 px-2 py-1 rounded">
                    <span className="text-xs text-red-600 font-medium">Offer ends:</span>
                    <CountdownTimer productId={product.id} />
                  </div>
                )}

                {/* Last purchased indicator */}
                <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
                  <HiLightningBolt className="w-3.5 h-3.5 text-amber-500" />
                  Last bought {(getProductHash(product.id) % 45) + 5} mins ago
                </span>

                {/* Trending in city */}
                {(getProductHash(product.id) % 3 === 0) && (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    <HiTrendingUp className="w-3.5 h-3.5" />
                    Trending in {INDIAN_CITIES[getProductHash(product.id) % INDIAN_CITIES.length]}
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-neutral-600 line-clamp-2 mb-3">
              {stripHtml(product.description) || "Premium quality product from our collection."}
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
              {/* Price may increase warning */}
              {discount > 0 && (
                <div className="flex items-center gap-1 text-xs text-amber-600">
                  <HiTrendingUp className="w-3 h-3" />
                  <span>Price may increase soon!</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Add to Cart Button */}
              {isInStock ? (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (isInCart) {
                      onRemoveFromCart();
                    } else {
                      onAddToCart();
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                    isInCart
                      ? "bg-amber-500 text-white hover:bg-amber-600"
                      : "bg-neutral-100 text-neutral-700 hover:bg-amber-500 hover:text-white"
                  } ${isShaking ? "animate-shake" : ""}`}
                >
                  {isInCart ? (
                    <>
                      <FaCheck className="w-4 h-4" />
                      In Cart
                    </>
                  ) : (
                    <>
                      <FaShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </>
                  )}
                </button>
              ) : (
                <button
                  disabled
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-neutral-100 text-neutral-400 cursor-not-allowed"
                >
                  <FaShoppingCart className="w-4 h-4" />
                  Unavailable
                </button>
              )}

              {/* WhatsApp Button */}
              <a
                href={getWhatsAppLink(product)}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  isInStock
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-orange-500 text-white hover:bg-orange-600"
                }`}
              >
                <FaWhatsapp className="w-4 h-4" />
                {isInStock ? "Book" : "Enquire"}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
